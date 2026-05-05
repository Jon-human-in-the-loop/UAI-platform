/**
 * GET /api/health
 *
 * Health check endpoint for monitoring (UptimeRobot, Vercel, etc.)
 * Returns system status: DB connectivity, required env vars, memory layer.
 * This endpoint is PUBLIC — does not require authentication.
 */

import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    version: string;
    services: {
        database: 'connected' | 'error' | 'unconfigured';
        memory: 'pgvector' | 'disabled';
        ai: {
            anthropic: boolean;
            openai: boolean;
            google: boolean;
        };
        payments: {
            stripe: boolean;
            mercadopago: boolean;
        };
        sentry: boolean;
    };
    latency_ms?: number;
}

export async function GET() {
    const start = Date.now();

    const health: HealthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '1.0.0',
        services: {
            database: 'unconfigured',
            memory: 'disabled',
            ai: {
                anthropic: !!process.env.ANTHROPIC_API_KEY,
                openai: !!process.env.OPENAI_API_KEY,
                google: !!(process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
            },
            payments: {
                stripe: !!process.env.STRIPE_SECRET_KEY,
                mercadopago: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
            },
            sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
        },
    };

    // ── Database check ─────────────────────────────────────────────────────────
    if (!process.env.DATABASE_URL) {
        health.services.database = 'unconfigured';
        health.status = 'error';
    } else {
        try {
            const client = await dbPool.connect();
            try {
                await client.query('SELECT 1');
                health.services.database = 'connected';

                // Check if pgvector is available
                const vectorCheck = await client.query(
                    `SELECT 1 FROM pg_extension WHERE extname = 'vector'`
                );
                health.services.memory = vectorCheck.rows.length > 0 ? 'pgvector' : 'disabled';
            } finally {
                client.release();
            }
        } catch {
            health.services.database = 'error';
            health.status = 'degraded';
        }
    }

    // ── AI services degradation check ─────────────────────────────────────────
    if (!health.services.ai.anthropic && !health.services.ai.openai) {
        health.status = health.status === 'ok' ? 'degraded' : health.status;
    }

    health.latency_ms = Date.now() - start;

    const httpStatus = health.status === 'error' ? 503
        : health.status === 'degraded' ? 207
        : 200;

    return NextResponse.json(health, { status: httpStatus });
}
