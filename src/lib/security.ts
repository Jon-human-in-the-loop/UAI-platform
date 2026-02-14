/**
 * Lista de dominios de email desechables conocidos (Mailinator, Yopmail, etc.)
 * Para una implementación más robusta en el futuro, se podría usar un servicio externo
 * o una librería como 'disposable-email-domains'.
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
    'mailinator.com',
    'yopmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'tempmail.com',
    'getnada.com',
    'dispostable.com',
    'sharklasers.com',
    'temp-mail.org',
    'throwawaymail.com',
    'mailed.at',
    'maildrop.cc',
    'mailnesia.com',
    'mailsac.com',
    'mintemail.com',
    'mytrashmail.com',
    'pwned.com',
    'send-cote.com',
    'tradermail.info',
    'wowmail.com',
    'zippymail.info'
];

/**
 * Valida si un email pertenece a un dominio desechable.
 */
export function isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Función básica de Rate Limiting por IP para el registro.
 * En producción (Railway), se recomienda usar Redis para persistencia,
 * pero como medida inicial usaremos memoria (limitada a la instancia).
 */
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const hit = rateLimitMap.get(ip);

    if (!hit) {
        rateLimitMap.set(ip, { count: 1, lastRequest: now });
        return { allowed: true, remaining: limit - 1 };
    }

    if (now - hit.lastRequest > windowMs) {
        // Reiniciar ventana
        rateLimitMap.set(ip, { count: 1, lastRequest: now });
        return { allowed: true, remaining: limit - 1 };
    }

    if (hit.count >= limit) {
        return { allowed: false, remaining: 0 };
    }

    hit.count++;
    hit.lastRequest = now;
    return { allowed: true, remaining: limit - hit.count };
}

/**
 * Detecta indicios de VPN o Proxy basados en headers comunes.
 * Nota: Una detección al 100% requiere una base de datos de IPs de datacenters.
 */
export function isVpnOrProxy(request: Request): boolean {
    const headers = request.headers;

    // Headers sospechosos inyectados por proxies comunes
    const suspiciousHeaders = [
        'via',
        'x-proxy-id',
        'x-forwarded-for-proxy',
        'forwarded-for-proxy',
        'x-forwarded-by',
        'forwarded-by',
        'x-requested-with', // Algunas apps de VPN lo inyectan
        'x-anonymous-proxy',
        'x-proxy-agent'
    ];

    for (const h of suspiciousHeaders) {
        if (headers.get(h)) {
            console.log(`[Suspicious Header Detected]: ${h}`);
            return true;
        }
    }

    // Análisis de X-Forwarded-For (si tiene múltiples saltos sospechosos)
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor && forwardedFor.split(',').length > 2) {
        // Más de 2 saltos usualmente indica una cadena de proxies/VPN
        console.log(`[Suspicious Chain Detected]: ${forwardedFor}`);
        return true;
    }

    return false;
}
