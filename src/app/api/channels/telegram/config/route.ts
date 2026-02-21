import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { registerTelegramConfig, getTelegramConfig } from '@/lib/telegram-integration';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const config = await getTelegramConfig(session.user.id);
        return NextResponse.json(config || { enabled: false });
    } catch (error: any) {
        console.error('[Telegram Config API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { botToken, chatId } = await req.json();

        if (!botToken || !chatId) {
            return NextResponse.json(
                { error: 'Se requieren botToken y chatId' },
                { status: 400 }
            );
        }

        await registerTelegramConfig(session.user.id, botToken, chatId.toString());

        return NextResponse.json({
            success: true,
            message: 'Configuración de Telegram guardada exitosamente'
        });
    } catch (error: any) {
        console.error('[Telegram Config API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
