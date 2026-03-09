'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Zap, Activity, Terminal, BarChart3, Copy, LayoutDashboard, Rocket, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import FlowEditor from '@/components/flow-editor/FlowEditor';
import MissionControlDashboard from '@/components/mission-control/MissionControlDashboard';


interface RunSummaryResponse {
    created_at: string;
    updated_at: string;
    total_tokens: number;
    total_cost_credits: number;
}

// ─── Stats Panel ────────────────────────────────────────────────────────────

function StatsPanel({ metrics, logs }: {
    metrics: { latency: number; tokens: number; load: number; cost: number };
    logs: { id: number; type: string; text: string; time: string }[];
}) {
    const [agentMetrics, setAgentMetrics] = React.useState<any>(null);
    const [agents, setAgents] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetch('/api/agent/metrics').then(r => r.ok ? r.json() : null).then(d => { if (d) setAgentMetrics(d.totals); });
        fetch('/api/agents').then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setAgents(d); });
    }, []);

    const totals = agentMetrics || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Estadísticas del Sistema</span>
            </div>

            {/* Métricas globales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Runs Totales', value: totals.total_runs ?? '—', color: 'text-blue-400', icon: '▶' },
                    { label: 'Tokens Usados', value: totals.total_tokens ? Number(totals.total_tokens).toLocaleString() : '—', color: 'text-green-400', icon: '◈' },
                    { label: 'Costo Total', value: totals.total_cost ? `$${Number(totals.total_cost).toFixed(4)}` : '—', color: 'text-yellow-400', icon: '◆' },
                    { label: 'Latencia Prom.', value: totals.avg_latency_ms ? `${Math.round(totals.avg_latency_ms)}ms` : '—', color: 'text-purple-400', icon: '◉' },
                ].map(m => (
                    <div key={m.label} className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <div className="text-[9px] text-white/30 font-mono mb-2">{m.icon} {m.label.toUpperCase()}</div>
                        <div className={`text-xl font-black font-mono ${m.color}`}>{m.value}</div>
                    </div>
                ))}
            </div>

            {/* Agentes */}
            {agents.length > 0 && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Agentes Registrados</div>
                    <div className="space-y-2">
                        {agents.map(a => (
                            <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{a.avatar || '🤖'}</span>
                                    <div>
                                        <div className="text-xs font-bold text-white">{a.name}</div>
                                        <div className="text-[10px] text-white/30">{a.role} · {a.model}</div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-green-400 font-mono">● Online</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Métricas de la última ejecución */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Última Ejecución</div>
                <div className="space-y-3">
                    {[
                        { label: 'Latencia', value: metrics.latency, max: 5000, unit: 'ms', color: 'bg-blue-500' },
                        { label: 'Tokens', value: metrics.tokens, max: 1000, unit: '', color: 'bg-green-500' },
                        { label: 'Costo', value: metrics.cost, max: 50, unit: ' CR', color: 'bg-yellow-500' },
                        { label: 'Carga Neural', value: metrics.load, max: 100, unit: '%', color: 'bg-red-500' },
                    ].map(m => (
                        <div key={m.label}>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-white/40">{m.label}</span>
                                <span className="text-white font-mono">{m.value}{m.unit}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full ${m.color} transition-all`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Log reciente */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Log de Actividad</div>
                <div className="space-y-1 font-mono text-[10px] max-h-40 overflow-y-auto custom-scrollbar">
                    {logs.slice().reverse().slice(0, 20).map(log => (
                        <div key={log.id} className="flex gap-2">
                            <span className="text-white/20 shrink-0">[{log.time}]</span>
                            <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-white/50'}>{log.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { awardXp, activeAgent } = useDashboard();
    const [mainView, setMainView] = useState<'dashboard' | 'execution' | 'habitat'>('habitat');
    const [executionSubView, setExecutionSubView] = useState<'graph' | 'output'>('output');
    const [isRunning, setIsRunning] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
    const [userInput, setUserInput] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const missionStartRef = useRef<number | null>(null);
    
    const [logs, setLogs] = useState<{ id: number; type: string; text: string; time: string }[]>([
        { id: 1, type: 'info', text: 'Sincronización de Centro de Comando completada.', time: new Date().toLocaleTimeString() },
    ]);

    const [metrics, setMetrics] = useState({
        latency: 0,
        tokens: 0,
        load: 0,
        cost: 0
    });

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);


    const syncMetricsFromRunSummary = async (threadId?: string) => {
        if (!threadId) return;

        try {
            const res = await fetch(`/api/agent/run/${threadId}/summary`, { cache: 'no-store' });
            if (!res.ok) return;

            const summary = (await res.json()) as RunSummaryResponse;
            const createdAt = new Date(summary.created_at).getTime();
            const updatedAt = new Date(summary.updated_at).getTime();
            const latency = Number.isFinite(createdAt) && Number.isFinite(updatedAt)
                ? Math.max(0, Math.round((updatedAt - createdAt) / 1000))
                : 0;

            setMetrics(prev => ({
                ...prev,
                latency,
                tokens: Number(summary.total_tokens || 0),
                cost: Number(summary.total_cost_credits || 0),
                load: 0,
            }));
        } catch {
            // noop: mantenemos métricas en streaming si falla la lectura de summary.
        }
    };

    const startAgent = async () => {
        if (isRunning || !userInput.trim()) return;
        setIsRunning(true);
        setResult(null);
        setMainView('execution');
        setExecutionSubView('graph');
        const instruction = userInput.trim();
        setUserInput('');
        
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { id: Date.now(), type: 'process', text: `Iniciando Misión: "${instruction.substring(0, 50)}..."`, time: timestamp }]);

        missionStartRef.current = Date.now();
        setMetrics({ latency: 0, tokens: 0, load: 5, cost: 0 });

        try {
            const response = await fetch('/api/agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: instruction,
                    threadId: currentThreadId,
                    agent: activeAgent
                }),
            });

            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let missionThreadId = currentThreadId;

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const event = JSON.parse(line);
                            if (event.type === 'session_info') {
                                missionThreadId = event.threadId;
                                setCurrentThreadId(event.threadId);
                            } else if (event.type === 'node_update') {
                                const state = event.chunk;
                                // Live node tracking: map LangGraph node name to FlowEditor node id
                                const nodeMap: Record<string, string> = {
                                    analizador: '1', challenger: '1', ejecutor: '2',
                                    validador: '3', reflexion: '4', healing: '3'
                                };
                                if (state?.next_node && nodeMap[state.next_node]) {
                                    setActiveNodeId(nodeMap[state.next_node]);
                                }
                                if (state?.messages) {
                                    const lastMsg = state.messages[state.messages.length - 1];
                                    const text = typeof lastMsg === 'string' ? lastMsg : lastMsg.content;
                                    if (text && text.length > 5) {
                                        setLogs(prev => [...prev, { id: Date.now(), type: 'process', text: text.substring(0, 80) + (text.length > 80 ? '...' : ''), time: new Date().toLocaleTimeString() }]);
                                        if (text.length > 150) setResult(text);
                                        
                                        setMetrics(prev => ({
                                            ...prev,
                                            latency: missionStartRef.current ? Math.max(0, Math.round((Date.now() - missionStartRef.current) / 1000)) : prev.latency,
                                            load: Math.min(prev.load + 15, 95)
                                        }));
                                    }
                                }
                            } else if (event.type === 'complete') {
                                setLogs(prev => [...prev, { id: Date.now(), type: 'success', text: 'Misión completada con éxito.', time: new Date().toLocaleTimeString() }]);
                                setExecutionSubView('output');
                                setMetrics(prev => ({
                                    ...prev,
                                    load: 0,
                                    tokens: event.metrics?.tokens ?? prev.tokens,
                                    cost: event.metrics?.costCredits ?? prev.cost
                                }));
                                await syncMetricsFromRunSummary(missionThreadId);
                                missionStartRef.current = null;
                            }
                        } catch {
                            // Ignoramos líneas de stream no parseables.
                        }
                    }
                }
            }
        } catch (error: any) {
            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString() }]);
        } finally {
            missionStartRef.current = null;
            setIsRunning(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white p-4 gap-4 overflow-hidden">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-white/20 tracking-widest">Agente Activo:</span>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] text-white/60">
                            <span className="text-sm">{activeAgent?.avatar || '🤖'}</span>
                            <span className="font-bold">{activeAgent?.name || 'Lead de Estrategia Digital'}</span>
                            <span className="text-accent/50 font-mono">Lvl {activeAgent?.level || 7}</span>
                        </div>
                    </div>
                    
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        <button 
                            onClick={() => setMainView('habitat')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${mainView === 'habitat' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'text-white/30 hover:text-white'}`}
                        >
                            <Home className="w-3 h-3" /> Habitat
                        </button>
                        <button 
                            onClick={() => setMainView('dashboard')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${mainView === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-3 h-3" /> Stats
                        </button>
                        <button 
                            onClick={() => setMainView('execution')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${mainView === 'execution' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'text-white/30 hover:text-white'}`}
                        >
                            <Rocket className="w-3 h-3" /> Ejecución
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAgent(); } }}
                        placeholder="Escribe tu misión..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pr-14 text-sm text-white/80 placeholder-white/20 focus:border-accent/50 focus:ring-0 resize-none min-h-[80px] transition-all"
                    />
                    <button
                        onClick={startAgent}
                        disabled={isRunning || !userInput.trim()}
                        className="absolute bottom-4 right-4 p-3 rounded-lg bg-white/5 hover:bg-accent hover:text-white transition-all group-hover:border-accent/30 border border-transparent"
                    >
                        {isRunning ? <Activity className="w-5 h-5 animate-spin text-accent" /> : <Send className="w-5 h-5 text-white/40 group-hover:text-white" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {mainView === 'habitat' ? (
                        <motion.div 
                            key="habitat-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full overflow-hidden"
                        >
                            <MissionControlDashboard />
                        </motion.div>
                    ) : mainView === 'dashboard' ? (
                        <motion.div 
                            key="dashboard-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-full overflow-y-auto custom-scrollbar p-4"
                        >
                            <StatsPanel metrics={metrics} logs={logs} />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="execution-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full flex gap-4 overflow-hidden"
                        >
                            <div className="flex-[2] flex flex-col bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden relative">
                                <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        <Zap className="w-3 h-3 text-accent" />
                                        Resultado de Misión
                                    </div>
                                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                        <button 
                                            onClick={() => setExecutionSubView('graph')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${executionSubView === 'graph' ? 'bg-accent text-white' : 'text-white/30 hover:text-white'}`}
                                        >
                                            Grafo
                                        </button>
                                        <button 
                                            onClick={() => setExecutionSubView('output')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${executionSubView === 'output' ? 'bg-accent text-white' : 'text-white/30 hover:text-white'}`}
                                        >
                                            Output
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    <AnimatePresence mode="wait">
                                        {executionSubView === 'graph' ? (
                                            <motion.div key="graph-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                                <FlowEditor activeNodeId={activeNodeId} />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="output-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                                {result ? (
                                                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 relative group">
                                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { navigator.clipboard.writeText(result); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                                <Copy className="w-4 h-4 text-white/40" />
                                                            </button>
                                                        </div>
                                                        <div className="prose prose-invert prose-sm max-w-none">
                                                            {result}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4 py-20">
                                                        <Terminal className="w-12 h-12 opacity-20" />
                                                        <p className="text-xs font-bold uppercase tracking-widest">Esperando ejecución...</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col h-1/2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">
                                        <Activity className="w-3 h-3 text-red-500" />
                                        Métricas de Cómputo
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-white/40">Latencia</span>
                                                <span className="text-white font-mono">{metrics.latency}ms</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${Math.min(metrics.latency / 5, 100)}%` }} className="h-full bg-blue-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-white/40">Tokens</span>
                                                <span className="text-white font-mono">{metrics.tokens}</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${Math.min(metrics.tokens / 10, 100)}%` }} className="h-full bg-green-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-white/40">Costo</span>
                                                <span className="text-white font-mono">{metrics.cost} CR</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${Math.min(metrics.cost * 2, 100)}%` }} className="h-full bg-yellow-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-white/40">Carga Neural</span>
                                                <span className="text-white font-mono">{metrics.load}%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: `${metrics.load}%` }} className="h-full bg-red-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">
                                        <Terminal className="w-3 h-3 text-accent" />
                                        Logs de Orquestación
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[10px]">
                                        {logs.map(log => (
                                            <div key={log.id} className="flex gap-2">
                                                <span className="text-white/20">[{log.time}]</span>
                                                <span className={log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : 'text-white/60'}>
                                                    {log.text}
                                                </span>
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
