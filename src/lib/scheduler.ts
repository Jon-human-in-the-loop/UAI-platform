/**
 * SCHEDULING ENGINE - UAI Platform (Fase 3)
 * Gestión de misiones proactivas y tareas programadas.
 */

export interface ScheduledTask {
    id: string;
    userId: string;
    agentId: string;
    missionTemplate: string;
    cronExpression: string; // e.g., "0 9 * * 1" (Lunes 9 AM)
    lastRun?: Date;
    nextRun: Date;
    status: 'ENABLED' | 'DISABLED' | 'PAUSED';
    metadata: Record<string, any>;
}

/**
 * Calcula la próxima ejecución basada en una expresión cron simple.
 * En producción se usaría una librería como 'cron-parser'.
 */
export function calculateNextRun(cron: string): Date {
    const now = new Date();
    // Simulación: Añadir 24 horas por defecto para el prototipo
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Crea una nueva tarea programada para un agente.
 */
export async function scheduleMission(
    userId: string, 
    agentId: string, 
    template: string, 
    cron: string
): Promise<ScheduledTask> {
    const task: ScheduledTask = {
        id: crypto.randomUUID(),
        userId,
        agentId,
        missionTemplate: template,
        cronExpression: cron,
        nextRun: calculateNextRun(cron),
        status: 'ENABLED',
        metadata: {
            createdVia: 'web_dashboard',
            priority: 'NORMAL'
        }
    };

    console.log(`[Scheduler] Tarea programada: ${template} para Agente ${agentId} (${cron})`);
    
    // Aquí se persistiría en la tabla 'scheduled_tasks'
    return task;
}

/**
 * Ejecuta las tareas que han llegado a su tiempo de ejecución.
 */
export async function processPendingTasks() {
    const now = new Date();
    console.log(`[Scheduler] Procesando tareas pendientes a las ${now.toISOString()}...`);
    
    // 1. Buscar tareas en DB donde nextRun <= now
    // 2. Disparar orquestador para cada tarea
    // 3. Actualizar lastRun y calcular nuevo nextRun
}

/**
 * Calcula el ROI estimado de una tarea automatizada.
 */
export function calculateTaskROI(executions: number, avgManualTimeMinutes: number): Record<string, any> {
    const totalMinutesSaved = executions * avgManualTimeMinutes;
    const hoursSaved = Math.round(totalMinutesSaved / 60);
    
    return {
        hoursSaved,
        cognitiveLoadReduction: 'HIGH',
        estimatedCostSaving: hoursSaved * 25, // $25/hr estimado
    };
}
