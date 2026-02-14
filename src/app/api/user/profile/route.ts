import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbAdapter } from '@/lib/db-adapter';
import {
    XP_REWARDS,
    calculateLevel,
    getRank,
    levelProgress,
    calculateExecutionXp,
    calculateStreak,
    getStreakMessage,
    getUnlockedAchievements,
    DAILY_GOAL,
    UserStats,
    Achievement
} from '@/lib/gamification';

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
            executionsToday: user.executions_today || 0,
            dailyGoal: DAILY_GOAL, // Send the goal target to frontend
            dailyGoalMet: (user.executions_today || 0) >= DAILY_GOAL,
            dailyGoalProgress: Math.min(100, Math.floor(((user.executions_today || 0) / DAILY_GOAL) * 100)),
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
        // We receive the execution results from the client (or agent runner)
        const { autoHeal, nodesCompleted, agentId } = await req.json();

        // --- UPDATE AGENT XP (If agentId is provided) ---
        if (agentId) {
            const agent = await dbAdapter.getAgentById(agentId);
            if (agent && agent.user_id === session.user.id) { // Verify ownership
                // Calculate Agent XP (simplified: 100% of user XP for now)
                // Or better: use the same calculation function?
                const agentXpResult = calculateExecutionXp({
                    success: true,
                    autoHealed: autoHeal,
                    nodesCompleted,
                    isFirstOfDay: false, // Agents don't have streaks daily logic yet
                    currentStreak: 0,
                    executionsToday: 0
                });

                const xpGain = agentXpResult.total;
                const newAgentXp = (agent.xp || 0) + xpGain;
                const newAgentLevel = calculateLevel(newAgentXp); // Using same level scale for simplicity

                await dbAdapter.updateAgent(agent.id, {
                    xp: newAgentXp,
                    level: newAgentLevel
                });
            }
        }

        const user = await dbAdapter.getUserByEmail(session.user.email);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const now = new Date();
        const lastActive = user.last_active ? new Date(user.last_active) : undefined;

        // 1. Check if it's a new day for executions_today reset
        let executionsToday = user.executions_today || 0;
        let isFirstOfDay = false;

        if (!lastActive || lastActive.getDate() !== now.getDate() || lastActive.getMonth() !== now.getMonth() || lastActive.getFullYear() !== now.getFullYear()) {
            executionsToday = 0;
            isFirstOfDay = true;
        }

        // 2. Streak Logic
        const streakInfo = calculateStreak(user.last_active ? user.last_active.toString() : undefined, now.toISOString());
        let currentStreak = user.current_streak;
        let streakMessage = getStreakMessage(currentStreak);

        if (streakInfo.streakBroken) {
            currentStreak = 1; // Reset to 1 because we are active now
        } else if (isFirstOfDay) {
            // If it's the first execution of a new day, and streak is active (consecutive), increment.
            if (streakInfo.isActive) {
                currentStreak += 1;
            } else {
                currentStreak = 1; // Should be covered by streakBroken usually, but safety check
                if (user.current_streak === 0) currentStreak = 1;
            }
        }
        // If it's the same day, streak doesn't change.

        // 3. Update Executions Today
        executionsToday += 1;

        // 4. Calculate XP Breakdown
        const xpResult = calculateExecutionXp({
            success: true,
            autoHealed: autoHeal,
            nodesCompleted: nodesCompleted,
            isFirstOfDay: isFirstOfDay,
            currentStreak: currentStreak,
            executionsToday: executionsToday // pass current count to check against goal
        });

        const xpToAdd = xpResult.total;
        const newXp = (user.xp || 0) + xpToAdd;

        // 5. Level Calculation
        const oldLevel = calculateLevel(user.xp || 0);
        const newLevel = calculateLevel(newXp);
        const leveledUp = newLevel > oldLevel;

        // 6. Daily Goals
        const dailyGoalMet = executionsToday >= DAILY_GOAL;
        const dailyGoalJustMet = executionsToday === DAILY_GOAL;

        let dailyGoalsCompletedTotal = user.daily_goals;
        if (dailyGoalJustMet) dailyGoalsCompletedTotal += 1;

        // 7. Stats update for Achievements check
        const newStats: UserStats = {
            totalExecutions: (user.total_executions || 0) + 1,
            totalXp: newXp,
            level: newLevel,
            currentStreak: currentStreak,
            longestStreak: Math.max(user.longest_streak, currentStreak),
            perfectExecutions: (user.perf_executions || 0) + (!autoHeal ? 1 : 0), // Assuming success=true means perfect if no autoHeal
            dailyGoalsCompleted: dailyGoalsCompletedTotal,
            autoHeals: (user.auto_heals || 0) + (autoHeal ? 1 : 0)
        };

        // 8. Achievements
        const currentAchievements = user.achievements || [];
        const unlocked = getUnlockedAchievements(newStats);
        // Find new ones
        const newAchievements = unlocked.filter(a => !currentAchievements.find(ca => ca.id === a.id));
        // Serialize for DB (store only simpler objects usually? But interface says Achievement[])
        // The gamification.ts exports full Achievement objects with functions. DB should store ID or Metadata?
        // database.ts schema says JSONB. usually we store structure.
        // Let's store the full object minus the function 'condition'.
        const achievementToStore = (a: Achievement) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            emoji: a.emoji
            // condition is excluded
        });

        const allAchievements = [
            ...currentAchievements,
            ...newAchievements.map(achievementToStore)
        ];

        // 9. Update DB
        await dbAdapter.updateUserGamification(user.id, {
            xp: newXp,
            level: newLevel,
            totalExecutions: newStats.totalExecutions,
            perfectExecutions: newStats.perfectExecutions,
            autoHeals: newStats.autoHeals,
            dailyGoalsCompleted: newStats.dailyGoalsCompleted,
            currentStreak: newStats.currentStreak,
            longestStreak: newStats.longestStreak,
            achievements: allAchievements as any, // Cast to avoid strict type issues with functions
            lastActive: now,
            executionsToday: executionsToday
        });

        // 10. Return FULL RESULT for Frontend
        const progressStats = levelProgress(newXp);

        return NextResponse.json({
            xpBreakdown: xpResult.breakdown,
            xpTotal: xpToAdd,
            totalXp: newXp,
            level: newLevel,
            rank: progressStats.rank.name,
            rankEmoji: progressStats.rank.emoji,
            progress: progressStats.progress,
            leveledUp: leveledUp,
            rankChanged: false, // Could calculate if rank changed
            newRank: null, // Could populate if changed
            currentStreak: currentStreak,
            streakMessage: getStreakMessage(currentStreak),
            dailyGoalMet: dailyGoalMet,
            dailyGoalJustMet: dailyGoalJustMet,
            newAchievements: newAchievements.map(achievementToStore)
        });
    } catch (error) {
        console.error('Error updating XP:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
