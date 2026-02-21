import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { registerWhatsAppConfig, getWhatsAppConfig } from '@/lib/whatsapp-integration';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const config = await getWhatsAppConfig(session.user.id);
        return NextResponse.json(config || { enabled: false });
    } catch (error: any) {
        console.error('[WhatsApp Config API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { accountSid, authToken, fromNumber } = await req.json();

        if (!accountSid || !authToken || !fromNumber) {
            return NextResponse.json(
                { error: 'Se requieren accountSid, authToken y fromNumber' },
                { status: 400 }
            );
        }

        await registerWhatsAppConfig(session.user.id, accountSid, authToken, fromNumber);

        return NextResponse.json({
            success: true,
            message: 'Configuracion de WhatsApp guardada exitosamente'
        });
    } catch (error: any) {
        console.error('[WhatsApp Config API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
