import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const client = await dbPool.connect();
        try {
            // Últimas 10 ejecuciones del usuario con métricas agregadas
            const res = await client.query(
                `SELECT 
                    mission_id,
                    status,
                    total_tokens,
                    total_cost_credits,
                    node_metrics,
                    created_at,
                    updated_at,
                    EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000 AS latency_ms
                 FROM run_summaries 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 20`,
                [session.user.id]
            );
            
            // Totales agregados
            const totals = await client.query(
                `SELECT 
                    COUNT(*) AS total_runs,
                    COALESCE(SUM(total_tokens), 0) AS total_tokens,
                    COALESCE(SUM(total_cost_credits), 0) AS total_cost,
                    COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 0) AS avg_latency_ms,
                    COUNT(CASE WHEN status = 'success' THEN 1 END) AS successful_runs,
                    COUNT(CASE WHEN status = 'error' THEN 1 END) AS failed_runs,
                    COUNT(CASE WHEN status = 'running' THEN 1 END) AS running_now
                 FROM run_summaries 
                 WHERE user_id = $1`,
                [session.user.id]
            );
            
            return NextResponse.json({
                runs: res.rows,
                totals: totals.rows[0]
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching metrics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
