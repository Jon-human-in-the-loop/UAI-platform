'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

export default function LeaderboardPanel() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification/leaderboard')
            .then(res => res.json())
            .then(data => {
                setLeaders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading leaderboard:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Ranking Global
                </h3>
                <span className="text-[10px] font-mono text-yellow-500/60">TOP 10 AGENTES</span>
            </div>
            <div className="p-4">
                {loading ? (
                    <div className="py-10 text-center text-white/20 animate-pulse">Calculando posiciones...</div>
                ) : leaders.length > 0 ? (
                    <div className="space-y-2">
                        {leaders.map((user: any, index: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={user.id} 
                                className={`p-3 rounded-xl flex items-center justify-between ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5 border border-white/5'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                        index === 0 ? 'bg-yellow-500 text-black' : 
                                        index === 1 ? 'bg-slate-300 text-black' : 
                                        index === 2 ? 'bg-amber-600 text-white' : 'text-white/40'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{user.rank_emoji || '👤'}</span>
                                        <div>
                                            <h4 className="text-xs font-bold text-white">{user.name}</h4>
                                            <p className="text-[9px] text-white/40 uppercase">{user.rank || 'Novato'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-white">{user.xp.toLocaleString()} XP</div>
                                    <div className="text-[9px] text-white/40 font-mono">NIVEL {user.level}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-white/20">No hay datos de ranking disponibles.</div>
                )}
            </div>
        </div>
    );
}
