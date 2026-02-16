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

// Mapa para almacenar las instancias de CronJob activas
const activeCronJobs = new Map<string, CronJob>();

/**
 * Registra una nueva tarea programada en la base de datos.
 */
export async function createScheduledTask(
    userId: string,
    agentId: string,
    missionTemplate: string,
    cronExpression: string
): Promise<ScheduledTask> {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `INSERT INTO scheduled_tasks 
             (user_id, agent_id, mission_template, cron_expression, status, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
            [userId, agentId, missionTemplate, cronExpression, "ENABLED"]
        );
        const newTask: ScheduledTask = res.rows[0];
        scheduleTask(newTask);
        return newTask;
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
        stopScheduledTask(taskId);
    } finally {
        client.release();
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
            budget_status: {
                current: 0,
                limit: 1000,
                plan: 'professional'
            },
            is_blocked: false,
            agent_config: {
                name: 'UAI Scheduler Agent',
                role: 'Orquestador de Tareas Programadas',
                model: 'gpt-4o',
                system_prompt: 'Eres un orquestador de IA que ejecuta tareas programadas de forma autónoma.'
            }
        };

        // Ejecutar la misión y esperar el resultado (o manejar el stream si es necesario)
        const result = await app.invoke(payload, config);
        console.log(`[Scheduler] Misión programada ${task.id} completada. Resultado:`, result);

        await updateScheduledTaskStatus(task.id, { last_run: new Date(), next_run: calculateNextRun(task.cron_expression), status: "COMPLETED" });
    } catch (error: any) {
        console.error(`[Scheduler] Error al ejecutar misión programada ${task.id}:`, error);
        await updateScheduledTaskStatus(task.id, { last_run: new Date(), status: "FAILED", metadata: { error: error.message } });
    }
}

/**
 * Calcula la próxima fecha de ejecución basada en una expresión cron.
 */
function calculateNextRun(cronExpression: string): Date {
    try {
        const job = new CronJob(cronExpression, () => {});
        return job.nextDates().toDate();
    } catch (error) {
        console.error("Error al calcular la próxima ejecución cron:", error);
        return new Date(Date.now() + 60 * 60 * 1000); // Fallback: 1 hora en el futuro
    }
}

/**
 * Programa una tarea usando node-cron.
 */
export function scheduleTask(task: ScheduledTask) {
    if (activeCronJobs.has(task.id)) {
        stopScheduledTask(task.id);
    }

    const job = new CronJob(task.cron_expression, async () => {
        await executeScheduledMission(task);
    }, null, true, 'America/Los_Angeles'); // Usar una zona horaria consistente

    activeCronJobs.set(task.id, job);
    console.log(`[Scheduler] Tarea ${task.id} programada para ${job.nextDates().toDate()}`);
    updateScheduledTaskStatus(task.id, { next_run: job.nextDates().toDate() });
}

/**
 * Detiene una tarea programada.
 */
export function stopScheduledTask(taskId: string) {
    const job = activeCronJobs.get(taskId);
    if (job) {
        job.stop();
        activeCronJobs.delete(taskId);
        console.log(`[Scheduler] Tarea ${taskId} detenida.`);
    }
}

/**
 * Inicializa el programador al cargar la aplicación, cargando tareas existentes.
 */
export async function initializeScheduler() {
    console.log("[Scheduler] Inicializando programador...");
    const tasks = await getActiveScheduledTasks();
    for (const task of tasks) {
        scheduleTask(task);
    }
    console.log(`[Scheduler] ${tasks.length} tareas programadas cargadas.`);
}

// Asegurarse de que el scheduler se inicialice al inicio de la aplicación
// Esto se llamaría en un archivo de inicialización del servidor o en el entry point.
// initializeScheduler().catch(console.error);
