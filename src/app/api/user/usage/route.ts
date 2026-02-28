import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbAdapter } from '@/lib/db-adapter';

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

        const totalCredits = Number((user as any).total_credits || 0);
        const usedCredits = Number((user as any).used_credits || 0);
        const tokenUsageTotal = Number((user as any).token_usage_total || 0);
        const availableCredits = Math.max(totalCredits - usedCredits, 0);
        const usagePercent = totalCredits > 0 ? Math.min(Math.round((usedCredits / totalCredits) * 100), 100) : 0;

        return NextResponse.json({
            plan: user.plan,
            totalCredits,
            usedCredits,
            availableCredits,
            tokenUsageTotal,
            usagePercent,
        });
    } catch (error: any) {
        console.error('Error fetching usage metrics:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
