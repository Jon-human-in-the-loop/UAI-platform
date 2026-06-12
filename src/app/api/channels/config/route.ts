import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { registerWhatsAppConfig } from '@/lib/whatsapp-integration';

/**
 * API de Configuración de Canales - UAI Platform
 *
 * GET  → Lista las configuraciones de canales del usuario autenticado.
 *        Los secretos NUNCA se exponen completos: se enmascaran mostrando
 *        solo los últimos 4 caracteres (ej: "••••3Xk9").
 *
 * POST → Guarda/actualiza la configuración de un canal. Acepta dos formas:
 *
 *   1) Forma nueva (usada por ChannelConfigModal):
 *      { channelType: 'TELEGRAM'|'WHATSAPP'|'DISCORD', enabled: boolean, credentials: {...} }
 *      - TELEGRAM → credentials: { botToken }
 *      - WHATSAPP → credentials: { accountSid, authToken, fromNumber }
 *      - DISCORD  → credentials: { publicKey, applicationId, guildId? }
 *
 *   2) Forma legada / toggle (usada por ChannelManager):
 *      { channelType, enabled, apiKey?, webhookUrl?, metadata? }
 *      Los valores enmascarados (que empiezan con "••••") se ignoran para
 *      no sobrescribir secretos reales con su versión enmascarada.
 */

const ALLOWED_CHANNELS = ['TELEGRAM', 'WHATSAPP', 'DISCORD', 'EMAIL'] as const;
type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

const MASK_PREFIX = '••••';
const TELEGRAM_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]+$/;
const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const DISCORD_PUBLIC_KEY_REGEX = /^[0-9a-fA-F]{64}$/;
const DISCORD_SNOWFLAKE_REGEX = /^\d{10,25}$/;

/** Enmascara un secreto mostrando solo sus últimos 4 caracteres. */
function maskSecret(value: unknown): string | null {
    if (typeof value !== 'string' || value.length === 0) return null;
    return `${MASK_PREFIX}${value.slice(-4)}`;
}

/** Detecta si un valor recibido es una versión enmascarada (no debe guardarse). */
function isMaskedValue(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith(MASK_PREFIX);
}

/** Normaliza el metadata (puede llegar como string JSON o como objeto desde JSONB). */
function parseMetadata(raw: unknown): Record<string, any> {
    if (!raw) return {};
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) || {};
        } catch {
            return {};
        }
    }
    if (typeof raw === 'object') return { ...(raw as Record<string, any>) };
    return {};
}

/** Devuelve una copia de la fila sin secretos completos. */
function sanitizeRow(row: any) {
    if (!row) return null;
    const metadata = parseMetadata(row.metadata);
    if (metadata.authToken) {
        metadata.authToken = maskSecret(metadata.authToken);
    }
    return {
        id: row.id,
        channel_type: row.channel_type,
        enabled: row.enabled,
        api_key: maskSecret(row.api_key),
        webhook_url: row.webhook_url || null,
        metadata,
        agent_id: row.agent_id || null,
        created_at: row.created_at || null,
    };
}

/** Obtiene la fila existente de un canal para el usuario (o null). */
async function getExistingConfig(userId: string, channelType: AllowedChannel) {
    const res = await dbPool.query(
        `SELECT id, channel_type, enabled, api_key, webhook_url, metadata, agent_id, created_at
         FROM channel_configs
         WHERE user_id = $1 AND channel_type = $2`,
        [userId, channelType]
    );
    return res.rows[0] || null;
}

/** Upsert genérico sobre channel_configs respetando UNIQUE(user_id, channel_type). */
async function upsertConfig(
    userId: string,
    channelType: AllowedChannel,
    enabled: boolean,
    apiKey: string | null,
    webhookUrl: string | null,
    metadata: Record<string, any>
) {
    const res = await dbPool.query(
        `INSERT INTO channel_configs (user_id, channel_type, enabled, api_key, webhook_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, channel_type)
         DO UPDATE SET enabled = $3, api_key = $4, webhook_url = $5, metadata = $6
         RETURNING id, channel_type, enabled, api_key, webhook_url, metadata, agent_id, created_at`,
        [userId, channelType, enabled, apiKey, webhookUrl, JSON.stringify(metadata || {})]
    );
    return res.rows[0];
}

/** URL base pública de la app (sin slash final), si está configurada. */
function getAppUrl(): string {
    return (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
}

/**
 * BONUS: registra automáticamente el webhook del bot en Telegram.
 * Si falla, la config ya quedó guardada y devolvemos un warning (no un error).
 */
async function registerTelegramWebhook(botToken: string, webhookUrl: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
            { method: 'GET', signal: AbortSignal.timeout(8000) }
        );
        const data: any = await res.json().catch(() => ({}));
        if (!data.ok) {
            return `La configuración se guardó, pero el registro del webhook en Telegram falló: ${data.description || `HTTP ${res.status}`}`;
        }
        console.log(`[Channels Config] Webhook de Telegram registrado: ${webhookUrl}`);
        return null;
    } catch (e: any) {
        return `La configuración se guardó, pero no se pudo contactar a la API de Telegram para registrar el webhook: ${e?.message || 'error de red'}`;
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const res = await dbPool.query(
            `SELECT id, channel_type, enabled, api_key, webhook_url, metadata, agent_id, created_at
             FROM channel_configs
             WHERE user_id = $1
             ORDER BY channel_type ASC`,
            [session.user.id]
        );
        return NextResponse.json(res.rows.map(sanitizeRow));
    } catch (error: any) {
        console.error('[Channels Config] Error listando configuraciones:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const userId = session.user.id;

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const channelType = String(body?.channelType || '').toUpperCase() as AllowedChannel;
    if (!ALLOWED_CHANNELS.includes(channelType)) {
        return NextResponse.json(
            { error: `Canal no válido. Usa uno de: ${ALLOWED_CHANNELS.join(', ')}` },
            { status: 400 }
        );
    }

    if (channelType === 'EMAIL') {
        return NextResponse.json(
            { error: 'La integración de Email estará disponible próximamente' },
            { status: 400 }
        );
    }

    const enabled = typeof body?.enabled === 'boolean' ? body.enabled : true;
    const credentials = body?.credentials;
    const appUrl = getAppUrl();
    let warning: string | null = null;

    try {
        const existing = await getExistingConfig(userId, channelType);
        const existingMetadata = parseMetadata(existing?.metadata);

        // ── Forma nueva: credenciales explícitas por canal ──────────────────
        if (credentials && typeof credentials === 'object') {
            switch (channelType) {
                case 'TELEGRAM': {
                    const botToken = String(credentials.botToken || '').trim();
                    if (!TELEGRAM_TOKEN_REGEX.test(botToken)) {
                        return NextResponse.json(
                            { error: 'Bot Token de Telegram inválido. Formato esperado: 123456789:AAEjemploDeToken_-abc' },
                            { status: 400 }
                        );
                    }
                    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/telegram` : existing?.webhook_url || null;
                    await upsertConfig(userId, 'TELEGRAM', enabled, botToken, webhookUrl, existingMetadata);

                    // BONUS: registrar el webhook automáticamente en Telegram
                    if (appUrl) {
                        warning = await registerTelegramWebhook(botToken, `${appUrl}/api/webhooks/telegram`);
                    } else {
                        warning = 'NEXT_PUBLIC_APP_URL no está definida: registra el webhook de Telegram manualmente con setWebhook.';
                    }
                    break;
                }

                case 'WHATSAPP': {
                    const accountSid = String(credentials.accountSid || '').trim();
                    const authToken = String(credentials.authToken || '').trim();
                    const fromNumber = String(credentials.fromNumber || '').trim();

                    if (!accountSid.startsWith('AC')) {
                        return NextResponse.json(
                            { error: 'El Account SID de Twilio debe comenzar con "AC"' },
                            { status: 400 }
                        );
                    }
                    if (!authToken) {
                        return NextResponse.json(
                            { error: 'El Auth Token de Twilio es requerido' },
                            { status: 400 }
                        );
                    }
                    if (!E164_REGEX.test(fromNumber)) {
                        return NextResponse.json(
                            { error: 'El número de WhatsApp debe estar en formato E.164 (ej: +14155238886)' },
                            { status: 400 }
                        );
                    }

                    // Reutilizamos la lógica existente de la integración (upsert con enabled=true)
                    await registerWhatsAppConfig(userId, accountSid, authToken, fromNumber);

                    // Ajustar enabled solicitado y webhook informativo
                    await dbPool.query(
                        `UPDATE channel_configs SET enabled = $1, webhook_url = $2
                         WHERE user_id = $3 AND channel_type = 'WHATSAPP'`,
                        [enabled, appUrl ? `${appUrl}/api/webhooks/whatsapp` : existing?.webhook_url || null, userId]
                    );
                    break;
                }

                case 'DISCORD': {
                    const publicKey = String(credentials.publicKey || '').trim();
                    const applicationId = String(credentials.applicationId || '').trim();
                    const guildId = String(credentials.guildId || '').trim();

                    if (!DISCORD_PUBLIC_KEY_REGEX.test(publicKey)) {
                        return NextResponse.json(
                            { error: 'La Public Key de Discord debe ser una cadena hexadecimal de 64 caracteres' },
                            { status: 400 }
                        );
                    }
                    if (!DISCORD_SNOWFLAKE_REGEX.test(applicationId)) {
                        return NextResponse.json(
                            { error: 'El Application ID de Discord debe ser numérico (snowflake)' },
                            { status: 400 }
                        );
                    }
                    if (guildId && !DISCORD_SNOWFLAKE_REGEX.test(guildId)) {
                        return NextResponse.json(
                            { error: 'El Guild ID de Discord debe ser numérico (snowflake)' },
                            { status: 400 }
                        );
                    }

                    const metadata: Record<string, any> = { ...existingMetadata, publicKey, applicationId };
                    if (guildId) {
                        metadata.guildId = guildId;
                    } else {
                        delete metadata.guildId;
                    }
                    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/discord` : existing?.webhook_url || null;
                    await upsertConfig(userId, 'DISCORD', enabled, existing?.api_key || null, webhookUrl, metadata);
                    break;
                }
            }
        } else {
            // ── Forma legada / toggle (compatible con ChannelManager) ───────
            const incomingApiKey = body?.apiKey;
            const incomingWebhookUrl = body?.webhookUrl;
            const incomingMetadata = parseMetadata(body?.metadata);

            // Ignorar valores enmascarados para no corromper secretos guardados
            const apiKeyProvided =
                typeof incomingApiKey === 'string' && incomingApiKey.trim() !== '' && !isMaskedValue(incomingApiKey);
            const newApiKey = apiKeyProvided ? incomingApiKey.trim() : existing?.api_key || null;

            if (apiKeyProvided && channelType === 'TELEGRAM' && !TELEGRAM_TOKEN_REGEX.test(newApiKey!)) {
                return NextResponse.json(
                    { error: 'Bot Token de Telegram inválido. Formato esperado: 123456789:AAEjemploDeToken_-abc' },
                    { status: 400 }
                );
            }
            if (apiKeyProvided && channelType === 'WHATSAPP' && !newApiKey!.startsWith('AC')) {
                return NextResponse.json(
                    { error: 'El Account SID de Twilio debe comenzar con "AC"' },
                    { status: 400 }
                );
            }

            const newWebhookUrl =
                typeof incomingWebhookUrl === 'string' && incomingWebhookUrl.trim() !== ''
                    ? incomingWebhookUrl.trim()
                    : existing?.webhook_url || null;

            // Merge de metadata descartando valores enmascarados
            const sanitizedIncoming: Record<string, any> = {};
            for (const [key, value] of Object.entries(incomingMetadata)) {
                if (!isMaskedValue(value)) sanitizedIncoming[key] = value;
            }
            const newMetadata = { ...existingMetadata, ...sanitizedIncoming };

            if (!existing && !enabled) {
                // Nada que deshabilitar: no-op honesto
                return NextResponse.json({ success: true, config: null, message: 'El canal ya estaba desconectado' });
            }

            const hasCredentials = Boolean(newApiKey) || Boolean(newMetadata.publicKey);
            if (!existing && enabled && !hasCredentials) {
                return NextResponse.json(
                    { error: 'Configura las credenciales del canal antes de habilitarlo' },
                    { status: 400 }
                );
            }

            await upsertConfig(userId, channelType, enabled, newApiKey, newWebhookUrl, newMetadata);

            // BONUS: si llegó un botToken nuevo de Telegram, registrar webhook también aquí
            if (apiKeyProvided && channelType === 'TELEGRAM' && appUrl) {
                warning = await registerTelegramWebhook(newApiKey!, `${appUrl}/api/webhooks/telegram`);
            }
        }

        const saved = await getExistingConfig(userId, channelType);
        return NextResponse.json({
            success: true,
            config: sanitizeRow(saved),
            warning: warning || undefined,
            message: 'Configuración guardada exitosamente',
        });
    } catch (error: any) {
        console.error('[Channels Config] Error guardando configuración:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
