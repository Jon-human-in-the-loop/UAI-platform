import { NextRequest, NextResponse } from 'next/server';
import { mpClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import { dbAdapter } from '@/lib/db-adapter';
import { buildMercadoPagoEventKey, registerWebhookEvent, markWebhookProcessed } from '@/lib/webhook-events';

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

    if (type === 'payment' && dataId) {
        try {
            const payment = new Payment(mpClient);
            const paymentData = await payment.get({ id: dataId });

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                const planId = paymentData.metadata?.plan_id;

                if (userId && planId) {
                    console.log(`Activating plan ${planId} for user ${userId} (Mercado Pago)`);
                    await dbAdapter.updateUserPlan(userId, planId);
                }
            }
        } catch (error) {
            console.error('Error procesando webhook de Mercado Pago:', error);
            await markWebhookProcessed('mercadopago', eventKey, 'FAILED');
            // Mercado Pago reintentará si no devolvemos 2xx, pero mejor loguear el error
        }
    }

    await markWebhookProcessed('mercadopago', eventKey, 'PROCESSED');
    return NextResponse.json({ received: true });
}
