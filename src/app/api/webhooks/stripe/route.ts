import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Force Node.js runtime for fs access
export const runtime = 'nodejs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

async function updateUserSubscription(userId: string, planId: string, customerId?: string) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);
        const userIndex = users.findIndex((u: any) => u.id === userId);

        if (userIndex !== -1) {
            users[userIndex].plan = planId;
            if (customerId) {
                users[userIndex].stripeCustomerId = customerId;
            }
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
            console.log(`✅ Plan actualizado para usuario ${userId} a ${planId} (Customer: ${customerId})`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        return false;
    }
}

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_test_secret'
        );
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as any;
            const userId = session.metadata?.userId;
            const planId = session.metadata?.planId;
            const customerId = session.customer as string;

            if (userId && planId) {
                // await updateUserSubscription(userId, planId, customerId); 
                // Using DB Adapter now
                const { dbAdapter } = await import('@/lib/db-adapter');
                await dbAdapter.updateUserPlan(userId, planId, customerId);
                console.log(`✅ Plan actualizado (DB) para usuario ${userId}`);
            } else {
                console.warn('⚠️  Webhook recibido sin metadata de userId/planId');
            }
            break;
        default:
            // Unexpected event type
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
