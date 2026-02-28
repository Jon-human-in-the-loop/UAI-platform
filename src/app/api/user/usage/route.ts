import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbAdapter } from '@/lib/db-adapter';
import { buildUsageMetrics } from '@/lib/usage-metrics';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const user = await dbAdapter.getUserById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const metrics = buildUsageMetrics(user);

        return NextResponse.json(metrics);
    } catch (error: any) {
        console.error('Error fetching usage metrics:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
