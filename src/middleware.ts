import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware compatibilidad con Edge Runtime.
 * Al usar authConfig (que no importa módulos de Node), evitamos errores en el build.
 */
export default NextAuth(authConfig).auth;

export const config = {
    // Proteger rutas de página (no API - las API manejan auth internamente)
    matcher: ["/dashboard/:path*"],
};
