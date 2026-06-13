import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { scheduleMission } from '@/lib/scheduler';

export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM scheduled_tasks WHERE user_id = $1 ORDER BY created_at DESC',
                [session.user.id]
            );
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { agentId, missionTemplate, cronExpression } = body as Record<string, unknown>;

    if (!agentId || !missionTemplate || !cronExpression) {
        return NextResponse.json(
            { error: 'agentId, missionTemplate y cronExpression son requeridos' },
            { status: 400 }
        );
    }

    try {
        const task = await scheduleMission(
            session.user.id,
            agentId as string,
            missionTemplate as string,
            cronExpression as string
        );
        return NextResponse.json(task, { status: 201 });
    } catch (err: any) {
        const isValidationError =
            typeof err?.message === 'string' && err.message.startsWith('Expresión cron inválida');
        return NextResponse.json(
            { error: err?.message ?? 'Failed to create task' },
            { status: isValidationError ? 400 : 500 }
        );
    }
}
