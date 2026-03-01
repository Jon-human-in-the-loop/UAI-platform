import test from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableEmail, checkRateLimit } from '../../src/lib/security.ts';

// --- isDisposableEmail ---

test('isDisposableEmail detecta dominios desechables conocidos', () => {
    assert.equal(isDisposableEmail('usuario@mailinator.com'), true);
    assert.equal(isDisposableEmail('test@yopmail.com'), true);
    assert.equal(isDisposableEmail('fake@guerrillamail.com'), true);
    assert.equal(isDisposableEmail('temp@10minutemail.com'), true);
});

test('isDisposableEmail permite dominios legítimos', () => {
    assert.equal(isDisposableEmail('usuario@gmail.com'), false);
    assert.equal(isDisposableEmail('contacto@empresa.com'), false);
    assert.equal(isDisposableEmail('dev@uai.ai'), false);
});

test('isDisposableEmail es insensible a mayúsculas en el dominio', () => {
    assert.equal(isDisposableEmail('usuario@MAILINATOR.COM'), true);
    assert.equal(isDisposableEmail('test@Yopmail.Com'), true);
});

test('isDisposableEmail retorna false para email sin dominio', () => {
    assert.equal(isDisposableEmail('sindominio'), false);
    assert.equal(isDisposableEmail(''), false);
});

// --- checkRateLimit ---

test('checkRateLimit permite la primera solicitud de una IP nueva', () => {
    const ip = `test-ip-${Date.now()}-1`;
    const result = checkRateLimit(ip, 5, 60000);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4);
});

test('checkRateLimit bloquea cuando se supera el límite', () => {
    const ip = `test-ip-${Date.now()}-2`;
    const limit = 3;
    // Consumir todas las solicitudes permitidas
    checkRateLimit(ip, limit, 60000);
    checkRateLimit(ip, limit, 60000);
    checkRateLimit(ip, limit, 60000);
    // La siguiente debe ser bloqueada
    const result = checkRateLimit(ip, limit, 60000);
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
});

test('checkRateLimit decrementa el contador de solicitudes restantes', () => {
    const ip = `test-ip-${Date.now()}-3`;
    const r1 = checkRateLimit(ip, 5, 60000);
    assert.equal(r1.remaining, 4);
    const r2 = checkRateLimit(ip, 5, 60000);
    assert.equal(r2.remaining, 3);
});
