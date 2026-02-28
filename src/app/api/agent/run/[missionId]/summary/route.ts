import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { getRunSummary } from '@/lib/run-tracing';

export async function GET(req: NextRequest, { params }: { params: Promise<{ missionId: string }> }) {
    const access = await authorize();
    if (!access.ok) return access.response;

    const { missionId } = await params;
    const summary = await getRunSummary(missionId);
    if (!summary) return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    if (summary.user_id && summary.user_id !== access.user.id && access.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(summary);
}
