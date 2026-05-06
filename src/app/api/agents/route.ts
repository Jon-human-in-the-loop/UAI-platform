import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC`,
                [session.user.id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, role, model, system_prompt, personal_context, avatar } = await req.json();

        // Validation
        if (!name || !role || !model) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `INSERT INTO agents (user_id, name, role, model, system_prompt, personal_context, avatar) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 RETURNING *`,
                [session.user.id, name, role, model, system_prompt || '', personal_context || '', avatar || '']
            );
            return NextResponse.json(res.rows[0], { status: 201 });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error creating agent:', error);
        return NextResponse.json({ error: `Error creating agent: ${error.message}` }, { status: 500 });
    }
}

