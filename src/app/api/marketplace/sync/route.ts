import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { dbPool } from '@/lib/database';

// POST /api/marketplace/sync
// Finds purchases that never got an agent created and repairs them.
export async function POST(req: NextRequest) {
    const access = await authorize();
    if (!access.ok) return access.response;

    const client = await dbPool.connect();
    try {
        // Find all purchased templates for this user
        const purchasesRes = await client.query(
            `SELECT p.template_id, t.name, t.role, t.model, t.system_prompt
             FROM marketplace_purchases p
             JOIN marketplace_templates t ON t.id = p.template_id
             WHERE p.user_id = $1 AND p.item_type = 'agent_template'`,
            [access.user.id]
        );

        if (purchasesRes.rows.length === 0) {
            return NextResponse.json({ synced: 0, message: 'No purchases found.' });
        }

        // Find which ones already have a matching agent (by name + user_id)
        const agentsRes = await client.query(
            `SELECT name FROM agents WHERE user_id = $1`,
            [access.user.id]
        );
        const existingNames = new Set(agentsRes.rows.map((r: any) => r.name));

        const missing = purchasesRes.rows.filter((p: any) => !existingNames.has(p.name));

        if (missing.length === 0) {
            return NextResponse.json({ synced: 0, message: 'All purchased agents already exist.' });
        }

        // Ensure updated_at column exists
        await client.query(`ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);

        for (const template of missing) {
            await client.query(
                `INSERT INTO agents (user_id, name, role, model, system_prompt, level, xp, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 1, 0, NOW())`,
                [
                    access.user.id,
                    template.name,
                    template.role,
                    template.model || 'gpt-4o',
                    template.system_prompt || '',
                ]
            );
        }

        return NextResponse.json({
            synced: missing.length,
            agents: missing.map((t: any) => t.name),
            message: `${missing.length} agent(s) restored successfully.`,
        });

    } finally {
        client.release();
    }
}
