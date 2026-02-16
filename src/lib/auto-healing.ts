/**
 * AUTO-HEALING NEURAL - UAI Platform
 * Sistema de detección y recuperación de errores en el flujo de agentes.
 */

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
        const pattern = typeof strategy.errorPattern === 'string' 
            ? new RegExp(strategy.errorPattern, 'i') 
            : strategy.errorPattern;
            
        if (pattern.test(errorMessage)) {
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
 * Registra un evento de sanación para visualización en el dashboard.
 */
export async function logHealingEvent(agentId: string, error: string, strategy: HealingStrategy) {
    console.log(`[Auto-Healing] Agente ${agentId} - Error: ${error.substring(0, 50)}... -> Acción: ${strategy.action}`);
    
    // Aquí se guardaría en la tabla 'execution_errors'
    return {
        timestamp: new Date(),
        agentId,
        strategy: strategy.action,
        resolved: true
    };
}
