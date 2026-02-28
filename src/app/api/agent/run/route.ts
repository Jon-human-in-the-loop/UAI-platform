import { NextRequest, NextResponse } from 'next/server';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { retrieveCollectiveKnowledge, abstractLearning } from '@/lib/collective-memory';
import { trackTokenUsage } from '@/lib/billing';
import { v4 as uuidv4 } from 'uuid';
import { startRunSummary, appendNodeMetric, finishRunSummary } from '@/lib/run-tracing';
import { auth } from '@/auth';

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

        // Persistencia: Usamos el threadId del frontend si existe, o generamos uno nuevo
        const currentThreadId = threadId || uuidv4();

        console.log(`--- Ejecución ${threadId ? 'Continua' : 'Nueva'} (Thread: ${currentThreadId}) ---`);
        if (agent) console.log(`--- Agente Activo: ${agent.name} (${agent.role}) ---`);

        // DIAGNÓSTICO DE KEYS (Solo mostramos si existen, no el valor)
        console.log("--- DIAGNÓSTICO DE KEYS ---");
        console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✅ Presente (" + process.env.ANTHROPIC_API_KEY.substring(0, 5) + "...)" : "❌ AUSENTE");
        console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Presente (" + process.env.OPENAI_API_KEY.substring(0, 5) + "...)" : "❌ AUSENTE");
        console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "✅ Presente (" + process.env.GOOGLE_API_KEY.substring(0, 5) + "...)" : "❌ AUSENTE");
        console.log("---------------------------");

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

        // RECUPERACIÓN DE MEMORIA COLECTIVA
        const collectiveKnowledge = await retrieveCollectiveKnowledge(input);
        const memoryContext = collectiveKnowledge.length > 0 
            ? "\n\n[MEMORIA COLECTIVA - APRENDIZAJES PASADOS]:\n" + collectiveKnowledge.join("\n")
            : "";

        // Si hay threadId, enviamos solo el nuevo mensaje (LangGraph se encarga de la historia)
        // Si no hay, enviamos el estado inicial completo
        const payload = threadId
            ? { messages: [new HumanMessage(input)] }
            : {
                userId: userId,
                messages: [new HumanMessage(input)],
                next_node: 'analizador',
                errors: [],
                skills_active: [],
                context_memory: {},
                budget_status: { current: 0, limit: 100, plan: "free" },
                is_blocked: false,
                agent_config: agent ? {
                    ...agent,
                    system_prompt: (agent.system_prompt || "") + memoryContext
                } : {
                    name: "UAI Core",
                    role: "Orquestador Default",
                    model: "claude-3-opus",
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
                    const chunk = rawChunk as any; // Forza el tipo para evitar error de Uint8Array en el build

                    // SERIALIZACIÓN ROBUSTA: LangChain messages pueden tener estructuras complejas
                    // Nos aseguramos de enviar un objeto limpio que el frontend pueda entender fácilmente.
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

                // ABSTRACCIÓN DE APRENDIZAJE AL FINALIZAR (Simplificado para el demo)
                // En producción, esto se dispararía basado en el éxito de la misión o errores resueltos.
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

                // SEGUIMIENTO DE TOKENS (Simulado con valores fijos para el demo)
                // En producción, LangGraph devolvería el uso real en el AgentState
                await trackTokenUsage({
                    userId: userId,
                    missionId: currentThreadId,
                    model: agent?.model || 'gpt-4-turbo',
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
