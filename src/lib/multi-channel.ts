/**
 * MULTI-CHANNEL INTEGRATION - UAI Platform
 * Orquestación de comunicaciones externas (WhatsApp, Telegram, Email).
 */

export type ChannelType = 'WHATSAPP' | 'TELEGRAM' | 'LINKEDIN' | 'EMAIL' | 'DISCORD';

export interface ChannelConfig {
    type: ChannelType;
    enabled: boolean;
    apiKey?: string;
    webhookUrl?: string;
    metadata: Record<string, any>;
}

/**
 * Procesa un mensaje entrante de un canal externo y lo normaliza para el orquestador.
 */
export async function processIncomingMessage(channel: ChannelType, payload: any) {
    console.log(`[Multi-Channel] Recibiendo mensaje de ${channel}`);
    
    let text = '';
    let senderId = '';
    let metadata: Record<string, any> = {};

    switch (channel) {
        case 'TELEGRAM':
            text = payload.message?.text || '';
            senderId = payload.message?.from?.id?.toString();
            metadata = { username: payload.message?.from?.username };
            break;
        case 'WHATSAPP':
            const msg = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            text = msg?.text?.body || '';
            senderId = msg?.from;
            metadata = { name: payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name };
            break;
        case 'DISCORD':
            text = payload.content || '';
            senderId = payload.author?.id;
            metadata = { channel_id: payload.channel_id };
            break;
        default:
            throw new Error(`Canal ${channel} no soportado aún.`);
    }

    return { 
        text, 
        senderId, 
        channel,
        metadata,
        timestamp: new Date(),
        isCommand: text.startsWith('/')
    };
}

/**
 * Formatea la respuesta del agente según el canal para mejorar la legibilidad.
 */
export function formatResponseForChannel(channel: ChannelType, response: string): string {
    switch (channel) {
        case 'TELEGRAM':
            // Telegram soporta MarkdownV2 o HTML
            return `🤖 *UAI Response*\n\n${response}`;
        case 'WHATSAPP':
            // WhatsApp soporta negritas con asteriscos
            return `*UAI Response*\n\n${response}`;
        case 'DISCORD':
            // Discord soporta Markdown estándar y bloques de código
            return `**UAI Response**\n${response}`;
        default:
            return response;
    }
}

/**
 * Envía una respuesta a través del canal correspondiente.
 */
export async function sendChannelResponse(channel: ChannelType, recipientId: string, message: string, config: ChannelConfig) {
    if (!config.enabled) {
        console.warn(`[Multi-Channel] Intento de envío por canal deshabilitado: ${channel}`);
        return { success: false, error: 'Channel disabled' };
    }

    const formattedMessage = formatResponseForChannel(channel, message);
    console.log(`[Multi-Channel] Enviando respuesta a ${recipientId} vía ${channel}`);
    
    // Simulación de integración con APIs externas
    // En producción, aquí se usarían fetch() a las APIs de Telegram, Twilio, etc.
    
    return { 
        success: true, 
        messageId: crypto.randomUUID(),
        channel,
        recipientId,
        timestamp: new Date()
    };
}

/**
 * Genera una respuesta automática de "Procesando" para mejorar la experiencia de usuario.
 */
export function getProcessingMessage(channel: ChannelType): string {
    const messages = [
        "Analizando tu solicitud con la flota de agentes...",
        "Consultando mi memoria semántica...",
        "Orquestando una respuesta precisa para ti...",
        "Invocando al Dragón Primordial para esta tarea..."
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    return formatResponseForChannel(channel, `⏳ ${randomMsg}`);
}
