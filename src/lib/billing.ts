import { dbPool } from './database';
import { stripe } from './stripe';
import { calculateCreditCost } from './billing-pricing';

/**
 * Módulo de Facturación Basada en Tokens (Fase 4)
 * Refina la integración con Stripe para créditos basados en consumo real.
 */

export interface TokenUsage {
    userId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    missionId?: string;
}

/**
 * Registra el uso de tokens y deduce créditos del usuario.
 * Incluye guardado en ledger y deduplicación por missionId cuando está presente.
 */
export async function trackTokenUsage(usage: TokenUsage) {
    console.log(`--- [Billing] Registrando uso para ${usage.userId}: ${usage.model} ---`);

    const cost = calculateCreditCost(usage);
    const totalTokens = usage.promptTokens + usage.completionTokens;
    const client = await dbPool.connect();

    try {
        await client.query('BEGIN');

        if (usage.missionId) {
            const existing = await client.query(
                `SELECT id FROM billing_ledger
                 WHERE user_id = $1 AND mission_id = $2 AND entry_type = 'DEBIT'
                 LIMIT 1`,
                [usage.userId, usage.missionId]
            );

            if (existing.rows.length > 0) {
                await client.query('COMMIT');
                return { success: true, cost: 0, deduplicated: true };
            }
        }

        await client.query(
            `INSERT INTO billing_ledger (
                user_id, mission_id, entry_type, amount_credits, token_count, model, provider, metadata
            ) VALUES ($1, $2, 'DEBIT', $3, $4, $5, 'internal', $6)`,
            [usage.userId, usage.missionId || null, cost, totalTokens, usage.model, JSON.stringify({ promptTokens: usage.promptTokens, completionTokens: usage.completionTokens })]
        );

        await client.query(
            `UPDATE users
             SET used_credits = used_credits + $1,
                 token_usage_total = token_usage_total + $2,
                 total_credits = GREATEST(total_credits - $1, 0)
             WHERE id = $3`,
            [cost, totalTokens, usage.userId]
        );

        await client.query('COMMIT');
        return { success: true, cost, deduplicated: false };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('--- [Billing] Error al registrar uso:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Crea una sesión de recarga de créditos en Stripe.
 */
export async function createCreditTopupSession(userId: string, amount: number) {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: { name: `Recarga de ${amount} Créditos UAI` },
                unit_amount: amount * 10,
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        metadata: { userId, amount: amount.toString() }
    });

    return session.url;
}
