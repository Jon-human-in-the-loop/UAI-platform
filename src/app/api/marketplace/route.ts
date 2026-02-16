import { NextResponse } from 'next/server';
import { getMarketplaceTemplates } from '@/lib/marketplace';

export async function GET() {
    try {
        const templates = getMarketplaceTemplates();
        return NextResponse.json({ success: true, templates });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
