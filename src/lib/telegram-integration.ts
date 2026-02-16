import axios from 'axios';
import { dbPool } from './database';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export interface TelegramMessage {
    chat_id: number;
    text: string;
    message_id: number;
    from_id: number;
}

/**
 * Envía un mensaje a través de Telegram usando el token del bot
 */
export async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
    try {
        const response = await axios.post(
            `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            }
        );
        console.log(`[Telegram] Mensaje enviado a ${chatId}`);
        return response.data;
    } catch (error: any) {
        console.error('[Telegram] Error al enviar mensaje:', error.message);
        throw error;
    }
}

/**
 * Obtiene la configuración de Telegram para un usuario
 */
export async function getTelegramConfig(userId: string) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM channel_configs 
             WHERE user_id = $1 AND channel_type = 'TELEGRAM' AND enabled = true`,
            [userId]
        );
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

/**
 * Procesa un mensaje entrante de Telegram y lo vincula con la orquestación
 */
export async function processTelegramMessage(payload: any) {
    try {
        const message = payload.message;
        if (!message || !message.text) {
            return { success: false, reason: 'No message text' };
        }

        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;
        const messageId = message.message_id;

        console.log(`[Telegram] Mensaje de ${userId}: ${text}`);

        // Registrar el mensaje en la base de datos
        const client = await dbPool.connect();
        try {
            await client.query(
                `INSERT INTO channel_messages 
                 (user_id, channel_type, sender_id, message_text, direction, status, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
                [userId, 'TELEGRAM', chatId.toString(), text, 'IN', 'RECEIVED']
            );
        } finally {
            client.release();
        }

        return {
            success: true,
            chatId,
            userId,
            text,
            messageId
        };
    } catch (error: any) {
        console.error('[Telegram] Error procesando mensaje:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Registra una nueva configuración de Telegram para un usuario
 */
export async function registerTelegramConfig(userId: string, botToken: string, chatId: string) {
    const client = await dbPool.connect();
    try {
        await client.query(
            `INSERT INTO channel_configs 
             (user_id, channel_type, enabled, api_key, metadata, created_at) 
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, channel_type) DO UPDATE SET
             api_key = $4, metadata = $5, enabled = $3`,
            [userId, 'TELEGRAM', true, botToken, JSON.stringify({ chatId })]
        );
        console.log(`[Telegram] Configuración registrada para usuario ${userId}`);
        return true;
    } catch (error: any) {
        console.error('[Telegram] Error registrando configuración:', error);
        throw error;
    } finally {
        client.release();
    }
}
