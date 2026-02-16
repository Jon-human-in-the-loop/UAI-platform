import { NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage, sendChannelResponse, getProcessingMessage } from '@/lib/multi-channel';
import { dbPool } from '@/lib/database';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        console.log('[Webhook Telegram] Recibido:', JSON.stringify(payload));

        // 1. Procesar y normalizar el mensaje
        const messageData = await processIncomingMessage('TELEGRAM', payload);
        
        if (!messageData.text) {
            return NextResponse.json({ ok: true });
        }

        // 2. Buscar configuración del canal para este usuario (simulado por ahora)
        // En producción, buscaríamos por el ID de Telegram del remitente
        
        // 3. Enviar mensaje de "Procesando" para feedback inmediato
        const processingMsg = getProcessingMessage('TELEGRAM');
        // Nota: Aquí necesitaríamos el token del bot de la config
        console.log(`[Webhook Telegram] Enviando feedback: ${processingMsg}`);

        // 4. Registrar en la base de datos
        const client = await dbPool.connect();
        try {
            await client.query(
                `INSERT INTO channel_messages (channel_type, channel_user_id, message_content, status) 
                 VALUES ($1, $2, $3, $4)`,
                ['TELEGRAM', messageData.senderId, messageData.text, 'RECEIVED']
            );
        } finally {
            client.release();
        }

        // 5. Aquí se dispararía la orquestación asíncrona
        // triggerOrchestration(messageData.text, messageData.senderId, 'TELEGRAM');

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[Webhook Telegram] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
