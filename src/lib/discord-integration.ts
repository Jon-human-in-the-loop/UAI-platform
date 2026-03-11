/**
 * Discord Integration - UAI Platform
 * Uses Discord Interactions API (webhook-based, no bot hosting required).
 * Supports slash commands via Ed25519 signature verification (Web Crypto API, no external deps).
 */

/**
 * Verifies the Discord interaction signature using Ed25519 (Web Crypto API).
 * Required by Discord to validate all incoming interactions.
 */
export async function verifyDiscordSignature(
    body: string,
    signature: string,
    timestamp: string,
    publicKey: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const keyBytes = hexToBytes(publicKey);
        const sigBytes = hexToBytes(signature);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes as BufferSource,
            { name: 'Ed25519' },
            false,
            ['verify']
        );

        const message = encoder.encode(timestamp + body);
        return await crypto.subtle.verify('Ed25519', cryptoKey, sigBytes as BufferSource, message);
    } catch (e) {
        console.error('[Discord] Signature verification error:', e);
        return false;
    }
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Sends a followup message to a Discord interaction.
 * Used for deferred responses when processing takes time.
 */
export async function sendDiscordFollowup(
    applicationId: string,
    interactionToken: string,
    content: string
): Promise<void> {
    const url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.substring(0, 2000) }),
    });
    if (!response.ok) {
        console.error('[Discord] Followup failed:', await response.text());
    }
}

/**
 * Sends an immediate response to a Discord interaction.
 * Type 4 = CHANNEL_MESSAGE_WITH_SOURCE (immediate reply)
 * Type 5 = DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (thinking...)
 */
export function buildInteractionResponse(content: string, deferred = false) {
    if (deferred) {
        return { type: 5 }; // Deferred
    }
    return {
        type: 4,
        data: { content: content.substring(0, 2000) },
    };
}

/**
 * Extracts the command name and options from a Discord APPLICATION_COMMAND interaction.
 */
export function parseSlashCommand(interaction: any): { command: string; input: string } {
    const command = interaction?.data?.name || 'ask';
    const options = interaction?.data?.options || [];
    const inputOption = options.find((o: any) => o.name === 'prompt' || o.name === 'input' || o.name === 'query');
    const input = inputOption?.value || options[0]?.value || '';
    return { command, input };
}
