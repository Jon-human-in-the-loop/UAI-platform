import type { NextAuthConfig } from "next-auth";

export const authConfig = {
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
    },
    providers: [], // Agregados en auth.ts para evitar colisiones con el Edge Runtime del Middleware
} satisfies NextAuthConfig;
