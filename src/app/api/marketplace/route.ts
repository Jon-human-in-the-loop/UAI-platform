import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { recordPurchase, hasUserPurchased, getUserCredits, getUserPurchasedTemplates } from '@/lib/marketplace';
import { dbPool } from '@/lib/database';

async function listTemplates(includeUnpublished = false) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM marketplace_templates
             ${includeUnpublished ? '' : 'WHERE published = TRUE'}
             ORDER BY updated_at DESC NULLS LAST, created_at DESC`,
        );
        return res.rows;
    } finally {
        client.release();
    }
}

async function getTemplateFromDb(id: string, includeUnpublished = false) {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM marketplace_templates WHERE id = $1 ${includeUnpublished ? '' : 'AND published = TRUE'} LIMIT 1`,
            [id],
        );
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'templates') {
            return NextResponse.json({ success: true, templates: await listTemplates(false) });
        }

        if (action === 'template') {
            const templateId = searchParams.get('id');
            if (!templateId) {
                return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });
            }
            const template = await getTemplateFromDb(templateId, false);
            return NextResponse.json(template || { error: 'Template no encontrado' });
        }

        if (action === 'purchased') {
            const access = await authorize();
            if (!access.ok) return access.response;
            const purchased = await getUserPurchasedTemplates(access.user.id);
            return NextResponse.json(purchased);
        }

        if (action === 'credits') {
            const access = await authorize();
            if (!access.ok) return access.response;
            const credits = await getUserCredits(access.user.id);
            return NextResponse.json({ credits });
        }

        return NextResponse.json({ success: true, templates: await listTemplates(false) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const access = await authorize({ permission: 'marketplace:write' });
    if (!access.ok) return access.response;

    try {
        const body = await req.json();

        if (body.action === 'create') {
            const { id, name, role, description, model, system_prompt, skills, category, price_credits } = body;
            if (!id || !name || !role || !model) {
                return NextResponse.json({ error: 'Campos obligatorios faltantes para create' }, { status: 400 });
            }

            const client = await dbPool.connect();
            try {
                const res = await client.query(
                    `INSERT INTO marketplace_templates
                    (id, name, role, description, model, system_prompt, skills, category, price_credits, owner_user_id, published, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,CURRENT_TIMESTAMP)
                    RETURNING *`,
                    [id, name, role, description || '', model, system_prompt || '', skills || [], category || 'business', price_credits || 0, access.user.id],
                );
                return NextResponse.json({ success: true, template: res.rows[0] }, { status: 201 });
            } finally {
                client.release();
            }
        }

        const { templateId } = body;
        if (!templateId) {
            return NextResponse.json({ error: 'Se requiere templateId' }, { status: 400 });
        }

        const alreadyPurchased = await hasUserPurchased(access.user.id, templateId);
        if (alreadyPurchased) {
            return NextResponse.json({ error: 'Ya has adquirido este template' }, { status: 400 });
        }

        const template = await getTemplateFromDb(templateId, false);
        if (!template) {
            return NextResponse.json({ error: 'Template no encontrado o no publicado' }, { status: 404 });
        }

        const availableCredits = await getUserCredits(access.user.id);
        if (availableCredits < template.price_credits) {
            return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 400 });
        }

        await recordPurchase(access.user.id, templateId, 'agent_template', template.price_credits);

        // 🔑 KEY FIX: Actually create the agent in the agents table
        // The marketplace value IS the system_prompt + role + model configuration.
        const client = await dbPool.connect();
        let newAgent;
        try {
            // Ensure updated_at column exists (safe migration)
            await client.query(`
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
            `);

            const agentRes = await client.query(
                `INSERT INTO agents (user_id, name, role, model, system_prompt, level, xp, updated_at)
                 VALUES ($1, $2, $3, $4, $5, 1, 0, NOW())
                 RETURNING *`,
                [
                    access.user.id,
                    template.name,
                    template.role,
                    template.model || 'claude-sonnet-4-6',
                    template.system_prompt || '',
                ]
            );
            newAgent = agentRes.rows[0];
        } finally {
            client.release();
        }

        return NextResponse.json({
            success: true,
            message: `Agente "${template.name}" clonado y listo en tu Agent Studio`,
            template,
            agent: newAgent, // Frontend can use this to navigate to the new agent
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const access = await authorize({ permission: 'marketplace:publish' });
    if (!access.ok) return access.response;

    try {
        const { id, published, name, description, price_credits } = await req.json();
        if (!id) return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });

        const client = await dbPool.connect();
        try {
            const ownerClause = access.role === 'admin' ? '' : 'AND owner_user_id = $6';
            const baseParams = [id, typeof published === 'boolean' ? published : null, name || null, description || null, price_credits ?? null];
            const params = access.role === 'admin' ? baseParams : [...baseParams, access.user.id];
            const res = await client.query(
                `UPDATE marketplace_templates
                 SET published = COALESCE($2, published),
                     name = COALESCE($3, name),
                     description = COALESCE($4, description),
                     price_credits = COALESCE($5, price_credits),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 ${ownerClause}
                 RETURNING *`,
                params,
            );
            if (!res.rows[0]) return NextResponse.json({ error: 'Template no encontrado o sin permisos' }, { status: 403 });
            return NextResponse.json({ success: true, template: res.rows[0] });
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const access = await authorize({ permission: 'marketplace:publish' });
    if (!access.ok) return access.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });

    const client = await dbPool.connect();
    try {
        const ownerClause = access.role === 'admin' ? '' : 'AND owner_user_id = $2';
        const params = access.role === 'admin' ? [id] : [id, access.user.id];
        const res = await client.query(`DELETE FROM marketplace_templates WHERE id = $1 ${ownerClause} RETURNING id`, params);
        if (!res.rows[0]) return NextResponse.json({ error: 'Template no encontrado o sin permisos' }, { status: 403 });
        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}
