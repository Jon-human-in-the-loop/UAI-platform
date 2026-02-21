'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/components/dashboard/DashboardContext';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import PricingModal from '@/components/dashboard/PricingModal';
import OnboardingTutorial from '@/components/dashboard/OnboardingTutorial';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const {
        profile,
        xpNotification,
        showAchievement,
        showCelebration,
        isPricingOpen,
        setIsPricingOpen
    } = useDashboard();

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden selection:bg-red-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
            </div>

            <Navbar />

            <div className="flex-1 flex overflow-hidden relative z-10">
                <Sidebar />
                {/* Habilitar scroll vertical en el contenedor principal */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/20">
                    {children}
                </main>
            </div>

            {/* ===== GLOBAL OVERLAYS ===== */}

            {/* CELEBRATION OVERLAY */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-8 right-8 z-[200] pointer-events-none flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                        >
                            +{xpNotification?.xpTotal || 0} XP
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEVEL UP & RANK NOTIFICATION */}
            <AnimatePresence>
                {xpNotification && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="fixed top-24 right-8 z-[100] min-w-[300px]"
                    >
                        {/* Compact XP Notification (Top Center) */}
                        {!xpNotification.leveledUp && !xpNotification.rankChanged && (
                            <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-green-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-4">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Trophy className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-green-400 font-bold text-sm">¡Misión Completada!</p>
                                    <p className="text-white/60 text-xs">Has ganado <span className="text-white font-mono font-bold">+{xpNotification.xpTotal} XP</span></p>
                                </div>
                            </div>
                        )}

                        {/* Level Up Banner */}
                        {xpNotification.leveledUp && (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-r from-yellow-600/90 to-orange-600/90 backdrop-blur-md border border-yellow-400/50 rounded-xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.4)] text-center space-y-2"
                            >
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                                    ¡Subiste de Nivel!
                                </h3>
                                <div className="text-6xl font-black text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                                    {xpNotification.level}
                                </div>
                                <p className="text-white/90 font-bold text-sm">Capacidad de procesamiento aumentada.</p>
                            </motion.div>
                        )}

                        {/* Rank Up Overlay */}
                        {xpNotification.rankChanged && xpNotification.newRank && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.5 }}
                                className="mt-4 bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl border border-indigo-400/50 shadow-2xl text-center"
                            >
                                <p className="text-xs uppercase font-bold text-indigo-200 tracking-[0.2em] mb-2">Ascenso de Rango</p>
                                <div className="text-5xl mb-2 animate-bounce">{xpNotification.newRank.emoji}</div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                                    {xpNotification.newRank.name}
                                </h3>
                            </motion.div>
                        )}

                        {/* Daily Goal */}
                        {xpNotification.dailyGoalJustMet && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1, type: 'spring' }}
                                className="mt-2 text-center text-green-400 font-bold text-xs bg-green-900/20 px-4 py-2 rounded-full border border-green-500/20"
                            >
                                🎯 ¡Meta diaria cumplida! +75 XP bonus
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACHIEVEMENT POPUP */}
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
                                <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest font-bold">¡Logro desbloqueado!</p>
                                <p className="text-sm font-black text-white">{showAchievement.name}</p>
                                <p className="text-[11px] text-white/50">{showAchievement.description}</p>
                            </div>
                            <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {profile && (
                <>
                    <PricingModal
                        isOpen={isPricingOpen}
                        onClose={() => setIsPricingOpen(false)}
                        currentPlan={profile.plan || 'free'}
                    />
                    <OnboardingTutorial />
                </>
            )}
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <DashboardContent>{children}</DashboardContent>
        </DashboardProvider>
    );
}
