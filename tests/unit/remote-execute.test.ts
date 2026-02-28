import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import { verifyRemoteSignature } from '../../src/lib/remote-execute-policy.ts';

test('verifyRemoteSignature valida firma correcta', () => {
    const prev = process.env.REMOTE_EXECUTE_SECRET;
    process.env.REMOTE_EXECUTE_SECRET = 'test-secret';
    const payload = JSON.stringify({ hello: 'world' });
    const signature = crypto.createHmac('sha256', 'test-secret').update(payload).digest('hex');

    assert.equal(verifyRemoteSignature(payload, signature), true);
    process.env.REMOTE_EXECUTE_SECRET = prev;
});

test('verifyRemoteSignature rechaza firma inválida', () => {
    const prev = process.env.REMOTE_EXECUTE_SECRET;
    process.env.REMOTE_EXECUTE_SECRET = 'test-secret';
    const payload = JSON.stringify({ hello: 'world' });

    assert.equal(verifyRemoteSignature(payload, 'bad-signature'), false);
    process.env.REMOTE_EXECUTE_SECRET = prev;
});
