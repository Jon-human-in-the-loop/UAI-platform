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
                `SELECT * FROM healing_stats WHERE user_id = $1`,
                [session.user.id]
            );
            
            if (res.rows.length === 0) {
                return NextResponse.json({
                    total_errors: 0,
                    total_healed: 0,
                    most_common_error: 'None'
                });
            }
            
            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching healing stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
