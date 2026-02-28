import { NextRequest, NextResponse } from 'next/server';
import { claimNextQueuedRemoteJob, requeueOrFailRemoteJob, updateRemoteJob } from '@/lib/remote-execute';
import { isValidRemoteWorkerToken } from '@/lib/remote-execute-policy';

export const runtime = 'nodejs';

function getWorkerToken(req: NextRequest) {
    const bearer = req.headers.get('authorization');
    if (bearer?.startsWith('Bearer ')) return bearer.slice('Bearer '.length);
    return req.headers.get('x-uai-worker-token');
}

function getMaxAttempts() {
    const raw = Number(process.env.REMOTE_EXECUTE_MAX_ATTEMPTS || '3');
    if (!Number.isFinite(raw) || raw <= 0) return 3;
    return Math.floor(raw);
}

async function executeRemoteJobPayload(payload: any) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return {
        ok: true,
        provider: payload?.provider || 'remote',
        missionId: payload?.missionId || null,
        output: payload?.task || payload?.input || 'Remote execution completed',
    };
}

export async function POST(req: NextRequest) {
    const workerToken = getWorkerToken(req);
    if (!isValidRemoteWorkerToken(workerToken)) {
        return NextResponse.json({ error: 'Invalid worker token' }, { status: 401 });
    }

    const maxAttempts = getMaxAttempts();
    const runningJob = await claimNextQueuedRemoteJob(maxAttempts);
    if (!runningJob) {
        return NextResponse.json({ ok: true, message: 'No queued jobs' });
    }

    try {
        const result = await executeRemoteJobPayload(runningJob.request_payload || {});
        const updated = await updateRemoteJob(runningJob.id, 'success', result);
        return NextResponse.json({ ok: true, processed: true, job: updated });
    } catch (error: any) {
        const updated = await requeueOrFailRemoteJob(
            runningJob.id,
            Number(runningJob.attempts || 1),
            error?.message || 'Remote execution failed',
            maxAttempts,
        );
        return NextResponse.json({ ok: false, processed: true, job: updated }, { status: 500 });
    }
}
