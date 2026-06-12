import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const client = await dbPool.connect();
        try {
            // Totales globales del usuario
            const totalsRes = await client.query(
                `SELECT
                    COUNT(*) AS total_runs,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) AS successful_runs,
                    COALESCE(SUM(total_tokens), 0) AS total_tokens,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 0) AS avg_latency_ms
                 FROM run_summaries
                 WHERE user_id = $1`,
                [userId]
            );

            // Ejecuciones por día (últimos 7 días) — siempre 7 filas, 0 en días sin datos
            const perDayRes = await client.query(
                `SELECT
                    d.day::date AS day,
                    COALESCE(COUNT(rs.id), 0) AS runs,
                    COALESCE(COUNT(CASE WHEN rs.status = 'success' THEN 1 END), 0) AS successful
                 FROM generate_series(NOW() - INTERVAL '6 days', NOW(), '1 day') d(day)
                 LEFT JOIN run_summaries rs
                     ON DATE(rs.created_at) = d.day::date
                     AND rs.user_id = $1
                 GROUP BY d.day
                 ORDER BY d.day ASC`,
                [userId]
            );

            const totals = totalsRes.rows[0];
            const totalRuns = parseInt(totals.total_runs || '0', 10);
            const successfulRuns = parseInt(totals.successful_runs || '0', 10);
            const totalTokens = parseInt(totals.total_tokens || '0', 10);
            const avgLatencyMs = parseFloat(totals.avg_latency_ms || '0');

            // ROI estimate: $25/hr labor rate, ~30min per manual equivalent task
            const hoursSaved = Math.round(totalRuns * 0.5);
            const costSaved = hoursSaved * 25;

            return NextResponse.json({
                totalRuns,
                successfulRuns,
                successRate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0,
                totalTokens,
                avgLatencyMs: Math.round(avgLatencyMs),
                hoursSaved,
                costSaved,
                runsPerDay: perDayRes.rows.map(row => ({
                    day: row.day,
                    runs: parseInt(row.runs, 10),
                    successful: parseInt(row.successful, 10),
                })),
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
