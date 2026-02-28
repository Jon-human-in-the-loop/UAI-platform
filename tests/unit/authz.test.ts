import test from 'node:test';
import assert from 'node:assert/strict';

import { hasPermission, inferRole } from '../../src/lib/authz-policy.ts';

test('inferRole devuelve admin cuando role=admin', () => {
    assert.equal(inferRole({ role: 'admin', email: 'x@y.com' }), 'admin');
});

test('inferRole devuelve admin cuando email coincide con ADMIN_EMAIL', () => {
    const prev = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = 'admin@uai.ai';
    assert.equal(inferRole({ role: 'user', email: 'admin@uai.ai' }), 'admin');
    process.env.ADMIN_EMAIL = prev;
});

test('hasPermission respeta matriz de permisos', () => {
    assert.equal(hasPermission({ role: 'admin', email: 'x@y.com' }, 'admin:debug'), true);
    assert.equal(hasPermission({ role: 'user', email: 'u@y.com' }, 'admin:debug'), false);
    assert.equal(hasPermission({ role: 'user', email: 'u@y.com' }, 'marketplace:write'), true);
});
