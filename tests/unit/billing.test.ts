import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCreditCost } from '../../src/lib/billing-pricing.ts';

test('calculateCreditCost aplica tarifa por modelo y redondea hacia arriba', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4-turbo',
        promptTokens: 1200,
        completionTokens: 450,
    });

    // 1650 tokens * 10/1000 = 16.5 => ceil = 17
    assert.equal(cost, 17);
});

test('calculateCreditCost usa tarifa fallback para modelos no mapeados', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'unknown-model',
        promptTokens: 1000,
        completionTokens: 0,
    });

    assert.equal(cost, 5);
});
