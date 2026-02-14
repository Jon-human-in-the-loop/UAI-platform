import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/database';
import { totalXpForLevel } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || process.env.ADMIN_EMAIL || 'admin@uai.ai';

    try {
        const client = await dbPool.connect();
        try {
            const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

            // If checking fails, try listing all admins to find the right one?
            if (res.rows.length === 0) {
                // Check if there are ANY users
                const allUsers = await client.query('SELECT email, role FROM users LIMIT 5');
                return NextResponse.json({
                    error: `User ${email} not found`,
                    availableUsers: allUsers.rows
                }, { status: 404 });
            }

            const userId = res.rows[0].id;
            const targetLevel = 100;
            const targetXp = totalXpForLevel(targetLevel) + 5000; // Extra buffer

            await client.query(`
                UPDATE users
                SET xp = $1, level = $2, role = 'admin', plan = 'professional'
                WHERE id = $3
            `, [targetXp, targetLevel, userId]);

            return NextResponse.json({
                message: `User ${email} promoted to Dragón Primordial`,
                level: targetLevel,
                xp: targetXp,
                role: 'admin'
            });
        } finally {
            client.release();
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
