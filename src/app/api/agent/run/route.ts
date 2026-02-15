import { NextRequest, NextResponse } from 'next/server';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { input, threadId, agent } = await req.json();

        if (!input) {
            return NextResponse.json({ error: 'Falta el input' }, { status: 400 });
        }

        // Si no recibimos un threadId del frontend, generamos uno nuevo para la sesión
        // FIX: Forzamos un nuevo threadId si no se envía explícitamente para evitar estados "zombies"
        const currentThreadId = uuidv4();

        console.log(`--- Ejecución Persistente (Thread: ${currentThreadId}) para: ${input} ---`);
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

        const initialState = {
            messages: [new HumanMessage(input)],
            next_node: 'analizador',
            errors: [],
            skills_active: [],
            context_memory: {},
            agent_config: agent || {
                name: "UAI Core",
                role: "Orquestador Default",
                model: "claude-3-opus",
                system_prompt: "Eres el núcleo de la plataforma."
            }
        };

        // Cambiamos a STREAM directamente en el cuerpo de la función para mayor estabilidad en Next.js
        const runStream = async () => {
            try {
                await sendEvent('session_info', { threadId: currentThreadId });

                // Usamos streamMode: "values" para tener el estado completo en cada paso
                const graphStream = await app.stream(initialState, {
                    ...config,
                    streamMode: "values"
                });

                for await (const chunk of graphStream) {
                    console.log("Enviando chunk al cliente...");
                    await sendEvent('node_update', { chunk });
                }

                await sendEvent('complete', { success: true });
            } catch (err: any) {
                console.error('Error en orquestación:', err);
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
