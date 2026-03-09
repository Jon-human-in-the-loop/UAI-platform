import { dbPool } from "./database";
import { getCompiledApp } from "./orchestrator/nodes";
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "./orchestrator/graph";
import { CronJob } from "cron";

interface ScheduledTask {
    id: string;
    user_id: string;
    agent_id: string;
    mission_template: string;
    cron_expression: string;
    last_run: Date | null;
    next_run: Date | null;
    status: string;
    metadata: any;
}

/**
 * Registra una nueva tarea programada en la base de datos.
 */
export async function createScheduledTask(
    userId: string,
    agentId: string,
    missionTemplate: string,
    cronExpression: string
): Promise<ScheduledTask> {
    const nextRun = calculateNextRun(cronExpression);
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO scheduled_tasks
             (user_id, agent_id, mission_template, cron_expression, status, next_run, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *`,
            [userId, agentId, missionTemplate, cronExpression, "ENABLED", nextRun]
        );
        return res.rows[0];
    } finally {
        client.release();
    }
}

/**
 * Obtiene todas las tareas programadas activas de la base de datos.
 */
export async function getActiveScheduledTasks(): Promise<ScheduledTask[]> {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM scheduled_tasks WHERE status = $1`,
            ["ENABLED"]
        );
        return res.rows;
    } finally {
        client.release();
    }
}

/**
 * Actualiza el estado de una tarea programada (ej. last_run, next_run, status).
 */
export async function updateScheduledTaskStatus(
    taskId: string,
    updates: { last_run?: Date; next_run?: Date; status?: string; metadata?: any }
) {
    const client = await dbPool.connect();
    try {
        const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(", ");
        const values = Object.values(updates);
        await client.query(
            `UPDATE scheduled_tasks SET ${fields} WHERE id = $1`,
            [taskId, ...values]
        );
    } finally {
        client.release();
    }
}

/**
 * Elimina una tarea programada.
 */
export async function deleteScheduledTask(taskId: string) {
    const client = await dbPool.connect();
    try {
        await client.query(
            `DELETE FROM scheduled_tasks WHERE id = $1`,
            [taskId]
        );
    } finally {
        client.release();
    }
}

/**
 * Calcula la próxima fecha de ejecución basada en una expresión cron.
 * Usa el paquete 'cron' para parsing real de expresiones cron.
 */
export function calculateNextRun(cronExpression: string): Date {
    try {
        const job = new CronJob(cronExpression, () => {});
        return (job.nextDate() as any).toDate();
    } catch (error) {
        console.error("Error al calcular la próxima ejecución cron:", error);
        return new Date(Date.now() + 60 * 60 * 1000); // Fallback: 1 hora
    }
}

/**
 * Ejecuta una misión de agente basada en una tarea programada.
 */
async function executeScheduledMission(task: ScheduledTask) {
    console.log(`[Scheduler] Ejecutando misión programada: ${task.mission_template} (Task ID: ${task.id})`);
    try {
        const app = await getCompiledApp();
        const config = {
            configurable: { thread_id: `scheduled-${task.id}-${Date.now()}` }
        };

        const payload: AgentState = {
            userId: task.user_id,
            messages: [new HumanMessage(task.mission_template)],
            next_node: 'analizador',
            errors: [],
            skills_active: [],
            context_memory: { scheduled_task_id: task.id, agent_id: task.agent_id },
            budget_status: { current: 0, limit: 1000, plan: 'professional' },
            is_blocked: false,
            agent_config: {
                name: 'UAI Scheduler Agent',
                role: 'Orquestador de Tareas Programadas',
                model: 'gpt-4o',
                system_prompt: 'Eres un orquestador de IA que ejecuta tareas programadas de forma autónoma.'
            }
        };

        await app.invoke(payload as any, config);
        console.log(`[Scheduler] Misión programada ${task.id} completada.`);

        const nextRun = calculateNextRun(task.cron_expression);
        await updateScheduledTaskStatus(task.id, { last_run: new Date(), next_run: nextRun, status: "ENABLED" });
    } catch (error: any) {
        console.error(`[Scheduler] Error al ejecutar misión programada ${task.id}:`, error);
        await updateScheduledTaskStatus(task.id, {
            last_run: new Date(),
            status: "FAILED",
            metadata: { error: error.message }
        });
    }
}

/**
 * Ejecuta todas las tareas vencidas. Diseñado para ser llamado por el endpoint
 * /api/internal/scheduler-tick en lugar de un proceso CronJob en memoria.
 * Seguro para entornos serverless.
 */
export async function executeDueTasks(): Promise<{ executed: number; errors: number }> {
    console.log("[Scheduler] Verificando tareas vencidas...");
    const client = await dbPool.connect();
    let dueTasks: ScheduledTask[] = [];

    try {
        const res = await client.query(
            `SELECT * FROM scheduled_tasks
             WHERE status = 'ENABLED' AND next_run <= NOW()
             ORDER BY next_run ASC`
        );
        dueTasks = res.rows;
    } finally {
        client.release();
    }

    console.log(`[Scheduler] ${dueTasks.length} tareas vencidas encontradas.`);

    let executed = 0;
    let errors = 0;

    for (const task of dueTasks) {
        try {
            await executeScheduledMission(task);
            executed++;
        } catch (e) {
            console.error(`[Scheduler] Fallo al ejecutar tarea ${task.id}:`, e);
            errors++;
        }
    }

    return { executed, errors };
}

/**
 * Inicialización liviana: solo verifica conectividad a BD.
 * No crea instancias CronJob en memoria (incompatibles con serverless).
 */
export async function initializeScheduler() {
    try {
        const tasks = await getActiveScheduledTasks();
        console.log(`[Scheduler] ${tasks.length} tareas activas en BD. Modo polling activo.`);
    } catch (e) {
        console.error("[Scheduler] Error al verificar tareas:", e);
    }
}
