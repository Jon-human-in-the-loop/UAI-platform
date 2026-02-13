import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbAdapter } from '@/lib/db-adapter';
import { XP_REWARDS, calculateLevel, getRank, levelProgress } from '@/lib/gamification';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const user = await dbAdapter.getUserByEmail(session.user.email);

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const stats = levelProgress(user.xp);

        return NextResponse.json({
            name: user.name,
            email: user.email,
            plan: user.plan,
            xp: user.xp,
            level: stats.level,
            rank: stats.rank.name,
            rankEmoji: stats.rank.emoji,
            progressToNextLevel: stats.progress,
            xpToNextLevel: stats.xpToNext,
            currentStreak: user.current_streak,
            longestStreak: user.longest_streak,
            achievements: user.achievements || [],
            stats: {
                totalExecutions: user.total_executions,
                perfectExecutions: user.perf_executions,
                autoHeals: user.auto_heals,
                dailyGoalsCompleted: user.daily_goals
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
        const { xpToAdd, reason, autoHeal, nodesCompleted, isFirstOfDay, dailyGoalMet } = await req.json();
        const user = await dbAdapter.getUserByEmail(session.user.email);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Calculate new stats
        const newXp = (user.xp || 0) + (xpToAdd || 0);
        const newTotalExecutions = (user.total_executions || 0) + 1;
        const newPerf = (user.perf_executions || 0) + (autoHeal ? 0 : 1); // If autoHeal is false (and success assumed), it's perfect? Verify logic.
        // Actually reason might be 'Ejecución perfecta'. simplified for now.
        const newAutoHeals = (user.auto_heals || 0) + (autoHeal ? 1 : 0);
        const newDailyGoals = (user.daily_goals || 0) + (dailyGoalMet ? 1 : 0);

        // Update DB
        await dbAdapter.updateUserGamification(user.id, {
            xp: newXp,
            totalExecutions: newTotalExecutions,
            perfectExecutions: newPerf, // Simplification, ideally verify success flag
            autoHeals: newAutoHeals,
            dailyGoalsCompleted: newDailyGoals,
            // Streak logic handled separately or assumed passed?
            // For now, let's trust the input or recalculate?
            // Better to rely on what was calculated in the gamification engine logic 
            // but we need to pass current streak.
        });

        return NextResponse.json({ success: true, newXp });
    } catch (error) {
        console.error('Error updating XP:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
