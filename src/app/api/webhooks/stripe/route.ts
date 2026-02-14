import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbAdapter } from '@/lib/db-adapter';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
        if (!signature || !webhookSecret) {
            console.error('Missing signature or webhook secret');
            return NextResponse.json({ error: 'Configuración de webhook incompleta' }, { status: 400 });
        }
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
            try {
                console.log(`Activating plan ${planId} for user ${userId}`);
                await dbAdapter.updateUserPlan(userId, planId, session.customer as string);

                // Optional: trigger other actions like sending a welcome email

            } catch (err) {
                console.error(`Error updating user plan:`, err);
                return NextResponse.json({ error: 'Error actualizando el plan en la base de datos' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
