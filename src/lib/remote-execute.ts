import { dbPool } from './database';
import { verifyRemoteSignature } from './remote-execute-policy';

export async function createRemoteJob(params: { userId?: string; missionId?: string; provider?: string; payload: any }) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO remote_jobs (user_id, mission_id, status, provider, request_payload)
             VALUES ($1, $2, 'queued', $3, $4)
             RETURNING *`,
            [params.userId || null, params.missionId || null, params.provider || 'remote', JSON.stringify(params.payload || {})]
        );
        return res.rows[0];
    } finally {
        client.release();
    }
}

export async function updateRemoteJob(jobId: string, status: 'running' | 'success' | 'failed', responsePayload?: any, errorMessage?: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `UPDATE remote_jobs
             SET status = $2, response_payload = COALESCE($3, response_payload), error_message = COALESCE($4, error_message), updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [jobId, status, responsePayload ? JSON.stringify(responsePayload) : null, errorMessage || null]
        );
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

export async function getRemoteJob(jobId: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(`SELECT * FROM remote_jobs WHERE id = $1`, [jobId]);
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

export { verifyRemoteSignature };
