import OpenAI from "openai";
import { HumanMessage, MessageContent, BaseMessage } from "@langchain/core/messages";

const openai = new OpenAI();

/**
 * Transcribe audio a texto usando OpenAI Whisper.
 * @param audioBuffer El buffer de audio en formato compatible con Whisper.
 * @param format El formato del audio (ej. "mp3", "wav").
 * @returns El texto transcrito.
 */
export async function transcribeAudio(audioBuffer: Buffer, format: string): Promise<string> {
    try {
        const response = await openai.audio.transcriptions.create({
            file: new File([audioBuffer], `audio.${format}`),
            model: "whisper-1",
        });
        return response.text;
    } catch (error) {
        console.error("Error al transcribir audio con Whisper:", error);
        throw new Error("Fallo en la transcripción de audio.");
    }
}

/**
 * Procesa un mensaje multimodal (texto e imágenes) para el LLM.
 * @param input El mensaje de entrada, que puede contener texto y URLs de imágenes.
 * @returns Un array de MessageContent compatible con Langchain/OpenAI.
 */
export function processMultimodalInput(input: string): MessageContent {
    const content: MessageContent = [];
    const imageRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/g;
    let lastIndex = 0;

    // Extraer URLs de imágenes y texto
    let match;
    while ((match = imageRegex.exec(input)) !== null) {
        if (match.index > lastIndex) {
            content.push({ type: "text", text: input.substring(lastIndex, match.index) });
        }
        content.push({ type: "image_url", image_url: { url: match[0] } });
        lastIndex = imageRegex.lastIndex;
    }

    if (lastIndex < input.length) {
        content.push({ type: "text", text: input.substring(lastIndex) });
    }

    return content.filter(item => (typeof item === 'string' && item.trim() !== '') || (typeof item === 'object' && item.type === 'image_url'));
}

/**
 * Convierte un mensaje de texto simple en un HumanMessage multimodal.
 * Si el texto contiene URLs de imágenes, las procesa.
 * @param text El texto de entrada.
 * @returns Un HumanMessage con contenido multimodal si se detectan imágenes.
 */
export function createMultimodalHumanMessage(text: string): HumanMessage {
    const processedContent = processMultimodalInput(text);
    if (processedContent.length > 0) {
        return new HumanMessage({ content: processedContent });
    } else {
        return new HumanMessage(text);
    }
}

/**
 * Verifica si un mensaje contiene contenido multimodal (imágenes).
 * @param message El mensaje a verificar.
 * @returns True si el mensaje contiene imágenes, false en caso contrario.
 */
export function containsMultimodalContent(message: BaseMessage): boolean {
    if (typeof message.content === 'string') {
        return false;
    }
    if (Array.isArray(message.content)) {
        return message.content.some(item => typeof item === 'object' && item.type === 'image_url');
    }
    return false;
}
