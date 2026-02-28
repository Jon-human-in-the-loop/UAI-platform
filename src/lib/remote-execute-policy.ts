import crypto from 'crypto';

export function verifyRemoteSignature(payload: string, signature: string | null) {
    const secret = process.env.REMOTE_EXECUTE_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
