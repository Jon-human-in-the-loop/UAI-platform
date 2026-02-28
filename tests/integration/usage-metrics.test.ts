import test from 'node:test';
import assert from 'node:assert/strict';

import { buildUsageMetrics } from '../../src/lib/usage-metrics.ts';

test('buildUsageMetrics transforma correctamente datos de usuario a contrato API', () => {
    const metrics = buildUsageMetrics({
        plan: 'professional',
        total_credits: 1000,
        used_credits: 275,
        token_usage_total: 88000,
    });

    assert.deepEqual(metrics, {
        plan: 'professional',
        totalCredits: 1000,
        usedCredits: 275,
        availableCredits: 725,
        tokenUsageTotal: 88000,
        usagePercent: 28,
    });
});

test('buildUsageMetrics no permite disponibles negativos y maneja default values', () => {
    const metrics = buildUsageMetrics({
        used_credits: 150,
        total_credits: 100,
    });

    assert.equal(metrics.availableCredits, 0);
    assert.equal(metrics.usagePercent, 100);
    assert.equal(metrics.plan, 'free');
});
