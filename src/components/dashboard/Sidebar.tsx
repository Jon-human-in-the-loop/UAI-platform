'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Bot, Layers, Trophy, ShieldCheck, Share2, BarChart3, ShoppingBag, Brain, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from './DashboardContext';

const planLabel: Record<string, string> = {
    'free': 'Gratis',
    'essentials': 'Essentials',
    'professional': 'Pro'
};

export default function Sidebar() {
    const { profile, setIsPricingOpen } = useDashboard();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-md hidden xl:flex flex-col p-4 gap-4 shadow-2xl overflow-y-auto custom-scrollbar h-full"
        >
            {/* Navigation */}
            <nav className="space-y-2">
                <Link href="/dashboard">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <Layers className="w-5 h-5" />
                        <span className="font-bold">Mission Control</span>
                    </div>
                </Link>
                <Link href="/dashboard/agents">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/agents') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <Bot className="w-5 h-5" />
                        <span className="font-bold">Agent Studio</span>
                    </div>
                </Link>
                <Link href="/dashboard/marketplace">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/marketplace') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <ShoppingBag className="w-5 h-5" />
                        <span className="font-bold">Marketplace</span>
                    </div>
                </Link>
                <Link href="/dashboard/memory">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/memory') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <Brain className="w-5 h-5" />
                        <span className="font-bold">Memoria Colectiva</span>
                    </div>
                </Link>
                <Link href="/dashboard/leaderboard">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/leaderboard') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold">Ranking</span>
                    </div>
                </Link>
                <Link href="/dashboard/channels">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/channels') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <Share2 className="w-5 h-5" />
                        <span className="font-bold">Canales</span>
                    </div>
                </Link>
                <Link href="/dashboard/healing">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/healing') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold">Auto-Sanación</span>
                    </div>
                </Link>
                <Link href="/dashboard/analytics">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/analytics') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-bold">Analítica ROI</span>
                    </div>
                </Link>
                <Link href="/dashboard/billing">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard/billing') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                        <CreditCard className="w-5 h-5" />
                        <span className="font-bold">Créditos</span>
                    </div>
                </Link>
            </nav>

            <div className="h-px bg-white/5 my-2" />

            {profile && (
                <>
                    {/* ── Rango & Nivel ── */}
                    <div className="relative p-4 rounded-xl border border-red-500/20 bg-red-500/5 space-y-3 group overflow-hidden">
                        <div className="absolute top-2 right-2 z-10">
                            <button
                                onClick={() => setIsPricingOpen(true)}
                                className="text-[10px] uppercase font-black tracking-wider bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500 transition-colors shadow-lg animate-pulse"
                            >
                                Mejorar plan
                            </button>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <motion.span
                                className="text-4xl"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                {profile.rankEmoji}
                            </motion.span>
                            <div>
                                <h4 className={`text-sm font-black uppercase text-transparent bg-clip-text ${profile.rankGradient || 'bg-gradient-to-r from-red-500 to-orange-500'}`}>{profile.rank}</h4>
                                <p className="text-white/80 text-xs font-mono">Nivel {profile.level}</p>
                            </div>
                        </div>
                        {/* XP Progress Bar */}
                        <div className="space-y-1 relative z-10">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-white/40">XP</span>
                                <span className="text-red-500 font-mono font-bold">{profile.currentXp} / {profile.xpToNext}</span>
                            </div>
                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profile.progress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full relative"
                                >
                                    <div className="absolute right-0 top-0 h-full w-3 bg-white/30 blur-sm" />
                                </motion.div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 relative z-10">
                            <span className="text-[9px] text-white/30 uppercase tracking-wider">Plan</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                {planLabel[profile.plan] || profile.plan}
                            </span>
                        </div>
                    </div>

                    {/* ── Racha 🔥 (el gancho Duolingo) ── */}
                    <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-3 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/10 blur-xl rounded-full" />
                        <div className="flex items-center justify-between relative z-10">
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
                        <p className="text-[11px] text-white/50 relative z-10">{profile.streakMessage}</p>
                        {profile.longestStreak > 0 && (
                            <p className="text-[9px] text-white/20 relative z-10">Récord: {profile.longestStreak} días</p>
                        )}
                        {profile.streakBroken && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] text-red-400 font-bold animate-pulse relative z-10"
                            >
                                💔 ¡Tu racha se rompió! Ejecuta una misión para empezar de nuevo
                            </motion.p>
                        )}
                    </div>

                    {/* ── Meta Diaria 🎯 ── */}
                    <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3 relative overflow-hidden">
                        <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-green-500/10 blur-xl rounded-full" />
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-400" />
                                <span className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-bold">Meta diaria</span>
                            </div>
                            {profile.dailyGoalMet && (
                                <span className="text-xs text-green-400 font-bold">✅</span>
                            )}
                        </div>
                        {/* Circular-ish progress */}
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <motion.circle
                                        cx="18" cy="18" r="15" fill="none"
                                        stroke={profile.dailyGoalMet ? "#4ade80" : "#ffffff"}
                                        strokeWidth="3"
                                        strokeDasharray="94.2"
                                        initial={{ strokeDashoffset: 94.2 }}
                                        animate={{ strokeDashoffset: 94.2 - (94.2 * (profile.dailyGoalProgress / 100)) }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-[8px] text-white/40 font-bold">XP</span>
                                    <span className="text-xs font-bold text-white">{profile.executionsToday * 50}/{profile.dailyGoal}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-white/60 leading-tight">
                                    {profile.dailyGoalMet
                                        ? "¡Misión cumplida! Has ganado bonificación."
                                        : "Completa misiones para ganar XP extra."}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.aside>
    );
}
