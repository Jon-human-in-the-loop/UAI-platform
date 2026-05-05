import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const { name, role, model, system_prompt } = await req.json();

        if (!name || !role || !model) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const client = await dbPool.connect();
        try {
            // Ensure updated_at column exists (safe migration)
            await client.query(`
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
            `);

            const res = await client.query(
                `UPDATE agents
                 SET name = $1, role = $2, model = $3, system_prompt = $4, updated_at = NOW()
                 WHERE id = $5 AND user_id = $6
                 RETURNING *`,
                [name, role, model, system_prompt || '', id, session.user.id]
            );

            if (res.rows.length === 0) {
                return NextResponse.json({ error: 'Agente no encontrado o sin permisos' }, { status: 404 });
            }

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error updating agent:', error);
        return NextResponse.json({ error: `Error actualizando agente: ${error.message}` }, { status: 500 });
    }
}


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `DELETE FROM agents WHERE id = $1 AND user_id = $2 RETURNING id`,
            [id, session.user.id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Agente no encontrado o sin permisos' }, { status: 404 });
        }

        return NextResponse.json({ success: true, deletedId: id });
    } catch (error: any) {
        console.error('Error deleting agent:', error);
        return NextResponse.json({ error: `Error eliminando agente: ${error.message}` }, { status: 500 });
    } finally {
        client.release();
    }
}
