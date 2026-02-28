import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import { authorize } from '@/lib/authz';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const access = await authorize({ roles: ['admin'], permission: 'admin:debug' });
    if (!access.ok) return access.response;

    const searchParams = new URL(req.url).searchParams;
    const secret = searchParams.get('secret');
    const reset = searchParams.get('reset') === 'true';

    if (secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (reset && process.env.ALLOW_SETUP_RESET !== 'true') {
        return NextResponse.json({ error: 'Reset disabled in this environment' }, { status: 403 });
    }

    if (!process.env.DATABASE_URL) {
        return NextResponse.json({ error: 'DATABASE_URL environment variable is missing' }, { status: 500 });
    }

    try {
        const client = await dbPool.connect();
        try {
            if (reset) {
                await client.query('DROP TABLE IF EXISTS agents CASCADE;');
            }

            await initDatabase();
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`);

            const email = 'admin@uai.ai';
            const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

            if (res.rows.length === 0) {
                const hash = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || 'uai2026').digest('hex');
                await client.query(
                    `INSERT INTO users (name, email, password_hash, plan, role)
                     VALUES ($1, $2, $3, 'professional', 'admin')`,
                    ['UAI Admin', email, hash],
                );
                return NextResponse.json({ message: 'Database initialized & Admin created' });
            }

            return NextResponse.json({ message: reset ? 'Agents reset & DB re-initialized' : 'Database initialized (Admin already exists)' });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Setup logic failed:', error);
        return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
    }
}
