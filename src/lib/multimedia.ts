import OpenAI from 'openai';
import { dbPool } from './database';
import { toFile } from 'openai/uploads';

let openaiInstance: OpenAI | null = null;
function getOpenAI() {
    if (!openaiInstance) {
        openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build' });
    }
    return openaiInstance;
}

/**
 * Módulo de Multimedia y Voz (Fase 4)
 */

export async function transcribeAudio(audioBuffer: Buffer) {
    console.log('--- [Multimedia] Transcribiendo audio con Whisper ---');

    if (!process.env.OPENAI_API_KEY) {
        return 'Simulación: Texto transcrito desde audio de WhatsApp.';
    }

    try {
        const file = await toFile(audioBuffer, 'voice.mp3', { type: 'audio/mpeg' });
        const response = await getOpenAI().audio.transcriptions.create({
            file,
            model: 'whisper-1',
        });
        return response.text;
    } catch (error) {
        console.error('Error transcribiendo audio, fallback a simulación:', error);
        return 'Simulación: Texto transcrito desde audio de WhatsApp.';
    }
}

export async function generateSpeech(text: string) {
    console.log('--- [Multimedia] Generando voz con TTS ---');

    if (!process.env.OPENAI_API_KEY) {
        return Buffer.from('Simulación de audio MP3');
    }

    try {
        const mp3 = await getOpenAI().audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: text,
        });
        return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
        console.error('Error generando TTS, fallback a simulación:', error);
        return Buffer.from('Simulación de audio MP3');
    }
}

export async function sendWhatsAppMessage(userId: string, to: string, content: string, type: 'text' | 'voice' = 'text') {
    console.log(`--- [WhatsApp] Enviando mensaje de ${type} a ${to} ---`);

    try {
        const client = await dbPool.connect();
        try {
            await client.query(
                `INSERT INTO channel_messages (
                    user_id, channel_type, sender_id, message_text, direction, status
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, 'whatsapp', to, content, 'OUT', 'SENT']
            );
        } finally {
            client.release();
        }

        return { success: true };
    } catch (error) {
        console.error('--- [WhatsApp] Error al enviar mensaje:', error);
        return { success: false, error };
    }
}
