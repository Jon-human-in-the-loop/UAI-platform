'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    unlocked: boolean;
}

export interface UserProfile {
    name: string;
    email: string;
    plan: string;
    rank: string;
    rankEmoji: string;
    rankColor: string;
    rankGradient: string;
    level: number;
    xp: number;
    currentXp: number;
    xpToNext: number;
    progress: number;
    currentStreak: number;
    longestStreak: number;
    streakMessage: string;
    streakBroken: boolean;
    executionsToday: number;
    dailyGoal: number;
    dailyGoalMet: boolean;
    dailyGoalProgress: number;
    totalExecutions: number;
    achievements: Achievement[];
}

interface XpBreakdown {
    reason: string;
    xp: number;
    emoji: string;
}

export interface XpResult {
    xpBreakdown: XpBreakdown[];
    xpTotal: number;
    totalXp: number;
    level: number;
    rank: string;
    rankEmoji: string;
    progress: number;
    leveledUp: boolean;
    rankChanged: boolean;
    newRank: { name: string; emoji: string } | null;
    currentStreak: number;
    streakMessage: string;
    dailyGoalMet: boolean;
    dailyGoalJustMet: boolean;
    newAchievements: { id: string; name: string; emoji: string; description: string }[];
}

interface DashboardContextType {
    profile: UserProfile | null;
    refreshProfile: () => Promise<void>;
    awardXp: (success: boolean, autoHealed: boolean, nodesCompleted: number) => Promise<void>;
    xpNotification: XpResult | null;
    setXpNotification: (notification: XpResult | null) => void;
    showCelebration: boolean;
    showAchievement: { name: string; emoji: string; description: string } | null;
    isPricingOpen: boolean;
    setIsPricingOpen: (isOpen: boolean) => void;
    activeAgent: Agent | null;
    setActiveAgent: (agent: Agent | null) => void;
    agents: Agent[];
    refreshAgents: () => Promise<void>;
}

export interface Agent {
    id: string;
    name: string;
    role: string;
    model: string;
    level: number;
    xp: number;
    avatar?: string;
    system_prompt?: string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [xpNotification, setXpNotification] = useState<XpResult | null>(null);
    const [showAchievement, setShowAchievement] = useState<{ name: string; emoji: string; description: string } | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

    useEffect(() => {
        fetchProfile();
        fetchAgents();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) setProfile(await res.json());
        } catch (err) { console.error('Error cargando perfil:', err); }
    };

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
                if (data.length > 0) setActiveAgent(data[0]); // Default to first agent
            }
        } catch (err) { console.error('Error cargando agentes:', err); }
    };

    const awardXp = async (success: boolean, autoHealed: boolean, nodesCompleted: number) => {
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                // Include activeAgentId to award XP to agent as well
                body: JSON.stringify({
                    success,
                    autoHealed,
                    nodesCompleted,
                    agentId: activeAgent?.id
                }),
            });
            if (res.ok) {
                const result: XpResult = await res.json();
                setXpNotification(result);
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);
                fetchProfile();
                fetchAgents(); // Refresh agents to show new XP

                // Show achievements one by one
                if (result.newAchievements?.length > 0) {
                    setTimeout(() => {
                        setShowAchievement(result.newAchievements[0]);
                        setTimeout(() => setShowAchievement(null), 4000);
                    }, 2500);
                }

                setTimeout(() => setXpNotification(null), 5000);
            }
        } catch (err) { console.error('Error otorgando XP:', err); }
    };

    return (
        <DashboardContext.Provider value={{
            profile,
            refreshProfile: fetchProfile,
            awardXp,
            xpNotification,
            setXpNotification,
            showCelebration,
            showAchievement,
            isPricingOpen,
            setIsPricingOpen,
            activeAgent,
            setActiveAgent,
            agents,
            refreshAgents: fetchAgents
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
