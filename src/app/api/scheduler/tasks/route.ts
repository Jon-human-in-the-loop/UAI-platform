import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '@/lib/database';
import { calculateNextRun } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
    try {
        const client = await dbPool.connect();
        try {
            const result = await client.query('SELECT * FROM scheduled_tasks ORDER BY created_at DESC');
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, agentId, missionTemplate, cronExpression } = await req.json();
        const nextRun = calculateNextRun(cronExpression);

        const client = await dbPool.connect();
        try {
            const result = await client.query(
                `INSERT INTO scheduled_tasks (user_id, agent_id, mission_template, cron_expression, next_run)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userId, agentId, missionTemplate, cronExpression, nextRun]
            );
            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
