import { NextRequest, NextResponse } from 'next/server';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { retrieveCollectiveKnowledge, abstractLearning } from '@/lib/collective-memory';
import { trackTokenUsage } from '@/lib/billing';
import { getUserBudgetStatus } from '@/lib/budget';
import { v4 as uuidv4 } from 'uuid';
import { startRunSummary, appendNodeMetric, finishRunSummary } from '@/lib/run-tracing';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

const RATE_LIMIT_PER_PLAN: Record<string, number> = {
    free: 5,
    essentials: 15,
    professional: 60,
    admin: Infinity,
};

async function checkUserQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
        const userRes = await dbPool.query(
            `SELECT total_credits, used_credits, plan, role FROM users WHERE id = $1`,
            [userId]
        );
        if (userRes.rows.length === 0) return { allowed: false, reason: 'Usuario no encontrado' };

        const { total_credits, used_credits, plan, role } = userRes.rows[0];

        // Admins bypass all quota and rate limits
        if (role === 'admin') return { allowed: true };

        // Credit-based quota check (skip for professional)
        if (plan !== 'professional' && used_credits >= total_credits) {
            return { allowed: false, reason: 'Créditos agotados. Actualiza tu plan para continuar.' };
        }

        // Per-minute rate limiting
        const rpmLimit = RATE_LIMIT_PER_PLAN[plan] ?? 5;
        if (rpmLimit < Infinity) {
            const rpmRes = await dbPool.query(
                `SELECT COUNT(*) as cnt FROM run_summaries
                 WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
                [userId]
            );
            const runsLastMinute = parseInt(rpmRes.rows[0]?.cnt || '0', 10);
            if (runsLastMinute >= rpmLimit) {
                return { allowed: false, reason: `Límite de ${rpmLimit} ejecuciones por minuto alcanzado. Espera un momento.` };
            }
        }

        return { allowed: true };
    } catch (e) {
        console.error('[Rate Limit] Error verificando cuota:', e);
        return { allowed: true }; // Allow on error to avoid blocking legit users
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        const userId = session.user.id;

        const { input, threadId, agent } = await req.json();

        if (!input) {
            return NextResponse.json({ error: 'Falta el input' }, { status: 400 });
        }

        // Quota and rate limit check
        const quota = await checkUserQuota(userId);
        if (!quota.allowed) {
            return NextResponse.json(
                { error: quota.reason, upgradeUrl: '/dashboard/billing' },
                { status: 429 }
            );
        }

        // Persistencia: Usamos el threadId del frontend si existe, o generamos uno nuevo
        const currentThreadId = threadId || uuidv4();

        console.log(`[Run] Thread: ${currentThreadId} | Agent: ${agent?.name || 'Default'}`);
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        const sendEvent = async (type: string, data: any) => {
            await writer.write(encoder.encode(JSON.stringify({ type, ...data }) + '\n'));
        };

        const app = await getCompiledApp();
        const config = {
            configurable: { thread_id: currentThreadId }
        };

        await startRunSummary(currentThreadId, userId, { source: 'api/agent/run' });

        const collectiveKnowledge = await retrieveCollectiveKnowledge(input);
        const memoryContext = collectiveKnowledge.length > 0 
            ? "\n\n[MEMORIA COLECTIVA - APRENDIZAJES PASADOS]:\n" + collectiveKnowledge.join("\n")
            : "";

        // Si hay threadId, enviamos solo el nuevo mensaje (LangGraph se encarga de la historia)
        // Si no hay, enviamos el estado inicial completo
        const budgetStatus = await getUserBudgetStatus(userId);
        const payload = threadId
            ? { messages: [new HumanMessage(input)] }
            : {
                userId: userId,
                messages: [new HumanMessage(input)],
                next_node: 'analizador',
                errors: [],
                skills_active: [],
                context_memory: {},
                budget_status: budgetStatus,
                is_blocked: false,
                agent_config: agent ? {
                    ...agent,
                    system_prompt: (agent.system_prompt || "") +
                                   (agent.personal_context ? `\n\n[CONTEXTO DE MARCA/USUARIO]:\n${agent.personal_context}` : "") +
                                   memoryContext
                } : {
                    name: "UAI Core",
                    role: "Orquestador Default",
                    model: "gpt-4o",
                    system_prompt: "Eres el núcleo de la plataforma." + memoryContext
                }
            };

        // Cambiamos a STREAM directamente en el cuerpo de la función para mayor estabilidad en Next.js
        let cumulativeTokens = 0;
        let cumulativeCost = 0;

        const runStream = async () => {
            try {
                await sendEvent('session_info', { threadId: currentThreadId });

                // StreamMode "values" nos da el estado completo de AgentState en cada paso
                const graphStream = await app.stream(payload as any, {
                    ...config,
                    streamMode: "values"
                });

                for await (const rawChunk of graphStream) {
                    const chunk = rawChunk as any;

                    // Serialize LangChain messages for frontend
                    const simplifiedMessages = (chunk.messages || []).map((m: any) => ({
                        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
                        role: m._getType ? m._getType() : 'ai'
                    }));

                    const cleanChunk = {
                        ...chunk,
                        messages: simplifiedMessages
                    };

                    console.log(`[Stream] Enviando actualización de nodo: ${chunk.next_node || 'FIN'}`);
                    await sendEvent('node_update', { chunk: cleanChunk });

                    const estimatedTokens = Math.max(1, Math.floor((JSON.stringify(cleanChunk).length || 1) / 6));
                    const estimatedCost = Math.ceil(estimatedTokens / 100);
                    cumulativeTokens += estimatedTokens;
                    cumulativeCost += estimatedCost;
                    await appendNodeMetric(currentThreadId, chunk.next_node || 'FIN', estimatedTokens, estimatedCost);
                }

                if (agent && agent.id) {
                    await abstractLearning({
                        agent_id: agent.id,
                        mission_id: currentThreadId,
                        learning_type: 'insight',
                        summary: `Interacción sobre: ${input.substring(0, 50)}...`,
                        details: { input, timestamp: new Date().toISOString() },
                        keywords: [agent.role, 'interacción']
                    });
                }

                await trackTokenUsage({
                    userId: userId,
                    missionId: currentThreadId,
                    model: agent?.model || 'gpt-4o',
                    promptTokens: Math.max(200, Math.floor(cumulativeTokens * 0.6)),
                    completionTokens: Math.max(100, Math.floor(cumulativeTokens * 0.4))
                });

                await finishRunSummary(currentThreadId, 'success');
                await sendEvent('complete', { success: true, metrics: { tokens: cumulativeTokens, costCredits: cumulativeCost } });
            } catch (err: any) {
                console.error('Error en orquestación:', err);
                await finishRunSummary(currentThreadId, 'error');
                await sendEvent('error', { message: err.message });
            } finally {
                await writer.close();
            }
        };

        runStream();

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // Crítico para Nginx/Railway
            },
        });

    } catch (error: any) {
        console.error('Error en API Agent:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
