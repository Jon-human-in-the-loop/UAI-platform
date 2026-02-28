import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMercadoPagoEventKey } from '../../src/lib/webhook-events-policy.ts';

test('buildMercadoPagoEventKey genera clave estable', () => {
    assert.equal(buildMercadoPagoEventKey('payment', '123'), 'mp:payment:123');
});

test('buildMercadoPagoEventKey maneja valores faltantes', () => {
    assert.equal(buildMercadoPagoEventKey(null, null), 'mp:unknown:unknown');
});
