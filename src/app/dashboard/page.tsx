'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Zap, Activity, Terminal, BarChart3, Copy, LayoutDashboard, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import FlowEditor from '@/components/flow-editor/FlowEditor';
import MissionControlDashboard from '@/components/mission-control/MissionControlDashboard';

export default function Dashboard() {
    const { awardXp, activeAgent } = useDashboard();
    const [mainView, setMainView] = useState<'dashboard' | 'execution'>('dashboard');
    const [executionSubView, setExecutionSubView] = useState<'graph' | 'output'>('output');
    const [isRunning, setIsRunning] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
    const [userInput, setUserInput] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    
    const [logs, setLogs] = useState<{ id: number; type: string; text: string; time: string }[]>([
        { id: 1, type: 'info', text: 'Sincronización de Centro de Comando completada.', time: new Date().toLocaleTimeString() },
    ]);

    const [metrics, setMetrics] = useState({
        latency: 0,
        tokens: 0,
        load: 0
    });

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

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

        setMetrics({ latency: 120, tokens: 0, load: 5 });

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
                                setCurrentThreadId(event.threadId);
                            } else if (event.type === 'node_update') {
                                const state = event.chunk;
                                if (state?.messages) {
                                    const lastMsg = state.messages[state.messages.length - 1];
                                    const text = typeof lastMsg === 'string' ? lastMsg : lastMsg.content;
                                    if (text && text.length > 5) {
                                        setLogs(prev => [...prev, { id: Date.now(), type: 'process', text: text.substring(0, 80) + (text.length > 80 ? '...' : ''), time: new Date().toLocaleTimeString() }]);
                                        if (text.length > 150) setResult(text);
                                        
                                        setMetrics(prev => ({
                                            latency: Math.floor(Math.random() * 100) + 150,
                                            tokens: prev.tokens + Math.floor(text.length / 4),
                                            load: Math.min(prev.load + 15, 95)
                                        }));
                                    }
                                }
                            } else if (event.type === 'complete') {
                                setLogs(prev => [...prev, { id: Date.now(), type: 'success', text: 'Misión completada con éxito.', time: new Date().toLocaleTimeString() }]);
                                setExecutionSubView('output');
                                setMetrics(prev => ({ ...prev, load: 0 }));
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (error: any) {
            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `Error: ${error.message}`, time: new Date().toLocaleTimeString() }]);
        } finally {
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
                            onClick={() => setMainView('dashboard')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${mainView === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-3 h-3" /> Mission Control
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
                    {mainView === 'dashboard' ? (
                        <motion.div 
                            key="dashboard-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-full overflow-y-auto custom-scrollbar"
                        >
                            <MissionControlDashboard />
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
                                                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 relative group">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Output Generado por UAI</span>
                                                    </div>
                                                    <div className="text-sm text-white/70 leading-relaxed font-mono whitespace-pre-wrap">
                                                        {result || "Esperando ejecución..."}
                                                    </div>
                                                    <button className="absolute bottom-4 right-4 flex items-center gap-2 text-[9px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-all">
                                                        <Copy className="w-3 h-3" /> [Copiar Texto]
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                            <Terminal className="w-3 h-3" />
                                            System Logs
                                        </div>
                                        <span className="text-[8px] font-mono text-white/20">v2.4.0-stable</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px] custom-scrollbar">
                                        {logs.map((log) => (
                                            <div key={log.id} className="flex gap-3 group">
                                                <span className="text-white/20 shrink-0">[{log.time}]</span>
                                                <span className={`${log.type === 'success' ? 'text-green-500' : log.type === 'error' ? 'text-red-500' : 'text-white/50'} leading-relaxed`}>
                                                    {log.type === 'success' && '✅ '}
                                                    {log.text}
                                                </span>
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                                        <BarChart3 className="w-3 h-3" />
                                        Métricas de Sesión
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <MetricBar label="Latencia Neural" value={metrics.latency} max={500} unit="ms" color="bg-green-500" />
                                        <MetricBar label="Tokens Procesados" value={metrics.tokens} max={5000} unit=" t" color="bg-blue-500" />
                                        <MetricBar label="Carga Cognitiva" value={metrics.load} max={100} unit="%" color="bg-red-500" />
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

function MetricBar({ label, value, max, unit, color }: any) {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                <span className="text-white/40">{label}</span>
                <span className="text-white/80">{value}{unit}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                />
            </div>
        </div>
    );
}
