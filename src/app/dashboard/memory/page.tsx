'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Cpu, Database, Network, Zap, Shield, Sparkles, Terminal, Activity, RefreshCw } from 'lucide-react';
import NeuralNetworkVisualization from '@/components/memory/NeuralNetworkVisualization';

interface Learning {
    id: string;
    agent_name: string;
    learning_type: string;
    summary: string;
    created_at: string;
    keywords: string[];
    complexity: string;
}

interface MemoryStats {
    totalLearnings: number;
    agentsContributing: number;
    recentLearnings: number;
    semanticConnections: number;
    computeSavings: number;
    autoMitigations: number;
}

export default function CollectiveMemoryPage() {
    const [viewMode, setViewMode] = useState<'network' | 'list'>('list');
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLearnings = useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            params.set('limit', '50');

            const res = await fetch(`/api/memory/learnings?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const mapped = (data.learnings || []).map((item: any) => ({
                    id: item.id,
                    agent_name: item.agent_name || 'Agente Desconocido',
                    learning_type: item.learning_type,
                    summary: item.summary,
                    created_at: item.created_at,
                    keywords: item.keywords || [],
                    complexity: item.complexity || mapComplexity(item.learning_type),
                }));
                setLearnings(mapped);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching learnings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLearnings();
    }, [fetchLearnings]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLearnings(searchTerm || undefined);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchLearnings]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Toggle de vista */}
            <div className="flex items-center gap-2 p-4 border-b border-white/5">
                <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
                >
                    Vista Lista
                </button>
                <button
                    onClick={() => setViewMode('network')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'network' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-white/5 text-white/40 border border-white/10'}`}
                >
                    Vista Red Neural
                </button>
            </div>

            {/* Vista de Red Neuronal */}
            {viewMode === 'network' && <NeuralNetworkVisualization />}

            {/* Vista de Lista */}
            {viewMode === 'list' && (
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
                    <button
                        onClick={() => fetchLearnings(searchTerm || undefined)}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                        title="Refrescar datos"
                    >
                        <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Database} label="Nodos de Memoria" value={stats?.totalLearnings?.toLocaleString() ?? '0'} color="text-blue-500" />
                <StatCard icon={Network} label="Conexiones Semánticas" value={stats?.semanticConnections?.toLocaleString() ?? '0'} color="text-purple-500" />
                <StatCard icon={Zap} label="Ahorro de Cómputo" value={`${stats?.computeSavings ?? 0}%`} color="text-yellow-500" />
                <StatCard icon={Shield} label="Mitigaciones Auto" value={stats?.autoMitigations?.toString() ?? '0'} color="text-green-500" />
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
                ) : learnings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Brain className="w-16 h-16 text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-white/40">Sin aprendizajes registrados</h3>
                        <p className="text-sm text-white/20 mt-2 max-w-md">
                            Los agentes almacenarán aquí sus descubrimientos y patrones a medida que ejecuten misiones.
                        </p>
                    </div>
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
                                            <span suppressHydrationWarning className="text-[10px] font-mono text-white/20">{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-white/70 leading-relaxed font-mono italic">
                                            &ldquo;{item.summary}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-2 pt-2 flex-wrap">
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
            )}
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

function mapComplexity(learningType: string): string {
    const map: Record<string, string> = {
        'VULNERABILITY': 'Critical',
        'MARKET_INSIGHT': 'High',
        'OPTIMIZATION': 'Medium',
        'CONVERSION_PATTERN': 'Medium',
        'ENGAGEMENT_INSIGHT': 'Medium',
    };
    return map[learningType] || 'Medium';
}
