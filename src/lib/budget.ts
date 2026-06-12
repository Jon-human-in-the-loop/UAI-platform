import { dbPool } from './database';

/**
 * PRESUPUESTOS REALES - UAI Platform
 * Fuente única de verdad para el budget_status que consume el orquestador (LangGraph).
 * Reemplaza los valores hardcodeados que existían en /api/agent/run y los webhooks.
 */

export interface BudgetStatus {
    current: number;
    limit: number;
    plan: string; // 'free' | 'essentials' | 'professional' | 'advanced' | 'admin'
}

/**
 * Obtiene el estado real de presupuesto de un usuario desde la base de datos.
 * - current: créditos ya consumidos (used_credits)
 * - limit: créditos totales disponibles (total_credits)
 * - plan: plan del usuario; los admins reportan 'admin' (bypass del guardrail en el analizador)
 *
 * Si el usuario no existe (o el id no es un UUID válido, ej. canales anónimos),
 * devuelve { current: 0, limit: 0, plan: 'free' } — lo que bloquea el consumo
 * de LLM en el grafo y cierra el agujero de facturación.
 */
export async function getUserBudgetStatus(userId: string): Promise<{ current: number; limit: number; plan: string }> {
    try {
        const res = await dbPool.query(
            `SELECT plan, role, total_credits, used_credits FROM users WHERE id = $1`,
            [userId]
        );

        if (res.rows.length === 0) {
            return { current: 0, limit: 0, plan: 'free' };
        }

        const { plan, role, total_credits, used_credits } = res.rows[0];

        return {
            current: Number(used_credits ?? 0) || 0,
            limit: Number(total_credits ?? 0) || 0,
            plan: role === 'admin' ? 'admin' : (plan || 'free'),
        };
    } catch (error) {
        // Un id no-UUID (ej. 'discord-anon') o un fallo de DB no deben tumbar la orquestación:
        // tratamos al usuario como inexistente.
        console.error(`[Budget] Error consultando presupuesto de ${userId}:`, error);
        return { current: 0, limit: 0, plan: 'free' };
    }
}
