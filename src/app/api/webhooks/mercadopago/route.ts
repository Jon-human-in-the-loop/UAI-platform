import { NextRequest, NextResponse } from 'next/server';
import { mpClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import { dbAdapter } from '@/lib/db-adapter';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');

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
            // Mercado Pago reintentará si no devolvemos 2xx, pero mejor loguear el error
        }
    }

    return NextResponse.json({ received: true });
}
