import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { CHARACTERS } from '@/lib/gamification-advanced';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            // Get unlocked characters for the user
            const res = await client.query(
                `SELECT character_id FROM user_characters WHERE user_id = $1`,
                [session.user.id]
            );
            
            const unlockedIds = res.rows.map(r => r.character_id);
            
            const charactersWithStatus = CHARACTERS.map(char => ({
                ...char,
                unlocked: unlockedIds.includes(char.id)
            }));
            
            return NextResponse.json(charactersWithStatus);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching characters:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
