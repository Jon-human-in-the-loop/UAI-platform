import { NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

async function updateUserPlan(userId: string, planId: string) {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);
        const userIndex = users.findIndex((u: any) => u.id === userId);

        if (userIndex !== -1) {
            users[userIndex].plan = planId;
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
            console.log(`✅ Plan actualizado (MP) para usuario ${userId} a ${planId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error actualizando usuario (MP):', error);
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get('topic') || url.searchParams.get('type');
        const id = url.searchParams.get('id') || url.searchParams.get('data.id');

        // MP a veces manda el body
        const body = await req.json().catch(() => ({}));

        const paymentId = id || body?.data?.id;
        const action = body?.action;

        if (topic === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            if (!paymentId) {
                return NextResponse.json({ error: 'Falta Payment ID' }, { status: 400 });
            }

            // Verificar estado del pago
            const payment = new Payment(mpClient);
            const paymentData = await payment.get({ id: paymentId });

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                // La metadata en MP viene en snake_case a veces, o en el objeto metadata
                const planId = paymentData.metadata?.plan_id || 'essentials'; // Fallback

                if (userId) {
                    // await updateUserPlan(userId, planId);
                    const { dbAdapter } = await import('@/lib/db-adapter');
                    await dbAdapter.updateUserPlan(userId, planId); // MP doesn't give a "customer id" like Stripe easily
                    console.log(`✅ Plan actualizado (DB/MP) para usuario ${userId}`);
                }
            }
        }

        return NextResponse.json({ status: 'OK' });
    } catch (error) {
        console.error('Error en webhook MP:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
