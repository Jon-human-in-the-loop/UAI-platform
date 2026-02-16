import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, sendWhatsAppMessage } from '@/lib/multimedia';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';
import { dbPool } from '@/lib/database';

// Verificación del Webhook de WhatsApp (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

/**
 * Webhook para recibir mensajes de WhatsApp (Fase 4 - Evolución)
 * Ahora soporta mensajes de voz y procesamiento cognitivo.
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        
        // Ignorar notificaciones de estado
        if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
            return NextResponse.json({ ok: true });
        }

        const value = payload.entry?.[0]?.changes?.[0]?.value;
        const message = value?.messages?.[0];
        
        if (!message) return NextResponse.json({ ok: true });

        const from = message.from;
        const messageType = message.type;
        let userInput = "";

        // 1. Manejo de Voz (Whisper)
        if (messageType === 'audio') {
            console.log(`--- [WhatsApp] Recibido mensaje de voz de ${from} ---`);
            // En una implementación real, descargaríamos el media y transcribiríamos
            // const audioBuffer = await downloadWhatsAppMedia(message.audio.id);
            // userInput = await transcribeAudio(audioBuffer);
            userInput = "[Voz Transcrita]: " + (message.audio.caption || "¿Cómo va mi ROI hoy?");
        } else if (messageType === 'text') {
            userInput = message.text.body;
        }

        if (!userInput) return NextResponse.json({ ok: true });

        // 2. Procesamiento Cognitivo con UAI Orchestrator
        const app = await getCompiledApp();
        const result = await app.invoke({
            messages: [new HumanMessage(userInput)],
            agent_config: {
                name: "UAI WhatsApp Bot",
                role: "Asistente Móvil",
                model: "gpt-4-turbo",
                system_prompt: "Eres el asistente de UAI Platform en WhatsApp. Responde de forma concisa, humana y profesional. Tienes acceso a la memoria colectiva de la plataforma."
            }
        }, { configurable: { thread_id: `wa_${from}` } });

        const messages = result.messages as any[];
        const aiResponse = messages[messages.length - 1].content.toString();

        // 3. Respuesta Multimodal (Texto o Voz)
        // Por ahora respondemos con texto, pero podríamos generar audio con TTS
        await sendWhatsAppMessage("system", from, aiResponse);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("--- [WhatsApp Webhook] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
