import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbAdapter } from '@/lib/db-adapter';
import { registerWebhookEvent, markWebhookProcessed } from '@/lib/webhook-events';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Créditos por plan
const PLAN_CREDITS: Record<string, number> = {
    essentials: 500,
    professional: 5000,
    enterprise: 50000,
};

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
        if (!signature || !webhookSecret) {
            console.error('[Stripe Webhook] Missing signature or webhook secret');
            return NextResponse.json({ error: 'Configuración de webhook incompleta' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
        console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const eventId = (event as any).id as string;
    const reg = await registerWebhookEvent('stripe', eventId, event);
    if (!reg.isNew) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                const userId = session.metadata?.userId;
                const planId = session.metadata?.planId;

                if (userId && planId) {
                    console.log(`[Stripe Webhook] Activating plan ${planId} for user ${userId}`);
                    await dbAdapter.updateUserPlan(userId, planId, session.customer as string);

                    // Asignar créditos según el plan
                    const credits = PLAN_CREDITS[planId] || 100;
                    await dbAdapter.addCredits(userId, credits);
                    console.log(`[Stripe Webhook] Added ${credits} credits to user ${userId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
                const userId = subscription.metadata?.userId;
                if (userId) {
                    if (subscription.cancel_at_period_end) {
                        console.log(`[Stripe Webhook] Subscription marked for cancellation for user ${userId}`);
                    } else {
                        console.log(`[Stripe Webhook] Subscription updated for user ${userId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                const userId = subscription.metadata?.userId;
                if (userId) {
                    console.log(`[Stripe Webhook] Subscription cancelled for user ${userId}, downgrading to free`);
                    await dbAdapter.updateUserPlan(userId, 'free');
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as any;
                console.log(`[Stripe Webhook] Payment failed for customer ${invoice.customer}`);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const userId = invoice.subscription_details?.metadata?.userId;
                const planId = invoice.subscription_details?.metadata?.planId;
                
                // Renovación mensual: agregar créditos
                if (userId && planId && invoice.billing_reason === 'subscription_cycle') {
                    const credits = PLAN_CREDITS[planId] || 100;
                    await dbAdapter.addCredits(userId, credits);
                    console.log(`[Stripe Webhook] Renewal: Added ${credits} credits to user ${userId}`);
                }
                break;
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        await markWebhookProcessed('stripe', eventId, 'PROCESSED');
        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`[Stripe Webhook] Error processing event ${event.type}:`, err);
        await markWebhookProcessed('stripe', eventId, 'FAILED');
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
}
