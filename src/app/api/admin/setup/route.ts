import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    console.log("--- SETUP ROUTE STARTED ---");

    // 1. URL Parsing Debug
    let searchParams;
    try {
        const urlObj = new URL(req.url, 'http://localhost');
        searchParams = urlObj.searchParams;
        console.log("URL Parsed Successfully");
    } catch (e: any) {
        console.error("URL Parsing Failed:", e);
        return NextResponse.json({ error: `Request URL Parsing Failed: ${e.message}` }, { status: 400 });
    }

    const secret = searchParams.get('secret');

    // 2. Secret Check
    if (secret !== process.env.SETUP_SECRET) {
        console.log("Invalid Secret");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Environment Check
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is missing");
        return NextResponse.json({ error: 'CRITICAL: DATABASE_URL environment variable is missing in Railway.' }, { status: 500 });
    }

    try {
        console.log("Initializing Database...");
        await initDatabase();
        console.log("Database Initialized. Checking Admin...");

        const client = await dbPool.connect();
        try {
            const email = 'admin@uai.ai';
            const res = await client.query("SELECT * FROM users WHERE email = $1", [email]);

            if (res.rows.length === 0) {
                console.log("Creating Admin User...");
                const hash = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD || 'uai2026').digest('hex');
                await client.query(`
                    INSERT INTO users (name, email, password_hash, plan, role) 
                    VALUES ($1, $2, $3, 'professional', 'admin')
                `, ['UAI Admin', email, hash]);
                return NextResponse.json({ message: 'Database initialized & Admin created' });
            }

            console.log("Admin already exists.");
            return NextResponse.json({ message: 'Database initialized (Admin already exists)' });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error("Setup Logic Failed:", error);
        // Return full stack to identify the source (DB vs Request)
        return NextResponse.json({
            error: error.message,
            stack: error.stack,
            stage: 'Database Initialization or Query'
        }, { status: 500 });
    }
}
