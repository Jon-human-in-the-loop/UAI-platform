import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authz';
import { createRemoteJob, registerRemoteRequestNonce } from '@/lib/remote-execute';
import { isTimestampFresh, verifyRemoteSignature } from '@/lib/remote-execute-policy';

export async function POST(req: NextRequest) {
    const rawPayload = await req.text();
    const signature = req.headers.get('x-uai-signature');
    const timestamp = req.headers.get('x-uai-timestamp') || '';
    const nonce = req.headers.get('x-uai-nonce') || '';

    if (!timestamp || !nonce) {
        return NextResponse.json({ error: 'Missing timestamp or nonce' }, { status: 401 });
    }

    if (!isTimestampFresh(timestamp)) {
        return NextResponse.json({ error: 'Stale timestamp' }, { status: 401 });
    }

    const path = new URL(req.url).pathname;
    const validSignature = verifyRemoteSignature(
        {
            method: req.method,
            path,
            timestamp,
            nonce,
            body: rawPayload,
        },
        signature,
    );

    if (!validSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const access = await authorize({ permission: 'remote:execute' });
    if (!access.ok) return access.response;

    const nonceRegistered = await registerRemoteRequestNonce(nonce, timestamp, access.user.id);
    if (!nonceRegistered) {
        return NextResponse.json({ error: 'Replay detected' }, { status: 409 });
    }

    const payload = JSON.parse(rawPayload || '{}');
    const job = await createRemoteJob({
        userId: access.user.id,
        missionId: payload.missionId,
        provider: payload.provider,
        payload,
    });

    return NextResponse.json(
        {
            jobId: job.id,
            status: job.status,
            message: 'Job queued. A worker must process this job.',
        },
        { status: 202 },
    );
}
