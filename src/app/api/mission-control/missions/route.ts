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
                `SELECT * FROM collaborative_missions WHERE user_id = $1 ORDER BY created_at DESC`,
                [session.user.id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching missions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, description, agentIds, synergyScore } = await req.json();
        
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `INSERT INTO collaborative_missions (user_id, name, description, assigned_agents, synergy_score) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [session.user.id, name, description, agentIds, synergyScore || 0]
            );

            return NextResponse.json(res.rows[0], { status: 201 });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error creating mission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
