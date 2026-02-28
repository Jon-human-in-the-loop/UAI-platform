import { dbPool } from './database';

export async function startRunSummary(missionId: string, userId: string, metadata: Record<string, any> = {}) {
    const client = await dbPool.connect();
    try {
        await client.query(
            `INSERT INTO run_summaries (mission_id, user_id, status, metadata)
             VALUES ($1, $2, 'running', $3)
             ON CONFLICT (mission_id) DO NOTHING`,
            [missionId, userId, JSON.stringify(metadata)]
        );
    } finally {
        client.release();
    }
}

export async function appendNodeMetric(missionId: string, node: string, tokens: number, costCredits: number) {
    const client = await dbPool.connect();
    try {
        await client.query(
            `UPDATE run_summaries
             SET total_tokens = total_tokens + $2,
                 total_cost_credits = total_cost_credits + $3,
                 node_metrics = COALESCE(node_metrics, '[]'::jsonb) || $4::jsonb,
                 updated_at = CURRENT_TIMESTAMP
             WHERE mission_id = $1`,
            [missionId, tokens, costCredits, JSON.stringify([{ node, tokens, costCredits, at: new Date().toISOString() }])]
        );
    } finally {
        client.release();
    }
}

export async function finishRunSummary(missionId: string, status: 'success' | 'error') {
    const client = await dbPool.connect();
    try {
        await client.query(
            `UPDATE run_summaries SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE mission_id = $1`,
            [missionId, status]
        );
    } finally {
        client.release();
    }
}

export async function getRunSummary(missionId: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(`SELECT * FROM run_summaries WHERE mission_id = $1`, [missionId]);
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}
