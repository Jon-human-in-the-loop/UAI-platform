import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import { buildCanonicalRequest, getRemoteMaxAttempts, isTimestampFresh, isValidRemoteWorkerToken, verifyRemoteSignature } from '../../src/lib/remote-execute-policy.ts';

function buildSignedInput() {
    const input = {
        method: 'POST',
        path: '/api/agent/remote-execute',
        timestamp: String(Date.now()),
        nonce: 'nonce-1',
        body: JSON.stringify({ hello: 'world' }),
    };

    return {
        input,
        canonical: buildCanonicalRequest(input),
    };
}

test('verifyRemoteSignature valida firma correcta con canonical request', () => {
    const prev = process.env.REMOTE_EXECUTE_SECRET;
    process.env.REMOTE_EXECUTE_SECRET = 'test-secret';

    const { input, canonical } = buildSignedInput();
    const signature = crypto.createHmac('sha256', 'test-secret').update(canonical).digest('hex');

    assert.equal(verifyRemoteSignature(input, signature), true);
    process.env.REMOTE_EXECUTE_SECRET = prev;
});

test('verifyRemoteSignature rechaza firma inválida', () => {
    const prev = process.env.REMOTE_EXECUTE_SECRET;
    process.env.REMOTE_EXECUTE_SECRET = 'test-secret';

    const { input } = buildSignedInput();
    assert.equal(verifyRemoteSignature(input, 'bad-signature'), false);

    process.env.REMOTE_EXECUTE_SECRET = prev;
});

test('isTimestampFresh valida ventana de replay', () => {
    const now = 1_000_000;
    assert.equal(isTimestampFresh('1000000', now), true);
    assert.equal(isTimestampFresh('690000', now), false);
});


test('isValidRemoteWorkerToken valida token de worker', () => {
    const prev = process.env.REMOTE_EXECUTE_WORKER_TOKEN;
    process.env.REMOTE_EXECUTE_WORKER_TOKEN = 'worker-secret';

    assert.equal(isValidRemoteWorkerToken('worker-secret'), true);
    assert.equal(isValidRemoteWorkerToken('invalid'), false);

    process.env.REMOTE_EXECUTE_WORKER_TOKEN = prev;
});


test('getRemoteMaxAttempts usa default y sanitiza valores inválidos', () => {
    const prev = process.env.REMOTE_EXECUTE_MAX_ATTEMPTS;

    delete process.env.REMOTE_EXECUTE_MAX_ATTEMPTS;
    assert.equal(getRemoteMaxAttempts(), 3);

    process.env.REMOTE_EXECUTE_MAX_ATTEMPTS = '0';
    assert.equal(getRemoteMaxAttempts(), 3);

    process.env.REMOTE_EXECUTE_MAX_ATTEMPTS = '5.8';
    assert.equal(getRemoteMaxAttempts(), 5);

    process.env.REMOTE_EXECUTE_MAX_ATTEMPTS = prev;
});
