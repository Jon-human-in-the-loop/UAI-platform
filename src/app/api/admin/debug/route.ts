import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';

export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');

    // Validación dual: secret + rol admin autenticado
    if (secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await authorize({ roles: ['admin'], permission: 'admin:debug' });
    if (!access.ok) return access.response;

    const hostHeader = req.headers.get('host');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const railwayStaticHost = req.headers.get('x-railway-static-url');

    return NextResponse.json({
        diagnostics: {
            time: new Date().toISOString(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                AUTH_URL_CONFIGURED: !!process.env.AUTH_URL,
                AUTH_URL_VALUE: process.env.AUTH_URL || 'NOT_SET',
                NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
                APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
            },
            request: {
                url: req.url,
                method: req.method,
                hostHeader,
                forwardedHost,
                forwardedProto,
                railwayStaticHost
            }
        }
    });
}
