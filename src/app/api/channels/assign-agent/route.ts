import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

/**
 * POST /api/channels/assign-agent
 * Asigna un agente específico a un canal del usuario.
 * Body: { channelType: 'TELEGRAM' | 'WHATSAPP', agentId: string | null }
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { channelType, agentId } = await req.json();

        if (!channelType) {
            return NextResponse.json({ error: 'channelType es requerido' }, { status: 400 });
        }

        const client = await dbPool.connect();
        try {
            // Verificar que el agente pertenece al usuario (si se especificó uno)
            if (agentId) {
                const agentCheck = await client.query(
                    `SELECT id FROM agents WHERE id = $1 AND user_id = $2`,
                    [agentId, session.user.id]
                );
                if (agentCheck.rows.length === 0) {
                    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 });
                }
            }

            // Actualizar el agent_id en channel_configs
            const result = await client.query(
                `UPDATE channel_configs
                 SET agent_id = $1
                 WHERE user_id = $2 AND channel_type = $3
                 RETURNING id, channel_type, agent_id`,
                [agentId || null, session.user.id, channelType]
            );

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Canal no configurado. Configura el canal primero.' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                channel: result.rows[0],
                message: agentId
                    ? 'Agente asignado al canal correctamente'
                    : 'Agente desvinculado del canal (usará el agente más reciente)',
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('[Assign Agent API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * GET /api/channels/assign-agent?channelType=TELEGRAM
 * Obtiene el agente asignado a un canal del usuario.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const channelType = new URL(req.url).searchParams.get('channelType');
    if (!channelType) {
        return NextResponse.json({ error: 'channelType es requerido' }, { status: 400 });
    }

    const client = await dbPool.connect();
    try {
        const result = await client.query(
            `SELECT cc.agent_id, a.name as agent_name, a.role as agent_role,
                    a.model as agent_model, a.avatar as agent_avatar
             FROM channel_configs cc
             LEFT JOIN agents a ON a.id = cc.agent_id
             WHERE cc.user_id = $1 AND cc.channel_type = $2`,
            [session.user.id, channelType]
        );

        return NextResponse.json(result.rows[0] || { agent_id: null });
    } finally {
        client.release();
    }
}
