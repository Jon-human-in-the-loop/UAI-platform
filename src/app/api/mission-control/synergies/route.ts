import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { analyzeSynergy } from '@/lib/mission-control';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `SELECT * FROM synergy_notifications WHERE user_id = $1 ORDER BY created_at DESC`,
                [session.user.id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching synergies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { agentAId, agentBId } = await req.json();
        
        const client = await dbPool.connect();
        try {
            // Fetch agents to analyze synergy
            const agentsRes = await client.query(
                `SELECT * FROM agents WHERE id IN ($1, $2) AND user_id = $3`,
                [agentAId, agentBId, session.user.id]
            );

            if (agentsRes.rows.length < 2) {
                return NextResponse.json({ error: 'Agents not found' }, { status: 404 });
            }

            const synergy = analyzeSynergy(agentsRes.rows[0], agentsRes.rows[1]);

            // Save notification
            const res = await client.query(
                `INSERT INTO synergy_notifications (user_id, type, score, description, agent_ids) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [session.user.id, synergy.type, synergy.score, synergy.description, [agentAId, agentBId]]
            );

            return NextResponse.json(res.rows[0], { status: 201 });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error analyzing synergy:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
