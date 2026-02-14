import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirigir a login
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Evitar que Auth.js redireccione a localhost:8080 en producción
            // Si la URL detectada es localhost pero el baseUrl real (desde AUTH_URL o request) es externo, corregimos.
            if (url.includes('localhost') && !baseUrl.includes('localhost')) {
                const fixedUrl = url.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
                console.log(`--- Auth Redirect Fix: ${url} -> ${fixedUrl} ---`);
                return fixedUrl;
            }
            // Aseguramos que las redirecciones relativas funcionen
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Si ya es una URL absoluta externa, la permitimos
            return url;
        },
    },
    providers: [], // Agregados en auth.ts para evitar colisiones con el Edge Runtime del Middleware
} satisfies NextAuthConfig;
