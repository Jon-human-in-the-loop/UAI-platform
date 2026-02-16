import { NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage, getProcessingMessage } from '@/lib/multi-channel';
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

// Procesamiento de mensajes de WhatsApp (POST)
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        
        // WhatsApp envía notificaciones de estado que no son mensajes
        if (payload.entry?.[0]?.changes?.[0]?.value?.statuses) {
            return NextResponse.json({ ok: true });
        }

        const messageData = await processIncomingMessage('WHATSAPP', payload);
        
        if (!messageData.text) {
            return NextResponse.json({ ok: true });
        }

        // Registrar mensaje entrante
        const client = await dbPool.connect();
        try {
            await client.query(
                `INSERT INTO channel_messages (channel_type, channel_user_id, message_content, status) 
                 VALUES ($1, $2, $3, $4)`,
                ['WHATSAPP', messageData.senderId, messageData.text, 'RECEIVED']
            );
        } finally {
            client.release();
        }

        console.log(`[Webhook WhatsApp] Mensaje de ${messageData.senderId}: ${messageData.text}`);
        
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[Webhook WhatsApp] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
