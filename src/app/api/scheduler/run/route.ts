import { NextRequest, NextResponse } from 'next/server';
import { processPendingTasks } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    // CRON_SECRET must be configured; if absent, reject all requests
    if (!secret) return false;

    // Accept via Authorization header: "Bearer <secret>"
    const authHeader = req.headers.get('authorization');
    if (authHeader === `Bearer ${secret}`) return true;

    // Accept via query param: ?secret=<secret>
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') === secret) return true;

    return false;
}

async function runHandler(req: NextRequest): Promise<NextResponse> {
    if (!process.env.CRON_SECRET) {
        return NextResponse.json(
            {
                error:
                    'CRON_SECRET no está configurada. Define la variable de entorno para habilitar este endpoint.',
            },
            { status: 503 }
        );
    }

    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const summary = await processPendingTasks();
        return NextResponse.json({
            ok: true,
            ...summary,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[Scheduler Run] Error ejecutando processPendingTasks:', err);
        return NextResponse.json(
            { error: err?.message ?? 'Internal server error' },
            { status: 500 }
        );
    }
}

export const GET = runHandler;
export const POST = runHandler;
