import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
    createScheduledTask, 
    getActiveScheduledTasks,
    deleteScheduledTask,
    updateScheduledTaskStatus 
} from '@/lib/scheduled-tasks';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const tasks = await getActiveScheduledTasks();
        const userTasks = tasks.filter(t => t.user_id === session.user.id);
        return NextResponse.json(userTasks);
    } catch (error: any) {
        console.error('[Scheduled Tasks API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { agentId, missionTemplate, cronExpression } = await req.json();

        if (!agentId || !missionTemplate || !cronExpression) {
            return NextResponse.json(
                { error: 'Se requieren agentId, missionTemplate y cronExpression' },
                { status: 400 }
            );
        }

        const task = await createScheduledTask(
            session.user.id,
            agentId,
            missionTemplate,
            cronExpression
        );

        return NextResponse.json({
            success: true,
            task: task,
            message: 'Tarea programada creada exitosamente'
        });
    } catch (error: any) {
        console.error('[Scheduled Tasks API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json({ error: 'Se requiere taskId' }, { status: 400 });
        }

        await deleteScheduledTask(taskId);

        return NextResponse.json({
            success: true,
            message: 'Tarea programada eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('[Scheduled Tasks API] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
