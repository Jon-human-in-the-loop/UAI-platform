'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal, Play, Send, Activity, Search, X, Maximize2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import FlowEditor from '@/components/flow-editor/FlowEditor';

export default function Dashboard() {
    const { awardXp, activeAgent } = useDashboard();
    const [viewMode, setViewMode] = useState<'graph' | 'output'>('graph'); // Toggle visualización
    const [isRunning, setIsRunning] = useState(false);
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
    const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();
    const [userInput, setUserInput] = useState('');
    const [result, setResult] = useState<string | null>(null); // Nuevo estado para el resultado
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<{ id: number; type: string; text: string }[]>([
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
        setResult(null);
        setViewMode('graph'); // Resetear a grafo al inicio
        const instruction = userInput.trim();
        setUserInput('');
        setLogs([{ id: Date.now(), type: 'info', text: `🎯 Misión: "${instruction.substring(0, 80)}${instruction.length > 80 ? '...' : ''}"` }]);

        let nodesCompleted = 0;
        let autoHealed = false;
        let success = true;
        let accumulatedText = ""; // Capturar todo el texto por si acaso

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
                        console.log("Evento recibido:", event.type, event);

                        if (event.type === 'session_info') {
                            setCurrentThreadId(event.threadId);
                        } else if (event.type === 'node_update') {
                            nodesCompleted++;
                            // Extraer el estado real (LangGraph puede anidar 'chunk' o enviarlo directo)
                            const state = event.chunk;
                            if (!state) continue;

                            const nextNode = state.next_node;
                            const isFin = nextNode === 'FIN' || !nextNode;
                            const nodeName = isFin ? 'reflexion' : nextNode;
                            if (state.errors?.length > 0) autoHealed = true;

                            const nodeMap: Record<string, string> = { 'analizador': '1', 'ejecutor': '2', 'validador': '3', 'reflexion': '4' };
                            if (nodeMap[nodeName]) setActiveNodeId(nodeMap[nodeName]);

                            if (state.messages && Array.isArray(state.messages) && state.messages.length > 0) {
                                let latestMeaningfulText = "";

                                state.messages.forEach((msg: any) => {
                                    const text = typeof msg === 'string' ? msg : (msg?.content || "");
                                    const cleanText = String(text).trim();

                                    if (cleanText.length > 10) {
                                        latestMeaningfulText = cleanText;

                                        // Prioridad Máxima: Bloques de informe
                                        if (cleanText.includes('### 🤖') || cleanText.includes('RESULTADO:') || cleanText.includes('PROPUESTA TÉCNICA')) {
                                            setResult(prev => (cleanText.length >= (prev?.length || 0)) ? cleanText : prev);
                                        }
                                        // Backup: Si es un bloque largo (más de 200 chars), es probablemente un resultado
                                        else if (cleanText.length > 200) {
                                            setResult(prev => (cleanText.length >= (prev?.length || 0)) ? cleanText : prev);
                                        }
                                    }
                                });

                                if (latestMeaningfulText) {
                                    accumulatedText = latestMeaningfulText;
                                }

                                // Logs de sistema (siempre mostramos lo último que dijo el agente)
                                const last = state.messages[state.messages.length - 1];
                                let lastText = typeof last === 'string' ? last : (last?.content || "");
                                if (lastText && String(lastText).trim()) {
                                    setLogs(prev => {
                                        const t = String(lastText);
                                        if (prev.length > 0 && prev[prev.length - 1].text === t) return prev;
                                        return [...prev, { id: Date.now() + Math.random(), type: 'process', text: t }];
                                    });
                                }
                            }
                        } else if (event.type === 'complete') {
                            setLogs(prev => [...prev, { id: Date.now() + Math.random(), type: 'success', text: '✅ Misión completada con éxito.' }]);
                            await awardXp(true, autoHealed, nodesCompleted);

                            setResult(prev => {
                                const resolved = prev || accumulatedText;
                                if (!resolved || resolved.length < 20) {
                                    return "Misión finalizada. Por favor revisa los 'System Logs' para ver los detalles de la ejecución, ya que el agente no generó un bloque de resumen dedicado.";
                                }
                                return resolved;
                            });
                            setViewMode('output');
                        } else if (event.type === 'error') {
                            setLogs(prev => [...prev, { id: Date.now() + Math.random(), type: 'error', text: `❌ Error: ${event.message}` }]);
                        }
                    } catch (e) {
                        console.error('Line processing error:', e);
                    }
                }
            }
        } catch (error: any) {
            console.error("Global crash:", error);
            setLogs(prev => [...prev, { id: Date.now() + Math.random(), type: 'error', text: `💀 Fallo de sistema: ${error.message}` }]);
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
                {/* Left: Visualization or Result */}
                <div className="lg:col-span-2 glass-card relative overflow-hidden flex flex-col h-full border border-white/10 shadow-2xl bg-[#0A0A0A]">
                    {/* Header Toolbar */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 z-20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/60">
                            {viewMode === 'output' ? <Maximize2 className="w-4 h-4 text-green-400" /> : <Terminal className="w-4 h-4 text-purple-400" />}
                            <span>{viewMode === 'output' ? '✨ Resultado de Misión' : '📡 Centro de Comando - Procesos'}</span>
                        </div>

                        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                            <button
                                onClick={() => setViewMode('graph')}
                                className={`px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'graph' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/70'}`}
                            >
                                GRAFO
                            </button>
                            <button
                                onClick={() => setViewMode('output')}
                                className={`flex items-center gap-1 px-3 py-1 text-[10px] rounded-md transition-all ${viewMode === 'output' ? 'bg-green-500/20 text-green-400 font-bold border border-green-500/30' : 'text-white/40 hover:text-white/70'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${result ? 'bg-green-500' : 'bg-gray-500'}`} />
                                OUTPUT
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative bg-grid-pattern overflow-hidden">
                        {/* Background Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-[#050505]/95 to-black/90 z-0" />

                        {viewMode === 'output' ? (
                            // --- RESULT VIEW (ENHANCED) ---
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute inset-0 overflow-auto custom-scrollbar z-10 p-6 md:p-10"
                            >
                                {result ? (
                                    <div className="max-w-4xl mx-auto">
                                        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                                            {/* Result Header */}
                                            <div className="bg-gradient-to-r from-green-500/10 to-transparent p-4 border-b border-white/5 flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                <span className="text-sm font-mono text-green-400/80">OUTPUT GENERADO POR UAI</span>
                                            </div>

                                            {/* Result Body */}
                                            <div className="p-8 prose prose-invert prose-lg max-w-none 
                                                prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl 
                                                prose-p:text-gray-300 prose-p:leading-relaxed 
                                                prose-strong:text-white prose-strong:font-bold
                                                prose-ul:list-disc prose-ul:pl-4
                                                prose-code:bg-white/10 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-yellow-300
                                                font-sans">
                                                {result}
                                            </div>

                                            {/* Result Footer Actions */}
                                            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(result); alert("Copiado!"); }}
                                                    className="text-xs text-white/50 hover:text-white flex items-center gap-2 hover:underline"
                                                >
                                                    [COPIAR TEXTO]
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                        <Terminal className="w-12 h-12 opacity-50" />
                                        <p className="text-sm font-mono">Esperando resultado de la misión...</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (

                            // --- FLOW EDITOR VIEW ---
                            <div className="absolute inset-0 overflow-hidden flex items-center justify-center z-10">
                                <div className="w-full h-full scale-[0.85] opacity-90 hover:opacity-100 transition-opacity duration-500">
                                    <FlowEditor activeNodeId={activeNodeId} />
                                </div>

                                {/* Status Overlay when running */}
                                {isRunning && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-xl">
                                        <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                                        <span className="text-xs font-mono text-green-400">PROCESANDO TAREA...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Logs & Metrics */}
                <div className="glass-card flex flex-col overflow-hidden border-l border-white/5 bg-[#050505]/90">
                    {/* Cabecera Logs */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
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
                                    <span className="leading-relaxed break-words line-clamp-3 hover:line-clamp-none transition-all cursor-crosshair">{log.text}</span>
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
