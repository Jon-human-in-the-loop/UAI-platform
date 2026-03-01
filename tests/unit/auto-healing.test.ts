import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseError, HEALING_STRATEGIES } from '../../src/lib/auto-healing.ts';

// --- diagnoseError ---

test('diagnoseError detecta errores de rate limit y retorna SWITCH_MODEL', () => {
    const strategy = diagnoseError('OpenAI API rate limit exceeded');
    assert.equal(strategy.action, 'SWITCH_MODEL');
});

test('diagnoseError detecta errores de context length y retorna SIMPLIFY_PROMPT', () => {
    const strategy = diagnoseError('This model maximum context length is 4096 tokens');
    assert.equal(strategy.action, 'SIMPLIFY_PROMPT');
});

test('diagnoseError detecta errores de invalid json y retorna RETRY', () => {
    const strategy = diagnoseError('Failed to parse: invalid json response');
    assert.equal(strategy.action, 'RETRY');
});

test('diagnoseError retorna FALLBACK para errores desconocidos', () => {
    const strategy = diagnoseError('Unexpected network timeout error');
    assert.equal(strategy.action, 'FALLBACK');
});

test('diagnoseError es insensible a mayúsculas en el mensaje de error', () => {
    const strategy = diagnoseError('RATE LIMIT REACHED');
    assert.equal(strategy.action, 'SWITCH_MODEL');
});

test('HEALING_STRATEGIES contiene al menos 3 estrategias definidas', () => {
    assert.ok(HEALING_STRATEGIES.length >= 3);
});

test('diagnoseError retorna un objeto con las propiedades requeridas', () => {
    const strategy = diagnoseError('some error');
    assert.ok('action' in strategy);
    assert.ok('description' in strategy);
    assert.ok('errorPattern' in strategy);
});
