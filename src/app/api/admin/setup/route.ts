import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import { authorize } from '@/lib/authz';
import bcrypt from 'bcryptjs';

// Admin gets maximum level, XP (Dragón Primordial rank = level 100+) and unlimited credits
// XP formula: sum of floor(50*i^1.5) for i=1..100 ≈ 2,000,000; 5M ensures level 100 comfortably
const ADMIN_MAX_XP = 5_000_000;
const ADMIN_MAX_LEVEL = 100;
const ADMIN_MAX_CREDITS = 999_999;

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

            const adminEmail = process.env.ADMIN_EMAIL || 'admin@uai.ai';
            const adminPassword = process.env.ADMIN_PASSWORD || 'uai2026';
            const passwordHash = await bcrypt.hash(adminPassword, 12);

            const res = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

            if (res.rows.length === 0) {
                // Create admin with max level, XP, and unlimited credits
                await client.query(
                    `INSERT INTO users (name, email, password_hash, plan, role, level, xp, total_credits, used_credits)
                     VALUES ($1, $2, $3, 'professional', 'admin', $4, $5, $6, 0)`,
                    ['UAI Admin', adminEmail, passwordHash, ADMIN_MAX_LEVEL, ADMIN_MAX_XP, ADMIN_MAX_CREDITS],
                );
                return NextResponse.json({
                    message: 'Database initialized & Admin created with max stats',
                    bootstrap: isBootstrap,
                    adminStats: { level: ADMIN_MAX_LEVEL, xp: ADMIN_MAX_XP, credits: ADMIN_MAX_CREDITS }
                });
            }

            // Admin already exists — upgrade password to bcrypt and ensure max stats
            await client.query(
                `UPDATE users SET
                    password_hash = $1,
                    plan = 'professional',
                    role = 'admin',
                    level = GREATEST(level, $2),
                    xp = GREATEST(xp, $3),
                    total_credits = GREATEST(total_credits, $4),
                    used_credits = 0
                 WHERE email = $5`,
                [passwordHash, ADMIN_MAX_LEVEL, ADMIN_MAX_XP, ADMIN_MAX_CREDITS, adminEmail]
            );
            return NextResponse.json({
                message: reset ? 'DB re-initialized & Admin upgraded' : 'Admin upgraded to max stats',
                bootstrap: isBootstrap,
                adminStats: { level: ADMIN_MAX_LEVEL, xp: ADMIN_MAX_XP, credits: ADMIN_MAX_CREDITS }
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Setup logic failed:', error);
        return NextResponse.json({ error: 'Setup failed', details: (error as Error).message }, { status: 500 });
    }
}
