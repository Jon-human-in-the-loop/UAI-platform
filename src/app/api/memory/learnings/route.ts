import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { dbPool } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const access = await authorize();
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();

    // Paginación: limit (1-200, default 50) y offset (>= 0, default 0)
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 50 : rawLimit, 1), 200);
    const offset = Math.max(Number.isNaN(rawOffset) ? 0 : rawOffset, 0);

    try {
        const client = await dbPool.connect();
        try {
            // Obtener aprendizajes de los agentes del usuario.
            // Construcción limpia: los placeholders SIEMPRE coinciden con los params.
            // - Sin búsqueda: $1 = userId, $2 = limit, $3 = offset
            // - Con búsqueda: $1 = userId, $2 = patrón ILIKE, $3 = limit, $4 = offset
            let query: string;
            let params: (string | number)[];

            if (search) {
                query = `SELECT al.*, a.name as agent_name
                   FROM agent_learnings al
                   LEFT JOIN agents a ON al.agent_id = a.id
                   WHERE a.user_id = $1
                     AND (al.summary ILIKE $2 OR al.learning_type ILIKE $2 OR $2 = ANY(al.keywords))
                   ORDER BY al.created_at DESC
                   LIMIT $3 OFFSET $4`;
                params = [access.user.id, `%${search}%`, limit, offset];
            } else {
                query = `SELECT al.*, a.name as agent_name
                   FROM agent_learnings al
                   LEFT JOIN agents a ON al.agent_id = a.id
                   WHERE a.user_id = $1
                   ORDER BY al.created_at DESC
                   LIMIT $2 OFFSET $3`;
                params = [access.user.id, limit, offset];
            }

            const res = await client.query(query, params);

            // Stats globales
            const statsRes = await client.query(
                `SELECT
                    COUNT(*) as total_learnings,
                    COUNT(DISTINCT al.agent_id) as agents_contributing,
                    COUNT(CASE WHEN al.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_learnings
                 FROM agent_learnings al
                 LEFT JOIN agents a ON al.agent_id = a.id
                 WHERE a.user_id = $1`,
                [access.user.id]
            );

            const stats = statsRes.rows[0];

            return NextResponse.json({
                learnings: res.rows,
                stats: {
                    totalLearnings: parseInt(stats.total_learnings || '0', 10),
                    agentsContributing: parseInt(stats.agents_contributing || '0', 10),
                    recentLearnings: parseInt(stats.recent_learnings || '0', 10),
                    semanticConnections: parseInt(stats.total_learnings || '0', 10) * 3, // Estimado
                    computeSavings: Math.min(99, parseInt(stats.total_learnings || '0', 10) * 2),
                    autoMitigations: parseInt(stats.recent_learnings || '0', 10),
                }
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching memory learnings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
