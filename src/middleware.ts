export { auth as middleware } from "@/auth";

export const config = {
    // Proteger rutas de página (no API - las API manejan auth internamente)
    matcher: ["/dashboard/:path*"],
};
