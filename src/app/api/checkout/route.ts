import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { preference, mpClient } from '@/lib/mercadopago';
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

        // === MERCADO PAGO (SUSCRIPCIÓN RECURRENTE) ===
        if (provider === PAYMENT_PROVIDERS.MERCADOPAGO) {

            if (!plan.mpPlanId) {
                return NextResponse.json({ error: 'Plan de suscripción no configurado para Mercado Pago' }, { status: 400 });
            }

            // Para suscripciones, usamos el Preapproval de la API de Mercado Pago
            // En el SDK de Node, esto se maneja vía 'preapproval' o directamente creando la suscripción
            // Dado que el SDK oficial a veces tiene tipos complejos para preapproval,
            // y que ya tenemos el ID del Plan (preapproval_plan_id), 
            // la forma más directa y robusta es crear una "solicitud de suscripción" asociada a ese plan.

            const { PreApproval } = await import('mercadopago');
            const subscription = new PreApproval(mpClient);

            const result = await subscription.create({
                body: {
                    preapproval_plan_id: plan.mpPlanId,
                    payer_email: userEmail,
                    external_reference: userId, // ID de usuario para el webhook
                    back_url: successUrl,
                    reason: `Suscripción ${plan.name} - UAI Platform`,
                    auto_recurring: {
                        currency_id: 'ARS',
                        transaction_amount: Math.round(plan.price * 1376), // Tasa de cambio actualizada: 1 USD = 1376 ARS
                        frequency: 1,
                        frequency_type: 'months',
                    },
                    status: 'pending',
                }
            });

            if (!result.init_point) {
                console.error('Error MP Subscription:', result);
                throw new Error('No se pudo generar la suscripción de Mercado Pago');
            }

            return NextResponse.json({ url: result.init_point });
        }

        return NextResponse.json({ error: 'Proveedor de pagos no soportado' }, { status: 400 });

    } catch (error: any) {
        console.error('Error en checkout:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
