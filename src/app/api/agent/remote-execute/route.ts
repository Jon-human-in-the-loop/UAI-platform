import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { verifyRemoteSignature, createRemoteJob, updateRemoteJob } from '@/lib/remote-execute';

export async function POST(req: NextRequest) {
    const rawPayload = await req.text();
    const signature = req.headers.get('x-uai-signature');

    if (!verifyRemoteSignature(rawPayload, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const access = await authorize({ permission: 'remote:execute' });
    if (!access.ok) return access.response;

    const payload = JSON.parse(rawPayload || '{}');
    const job = await createRemoteJob({
        userId: access.user.id,
        missionId: payload.missionId,
        provider: payload.provider,
        payload,
    });

    // Simulación de ejecución asincrónica
    setTimeout(async () => {
        await updateRemoteJob(job.id, 'running');
        await updateRemoteJob(job.id, 'success', { message: 'Remote execution completed' });
    }, 10);

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
}
