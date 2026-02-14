import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function main() {
    // 1. Prioritize process.env
    const rootDir = process.cwd();
    const envPath = path.join(rootDir, '.env');
    let dbUrl: string | undefined = process.env.DATABASE_URL;

    if (!dbUrl && fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key?.trim() === 'DATABASE_URL') {
                dbUrl = value?.trim();
            }
        });
    }

    if (!dbUrl) {
        console.error('DATABASE_URL not found in environment or .env');
        return;
    }

    if (dbUrl) {
        dbUrl = dbUrl.replace('localhost', '127.0.0.1');
    }

    // Parse host for debugging (safe)
    const match = dbUrl.match(/@([^:]+):/);
    const host = match ? match[1] : 'unknown';
    console.log(`Using DB Host: ${host}`);
    // console.log('Using DB:', dbUrl.replace(/:[^:]*@/, ':****@')); // Mask password

    // 2. Connect
    const pool = new Pool({ connectionString: dbUrl });
    const client = await pool.connect();

    try {
        // 3. Define the Dragón Primordial User
        // Try to read ADMIN_EMAIL from .env too
        let adminEmail = process.argv[2];
        if (!adminEmail && fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key?.trim() === 'ADMIN_EMAIL') {
                    adminEmail = value?.trim();
                }
            });
        }
        if (!adminEmail) adminEmail = 'admin@uai.ai';

        console.log(`Checking user: ${adminEmail}`);

        const res = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        let userId;

        if (res.rows.length === 0) {
            console.log(`User ${adminEmail} not found.`);
            const allUsers = await client.query('SELECT email FROM users LIMIT 10');
            console.log('Available users:', allUsers.rows.map(r => r.email).join(', '));
            return;
        } else {
            userId = res.rows[0].id;
        }

        // 4. Update
        const targetLevel = 100;
        const xpForLevel = (lvl: number) => Math.floor(50 * Math.pow(lvl, 1.5));
        let totalXp = 0;
        for (let i = 1; i < targetLevel; i++) totalXp += xpForLevel(i + 1); // XP needed to REACH level i+1?
        // Wait, totalXpForLevel in gamification.ts sums from 1 to level.
        // Let's re-check gamification.ts logic.
        // It sums xpForLevel(i) for i from 1 to level.
        // And calculateLevel checks if totalXp < needed.
        // So to BE level 100, we need totalXpForLevel(100).
        totalXp = 0;
        for (let i = 1; i <= targetLevel; i++) totalXp += xpForLevel(i);

        // Add buffer
        const finalXp = totalXp + 5000;

        await client.query(`
            UPDATE users
            SET xp = $1, level = $2, role = 'admin', plan = 'professional'
            WHERE id = $3
        `, [finalXp, targetLevel, userId]);

        console.log(`✅ SUCCESS: User ${adminEmail} promoted to Dragón Primordial (Lvl ${targetLevel}, XP ${finalXp})`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
