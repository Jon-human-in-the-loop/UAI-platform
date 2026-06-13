import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCreditCost } from '../../src/lib/billing-pricing.ts';

// --- calculateCreditCost ---

test('calculateCreditCost calcula costo correcto para gpt-4o (solo prompt)', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // 1000 promptTokens * rateIn(10)/1000 = 10
    assert.equal(cost, 10);
});

test('calculateCreditCost calcula costo correcto para claude-sonnet-4-6 (solo prompt)', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'claude-sonnet-4-6',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // 1000 promptTokens * rateIn(12)/1000 = 12
    assert.equal(cost, 12);
});

test('calculateCreditCost calcula costo correcto para gpt-4o-mini (solo prompt)', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o-mini',
        promptTokens: 2000,
        completionTokens: 0,
    });
    // 2000 promptTokens * rateIn(3)/1000 = 6
    assert.equal(cost, 6);
});

test('calculateCreditCost calcula costo correcto para gpt-4o (solo completion)', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 0,
        completionTokens: 500,
    });
    // 500 completionTokens * rateOut(40)/1000 = 20
    assert.equal(cost, 20);
});

test('calculateCreditCost aplica tarifa fallback para modelos desconocidos', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'modelo-desconocido',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // fallback rateIn=5: 1000 * 5/1000 = 5
    assert.equal(cost, 5);
});

test('calculateCreditCost redondea hacia arriba (ceil) fracciones', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 1050,
        completionTokens: 0,
    });
    // 1050 * 10/1000 = 10.5 => ceil = 11
    assert.equal(cost, 11);
});

test('calculateCreditCost aplica rateIn y rateOut de forma independiente', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 1000,
        completionTokens: 1000,
    });
    // promptTokens: 1000 * rateIn(10)/1000 = 10
    // completionTokens: 1000 * rateOut(40)/1000 = 40
    // total = ceil(50) = 50
    assert.equal(cost, 50);
});

test('calculateCreditCost retorna 0 para 0 tokens', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4o',
        promptTokens: 0,
        completionTokens: 0,
    });
    assert.equal(cost, 0);
});
