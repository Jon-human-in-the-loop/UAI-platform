/**
 * SCHEDULING ENGINE - UAI Platform (Fase 3)
 * Gestión de misiones proactivas y tareas programadas.
 */

import { CronTime } from 'cron';
import { dbPool } from './database';
import { getUserBudgetStatus } from './budget';
import { trackTokenUsage } from './billing';
import { HumanMessage } from '@langchain/core/messages';

export interface ScheduledTask {
    id: string;
    userId: string;
    agentId: string;
    missionTemplate: string;
    cronExpression: string;
    lastRun?: Date;
    nextRun: Date;
    status: 'ENABLED' | 'DISABLED' | 'PAUSED';
    metadata: Record<string, any>;
}

/**
 * Calcula la próxima ejecución basada en una expresión cron.
 * Usa CronTime de la librería 'cron' para cálculo real.
 */
export function calculateNextRun(cron: string): Date {
    try {
        const cronTime = new CronTime(cron);
        // sendAt() devuelve un DateTime de luxon
        return cronTime.sendAt().toJSDate();
    } catch {
        throw new Error(`Expresión cron inválida: ${cron}`);
    }
}

/**
 * Crea una nueva tarea programada para un agente.
 * Valida el cron, persiste en DB y devuelve la tarea en camelCase.
 */
export async function scheduleMission(
    userId: string,
    agentId: string,
    template: string,
    cron: string
): Promise<ScheduledTask> {
    // Valida el cron antes de tocar la DB (lanza si es inválido)
    const nextRun = calculateNextRun(cron);

    const client = await dbPool.connect();
    try {
        const result = await client.query(
            `INSERT INTO scheduled_tasks
                (user_id, agent_id, mission_template, cron_expression, next_run, status, metadata)
             VALUES ($1, $2, $3, $4, $5, 'ENABLED', $6)
             RETURNING *`,
            [
                userId,
                agentId,
                template,
                cron,
                nextRun,
                JSON.stringify({ createdVia: 'web_dashboard', priority: 'NORMAL' }),
            ]
        );

        const row = result.rows[0];
        return rowToScheduledTask(row);
    } finally {
        client.release();
    }
}

/**
 * Ejecuta las tareas que han llegado a su tiempo de ejecución.
 * Usa FOR UPDATE SKIP LOCKED para evitar procesamiento doble en entornos con réplicas.
 */
export async function processPendingTasks(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
}> {
    const client = await dbPool.connect();
    let tasks: any[] = [];

    try {
        const result = await client.query(
            `SELECT id, user_id, agent_id, mission_template, cron_expression, status, metadata
             FROM scheduled_tasks
             WHERE status = 'ENABLED' AND next_run <= NOW()
             LIMIT 10
             FOR UPDATE SKIP LOCKED`
        );
        tasks = result.rows;
    } finally {
        client.release();
    }

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const task of tasks) {
        processed++;
        try {
            // Cargar configuración del agente con fallback genérico
            const agentResult = await dbPool.query(
                `SELECT name, role, model, system_prompt FROM agents WHERE id = $1`,
                [task.agent_id]
            );

            const agentRow = agentResult.rows[0];
            const agentConfig = agentRow
                ? {
                      id: task.agent_id as string,
                      name: agentRow.name as string,
                      role: agentRow.role as string,
                      model: agentRow.model as string,
                      system_prompt: agentRow.system_prompt as string,
                  }
                : {
                      id: task.agent_id as string,
                      name: 'UAI Scheduler Agent',
                      role: 'Agente Programado',
                      model: 'gpt-4o-mini',
                      system_prompt:
                          'Eres un agente automatizado. Ejecuta la misión asignada de forma precisa y concisa.',
                  };

            // Verificar presupuesto
            const budget = await getUserBudgetStatus(task.user_id);

            // Importar orquestador de forma dinámica para evitar ciclos de dependencia
            const { getCompiledApp } = await import('./orchestrator/nodes');
            const app = getCompiledApp();

            // Callback para capturar tokens consumidos
            let accumulatedTokens = 0;
            const tokenCallback = {
                handleLLMEnd(output: any) {
                    const usage = output?.llmOutput?.tokenUsage;
                    if (usage?.totalTokens) {
                        accumulatedTokens += usage.totalTokens;
                    }
                },
            };

            const payload = {
                userId: task.user_id,
                messages: [new HumanMessage(task.mission_template)],
                next_node: 'analizador',
                errors: [],
                skills_active: [],
                context_memory: {},
                budget_status: budget,
                is_blocked: false,
                agent_config: agentConfig,
            };

            // Consumir el stream completo
            const stream = await app.stream(payload, {
                configurable: { thread_id: `sched-${task.id}` },
                callbacks: [tokenCallback],
                streamMode: 'values',
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _chunk of stream) {
                // Consumir todos los valores para que el callback de tokens se dispare
            }

            // Registrar uso de tokens (mínimo 100 como estimado)
            const tokensToTrack = accumulatedTokens > 0 ? accumulatedTokens : 100;
            await trackTokenUsage({
                userId: task.user_id,
                model: agentConfig.model,
                promptTokens: Math.floor(tokensToTrack * 0.7),
                completionTokens: Math.floor(tokensToTrack * 0.3),
                missionId: task.id,
            });

            // Actualizar tarea con last_run y próximo next_run
            const nextRun = calculateNextRun(task.cron_expression);
            const currentMetadata =
                typeof task.metadata === 'string' ? JSON.parse(task.metadata) : (task.metadata ?? {});
            const updatedMetadata = {
                ...currentMetadata,
                lastSuccessAt: new Date().toISOString(),
                consecutiveFailures: 0,
            };

            await dbPool.query(
                `UPDATE scheduled_tasks
                 SET last_run = NOW(), next_run = $1, metadata = $2
                 WHERE id = $3`,
                [nextRun, JSON.stringify(updatedMetadata), task.id]
            );

            succeeded++;
        } catch (err: any) {
            failed++;
            console.error(`[Scheduler] Error procesando tarea ${task.id}:`, err);

            const currentMetadata =
                typeof task.metadata === 'string' ? JSON.parse(task.metadata) : (task.metadata ?? {});
            const consecutiveFailures = (Number(currentMetadata.consecutiveFailures) || 0) + 1;
            const failInfo = {
                ...currentMetadata,
                consecutiveFailures,
                lastFailureAt: new Date().toISOString(),
                lastError: err?.message ?? 'Unknown error',
            };

            const shouldPause = consecutiveFailures >= 3;

            await dbPool.query(
                `UPDATE scheduled_tasks
                 SET last_run = NOW(),
                     metadata = $1
                     ${shouldPause ? ", status = 'PAUSED'" : ''}
                 WHERE id = $2`,
                [JSON.stringify(failInfo), task.id]
            );

            if (shouldPause) {
                console.warn(
                    `[Scheduler] Tarea ${task.id} pausada tras ${consecutiveFailures} fallos consecutivos.`
                );
            }
        }
    }

    return { processed, succeeded, failed };
}

/**
 * Convierte una fila de DB (snake_case) al tipo ScheduledTask (camelCase).
 */
function rowToScheduledTask(row: any): ScheduledTask {
    return {
        id: row.id,
        userId: row.user_id,
        agentId: row.agent_id,
        missionTemplate: row.mission_template,
        cronExpression: row.cron_expression,
        lastRun: row.last_run ? new Date(row.last_run) : undefined,
        nextRun: new Date(row.next_run),
        status: row.status as ScheduledTask['status'],
        metadata:
            typeof row.metadata === 'string'
                ? JSON.parse(row.metadata)
                : (row.metadata ?? {}),
    };
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
