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
                `SELECT * FROM channel_configs WHERE user_id = $1`,
                [session.user.id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching channel configs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { channelType, enabled, apiKey, webhookUrl, metadata } = await req.json();
        
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `INSERT INTO channel_configs (user_id, channel_type, enabled, api_key, webhook_url, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 ON CONFLICT (user_id, channel_type) 
                 DO UPDATE SET enabled = $3, api_key = $4, webhook_url = $5, metadata = $6
                 RETURNING *`,
                [session.user.id, channelType, enabled, apiKey, webhookUrl, metadata || {}]
            );

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error updating channel config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
