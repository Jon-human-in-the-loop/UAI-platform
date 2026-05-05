import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const META_PROMPT = `Eres un experto en Prompt Engineering para agentes de IA autónomos.
Tu tarea es transformar una descripción simple en un System Prompt profesional y estructurado.

CONTEXTO DEL AGENTE:
- Nombre: {NAME}
- Rol: {ROLE}
- Descripción del usuario: {DESCRIPTION}

GENERA un System Prompt profesional siguiendo EXACTAMENTE esta estructura (sin los títulos de sección, solo el contenido fluido):

1. **IDENTIDAD Y PERSONALIDAD**: Define quién es el agente, su voz, tono y forma de comunicarse.
2. **CONTEXTO Y EXPERTISE**: Qué conocimiento profundo posee y en qué áreas es autoridad.
3. **OBJETIVOS PRINCIPALES**: Qué debe lograr en cada interacción (máximo 3 objetivos concretos).
4. **PROTOCOLO DE ACCIÓN**: Cómo estructura sus respuestas, qué preguntas hace primero, cómo prioriza tareas.
5. **RESTRICCIONES ABSOLUTAS**: Qué NUNCA debe hacer o decir (máximo 3 restricciones críticas).
6. **FIRMA DE SALIDA**: Formato preferido de sus respuestas (bullets, párrafos, tablas, etc.).

REGLAS CRÍTICAS:
- Escribe en segunda persona (Eres... Tu misión es... Debes...)
- Usa lenguaje directo y poderoso, no genérico
- El prompt debe tener entre 200 y 350 palabras
- NO incluyas los títulos de sección en el output final
- Output SOLO el System Prompt, sin explicaciones ni comentarios
- Escribe en el mismo idioma que la descripción del usuario`;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, role, description } = await req.json();

        if (!description || description.trim().length < 5) {
            return NextResponse.json(
                { error: 'Describe brevemente qué debe hacer tu agente (mínimo 5 caracteres)' },
                { status: 400 }
            );
        }

        const prompt = META_PROMPT
            .replace('{NAME}', name || 'Agente')
            .replace('{ROLE}', role || 'Asistente')
            .replace('{DESCRIPTION}', description.trim());

        const message = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                }
            ],
        });

        const optimizedPrompt = (message.content[0] as { type: string; text: string }).text?.trim();

        if (!optimizedPrompt) {
            throw new Error('No se pudo generar el prompt');
        }

        return NextResponse.json({ prompt: optimizedPrompt });
    } catch (error: any) {
        console.error('Error optimizing prompt:', error);
        return NextResponse.json(
            { error: `Error al optimizar: ${error.message}` },
            { status: 500 }
        );
    }
}
