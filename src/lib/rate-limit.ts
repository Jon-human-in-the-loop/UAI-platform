/**
 * rate-limit.ts — Rate limiter simple en memoria, por clave.
 *
 * LIMITACIÓN IMPORTANTE: el estado vive en la memoria del proceso, por lo que
 * el límite es PER-INSTANCIA. En serverless (p. ej. Vercel) cada instancia
 * caliente mantiene su propio contador; con pocas instancias esto es
 * suficiente como primera línea de defensa contra abuso. Para límites
 * estrictos a escala (muchas instancias/regiones) hay que usar un almacén
 * compartido como Redis (INCR + EXPIRE) o Upstash Ratelimit.
 */

export interface RateLimitResult {
    allowed: boolean;
    /** Segundos sugeridos de espera antes de reintentar (solo si allowed === false). */
    retryAfterSeconds?: number;
}

/** Map de clave → timestamps (ms) de solicitudes recientes, en orden ascendente. */
const requestLog = new Map<string, number[]>();

/**
 * Ventana máxima que respeta la limpieza perezosa. Las ventanas usadas por los
 * consumidores deben ser menores o iguales a este valor para no perder datos.
 */
const MAX_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

/** La limpieza perezosa se ejecuta cada N llamadas a checkRateLimit. */
const CLEANUP_EVERY_N_CALLS = 100;
let callsSinceCleanup = 0;

/**
 * Limpieza perezosa: poda timestamps fuera de la ventana máxima y elimina
 * claves vacías para que el Map no crezca sin límite con el tiempo.
 */
function lazyCleanup(now: number): void {
    callsSinceCleanup += 1;
    if (callsSinceCleanup < CLEANUP_EVERY_N_CALLS) return;
    callsSinceCleanup = 0;

    for (const [key, timestamps] of requestLog) {
        const fresh = timestamps.filter((t) => now - t < MAX_WINDOW_MS);
        if (fresh.length === 0) {
            requestLog.delete(key);
        } else if (fresh.length !== timestamps.length) {
            requestLog.set(key, fresh);
        }
    }
}

/**
 * Comprueba y registra una solicitud para `key` usando ventana deslizante.
 *
 * @param key         Clave única del limitador (ej: `agents-create:${userId}`)
 * @param maxRequests Máximo de solicitudes permitidas dentro de la ventana
 * @param windowMs    Tamaño de la ventana en milisegundos
 * @returns           { allowed: true } si pasa; { allowed: false, retryAfterSeconds } si excede el límite
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Poda las marcas de tiempo que ya salieron de la ventana actual.
    const recent = (requestLog.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= maxRequests) {
        // Persistimos la poda; la solicitud rechazada NO cuenta para el límite.
        requestLog.set(key, recent);
        const oldest = recent[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        lazyCleanup(now);
        return { allowed: false, retryAfterSeconds };
    }

    recent.push(now);
    requestLog.set(key, recent);
    lazyCleanup(now);
    return { allowed: true };
}
