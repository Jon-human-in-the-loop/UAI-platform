'use client';

import React, { useEffect, useState } from 'react';
import ROIDashboard from '@/components/dashboard/ROIDashboard';
import { BarChart3, PieChart, Activity } from 'lucide-react';

interface AnalyticsData {
    totalRuns: number;
    successfulRuns: number;
    successRate: number;
    totalTokens: number;
    avgLatencyMs: number;
    hoursSaved: number;
    costSaved: number;
    runsPerDay: { day: string; runs: number; successful: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const metrics = {
        hoursSaved: data?.hoursSaved ?? 0,
        costSaved: data?.costSaved ?? 0,
        cognitiveLoadReduction: data?.successRate ?? 0,
        efficiencyGain: data && data.totalRuns > 0
            ? Math.min(99, Math.round((data.successfulRuns / data.totalRuns) * 100))
            : 0,
    };

    // Build bar chart heights from runsPerDay (last 7 days)
    const barHeights = data?.runsPerDay.length
        ? (() => {
            const maxRuns = Math.max(...data.runsPerDay.map(d => d.runs), 1);
            return data.runsPerDay.slice(-5).map(d => Math.round((d.runs / maxRuns) * 100));
        })()
        : [0, 0, 0, 0, 0];

    const automationRate = data && data.totalRuns > 0
        ? Math.min(99, Math.round((data.successfulRuns / data.totalRuns) * 100))
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analítica de ROI</h2>
                    <p className="text-sm text-white/40">Impacto real de tu flota de agentes en tu flujo de trabajo.</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-white/80 uppercase">
                        {loading ? 'Cargando...' : `${data?.totalRuns ?? 0} misiones totales`}
                    </span>
                </div>
            </div>

            <ROIDashboard metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold text-white uppercase">Ejecuciones (Últimos 7 días)</h3>
                    </div>
                    <div className="h-48 flex items-end gap-4 px-4">
                        {(barHeights.length === 5 ? barHeights : [0, 0, 0, 0, 0]).map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-400"
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 uppercase font-bold px-2">
                        {data?.runsPerDay.slice(-5).map((d, i) => (
                            <span key={i}>{new Date(d.day).toLocaleDateString('es', { weekday: 'short' })}</span>
                        )) ?? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-white uppercase">Tasa de Éxito</h3>
                    </div>
                    <div className="flex items-center justify-center h-48">
                        <div className="w-32 h-32 rounded-full border-8 border-purple-500/20 border-t-purple-500 border-r-purple-500/60 flex items-center justify-center">
                            <span className="text-xl font-black text-white">{automationRate}%</span>
                        </div>
                    </div>
                    <p className="text-center text-[11px] text-white/40">
                        {automationRate}% de tus misiones fueron completadas exitosamente.
                    </p>
                </div>
            </div>
        </div>
    );
}
