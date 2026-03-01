import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Utilizado por Railway para verificar que la aplicación está funcionando correctamente.
 * Responde con el estado de la aplicación y la hora del servidor.
 */
export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? '1.0.0',
            environment: process.env.NODE_ENV ?? 'development',
        },
        { status: 200 }
    );
}
