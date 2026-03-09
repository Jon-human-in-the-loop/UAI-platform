import { NextRequest, NextResponse } from 'next/server';
import { executeDueTasks } from '@/lib/scheduled-tasks';

export const dynamic = 'force-dynamic';

/**
 * Endpoint interno para ejecutar tareas programadas vencidas.
 * Debe ser llamado por un servicio externo de cron (ej. Railway cron, cron-job.org)
 * cada minuto con el header x-scheduler-secret correcto.
 *
 * Ejemplo de configuración: POST https://your-app.com/api/internal/scheduler-tick
 * Header: x-scheduler-secret: <SCHEDULER_SECRET env var>
 */
export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-scheduler-secret');
    if (!secret || secret !== process.env.SCHEDULER_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await executeDueTasks();
        return NextResponse.json({
            success: true,
            executed: result.executed,
            errors: result.errors,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Scheduler Tick] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
