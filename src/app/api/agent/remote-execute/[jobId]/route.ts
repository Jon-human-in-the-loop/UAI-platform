import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { getRemoteJob } from '@/lib/remote-execute';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
    const access = await authorize({ permission: 'remote:read' });
    if (!access.ok) return access.response;

    const { jobId } = await params;
    const job = await getRemoteJob(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.user_id && job.user_id !== access.user.id && access.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(job);
}
