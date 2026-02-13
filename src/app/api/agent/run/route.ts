import { NextRequest, NextResponse } from 'next/server';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { input, threadId } = await req.json();

        if (!input) {
            return NextResponse.json({ error: 'Falta el input' }, { status: 400 });
        }

        // Si no recibimos un threadId del frontend, generamos uno nuevo para la sesión
        const currentThreadId = threadId || uuidv4();

        console.log(`--- Ejecución Persistente (Thread: ${currentThreadId}) para: ${input} ---`);

        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        const sendEvent = async (type: string, data: any) => {
            await writer.write(encoder.encode(JSON.stringify({ type, ...data }) + '\n'));
        };

        // Ejecución asíncrona con persistencia
        (async () => {
            try {
                const app = await getCompiledApp();

                // Configuración de la ejecución (Persistencia)
                const config = {
                    configurable: { thread_id: currentThreadId }
                };

                const initialState = {
                    messages: [new HumanMessage(input)],
                    next_node: 'analizador',
                    errors: [],
                    skills_active: [],
                    context_memory: {}
                };

                // Suscripción a eventos del grafo con persistencia activada
                const graphStream = await app.stream(initialState, {
                    ...config,
                    streamMode: "values"
                });

                // Enviar el thread_id al frontend para que pueda reconectarse si es necesario
                await sendEvent('session_info', { threadId: currentThreadId });

                for await (const chunk of graphStream) {
                    await sendEvent('node_update', { chunk });
                }

                await sendEvent('complete', { success: true });
            } catch (err: any) {
                console.error('Error en stream persistente:', err);
                await sendEvent('error', { message: err.message });
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Error en API Agent:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
