import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCreditCost } from '../../src/lib/billing-pricing.ts';

// --- calculateCreditCost ---

test('calculateCreditCost calcula costo correcto para gpt-4-turbo', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4-turbo',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // 1000 tokens * 10/1000 = 10
    assert.equal(cost, 10);
});

test('calculateCreditCost calcula costo correcto para claude-3-opus', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'claude-3-opus',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // 1000 tokens * 15/1000 = 15
    assert.equal(cost, 15);
});

test('calculateCreditCost calcula costo correcto para gemini-pro', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gemini-pro',
        promptTokens: 2000,
        completionTokens: 0,
    });
    // 2000 tokens * 5/1000 = 10
    assert.equal(cost, 10);
});

test('calculateCreditCost calcula costo correcto para gpt-3.5-turbo', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-3.5-turbo',
        promptTokens: 500,
        completionTokens: 500,
    });
    // 1000 tokens * 2/1000 = 2
    assert.equal(cost, 2);
});

test('calculateCreditCost aplica tarifa fallback para modelos desconocidos', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'modelo-desconocido',
        promptTokens: 1000,
        completionTokens: 0,
    });
    // 1000 tokens * 5/1000 = 5
    assert.equal(cost, 5);
});

test('calculateCreditCost redondea hacia arriba (ceil) fracciones', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4-turbo',
        promptTokens: 1200,
        completionTokens: 450,
    });
    // 1650 tokens * 10/1000 = 16.5 => ceil = 17
    assert.equal(cost, 17);
});

test('calculateCreditCost suma promptTokens y completionTokens correctamente', () => {
    const costSplit = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-3.5-turbo',
        promptTokens: 300,
        completionTokens: 700,
    });
    const costCombined = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-3.5-turbo',
        promptTokens: 1000,
        completionTokens: 0,
    });
    assert.equal(costSplit, costCombined);
});

test('calculateCreditCost retorna 0 para 0 tokens', () => {
    const cost = calculateCreditCost({
        userId: 'u1',
        model: 'gpt-4-turbo',
        promptTokens: 0,
        completionTokens: 0,
    });
    assert.equal(cost, 0);
});
