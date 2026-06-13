import * as Sentry from '@sentry/nextjs';

/**
 * instrumentation.ts — Hook de arranque de Next.js (estable desde Next 15,
 * no requiere flag en next.config).
 *
 * `register()` se ejecuta UNA vez por instancia del servidor, antes de servir
 * tráfico. Aquí garantizamos que:
 *
 * 1. Sentry quede inicializado en cada runtime (los sentry.*.config.ts de la
 *    raíz NO se cargan solos con @sentry/nextjs v8+; deben importarse aquí).
 * 2. El esquema de la base de datos esté migrado (CREATE TABLE / ALTER TABLE
 *    ... IF NOT EXISTS) sin depender de que alguien invoque manualmente
 *    /api/admin/setup. Esto evita 500s en producción cuando la DB es antigua
 *    (p. ej. INSERT con columnas nuevas como agents.personal_context).
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Sentry primero, para poder capturar errores del propio arranque.
        await import('../sentry.server.config');

        // Import dinámico: evita arrastrar 'pg' (módulo Node-only) al edge runtime.
        const { initDatabase } = await import('@/lib/database');
        // initDatabase captura sus propios errores y solo los loguea,
        // por lo que un fallo de DB no tumba el arranque del servidor.
        await initDatabase();
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
    }
}

/**
 * Reporta a Sentry los errores no controlados de requests del App Router.
 */
export const onRequestError = Sentry.captureRequestError;
