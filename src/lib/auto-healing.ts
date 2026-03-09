/**
 * AUTO-HEALING NEURAL - UAI Platform
 * Sistema de detección y recuperación de errores en el flujo de agentes.
 */

import { dbPool } from './database';

export interface HealingStrategy {
    errorPattern: string | RegExp;
    action: 'RETRY' | 'SWITCH_MODEL' | 'SIMPLIFY_PROMPT' | 'FALLBACK';
    description: string;
}

export const HEALING_STRATEGIES: HealingStrategy[] = [
    {
        errorPattern: /rate limit/i,
        action: 'SWITCH_MODEL',
        description: 'Límite de cuota alcanzado. Cambiando a modelo de respaldo (Gemini/GPT-4o).'
    },
    {
        errorPattern: /context length/i,
        action: 'SIMPLIFY_PROMPT',
        description: 'Contexto demasiado largo. Resumiendo historial y simplificando tarea.'
    },
    {
        errorPattern: /invalid json/i,
        action: 'RETRY',
        description: 'Error de formato JSON. Reintentando con instrucción de formato estricta.'
    }
];

/**
 * Analiza un error y devuelve la mejor estrategia de sanación.
 */
export function diagnoseError(errorMessage: string): HealingStrategy {
    for (const strategy of HEALING_STRATEGIES) {
        const pattern = strategy.errorPattern;
        const isMatch = typeof pattern === 'string'
            ? errorMessage.toLowerCase().includes(pattern.toLowerCase())
            : pattern.test(errorMessage);

        if (isMatch) {
            return strategy;
        }
    }

    return {
        errorPattern: /.*/,
        action: 'FALLBACK',
        description: 'Error desconocido. Activando modo de respuesta de seguridad.'
    };
}

/**
 * Registra un evento de sanación en la base de datos.
 */
export async function logHealingEvent(
    userId: string,
    agentId: string,
    error: string,
    strategy: HealingStrategy
) {
    console.log(`[Auto-Healing] Agente ${agentId} - Error: ${error.substring(0, 50)}... -> Acción: ${strategy.action}`);

    try {
        const errorPattern = typeof strategy.errorPattern === 'string'
            ? strategy.errorPattern
            : strategy.errorPattern.source;

        await dbPool.query(
            `INSERT INTO execution_errors (user_id, agent_id, error_message, error_pattern, strategy_applied, resolved)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, agentId || null, error, errorPattern, strategy.action, true]
        );

        await updateHealingStats(userId, true, error);
    } catch (dbErr) {
        console.error('[Auto-Healing] Error guardando en BD:', dbErr);
    }

    return {
        timestamp: new Date(),
        agentId,
        strategy: strategy.action,
        resolved: true
    };
}

/**
 * Actualiza las estadísticas de sanación del usuario via UPSERT.
 */
export async function updateHealingStats(userId: string, resolved: boolean, errorMessage?: string) {
    try {
        const healedIncrement = resolved ? 1 : 0;

        // Get most common error pattern for this user
        const commonErrorRes = await dbPool.query(
            `SELECT error_pattern, COUNT(*) as cnt
             FROM execution_errors
             WHERE user_id = $1 AND error_pattern IS NOT NULL
             GROUP BY error_pattern
             ORDER BY cnt DESC
             LIMIT 1`,
            [userId]
        );
        const mostCommonError = commonErrorRes.rows[0]?.error_pattern || errorMessage?.substring(0, 255) || null;

        await dbPool.query(
            `INSERT INTO healing_stats (user_id, total_errors, total_healed, most_common_error, last_updated)
             VALUES ($1, 1, $2, $3, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                total_errors = healing_stats.total_errors + 1,
                total_healed = healing_stats.total_healed + $2,
                most_common_error = $3,
                last_updated = NOW()`,
            [userId, healedIncrement, mostCommonError]
        );
    } catch (dbErr) {
        console.error('[Auto-Healing] Error actualizando healing_stats:', dbErr);
    }
}
