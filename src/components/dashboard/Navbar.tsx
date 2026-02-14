'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Flame, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useDashboard } from './DashboardContext';

interface NavbarProps {
    currentThreadId?: string;
}

export default function Navbar({ currentThreadId }: NavbarProps) {
    const { profile } = useDashboard();

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-16 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-[0_0_30px_rgba(139,0,0,0.1)]"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-900/20 rounded-xl flex items-center justify-center border border-red-500/30 shadow-[0_10px_15px_rgba(139,0,0,0.2)]">
                    <Cpu className="text-red-500 w-6 h-6 animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-red-200 to-red-500 tracking-tighter leading-none">UAI PLATFORM</h1>
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
                    <LogOut className="w-5 h-5 text-white/40 group-hover:text-red-500" />
                </button>
            </div>
        </motion.header>
    );
}
