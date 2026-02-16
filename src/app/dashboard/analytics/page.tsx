'use client';

import React from 'react';
import ROIDashboard from '@/components/dashboard/ROIDashboard';
import { BarChart3, PieChart, Activity } from 'lucide-react';

export default function AnalyticsPage() {
    // Datos simulados para la Fase 3
    const metrics = {
        hoursSaved: 124,
        costSaved: 3100,
        cognitiveLoadReduction: 65,
        efficiencyGain: 42
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analítica de ROI</h2>
                    <p className="text-sm text-white/40">Impacto real de tu flota de agentes en tu flujo de trabajo.</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-white/80 uppercase">Datos en tiempo real</span>
                </div>
            </div>

            <ROIDashboard metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold text-white uppercase">Ahorro por Categoría</h3>
                    </div>
                    <div className="h-48 flex items-end gap-4 px-4">
                        {[60, 85, 45, 95, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-400" 
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 uppercase font-bold px-2">
                        <span>Dev</span>
                        <span>SEO</span>
                        <span>Copy</span>
                        <span>Research</span>
                        <span>Ops</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-white uppercase">Distribución de Carga</h3>
                    </div>
                    <div className="flex items-center justify-center h-48">
                        <div className="w-32 h-32 rounded-full border-8 border-purple-500/20 border-t-purple-500 border-r-purple-500/60 flex items-center justify-center">
                            <span className="text-xl font-black text-white">72%</span>
                        </div>
                    </div>
                    <p className="text-center text-[11px] text-white/40">
                        El 72% de tus tareas repetitivas están siendo manejadas por agentes.
                    </p>
                </div>
            </div>
        </div>
    );
}
