'use client';

import React from 'react';
import HealingStats from '@/components/healing/HealingStats';

export default function HealingPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Auto-Sanación Neural</h1>
                <p className="text-white/60">Monitorea la resiliencia de tus agentes y las estrategias de recuperación aplicadas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HealingStats />
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase mb-4">Estrategias Activas</h3>
                    <ul className="space-y-3">
                        {[
                            { name: 'Rate Limit Recovery', desc: 'Cambio automático de modelo ante cuotas agotadas.' },
                            { name: 'JSON Repair', desc: 'Corrección de sintaxis en tiempo real para outputs de LLM.' },
                            { name: 'Context Compression', desc: 'Resumen inteligente cuando se excede el límite de tokens.' }
                        ].map(s => (
                            <li key={s.name} className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-white">{s.name}</p>
                                    <p className="text-[10px] text-white/40">{s.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
