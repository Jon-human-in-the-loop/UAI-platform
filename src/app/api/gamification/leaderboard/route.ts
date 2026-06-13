import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { calculateLevel, getRank } from '@/lib/gamification';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `SELECT id, name, level, xp
                 FROM users
                 ORDER BY xp DESC
                 LIMIT 10`
            );

            const rows = res.rows.map((row: any) => {
                // Calcular nivel desde XP para consistencia (evita discrepancia con columna level del DB)
                const computedLevel = calculateLevel(row.xp || 0);
                const rankObj = getRank(computedLevel);
                return {
                    ...row,
                    level: computedLevel,
                    rank: rankObj.name,
                    rank_emoji: rankObj.emoji,
                };
            });

            return NextResponse.json(rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
