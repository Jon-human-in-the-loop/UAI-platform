'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Zap } from 'lucide-react';

interface HealingStatsData {
    total_healed: number;
    total_errors: number;
    most_common_error?: string;
}

export default function HealingStats() {
    const [stats, setStats] = useState<HealingStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/healing/stats')
            .then(res => res.json())
            .then((data: HealingStatsData) => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading healing stats:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center text-white/20 animate-pulse">Analizando integridad neural...</div>;

    const totalHealed = stats?.total_healed ?? 0;
    const totalErrors = stats?.total_errors ?? 0;
    const recoveryRate = totalErrors > 0 ? Math.round((totalHealed / totalErrors) * 100) : 100;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-bold text-green-500/60 uppercase">Auto-Sanaciones</span>
                    </div>
                    <div className="text-2xl font-black text-white">{totalHealed}</div>
                    <p className="text-[9px] text-white/40">Errores resueltos automáticamente</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-[10px] font-bold text-red-500/60 uppercase">Errores Totales</span>
                    </div>
                    <div className="text-2xl font-black text-white">{totalErrors}</div>
                    <p className="text-[9px] text-white/40">Interrupciones detectadas</p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400/60 uppercase">Tasa de Recuperación</span>
                    </div>
                    <span className="text-xs font-bold text-white">
                        {recoveryRate}%
                    </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${recoveryRate}%` }}
                        className="h-full bg-blue-500"
                    />
                </div>
            </div>

            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <span className="text-[9px] text-white/30 uppercase block mb-1">Error más frecuente</span>
                <span className="text-xs font-mono text-white/80">{stats?.most_common_error ?? 'Ninguno'}</span>
            </div>
        </div>
    );
}
