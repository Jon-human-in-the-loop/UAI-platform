'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Cpu, Database, Network, Zap, Shield, Sparkles, Terminal, Activity } from 'lucide-react';

interface Learning {
    id: string;
    agent_name: string;
    learning_type: string;
    summary: string;
    created_at: string;
    keywords: string[];
    complexity: string;
}

export default function CollectiveMemoryPage() {
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Simulación de carga de datos (en producción esto vendría de /api/memory/learnings)
        setTimeout(() => {
            setLearnings([
                {
                    id: '1',
                    agent_name: 'Lead de Estrategia',
                    learning_type: 'MARKET_INSIGHT',
                    summary: 'Detectada saturación en canales de LinkedIn para SaaS B2B. Los hooks basados en "miedo a la obsolescencia técnica" tienen un 40% más de CTR.',
                    created_at: new Date().toISOString(),
                    keywords: ['linkedin', 'saas', 'b2b', 'hooks'],
                    complexity: 'High'
                },
                {
                    id: '2',
                    agent_name: 'Auditor de Seguridad',
                    learning_type: 'VULNERABILITY',
                    summary: 'Nueva vulnerabilidad zero-day en dependencias de Next.js detectada. Patrón de mitigación aplicado: actualización de middleware y headers de seguridad.',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    keywords: ['nextjs', 'security', 'vulnerability'],
                    complexity: 'Critical'
                },
                {
                    id: '3',
                    agent_name: 'UAI Nucleus',
                    learning_type: 'OPTIMIZATION',
                    summary: 'La orquestación paralela de agentes reduce la latencia en un 25% para misiones de investigación profunda.',
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    keywords: ['latency', 'orchestration', 'performance'],
                    complexity: 'Medium'
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Brain className="w-10 h-10 text-accent" /> Memoria <span className="text-accent/50">Colectiva</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium mt-2 max-w-2xl">
                        Visualiza los aprendizajes compartidos por el enjambre de agentes. 
                        Cada misión alimenta esta base de conocimientos semántica para optimizar futuras ejecuciones.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-1 rounded-2xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl border border-accent/20">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-xs font-black text-accent uppercase tracking-widest">Swarm Intel</span>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Database} label="Nodos de Memoria" value="1,248" color="text-blue-500" />
                <StatCard icon={Network} label="Conexiones Semánticas" value="5,892" color="text-purple-500" />
                <StatCard icon={Zap} label="Ahorro de Cómputo" value="18%" color="text-yellow-500" />
                <StatCard icon={Shield} label="Mitigaciones Auto" value="42" color="text-green-500" />
            </div>

            {/* Search & Filter */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input 
                    type="text"
                    placeholder="Buscar en la red neuronal de aprendizajes..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-white/20 focus:border-accent/50 focus:ring-0 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Learning Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />)
                ) : (
                    <AnimatePresence>
                        {learnings.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-accent/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:bg-accent/10 group-hover:border-accent/50 transition-all">
                                        <Cpu className="w-6 h-6 text-accent" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-white uppercase tracking-tighter">{item.agent_name}</span>
                                                <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded text-white/30 uppercase tracking-widest">{item.learning_type}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/20">{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-white/70 leading-relaxed font-mono italic">
                                            "{item.summary}"
                                        </p>
                                        <div className="flex items-center gap-2 pt-2">
                                            {item.keywords.map(kw => (
                                                <span key={kw} className="text-[9px] font-bold text-accent/60 bg-accent/5 px-2 py-1 rounded-md border border-accent/10 uppercase">
                                                    #{kw}
                                                </span>
                                            ))}
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-white/20 uppercase">Complejidad:</span>
                                                <span className={`text-[9px] font-bold uppercase ${
                                                    item.complexity === 'Critical' ? 'text-red-500' : 
                                                    item.complexity === 'High' ? 'text-orange-500' : 'text-blue-500'
                                                }`}>
                                                    {item.complexity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-all">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-xl font-black text-white mt-1 leading-none">{value}</p>
            </div>
        </div>
    );
}
