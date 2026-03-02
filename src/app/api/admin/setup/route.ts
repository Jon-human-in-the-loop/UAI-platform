import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import { authorize } from '@/lib/authz';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const secret = searchParams.get('secret');
    const reset = searchParams.get('reset') === 'true';

    // Validate secret first (before auth check to allow bootstrap)
    if (secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
        return NextResponse.json({ error: 'DATABASE_URL environment variable is missing' }, { status: 500 });
    }

    // Check if DB is empty (bootstrap mode) - allow without auth
    let isBootstrap = false;
    try {
        const checkClient = await dbPool.connect();
        try {
            const tableCheck = await checkClient.query(
                `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
            );
            isBootstrap = !tableCheck.rows[0].exists;
        } finally {
            checkClient.release();
        }
    } catch {
        isBootstrap = true; // If we can't check, assume bootstrap
    }

    // If not bootstrap mode, require admin auth
    if (!isBootstrap) {
        const access = await authorize({ roles: ['admin'], permission: 'admin:debug' });
        if (!access.ok) return access.response;
    }

    if (reset && process.env.ALLOW_SETUP_RESET !== 'true') {
        return NextResponse.json({ error: 'Reset disabled in this environment' }, { status: 403 });
    }

    try {
        const client = await dbPool.connect();
        try {
            if (reset) {
                await client.query('DROP TABLE IF EXISTS channels CASCADE;');
                await client.query('DROP TABLE IF EXISTS agents CASCADE;');
                await client.query('DROP TABLE IF EXISTS users CASCADE;');
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
                return NextResponse.json({ message: 'Database initialized & Admin created', bootstrap: isBootstrap });
            }

            return NextResponse.json({ message: reset ? 'Agents reset & DB re-initialized' : 'Database initialized (Admin already exists)', bootstrap: isBootstrap });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Setup logic failed:', error);
        return NextResponse.json({ error: 'Setup failed', details: (error as Error).message }, { status: 500 });
    }
}
