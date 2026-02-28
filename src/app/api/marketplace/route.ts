import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { 
    getMarketplaceTemplates,
    getTemplateById,
    recordPurchase,
    hasUserPurchased,
    getUserCredits,
    getUserPurchasedTemplates
} from '@/lib/marketplace';

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
        const { templateId } = await req.json();

        if (!templateId) {
            return NextResponse.json({ error: 'Se requiere templateId' }, { status: 400 });
        }

        // Verificar si el usuario ya ha comprado este template
        const alreadyPurchased = await hasUserPurchased(access.user.id, templateId);
        if (alreadyPurchased) {
            return NextResponse.json(
                { error: 'Ya has adquirido este template' },
                { status: 400 }
            );
        }

        // Obtener el template
        const template = getTemplateById(templateId);
        if (!template) {
            return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
        }

        // Verificar créditos
        const availableCredits = await getUserCredits(access.user.id);
        if (availableCredits < template.price_credits) {
            return NextResponse.json(
                { error: 'Créditos insuficientes' },
                { status: 400 }
            );
        }

        // Registrar la compra
        await recordPurchase(access.user.id, templateId, 'agent_template', template.price_credits);

        return NextResponse.json({
            success: true,
            message: 'Template adquirido exitosamente',
            template: template
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
