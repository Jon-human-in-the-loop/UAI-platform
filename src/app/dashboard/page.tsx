'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal, Play, Send, Activity, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import FlowEditor from '@/components/flow-editor/FlowEditor';

export default function Dashboard() {
    const { awardXp, activeAgent } = useDashboard();
    const [isRunning, setIsRunning] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
    const [userInput, setUserInput] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState([
        { id: 1, type: 'info', text: '💡 Escribe una instrucción y lanza tu primera misión del día.' },
    ]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (logs.length > 1) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [logs]);

    const startAgent = async () => {
        if (isRunning || !userInput.trim()) return;
        setIsRunning(true);
        const instruction = userInput.trim();
        setUserInput('');
        setLogs([{ id: Date.now(), type: 'info', text: `🎯 Misión: "${instruction.substring(0, 80)}${instruction.length > 80 ? '...' : ''}"` }]);

        let nodesCompleted = 0;
        let autoHealed = false;
        let success = true;

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
            if (!response.body) throw new Error('Sin cuerpo de respuesta');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

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
                            nodesCompleted++;
                            const state = event.chunk;
                            const nextNode = state.next_node;
                            const isFin = nextNode === 'FIN' || !nextNode;
                            const nodeName = isFin ? 'reflexion' : nextNode;
                            if (state.errors?.length > 0) autoHealed = true;

                            const nodeMap: Record<string, string> = { 'analizador': '1', 'ejecutor': '2', 'validador': '3', 'reflexion': '4' };
                            if (nodeMap[nodeName]) setActiveNodeId(nodeMap[nodeName]);

                            if (state.messages?.length > 0) {
                                const lastMsg = state.messages[state.messages.length - 1];
                                const text = typeof lastMsg === 'string' ? lastMsg : lastMsg.content;
                                setLogs(prev => {
                                    if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
                                    return [...prev, { id: Date.now() + Math.random(), type: 'process', text }];
                                });
                            }
                        } else if (event.type === 'complete') {
                            setLogs(prev => [...prev, { id: Date.now(), type: 'success', text: '✅ Misión completada con éxito.' }]);
                            await awardXp(true, autoHealed, nodesCompleted);
                        } else if (event.type === 'error') {
                            success = false;
                            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `❌ Error: ${event.message}` }]);
                        }
                    } catch (e) { console.error('Parse error:', e); }
                }
            }
        } catch (error: any) {
            success = false;
            setLogs(prev => [...prev, { id: Date.now(), type: 'error', text: `💀 Fallo crítico: ${error.message}` }]);
        } finally {
            setIsRunning(false);
            setActiveNodeId(undefined);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            {/* Input Overlay */}
            <div className="mb-6 relative z-30 space-y-3">
                {/* Active Agent Badge */}
                <div className="flex items-center gap-2 px-2">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Agente Activo:</span>
                    {activeAgent ? (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-white/80">
                            <span className="text-lg">{activeAgent.avatar || '🤖'}</span>
                            <span className="font-bold">{activeAgent.name}</span>
                            <span className="bg-white/10 px-1.5 rounded text-[10px] text-white/50">Lvl {activeAgent.level}</span>
                        </div>
                    ) : (
                        <div className="text-xs text-white/30 italic">Ningún agente seleccionado (Usando Default)</div>
                    )}
                </div>

                <div className="glass-card p-1 pr-2 flex items-center gap-2 shadow-2xl focus-within:border-red-500/50 transition-colors">
                    <div className="p-3 bg-white/5 rounded-xl">
                        {activeAgent?.avatar ? (
                            <span className="text-xl grayscale opacity-80">{activeAgent.avatar}</span>
                        ) : (
                            <Bot className={`w-6 h-6 ${isRunning ? 'text-red-500 animate-pulse' : 'text-white/40'}`} />
                        )}
                    </div>
                    <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                startAgent();
                            }
                        }}
                        placeholder="Describe tu misión (e.g., 'Investiga las últimas tendencias en IA y crea un resumen')..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/30 resize-none h-12 py-3"
                        disabled={isRunning}
                    />
                    <button
                        onClick={startAgent}
                        disabled={isRunning || !userInput.trim()}
                        className="p-3 bg-white text-black rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        {isRunning ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Main Workspace Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
                {/* Left: Visualization */}
                <div className="lg:col-span-2 glass-card relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/40">
                            <Terminal className="w-3 h-3" />
                            <span>Visualización de Proceso</span>
                        </div>
                        <div className="flex gap-2">
                            {/* Optional toolbar items */}
                        </div>
                    </div>

                    <div className="flex-1 relative bg-grid-pattern overflow-hidden">
                        <div className="absolute inset-0 bg-black/80" />
                        {/* Here we render the flowchart */}
                        <div className="absolute inset-0 overflow-auto custom-scrollbar p-8 flex items-center justify-center">
                            <div className="scale-90 origin-center w-full h-full">
                                <FlowEditor activeNodeId={activeNodeId} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Logs & Metrics */}
                <div className="glass-card flex flex-col overflow-hidden border-l border-white/5 bg-[#050505]/90">
                    {/* Cabecera Logs */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">System Logs</span>
                        </div>
                        <span className="text-[9px] font-mono text-white/20">v2.4.0-stable</span>
                    </div>

                    {/* Log Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px] custom-scrollbar bg-black/20">
                        <AnimatePresence>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className={`flex gap-3 p-2 rounded-lg ${log.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                        log.type === 'process' ? 'text-blue-300' :
                                            log.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'text-white/60'
                                        }`}
                                >
                                    <span className="opacity-30 shrink-0 select-none">[{new Date(log.id).toLocaleTimeString([], { hour12: false })}]</span>
                                    <span className="leading-relaxed break-words">{log.text}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={logsEndRef} />
                    </div>

                    {/* Metrics Footer */}
                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Métricas de Sesión</span>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Latencia Neural', val: '240ms', progress: 85, color: 'bg-green-500' },
                                { label: 'Tokens Procesados', val: '1.2k', progress: 45, color: 'bg-blue-500' },
                                { label: 'Carga Cognitiva', val: '12%', progress: 12, color: 'bg-red-500' }
                            ].map(metric => (
                                <div key={metric.label} className="space-y-1">
                                    <div className="flex justify-between text-[9px]">
                                        <span className="text-white/40">{metric.label}</span>
                                        <span className="text-white font-mono">{metric.val}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${metric.progress}%` }}
                                            className={`h-full ${metric.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
