import twilio from 'twilio';
import { dbPool } from './database';

export interface WhatsAppMessage {
    From: string;
    To: string;
    Body: string;
    MessageSid: string;
}

/**
 * Obtiene la configuración de WhatsApp para un usuario
 */
export async function getWhatsAppConfig(userId: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM channel_configs 
             WHERE user_id = $1 AND channel_type = 'WHATSAPP' AND enabled = true`,
            [userId]
        );
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

/**
 * Envía un mensaje a través de WhatsApp usando Twilio
 */
export async function sendWhatsAppMessage(
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    text: string
) {
    try {
        const twilioClient = twilio(accountSid, authToken);
        const message = await twilioClient.messages.create({
            from: `whatsapp:${fromNumber}`,
            to: `whatsapp:${toNumber}`,
            body: text
        });
        console.log(`[WhatsApp] Mensaje enviado: ${message.sid}`);
        return message;
    } catch (error: any) {
        console.error('[WhatsApp] Error al enviar mensaje:', error.message);
        throw error;
    }
}

/**
 * Procesa un mensaje entrante de WhatsApp
 */
export async function processWhatsAppMessage(payload: any) {
    try {
        const from = payload.From;
        const to = payload.To;
        const text = payload.Body;
        const numMedia = Number(payload.NumMedia || 0);
        const messageSid = payload.MessageSid;

        if (!text && numMedia === 0) {
            return { success: false, reason: 'No message text or media' };
        }

        console.log(`[WhatsApp] Mensaje de ${from}: ${text || '[media]'}`);

        // Extraer el número de teléfono (remover prefijo whatsapp:)
        const phoneNumber = from.replace('whatsapp:', '');

        // Registrar el mensaje en la base de datos
        const dbClient = await dbPool.connect();
        try {
            await dbClient.query(
                `INSERT INTO channel_messages 
                 (channel_type, sender_id, message_text, direction, status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                ['WHATSAPP', phoneNumber, text, 'IN', 'RECEIVED']
            );
        } finally {
            dbClient.release();
        }

        return {
            success: true,
            phoneNumber,
            text: text || '',
            messageSid
        };
    } catch (error: any) {
        console.error('[WhatsApp] Error procesando mensaje:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Registra una nueva configuración de WhatsApp para un usuario
 */
export async function registerWhatsAppConfig(
    userId: string,
    accountSid: string,
    authToken: string,
    fromNumber: string
) {
    const client = await dbPool.connect();
    try {
        await client.query(
            `INSERT INTO channel_configs 
             (user_id, channel_type, enabled, api_key, metadata, created_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, channel_type) DO UPDATE SET
             api_key = $4, metadata = $5, enabled = $3`,
            [
                userId,
                'WHATSAPP',
                true,
                accountSid,
                JSON.stringify({
                    authToken,
                    fromNumber
                })
            ]
        );
        console.log(`[WhatsApp] Configuración registrada para usuario ${userId}`);
        return true;
    } catch (error: any) {
        console.error('[WhatsApp] Error registrando configuración:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtiene el número de Twilio desde la configuración
 */
export function getTwilioNumber(config: any): string {
    try {
        const metadata = typeof config.metadata === 'string'
            ? JSON.parse(config.metadata)
            : config.metadata;
        return metadata.fromNumber || '';
    } catch {
        return '';
    }
}

/**
 * Obtiene el authToken desde la configuración
 */
export function getTwilioAuthToken(config: any): string {
    try {
        const metadata = typeof config.metadata === 'string'
            ? JSON.parse(config.metadata)
            : config.metadata;
        return metadata.authToken || '';
    } catch {
        return '';
    }
}
