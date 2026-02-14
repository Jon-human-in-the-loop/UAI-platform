'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Cpu, Zap, Layers, Activity, Terminal, Play, Search, Send, Flame, TrendingUp, Star, LogOut, Trophy, Target } from 'lucide-react';
import FlowEditor from '@/components/flow-editor/FlowEditor';
import PricingModal from '@/components/dashboard/PricingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    unlocked: boolean;
}

interface UserProfile {
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

interface XpResult {
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

export default function Dashboard() {
    const { data: session } = useSession();
    const [isRunning, setIsRunning] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
    const [userInput, setUserInput] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [xpNotification, setXpNotification] = useState<XpResult | null>(null);
    const [showAchievement, setShowAchievement] = useState<{ name: string; emoji: string; description: string } | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState([
        { id: 1, type: 'info', text: '💡 Escribe una instrucción y lanza tu primera misión del día.' },
    ]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProfile();
    }, []);
    useEffect(() => {
        // Solo auto-scrollear si hay más de un log (evita scroll al cargar inicial)
        if (logs.length > 1) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [logs]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) setProfile(await res.json());
        } catch (err) { console.error('Error cargando perfil:', err); }
    };

    const awardXp = async (success: boolean, autoHealed: boolean, nodesCompleted: number) => {
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success, autoHealed, nodesCompleted }),
            });
            if (res.ok) {
                const result: XpResult = await res.json();
                setXpNotification(result);
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);
                fetchProfile();

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

    const startAgent = async () => {
        if (isRunning || !userInput.trim()) return;
        setIsRunning(true);
        const instruction = userInput.trim();
        setUserInput('');
        setLogs([{ id: Date.now(), type: 'info', text: `🎯 Misión: "${instruction.substring(0, 80)}${instruction.length > 80 ? '...' : ''}"` }]);

        let nodesCompleted = 0;
        let autoHealed = false;
        let success = true;

        try {
            const response = await fetch('/api/agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: instruction, threadId: currentThreadId }),
            });

            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            if (!response.body) throw new Error('Sin cuerpo de respuesta');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const event = JSON.parse(line);
                        if (event.type === 'session_info') {
                            setCurrentThreadId(event.threadId);
                        } else if (event.type === 'node_update') {
                            nodesCompleted++;
                            const state = event.chunk;
                            const nextNode = state.next_node;
                            const isFin = nextNode === 'FIN' || !nextNode;
                            const nodeName = isFin ? 'reflexion' : nextNode;
                            if (state.errors?.length > 0) autoHealed = true;

                            const nodeMap: Record<string, string> = { 'analizador': '1', 'ejecutor': '2', 'validador': '3', 'reflexion': '4' };
                            if (nodeMap[nodeName]) setActiveNodeId(nodeMap[nodeName]);

                            if (state.messages?.length > 0) {
                                const lastMsg = state.messages[state.messages.length - 1];
                                const text = typeof lastMsg === 'string' ? lastMsg : lastMsg.content;
                                setLogs(prev => {
                                    if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
                                    return [...prev, { id: Date.now() + Math.random(), type: 'process', text }];
                                });
                            }
                        } else if (event.type === 'complete') {
                            setLogs(prev => [...prev, { id: Date.now(), type: 'success', text: '✅ Misión completada con éxito.' }]);
                            await awardXp(true, autoHealed, nodesCompleted);
                        } else if (event.type === 'error') {
                            success = false;
                            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `❌ Error: ${event.message}` }]);
                        }
                    } catch (e) { console.error('Parse error:', e); }
                }
            }
        } catch (error: any) {
            success = false;
            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `💀 Fallo crítico: ${error.message}` }]);
        } finally {
            setIsRunning(false);
            setActiveNodeId(undefined);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(); }
    };

    const planLabel: Record<string, string> = { free: 'Free', essentials: 'Essentials', professional: 'Pro' };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* ===== CELEBRATION PARTICLES ===== */}
            <AnimatePresence>
                {showCelebration && (
                    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: -20,
                                    scale: Math.random() * 0.5 + 0.5,
                                    rotate: 0,
                                }}
                                animate={{
                                    y: window.innerHeight + 20,
                                    rotate: 360,
                                    x: Math.random() * window.innerWidth,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 2 + Math.random() * 2, ease: 'easeIn' }}
                                className="absolute text-2xl"
                            >
                                {['⭐', '🔥', '✨', '💎', '🏆', '🎯'][i % 6]}
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* ===== XP BREAKDOWN TOAST ===== */}
            <AnimatePresence>
                {xpNotification && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] p-5 rounded-2xl bg-black/95 border border-accent/40 shadow-[0_0_40px_rgba(139,0,0,0.4)] backdrop-blur-xl min-w-[300px]"
                    >
                        {/* XP Header */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: 2, duration: 0.4 }}
                            >
                                <TrendingUp className="w-6 h-6 text-accent" />
                            </motion.div>
                            <span className="text-2xl font-black text-accent">+{xpNotification.xpTotal} XP</span>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-1.5">
                            {xpNotification.xpBreakdown.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="text-white/60">{item.emoji} {item.reason}</span>
                                    <span className="text-accent font-mono font-bold">+{item.xp}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Level Up */}
                        {xpNotification.leveledUp && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring', bounce: 0.6 }}
                                className="mt-3 pt-3 border-t border-white/10 text-center text-yellow-400 font-black text-sm animate-pulse"
                            >
                                🎉 ¡NIVEL {xpNotification.level}!
                            </motion.div>
                        )}

                        {/* Rank Change */}
                        {xpNotification.rankChanged && xpNotification.newRank && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8, type: 'spring', bounce: 0.6 }}
                                className="mt-2 text-center text-orange-400 font-black text-sm animate-pulse"
                            >
                                🏆 NUEVO RANGO: {xpNotification.newRank.emoji} {xpNotification.newRank.name}
                            </motion.div>
                        )}

                        {/* Daily Goal */}
                        {xpNotification.dailyGoalJustMet && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1, type: 'spring' }}
                                className="mt-2 text-center text-green-400 font-bold text-xs"
                            >
                                🎯 ¡META DIARIA CUMPLIDA! +75 XP bonus
                            </motion.div>
                        )}

                        {/* Streak */}
                        <div className="mt-3 pt-2 border-t border-white/5 text-center">
                            <span className="text-[10px] text-white/40">{xpNotification.streakMessage}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== ACHIEVEMENT POPUP ===== */}
            <AnimatePresence>
                {showAchievement && (
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-900/90 to-orange-900/90 border border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.3)] backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-4">
                            <motion.span
                                className="text-4xl"
                                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                {showAchievement.emoji}
                            </motion.span>
                            <div>
                                <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest font-bold">¡Logro Desbloqueado!</p>
                                <p className="text-sm font-black text-white">{showAchievement.name}</p>
                                <p className="text-[11px] text-white/50">{showAchievement.description}</p>
                            </div>
                            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== NAVBAR ===== */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-16 border-b border-border bg-card/10 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_0_30px_rgba(139,0,0,0.1)]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_10px_15px_rgba(139,0,0,0.2)]">
                        <Cpu className="text-accent w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold gold-text-gradient tracking-tighter leading-none">UAI PLATFORM</h1>
                        {currentThreadId && (
                            <span className="text-[8px] text-white/30 font-mono tracking-tighter uppercase">Thread: {currentThreadId.slice(0, 8)}...</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Streak Badge in Navbar */}
                    {profile && profile.currentStreak > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-black text-orange-400">{profile.currentStreak}</span>
                        </div>
                    )}

                    {profile && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-lg">{profile.rankEmoji}</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/80 leading-tight">{profile.name}</span>
                                <span className="text-[8px] text-white/40 font-mono leading-tight">Lvl {profile.level}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={() => signOut()} className="p-2 hover:bg-white/5 rounded-full transition-colors group" title="Cerrar Sesión">
                        <LogOut className="w-5 h-5 text-white/40 group-hover:text-accent" />
                    </button>
                </div>
            </motion.header>

            <div className="flex-1 flex overflow-hidden">
                {/* ===== SIDEBAR DUOLINGO-STYLE ===== */}
                <motion.aside
                    initial={{ x: -250 }}
                    animate={{ x: 0 }}
                    className="w-72 border-r border-border bg-black/40 backdrop-blur-md hidden xl:flex flex-col p-5 gap-5 shadow-2xl overflow-y-auto custom-scrollbar"
                >
                    {profile && (
                        <>
                            {/* ── Rango & Nivel ── */}
                            <div className="glass-card p-4 border-accent/20 bg-accent/5 space-y-3 relative group">
                                <div className="absolute top-2 right-2">
                                    <button
                                        onClick={() => setIsPricingOpen(true)}
                                        className="text-[10px] uppercase font-black tracking-wider bg-accent text-white px-2 py-1 rounded hover:bg-accent/80 transition-colors shadow-lg animate-pulse"
                                    >
                                        Mejorar Plan
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <motion.span
                                        className="text-4xl"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 3 }}
                                    >
                                        {profile.rankEmoji}
                                    </motion.span>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase ${profile.rankColor}`}>{profile.rank}</h4>
                                        <p className="text-white/80 text-xs font-mono">Nivel {profile.level}</p>
                                    </div>
                                </div>
                                {/* XP Progress Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-white/40">XP</span>
                                        <span className="text-accent font-mono font-bold">{profile.currentXp} / {profile.xpToNext}</span>
                                    </div>
                                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${profile.progress}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-accent via-orange-500 to-yellow-400 rounded-full relative"
                                        >
                                            <div className="absolute right-0 top-0 h-full w-3 bg-white/30 blur-sm" />
                                        </motion.div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Plan</span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                                        {planLabel[profile.plan] || profile.plan}
                                    </span>
                                </div>
                            </div>

                            {/* ── Racha 🔥 (el gancho Duolingo) ── */}
                            <div className="glass-card p-4 border-orange-500/20 bg-orange-500/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-5 h-5 text-orange-400" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-orange-400/80 font-bold">Racha</span>
                                    </div>
                                    <motion.span
                                        className="text-2xl font-black text-orange-400"
                                        key={profile.currentStreak}
                                        initial={{ scale: 1.5 }}
                                        animate={{ scale: 1 }}
                                    >
                                        {profile.currentStreak}
                                    </motion.span>
                                </div>
                                <p className="text-[11px] text-white/50">{profile.streakMessage}</p>
                                {profile.longestStreak > 0 && (
                                    <p className="text-[9px] text-white/20">Récord: {profile.longestStreak} días</p>
                                )}
                                {profile.streakBroken && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[10px] text-red-400 font-bold animate-pulse"
                                    >
                                        💔 ¡Tu racha se rompió! Ejecuta una misión para empezar de nuevo
                                    </motion.p>
                                )}
                            </div>

                            {/* ── Meta Diaria 🎯 ── */}
                            <div className="glass-card p-4 border-green-500/20 bg-green-500/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-green-400" />
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-bold">Meta Diaria</span>
                                    </div>
                                    {profile.dailyGoalMet && (
                                        <span className="text-xs text-green-400 font-bold">✅</span>
                                    )}
                                </div>
                                {/* Circular-ish progress */}
                                <div className="flex items-center gap-4">
                                    <div className="relative w-16 h-16">
                                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                            <motion.circle
                                                cx="18" cy="18" r="15" fill="none"
                                                stroke={profile.dailyGoalMet ? '#4ade80' : '#fb923c'}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray={`${profile.dailyGoalProgress * 0.94} 94`}
                                                initial={{ strokeDasharray: '0 94' }}
                                                animate={{ strokeDasharray: `${profile.dailyGoalProgress * 0.94} 94` }}
                                                transition={{ duration: 1 }}
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                                            {profile.executionsToday}/{profile.dailyGoal}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/60">
                                            {profile.dailyGoalMet
                                                ? '¡Meta cumplida! 🎉'
                                                : `${profile.dailyGoal - profile.executionsToday} misiones restantes`
                                            }
                                        </p>
                                        <p className="text-[9px] text-white/30 mt-1">+75 XP al completar</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Logros ── */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Logros</span>
                                    <span className="text-[9px] text-white/20 font-mono">
                                        {profile.achievements.filter(a => a.unlocked).length}/{profile.achievements.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {profile.achievements.map((a) => (
                                        <div
                                            key={a.id}
                                            className={`flex flex-col items-center p-2 rounded-xl transition-all ${a.unlocked
                                                ? 'bg-yellow-500/10 border border-yellow-500/20'
                                                : 'bg-white/[0.02] border border-white/5 opacity-30'
                                                }`}
                                            title={`${a.name}: ${a.description}`}
                                        >
                                            <span className="text-lg">{a.emoji}</span>
                                            <span className="text-[7px] text-white/40 mt-1 text-center leading-tight">{a.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Cognición Activa ── */}
                    <div className="space-y-3 mt-auto">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold block">Motor IA</label>
                        <div className="space-y-2">
                            {[
                                { name: 'Claude 3.7', color: 'bg-green-500', status: 'Razonando' },
                                { name: 'GPT-5.2', color: 'bg-blue-500', status: 'En espera' },
                                { name: 'Gemini 1.5', color: 'bg-purple-500', status: 'Contexto Largo' }
                            ].map((model) => (
                                <div key={model.name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <span className="text-xs text-white/70">{model.name}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] text-white/30">{model.status}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${model.color}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.aside>

                {/* ===== MAIN CONTENT ===== */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header + Input */}
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-bold text-white">
                                        Orquestación <span className="gold-text-gradient">Agentic</span>
                                    </motion.h2>
                                    <p className="text-white/40 text-sm">Escribe tu misión y los agentes la ejecutarán.</p>
                                </div>
                                {profile && (
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] text-white/30">{profile.totalExecutions} misiones totales</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Área */}
                            <div className="glass-card p-4 border-accent/10 hover:border-accent/25 transition-all duration-300 focus-within:border-accent/30 focus-within:shadow-[0_0_20px_rgba(139,0,0,0.15)]">
                                <textarea
                                    ref={inputRef}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="🚀 Describe tu misión... Ej: Investiga competidores en el mercado de AI Agents y crea un reporte estratégico."
                                    rows={3}
                                    disabled={isRunning}
                                    className="w-full bg-transparent text-white placeholder-white/20 text-sm leading-relaxed resize-none outline-none font-light"
                                />
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-[9px] text-white/15 font-mono">Enter = enviar · Shift+Enter = nueva línea</span>
                                    <button
                                        onClick={startAgent}
                                        disabled={isRunning || !userInput.trim()}
                                        className={`flex items-center gap-2 group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all overflow-hidden ${isRunning || !userInput.trim()
                                            ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                            : 'bg-primary text-white shadow-[0_0_20px_rgba(139,0,0,0.3)] hover:scale-105 active:scale-95'}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        {isRunning ? (
                                            <><div className="w-4 h-4 border-2 border-white/20 border-t-accent rounded-full animate-spin" /> Procesando...</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> Lanzar Misión</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Editor de Flujo */}
                            <div className="lg:col-span-3 h-[500px] glass-card relative overflow-hidden group shadow-2xl border-white/10">
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    <div className="glass-card px-3 py-1 text-[10px] text-accent font-bold border-accent/20">LIVE ENGINE</div>
                                    <div className="glass-card px-3 py-1 text-[10px] text-white/40 font-bold border-white/10">LANGGRAPH</div>
                                </div>
                                <FlowEditor activeNodeId={activeNodeId} />
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-card p-1.5 flex gap-1 z-10 shadow-2xl border-white/20">
                                    {[Bot, Zap, Layers, Activity].map((Icon, idx) => (
                                        <div key={idx} className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-white/10 ${idx === 2 ? 'bg-primary/20 text-accent border border-primary/30' : 'text-white/60'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Columna Derecha */}
                            <div className="space-y-6">
                                {/* Thought Log */}
                                <div className="glass-card flex flex-col h-[300px] border-white/5 overflow-hidden">
                                    <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
                                        <Terminal className="w-4 h-4 text-accent" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Pensamiento</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[10px]">
                                        <AnimatePresence>
                                            {logs.map((log) => (
                                                <motion.div
                                                    key={log.id}
                                                    initial={{ x: 20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    className={`flex gap-2 ${log.type === 'success' ? 'text-green-400' : log.type === 'process' ? 'text-accent' : log.type === 'error' ? 'text-red-400' : 'text-white/40'}`}
                                                >
                                                    <span className="opacity-30 shrink-0">[{new Date(log.id).toLocaleTimeString([], { hour12: false })}]</span>
                                                    <span className="leading-relaxed">{log.text}</span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>

                                {/* Métricas */}
                                <div className="glass-card p-4 space-y-3 border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary-light" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Métricas</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Latencia', val: '240ms', progress: 85 },
                                            { label: 'Skills Batch', val: '12%', progress: 12 },
                                            { label: 'Precisión', val: '99.4%', progress: 99 }
                                        ].map(metric => (
                                            <div key={metric.label} className="space-y-1">
                                                <div className="flex justify-between text-[9px]">
                                                    <span className="text-white/40">{metric.label}</span>
                                                    <span className="text-white font-mono">{metric.val}</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${metric.progress}%` }}
                                                        className={`h-full ${metric.progress > 90 ? 'bg-accent' : 'bg-primary'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {profile && (
                <PricingModal
                    isOpen={isPricingOpen}
                    onClose={() => setIsPricingOpen(false)}
                    currentPlan={profile.plan || 'free'}
                />
            )}
        </div>
    );
}
