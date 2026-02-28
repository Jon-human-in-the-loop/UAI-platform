import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authorize } from '@/lib/authz';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    try {
        const access = await authorize({ permission: 'billing:portal' });
        if (!access.ok) return access.response;

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Recuperar customer ID. 
        // 1. Leer de DB
        const { dbAdapter } = await import('@/lib/db-adapter');
        const user = await dbAdapter.getUserByEmail(session.user.email);

        let customerId = user?.stripe_customer_id;

        // 2. Buscar en Stripe por email como fallback robusto
        if (!customerId) {
            const customers = await stripe.customers.list({
                email: session.user.email,
                limit: 1,
            });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                // Opcional: Guardar en DB para la próxima
                if (user) await dbAdapter.updateUserPlan(user.id, user.plan, customerId);
            }
        }

        if (!customerId) {
            return NextResponse.json({ error: 'No se encontró una suscripción activa para este usuario.' }, { status: 404 });
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${origin}/dashboard`,
        });

        return NextResponse.json({ url: portalSession.url });

    } catch (error: any) {
        console.error('Error billing portal:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
