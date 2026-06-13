import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateCreditCost } from '../../src/lib/billing-pricing.ts';

test('calculateCreditCost aplica tarifa por modelo y redondea hacia arriba', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 1200,
        completionTokens: 450,
    });

    // promptTokens: 1200 * rateIn(10)/1000 = 12
    // completionTokens: 450 * rateOut(40)/1000 = 18
    // total = ceil(30) = 30
    assert.equal(cost, 30);
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
