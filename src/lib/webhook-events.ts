import { dbPool } from './database';
import { buildMercadoPagoEventKey } from './webhook-events-policy';

export async function registerWebhookEvent(provider: 'stripe' | 'mercadopago', eventId: string, payload: unknown) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO webhook_events (provider, event_id, payload, status)
             VALUES ($1, $2, $3, 'RECEIVED')
             ON CONFLICT (provider, event_id) DO NOTHING
             RETURNING id`,
            [provider, eventId, JSON.stringify(payload || {})]
        );

        return {
            isNew: res.rows.length > 0,
        };
    } finally {
        client.release();
    }
}

export async function markWebhookProcessed(provider: 'stripe' | 'mercadopago', eventId: string, status: 'PROCESSED' | 'FAILED') {
    const client = await dbPool.connect();
    try {
        await client.query(
            `UPDATE webhook_events
             SET status = $1, processed_at = CURRENT_TIMESTAMP
             WHERE provider = $2 AND event_id = $3`,
            [status, provider, eventId]
        );
    } finally {
        client.release();
    }
}

export { buildMercadoPagoEventKey };
