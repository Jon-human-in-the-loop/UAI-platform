import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { dbPool } from '@/lib/database';

// POST /api/marketplace/sync
// Detects purchases without a materialized agent and creates the missing ones.
export async function POST(req: NextRequest) {
    const access = await authorize();
    if (!access.ok) return access.response;

    const client = await dbPool.connect();
    try {
        // Get all purchased templates for this user
        const purchasesRes = await client.query(
            `SELECT mt.id AS template_id, mt.name, mt.role, mt.model, mt.system_prompt
             FROM user_purchases up
             JOIN marketplace_templates mt ON mt.id = up.item_id
             WHERE up.user_id = $1 AND up.item_type = 'agent_template'`,
            [access.user.id]
        );

        if (purchasesRes.rows.length === 0) {
            return NextResponse.json({ synced: 0, message: 'No purchases found.' });
        }

        // Get existing agent names for this user
        const agentsRes = await client.query(
            `SELECT name FROM agents WHERE user_id = $1`,
            [access.user.id]
        );
        const existingNames = new Set(agentsRes.rows.map((r: any) => r.name));

        const missing = purchasesRes.rows.filter((p: any) => !existingNames.has(p.name));

        if (missing.length === 0) {
            return NextResponse.json({ synced: 0, message: 'All purchased agents already exist.' });
        }

        await client.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);

        for (const t of missing) {
            await client.query(
                `INSERT INTO agents (user_id, name, role, model, system_prompt, level, xp, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 1, 0, NOW())`,
                [access.user.id, t.name, t.role, t.model || 'gpt-4o', t.system_prompt || '']
            );
        }

        return NextResponse.json({
            synced: missing.length,
            agents: missing.map((t: any) => t.name),
        });

    } finally {
        client.release();
    }
}
