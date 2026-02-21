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
            // Fetch top users by XP
            const res = await client.query(
                `SELECT id, name, level, xp, rank, rank_emoji 
                 FROM users 
                 ORDER BY xp DESC 
                 LIMIT 10`
            );
            
            // Note: rank and rank_emoji might need to be calculated or stored. 
            // For now, we return what's in the DB or default.
            
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
