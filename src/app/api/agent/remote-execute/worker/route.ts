import { NextRequest, NextResponse } from 'next/server';
import { claimNextQueuedRemoteJob, requeueOrFailRemoteJob, updateRemoteJob } from '@/lib/remote-execute';
import { getRemoteMaxAttempts, isValidRemoteWorkerToken } from '@/lib/remote-execute-policy';

export const runtime = 'nodejs';

function getWorkerToken(req: NextRequest) {
    const bearer = req.headers.get('authorization');
    if (bearer?.startsWith('Bearer ')) return bearer.slice('Bearer '.length);
    return req.headers.get('x-uai-worker-token');
}

function getBatchLimit(req: NextRequest) {
    const url = new URL(req.url);
    const raw = Number(url.searchParams.get('limit') || '1');
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    return Math.min(Math.floor(raw), 10);
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

    const maxAttempts = getRemoteMaxAttempts();
    const batchLimit = getBatchLimit(req);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const jobs: any[] = [];

    for (let i = 0; i < batchLimit; i++) {
        const runningJob = await claimNextQueuedRemoteJob(maxAttempts);
        if (!runningJob) break;

        processed += 1;

        try {
            const result = await executeRemoteJobPayload(runningJob.request_payload || {});
            const updated = await updateRemoteJob(runningJob.id, 'success', result);
            succeeded += 1;
            jobs.push(updated);
        } catch (error: any) {
            const updated = await requeueOrFailRemoteJob(
                runningJob.id,
                Number(runningJob.attempts || 1),
                error?.message || 'Remote execution failed',
                maxAttempts,
            );
            failed += 1;
            jobs.push(updated);
        }
    }

    if (processed === 0) {
        return NextResponse.json({ ok: true, message: 'No queued jobs', processed, succeeded, failed, jobs: [] });
    }

    return NextResponse.json({ ok: failed === 0, processed, succeeded, failed, jobs });
}
