import { NextRequest, NextResponse } from 'next/server';
import { mpClient } from '@/lib/mercadopago';
import { Payment, PreApproval } from 'mercadopago';
import { dbAdapter } from '@/lib/db-adapter';
import { buildMercadoPagoEventKey, registerWebhookEvent, markWebhookProcessed } from '@/lib/webhook-events';

export const runtime = 'nodejs';

// Credits granted per plan (mirrors Stripe webhook logic)
const PLAN_CREDITS: Record<string, number> = {
    essentials: 500,
    advanced: 2000,
    professional: 5000,
    enterprise: 50000,
};

// external_reference is encoded as "<userId>:<planId>" for PreApproval subscriptions
// and as "<userId>:<planId>" for one-off Payment intents (or just "<userId>" for legacy).
function parseExternalReference(ref: string | null | undefined): { userId: string; planId: string | null } {
    if (!ref) return { userId: '', planId: null };
    const [userId, planId] = ref.split(':');
    return { userId, planId: planId ?? null };
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');

    const eventKey = buildMercadoPagoEventKey(type, dataId);
    const reg = await registerWebhookEvent('mercadopago', eventKey, { type, dataId });
    if (!reg.isNew) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    const HANDLED_TYPES = ['payment', 'subscription_authorized', 'subscription_preapproval'];
    if (!HANDLED_TYPES.includes(type || '') || !dataId) {
        await markWebhookProcessed('mercadopago', eventKey, 'PROCESSED');
        return NextResponse.json({ received: true, ignored: true });
    }

    try {
        if (type === 'payment') {
            // One-off payment (e.g. price_data flow without a plan ID)
            const paymentApi = new Payment(mpClient);
            const paymentData = await paymentApi.get({ id: dataId });

            if (paymentData.status === 'approved') {
                const { userId, planId } = parseExternalReference(paymentData.external_reference);

                if (userId && planId) {
                    console.log(`[MP Webhook] payment approved — activating plan ${planId} for user ${userId}`);
                    await dbAdapter.updateUserPlan(userId, planId);
                    const credits = PLAN_CREDITS[planId] ?? 100;
                    await dbAdapter.addCredits(userId, credits);
                    console.log(`[MP Webhook] Added ${credits} credits to user ${userId}`);
                } else {
                    console.warn(`[MP Webhook] payment approved but missing userId/planId in external_reference: "${paymentData.external_reference}"`);
                }
            } else {
                console.log(`[MP Webhook] payment ${dataId} status: ${paymentData.status}`);
            }
        } else {
            // PreApproval subscription event (subscription_authorized or subscription_preapproval)
            const preApprovalApi = new PreApproval(mpClient);
            const sub = await preApprovalApi.get({ id: dataId });

            if (sub.status === 'authorized') {
                const { userId, planId } = parseExternalReference(sub.external_reference);

                if (userId && planId) {
                    console.log(`[MP Webhook] subscription authorized — activating plan ${planId} for user ${userId}`);
                    await dbAdapter.updateUserPlan(userId, planId);
                    const credits = PLAN_CREDITS[planId] ?? 100;
                    await dbAdapter.addCredits(userId, credits);
                    console.log(`[MP Webhook] Added ${credits} credits to user ${userId}`);
                } else {
                    console.warn(`[MP Webhook] subscription authorized but missing userId/planId in external_reference: "${sub.external_reference}"`);
                }
            } else if (sub.status === 'cancelled') {
                const { userId } = parseExternalReference(sub.external_reference);
                if (userId) {
                    console.log(`[MP Webhook] subscription cancelled — downgrading user ${userId} to free`);
                    await dbAdapter.updateUserPlan(userId, 'free');
                }
            } else {
                console.log(`[MP Webhook] subscription ${dataId} status: ${sub.status}`);
            }
        }

        await markWebhookProcessed('mercadopago', eventKey, 'PROCESSED');
        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[MP Webhook] Error procesando webhook:', error);
        await markWebhookProcessed('mercadopago', eventKey, 'FAILED');
        return NextResponse.json({ received: false }, { status: 500 });
    }
}
