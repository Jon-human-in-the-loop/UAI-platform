import { NextRequest, NextResponse } from 'next/server';
import { processTelegramMessage, sendTelegramMessage, getTelegramConfig } from '@/lib/telegram-integration';
import { dbPool } from '@/lib/database';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Obtiene el agente asignado al canal de Telegram del usuario.
 * Si no hay agente asignado, devuelve el agente más reciente del usuario como fallback.
 */
async function getAgentForChannel(userId: string, channelType: string) {
    const client = await dbPool.connect();
    try {
        // Primero intentar obtener el agente asignado específicamente al canal
        const channelRes = await client.query(
            `SELECT cc.agent_id, a.name, a.role, a.model, a.system_prompt
             FROM channel_configs cc
             LEFT JOIN agents a ON a.id = cc.agent_id
             WHERE cc.user_id = $1 AND cc.channel_type = $2 AND cc.enabled = true`,
            [userId, channelType]
        );
        if (channelRes.rows[0]?.agent_id) {
            return channelRes.rows[0];
        }
        // Fallback: obtener el agente activo más reciente del usuario
        const agentRes = await client.query(
            `SELECT id as agent_id, name, role, model, system_prompt
             FROM agents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );
        return agentRes.rows[0] || null;
    } finally {
        client.release();
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        console.log('[Webhook Telegram] Recibido:', JSON.stringify(payload));

        // 1. Procesar y normalizar el mensaje
        const result = await processTelegramMessage(payload);
        
        if (!result.success) {
            console.warn('[Webhook Telegram] Mensaje rechazado:', result.reason);
            return NextResponse.json({ ok: true });
        }

        const { chatId, userId, text } = result;

        // 2. Obtener configuración de Telegram del usuario
        const config = await getTelegramConfig(userId.toString());
        if (!config) {
            console.warn(`[Webhook Telegram] No hay configuración para usuario ${userId}`);
            return NextResponse.json({ ok: true });
        }

        // 3. Enviar mensaje de "Procesando" para feedback inmediato
        try {
            await sendTelegramMessage(
                config.api_key,
                chatId,
                '⏳ Procesando tu solicitud...'
            );
        } catch (e) {
            console.warn('[Webhook Telegram] No se pudo enviar feedback:', e);
        }

        // 4. Disparar la orquestación asíncrona (no bloqueante)
        triggerOrchestrationAsync(userId.toString(), text, chatId, config.api_key);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[Webhook Telegram] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Dispara la orquestación de forma asíncrona sin bloquear la respuesta del webhook
 */
async function triggerOrchestrationAsync(userId: string, input: string, chatId: number, botToken: string) {
    try {
        // Ejecutar la orquestación en background
        (async () => {
            try {
                const app = await getCompiledApp();
                const config = {
                    configurable: { thread_id: `telegram-${chatId}-${Date.now()}` }
                };

                const payload = {
                    userId: userId,
                    messages: [new HumanMessage(input)],
                    next_node: 'analizador',
                    errors: [],
                    skills_active: [],
                    context_memory: {},
                    budget_status: {
                        current: 0,
                        limit: 1000,
                        plan: 'professional'
                    },
                    is_blocked: false,
                    agent_config: await getAgentForChannel(userId, 'TELEGRAM').then(a => a
                        ? { name: a.name, role: a.role, model: a.model || 'gpt-4o', system_prompt: a.system_prompt || 'Eres un asistente de IA. Responde de forma concisa y útil.' }
                        : { name: 'UAI Telegram Agent', role: 'Asistente de Telegram', model: 'gpt-4o', system_prompt: 'Eres un asistente de IA para Telegram. Responde de forma concisa y útil.' }
                    )
                };

                let finalResponse = '';
                const stream = await app.stream(payload as any, {
                    ...config,
                    streamMode: 'values'
                });

                for await (const chunk of stream) {
                    const messages = (chunk as any).messages || [];
                    if (messages.length > 0) {
                        const lastMsg = messages[messages.length - 1];
                        const content = typeof lastMsg.content === 'string'
                            ? lastMsg.content
                            : JSON.stringify(lastMsg.content);
                        finalResponse = content;
                    }
                }

                // Enviar respuesta final a Telegram
                if (finalResponse) {
                    // Limitar a 4096 caracteres (límite de Telegram)
                    const chunks = finalResponse.match(/[\s\S]{1,4000}/g) || [finalResponse];
                    for (const chunk of chunks) {
                        await sendTelegramMessage(botToken, chatId, chunk);
                    }
                }

                // Registrar en la base de datos
                const client = await dbPool.connect();
                try {
                    await client.query(
                        `INSERT INTO channel_messages 
                         (user_id, channel_type, sender_id, message_text, direction, status, created_at) 
                         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
                        [userId, 'TELEGRAM', chatId.toString(), finalResponse, 'OUT', 'SENT']
                    );
                } finally {
                    client.release();
                }

                console.log(`[Telegram] Respuesta enviada a ${chatId}`);
            } catch (e: any) {
                console.error('[Telegram Orchestration] Error:', e);
                try {
                    await sendTelegramMessage(
                        botToken,
                        chatId,
                        '❌ Error procesando tu solicitud. Por favor, intenta de nuevo.'
                    );
                } catch (sendErr) {
                    console.error('[Telegram] Error enviando mensaje de error:', sendErr);
                }
            }
        })();
    } catch (e) {
        console.error('[Telegram] Error disparando orquestación:', e);
    }
}
