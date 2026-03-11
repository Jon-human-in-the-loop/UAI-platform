import { NextRequest, NextResponse } from 'next/server';
import { mpClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import { dbAdapter } from '@/lib/db-adapter';
import { buildMercadoPagoEventKey, registerWebhookEvent, markWebhookProcessed } from '@/lib/webhook-events';
import { PAYMENT_PLANS } from '@/lib/payments.config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');

    const eventKey = buildMercadoPagoEventKey(type, dataId);
    const reg = await registerWebhookEvent('mercadopago', eventKey, { type, dataId });
    if (!reg.isNew) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    // Solo procesamos pagos aprobados y suscripciones
    if (!['payment', 'subscription_authorized', 'subscription_preapproval'].includes(type || '') || !dataId) {
        await markWebhookProcessed('mercadopago', eventKey, 'PROCESSED');
        return NextResponse.json({ received: true, ignored: true });
    }

    try {
        const payment = new Payment(mpClient);
        const paymentData = await payment.get({ id: dataId });

        if (paymentData.status === 'approved') {
            const userId = paymentData.external_reference;
            const planId = paymentData.metadata?.plan_id;

            if (userId && planId) {
                console.log(`[MercadoPago Webhook] Activating plan ${planId} for user ${userId}`);
                
                // Activar plan del usuario
                await dbAdapter.updateUserPlan(userId, planId);

                // Asignar créditos según el plan
                const plan = Object.values(PAYMENT_PLANS).find(p => p.id === planId);
                if (plan) {
                    const credits = plan.id === 'essentials' ? 500
                        : plan.id === 'professional' ? 5000
                        : plan.id === 'enterprise' ? 50000
                        : 100;
                    
                    await dbAdapter.addCredits(userId, credits);
                    console.log(`[MercadoPago Webhook] Added ${credits} credits to user ${userId}`);
                }
            }
        } else if (paymentData.status === 'pending') {
            console.log(`[MercadoPago Webhook] Payment ${dataId} is pending for user ${paymentData.external_reference}`);
        } else if (paymentData.status === 'rejected') {
            console.log(`[MercadoPago Webhook] Payment ${dataId} was rejected for user ${paymentData.external_reference}`);
        }

        await markWebhookProcessed('mercadopago', eventKey, 'PROCESSED');
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[MercadoPago Webhook] Error procesando webhook:', error);
        await markWebhookProcessed('mercadopago', eventKey, 'FAILED');
        return NextResponse.json({ received: false }, { status: 500 });
    }
}
