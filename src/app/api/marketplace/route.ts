import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import {
    getMarketplaceTemplates,
    getTemplateById,
    recordPurchase,
    hasUserPurchased,
    getUserCredits,
    getUserPurchasedTemplates,
} from '@/lib/marketplace';
import { dbPool } from '@/lib/database';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'templates') {
            const templates = getMarketplaceTemplates();
            return NextResponse.json({ success: true, templates });
        }

        if (action === 'template') {
            const templateId = searchParams.get('id');
            if (!templateId) {
                return NextResponse.json({ error: 'Se requiere id' }, { status: 400 });
            }
            const template = getTemplateById(templateId);
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

        const templates = getMarketplaceTemplates();
        return NextResponse.json({ success: true, templates });
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
                    [id, name, role, description || '', model, system_prompt || '', skills || [], category || 'business', price_credits || 0, access.user.id]
                );
                return NextResponse.json({ success: true, template: res.rows[0] }, { status: 201 });
            } finally {
                client.release();
            }
        }

        // default: purchase
        const { templateId } = body;
        if (!templateId) {
            return NextResponse.json({ error: 'Se requiere templateId' }, { status: 400 });
        }

        const alreadyPurchased = await hasUserPurchased(access.user.id, templateId);
        if (alreadyPurchased) {
            return NextResponse.json({ error: 'Ya has adquirido este template' }, { status: 400 });
        }

        const template = getTemplateById(templateId);
        if (!template) {
            return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
        }

        const availableCredits = await getUserCredits(access.user.id);
        if (availableCredits < template.price_credits) {
            return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 400 });
        }

        await recordPurchase(access.user.id, templateId, 'agent_template', template.price_credits);

        return NextResponse.json({ success: true, message: 'Template adquirido exitosamente', template });
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
            const res = await client.query(
                `UPDATE marketplace_templates
                 SET published = COALESCE($2, published),
                     name = COALESCE($3, name),
                     description = COALESCE($4, description),
                     price_credits = COALESCE($5, price_credits),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [id, typeof published === 'boolean' ? published : null, name || null, description || null, price_credits ?? null]
            );
            if (!res.rows[0]) return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
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
        await client.query(`DELETE FROM marketplace_templates WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}
