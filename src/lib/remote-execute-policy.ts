import crypto from 'crypto';

const MAX_SKEW_SECONDS = 300;

export interface RemoteSignatureInput {
    method: string;
    path: string;
    timestamp: string;
    nonce: string;
    body: string;
}

export function hashBody(body: string) {
    return crypto.createHash('sha256').update(body).digest('hex');
}

export function buildCanonicalRequest(input: RemoteSignatureInput) {
    return [
        input.method.toUpperCase(),
        input.path,
        input.timestamp,
        input.nonce,
        hashBody(input.body),
    ].join('\n');
}

export function verifyRemoteSignature(input: RemoteSignatureInput, signature: string | null) {
    const secret = process.env.REMOTE_EXECUTE_SECRET;
    if (!secret || !signature) return false;

    const canonical = buildCanonicalRequest(input);
    const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function isTimestampFresh(timestamp: string, nowMs = Date.now()) {
    const parsed = Number(timestamp);
    if (!Number.isFinite(parsed)) return false;
    const deltaSeconds = Math.abs(nowMs - parsed) / 1000;
    return deltaSeconds <= MAX_SKEW_SECONDS;
}

export function getRemoteSignatureWindowSeconds() {
    return MAX_SKEW_SECONDS;
}
