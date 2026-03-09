import { NextRequest, NextResponse } from 'next/server';
import { verifyDiscordSignature, sendDiscordFollowup, buildInteractionResponse, parseSlashCommand } from '@/lib/discord-integration';
import { getCompiledApp } from '@/lib/orchestrator/nodes';
import { HumanMessage } from '@langchain/core/messages';
import { dbPool } from '@/lib/database';

export const dynamic = 'force-dynamic';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || '';

/**
 * Looks up the platform user linked to a Discord guild (server).
 * Falls back to admin user if no specific mapping exists.
 */
async function getUserForDiscordGuild(guildId: string): Promise<string | null> {
    try {
        const res = await dbPool.query(
            `SELECT user_id FROM channel_configs
             WHERE channel_type = 'DISCORD' AND enabled = true
             AND metadata->>'guildId' = $1
             LIMIT 1`,
            [guildId]
        );
        return res.rows[0]?.user_id || null;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('x-signature-ed25519') || '';
    const timestamp = req.headers.get('x-signature-timestamp') || '';

    if (!DISCORD_PUBLIC_KEY) {
        return NextResponse.json({ error: 'Discord public key not configured' }, { status: 500 });
    }

    // Verify Discord signature
    const isValid = await verifyDiscordSignature(body, signature, timestamp, DISCORD_PUBLIC_KEY);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let interaction: any;
    try {
        interaction = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Type 1: PING (Discord verification)
    if (interaction.type === 1) {
        return NextResponse.json({ type: 1 });
    }

    // Type 2: APPLICATION_COMMAND (slash command)
    if (interaction.type === 2) {
        const { command, input } = parseSlashCommand(interaction);
        const guildId = interaction.guild_id || '';
        const userId = await getUserForDiscordGuild(guildId);

        if (!input) {
            return NextResponse.json(buildInteractionResponse('Por favor incluye un mensaje. Ejemplo: `/ask prompt:¿Qué es UAI?`'));
        }

        // Send deferred response immediately (Discord requires < 3s response)
        const deferredResponse = NextResponse.json(buildInteractionResponse('', true));

        // Run orchestration asynchronously
        if (DISCORD_APPLICATION_ID && interaction.token) {
            triggerOrchestrationAsync(
                userId || 'discord-anon',
                input,
                DISCORD_APPLICATION_ID,
                interaction.token
            );
        }

        return deferredResponse;
    }

    // Type 3: MESSAGE_COMPONENT — acknowledge
    if (interaction.type === 3) {
        return NextResponse.json({ type: 6 });
    }

    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
}

async function triggerOrchestrationAsync(
    userId: string,
    input: string,
    applicationId: string,
    interactionToken: string
) {
    (async () => {
        try {
            const app = await getCompiledApp();
            const config = {
                configurable: { thread_id: `discord-${userId}-${Date.now()}` },
            };

            const payload = {
                userId,
                messages: [new HumanMessage(input)],
                next_node: 'analizador',
                errors: [],
                skills_active: [],
                context_memory: {},
                budget_status: { current: 0, limit: 1000, plan: 'essentials' },
                is_blocked: false,
                agent_config: {
                    name: 'UAI Discord Agent',
                    role: 'Asistente de Discord',
                    model: 'gpt-4o',
                    system_prompt: 'Eres un asistente de IA para Discord. Responde de forma concisa y útil. Máximo 2000 caracteres.'
                },
            };

            let finalResponse = '';
            const stream = await app.stream(payload as any, {
                ...config,
                streamMode: 'values',
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

            const responseText = finalResponse || 'No pude generar una respuesta. Intenta de nuevo.';
            await sendDiscordFollowup(applicationId, interactionToken, responseText);
        } catch (error: any) {
            console.error('[Discord] Orchestration error:', error);
            await sendDiscordFollowup(
                applicationId,
                interactionToken,
                'Hubo un error procesando tu solicitud. Por favor intenta nuevamente.'
            );
        }
    })();
}
