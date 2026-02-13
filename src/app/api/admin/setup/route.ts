import { NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import crypto from 'crypto';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== 'uai-setup-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await initDatabase();

        // Ensure Admin Exists
        const client = await dbPool.connect();
        try {
            const email = 'admin@uai.ai';
            const res = await client.query("SELECT * FROM users WHERE email = $1", [email]);

            if (res.rows.length === 0) {
                const hash = crypto.createHash('sha256').update('uai2026').digest('hex');
                await client.query(`
                    INSERT INTO users (name, email, password_hash, plan, role) 
                    VALUES ($1, $2, $3, 'professional', 'admin')
                `, ['UAI Admin', email, hash]);
                return NextResponse.json({ message: 'Database initialized & Admin created' });
            }

            return NextResponse.json({ message: 'Database initialized (Admin already exists)' });
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
