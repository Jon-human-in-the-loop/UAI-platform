import { dbPool } from './database';

const DEFAULT_MAX_ATTEMPTS = 3;

export async function createRemoteJob(params: { userId?: string; missionId?: string; provider?: string; payload: any }) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO remote_jobs (user_id, mission_id, status, provider, request_payload, attempts)
             VALUES ($1, $2, 'queued', $3, $4, 0)
             RETURNING *`,
            [params.userId || null, params.missionId || null, params.provider || 'remote', JSON.stringify(params.payload || {})],
        );
        return res.rows[0];
    } finally {
        client.release();
    }
}

export async function updateRemoteJob(jobId: string, status: 'queued' | 'running' | 'success' | 'failed', responsePayload?: any, errorMessage?: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `UPDATE remote_jobs
             SET status = $2,
                 response_payload = COALESCE($3, response_payload),
                 error_message = COALESCE($4, error_message),
                 updated_at = CURRENT_TIMESTAMP,
                 next_attempt_at = CASE WHEN $2 = 'queued' THEN CURRENT_TIMESTAMP + INTERVAL '30 seconds' ELSE next_attempt_at END
             WHERE id = $1
             RETURNING *`,
            [jobId, status, responsePayload ? JSON.stringify(responsePayload) : null, errorMessage || null],
        );
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

export async function claimNextQueuedRemoteJob(maxAttempts = DEFAULT_MAX_ATTEMPTS) {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');
        const candidate = await client.query(
            `SELECT id
             FROM remote_jobs
             WHERE status = 'queued'
               AND attempts < $1
               AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
             ORDER BY created_at ASC
             FOR UPDATE SKIP LOCKED
             LIMIT 1`,
            [maxAttempts],
        );

        if (candidate.rows.length === 0) {
            await client.query('COMMIT');
            return null;
        }

        const jobId = candidate.rows[0].id;
        const updated = await client.query(
            `UPDATE remote_jobs
             SET status = 'running',
                 attempts = attempts + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [jobId],
        );

        await client.query('COMMIT');
        return updated.rows[0] || null;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function requeueOrFailRemoteJob(jobId: string, attempts: number, errorMessage: string, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
    if (attempts >= maxAttempts) {
        return updateRemoteJob(jobId, 'failed', null, errorMessage);
    }

    return updateRemoteJob(jobId, 'queued', null, errorMessage);
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

export async function registerRemoteRequestNonce(nonce: string, timestamp: string, userId?: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO remote_request_nonces (nonce, request_timestamp, user_id)
             VALUES ($1, to_timestamp($2::double precision / 1000.0), $3)
             ON CONFLICT (nonce) DO NOTHING
             RETURNING nonce`,
            [nonce, timestamp, userId || null],
        );

        return res.rows.length > 0;
    } finally {
        client.release();
    }
}
