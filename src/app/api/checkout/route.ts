import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { preference } from '@/lib/mercadopago';
import { PAYMENT_PLANS, PAYMENT_PROVIDERS } from '@/lib/payments.config';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const { planId, provider, userId: bodyUserId } = await req.json();

        // Use session ID or provided userId from body (for registration flow)
        const userId = session?.user?.id || bodyUserId;
        let userEmail = session?.user?.email;

        if (!userId) {
            return NextResponse.json({ error: 'Usuario no identificado' }, { status: 401 });
        }

        // If no session, fetch user email from DB using userId
        const { dbAdapter } = await import('@/lib/db-adapter');
        if (!userEmail) {
            const user = await dbAdapter.getUserById(userId);
            if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
            userEmail = user.email;
        }

        // Validar plan
        const plan = Object.values(PAYMENT_PLANS).find(p => p.id === planId) as any;
        if (!plan || plan.price === 0) {
            return NextResponse.json({ error: 'Plan inválido o gratuito' }, { status: 400 });
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const successUrl = `${origin}/dashboard?payment_success=true&plan=${planId}`;
        const cancelUrl = `${origin}/dashboard?payment_cancelled=true`;

        // === STRIPE ===
        if (provider === PAYMENT_PROVIDERS.STRIPE) {
            // Si tenemos priceId definido en variable de entorno, lo usamos (modo subscripción)
            // Si no, usamos modo 'payment' con price_data on-the-fly (útil para dev/test rápido)
            const lineItems = plan.stripePriceId
                ? [{ price: plan.stripePriceId, quantity: 1 }]
                : [{
                    price_data: {
                        currency: plan.currency.toLowerCase(),
                        product_data: {
                            name: `UAI Platform - ${plan.name} Plan`,
                            description: plan.features.join(', '),
                        },
                        unit_amount: plan.price * 100, // Cents
                    },
                    quantity: 1,
                }];

            const sessionStripe = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: plan.stripePriceId ? 'subscription' : 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: userEmail,
                metadata: {
                    userId: userId,
                    planId: plan.id,
                },
            });

            return NextResponse.json({ url: sessionStripe.url });
        }

        // === MERCADO PAGO ===
        if (provider === PAYMENT_PROVIDERS.MERCADOPAGO) {
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: plan.id,
                            title: `UAI Platform - ${plan.name}`,
                            quantity: 1,
                            unit_price: plan.mpPrice || (plan.price * 1000), // Fallback conversion if not defined
                            currency_id: 'ARS', // Mercado Pago suele requerir moneda local del país de la cuenta
                        }
                    ],
                    payer: {
                        email: userEmail,
                        name: userEmail.split('@')[0], // Simplified name if not available
                    },
                    back_urls: {
                        success: successUrl,
                        failure: cancelUrl,
                        pending: cancelUrl,
                    },
                    auto_return: 'approved',
                    external_reference: userId, // Para identificar al usuario en el webhook
                    metadata: {
                        plan_id: plan.id,
                    }
                }
            });

            if (!result.init_point) {
                throw new Error('No se pudo generar el link de pago de Mercado Pago');
            }

            // En modo sandbox, init_point redirecciona al sandbox. En prod, al checkout real.
            return NextResponse.json({ url: result.init_point });
        }

        return NextResponse.json({ error: 'Proveedor de pagos no soportado' }, { status: 400 });

    } catch (error: any) {
        console.error('Error en checkout:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
