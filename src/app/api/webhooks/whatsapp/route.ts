import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppMessage, sendWhatsAppMessage, getWhatsAppConfig, getTwilioNumber, getTwilioAuthToken } from '@/lib/whatsapp-integration';
import { dbPool } from '@/lib/database';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';
import { transcribeAudio } from '@/lib/multimedia';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const payload = Object.fromEntries(formData);
        
        console.log('[Webhook WhatsApp] Recibido mensaje');

        // 1. Procesar y normalizar el mensaje
        const result = await processWhatsAppMessage(payload);
        
        if (!result.success) {
            console.warn('[Webhook WhatsApp] Mensaje rechazado');
            return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
                headers: { 'Content-Type': 'application/xml' }
            });
        }

        let { phoneNumber, text } = result as any;
        const userId = phoneNumber;

        if (!text && payload.NumMedia && Number(payload.NumMedia) > 0 && payload.MediaUrl0) {
            try {
                const mediaRes = await fetch(String(payload.MediaUrl0));
                const audioBuffer = Buffer.from(await mediaRes.arrayBuffer());
                text = await transcribeAudio(audioBuffer);
            } catch (e) {
                console.error('[Webhook WhatsApp] Error transcribiendo audio:', e);
            }
        }

        // 2. Obtener configuración de WhatsApp del usuario
        const config = await getWhatsAppConfig(userId);
        if (!config) {
            console.warn(`[Webhook WhatsApp] No hay configuracion para usuario ${userId}`);
            return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
                headers: { 'Content-Type': 'application/xml' }
            });
        }

        // 3. Enviar mensaje de "Procesando"
        const fromNumber = getTwilioNumber(config);
        const accountSid = config.api_key;
        const authToken = getTwilioAuthToken(config);

        try {
            await sendWhatsAppMessage(
                accountSid,
                authToken,
                fromNumber,
                phoneNumber,
                'Procesando tu solicitud...'
            );
        } catch (e) {
            console.warn('[Webhook WhatsApp] No se pudo enviar feedback');
        }

        // 4. Disparar la orquestación asíncrona
        triggerOrchestrationAsync(userId, text, phoneNumber, fromNumber, accountSid, authToken);

        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            headers: { 'Content-Type': 'application/xml' }
        });
    } catch (error: any) {
        console.error('[Webhook WhatsApp] Error:', error);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            status: 500,
            headers: { 'Content-Type': 'application/xml' }
        });
    }
}

async function triggerOrchestrationAsync(
    userId: string,
    input: string,
    toNumber: string,
    fromNumber: string,
    accountSid: string,
    authToken: string
) {
    try {
        (async () => {
            try {
                const app = await getCompiledApp();
                const config = {
                    configurable: { thread_id: `whatsapp-${toNumber}-${Date.now()}` }
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
                    agent_config: {
                        name: 'UAI WhatsApp Agent',
                        role: 'Asistente de WhatsApp',
                        model: 'gpt-4o',
                        system_prompt: 'Eres un asistente de IA para WhatsApp. Responde de forma concisa y util.'
                    }
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

                if (finalResponse) {
                    const chunks = finalResponse.match(/[\s\S]{1,1500}/g) || [finalResponse];
                    for (const chunk of chunks) {
                        await sendWhatsAppMessage(accountSid, authToken, fromNumber, toNumber, chunk);
                    }
                }

                const dbClient = await dbPool.connect();
                try {
                    await dbClient.query(
                        `INSERT INTO channel_messages 
                         (channel_type, sender_id, message_text, direction, status, created_at) 
                         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                        ['WHATSAPP', toNumber, finalResponse, 'OUT', 'SENT']
                    );
                } finally {
                    dbClient.release();
                }

                console.log(`[WhatsApp] Respuesta enviada a ${toNumber}`);
            } catch (e: any) {
                console.error('[WhatsApp Orchestration] Error:', e);
                try {
                    const twilio = require('twilio');
                    const twilioClient = twilio(accountSid, authToken);
                    await twilioClient.messages.create({
                        from: `whatsapp:${fromNumber}`,
                        to: `whatsapp:${toNumber}`,
                        body: 'Error procesando tu solicitud. Por favor, intenta de nuevo.'
                    });
                } catch (sendErr) {
                    console.error('[WhatsApp] Error enviando mensaje de error:', sendErr);
                }
            }
        })();
    } catch (e) {
        console.error('[WhatsApp] Error disparando orquestacion:', e);
    }
}
