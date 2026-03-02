'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Activity, Zap, Terminal, X, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agent {
    id: string;
    name: string;
    role: string;
    model: string;
    avatar: string;
    level?: number;
    xp?: number;
}

interface Synergy {
    id: string;
    type: string;
    score: number;
    description: string;
    agent_ids: string[];
    created_at: string;
}

interface Mission {
    id: string;
    name: string;
    description: string;
    assigned_agents: string[];
    synergy_score: number;
    status?: string;
    created_at: string;
}

interface MetricsTotals {
    total_runs: number;
    total_tokens: number;
    total_cost: number;
    avg_latency_ms: number;
    successful_runs: number;
    failed_runs: number;
    running_now: number;
}

interface RunRecord {
    mission_id: string;
    status: string;
    total_tokens: number;
    total_cost_credits: number;
    latency_ms: number;
    created_at: string;
}

// ─── Canvas Node ─────────────────────────────────────────────────────────────

interface CanvasNode {
    id: string;
    agent: Agent;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    orbit: number;       // orbit ring index
    angle: number;       // current angle on orbit
    speed: number;       // orbital speed
    color: string;
    pulsePhase: number;
    isActive: boolean;
    isSelected: boolean;
}

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    progress: number;
    speed: number;
    fromId: string;
    toId: string;
    color: string;
}

// ─── Color palette by role ────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
    'lead': '#ef4444',
    'analyst': '#3b82f6',
    'builder': '#22c55e',
    'guardian': '#a855f7',
    'connector': '#f59e0b',
    'researcher': '#06b6d4',
    'strategist': '#f97316',
    'default': '#6b7280',
};

function getRoleColor(role: string): string {
    const lower = role.toLowerCase();
    for (const [key, color] of Object.entries(ROLE_COLORS)) {
        if (lower.includes(key)) return color;
    }
    return ROLE_COLORS.default;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MissionControlDashboard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const nodesRef = useRef<CanvasNode[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const synergiesRef = useRef<Synergy[]>([]);
    const timeRef = useRef<number>(0);

    const [agents, setAgents] = useState<Agent[]>([]);
    const [synergies, setSynergies] = useState<Synergy[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [metrics, setMetrics] = useState<MetricsTotals | null>(null);
    const [recentRuns, setRecentRuns] = useState<RunRecord[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [activeTab, setActiveTab] = useState<'log' | 'missions' | 'agents'>('log');
    const [logs, setLogs] = useState<{ id: number; type: string; text: string; time: string }[]>([
        { id: 1, type: 'system', text: 'Sistema UAI inicializado. Grafo orbital activo.', time: new Date().toLocaleTimeString() },
    ]);
    const [missionInput, setMissionInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [runOutput, setRunOutput] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const addLog = useCallback((type: string, text: string) => {
        setLogs(prev => [...prev.slice(-49), {
            id: Date.now(),
            type,
            text,
            time: new Date().toLocaleTimeString()
        }]);
    }, []);

    // ── Fetch data ────────────────────────────────────────────────────────────

    const fetchAll = useCallback(async () => {
        try {
            const [agentsRes, synRes, missRes, metricsRes] = await Promise.all([
                fetch('/api/agents'),
                fetch('/api/mission-control/synergies'),
                fetch('/api/mission-control/missions'),
                fetch('/api/agent/metrics'),
            ]);

            if (agentsRes.ok) {
                const data: Agent[] = await agentsRes.json();
                setAgents(data);
                addLog('system', `${data.length} agente(s) conectado(s) al grafo.`);
            }
            if (synRes.ok) {
                const data: Synergy[] = await synRes.json();
                setSynergies(data);
                synergiesRef.current = data;
                if (data.length > 0) addLog('synergy', `${data.length} sinergia(s) activa(s) detectada(s).`);
            }
            if (missRes.ok) {
                const data: Mission[] = await missRes.json();
                setMissions(data);
            }
            if (metricsRes.ok) {
                const data = await metricsRes.json();
                setMetrics(data.totals);
                setRecentRuns(data.runs || []);
            }
        } catch {
            setError('Error al cargar datos del sistema.');
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 15000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    // ── Build canvas nodes from agents ────────────────────────────────────────

    const buildNodes = useCallback(() => {
        if (agents.length === 0) return;
        const canvas = canvasRef.current;
        if (!canvas || canvas.width === 0) return;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const orbits = [80, 140, 200, 260];
        nodesRef.current = agents.map((agent, i) => {
            const orbitIdx = Math.min(Math.floor(i / 3), orbits.length - 1);
            const orbitR = orbits[orbitIdx];
            const countInOrbit = Math.min(agents.length - orbitIdx * 3, 3);
            const angleStep = (Math.PI * 2) / countInOrbit;
            const startAngle = (i % 3) * angleStep;
            return {
                id: agent.id,
                agent,
                x: cx + Math.cos(startAngle) * orbitR,
                y: cy + Math.sin(startAngle) * orbitR,
                vx: 0,
                vy: 0,
                radius: 18,
                orbit: orbitIdx,
                angle: startAngle,
                speed: 0.003 + Math.random() * 0.002,
                color: getRoleColor(agent.role),
                pulsePhase: Math.random() * Math.PI * 2,
                isActive: true,
                isSelected: false,
            };
        });
    }, [agents]);

    useEffect(() => { buildNodes(); }, [buildNodes]);

    // ── Canvas render loop ────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const orbits = [80, 140, 200, 260];

        const render = (ts: number) => {
            timeRef.current = ts;
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            // Clear
            ctx.clearRect(0, 0, w, h);

            // Background gradient
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 2);
            bg.addColorStop(0, '#0a0a14');
            bg.addColorStop(1, '#050508');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            // Draw orbit rings
            orbits.forEach((r, i) => {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255,${0.03 + i * 0.01})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 8]);
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // Central core
            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
            coreGrad.addColorStop(0, 'rgba(239,68,68,0.9)');
            coreGrad.addColorStop(0.5, 'rgba(239,68,68,0.3)');
            coreGrad.addColorStop(1, 'rgba(239,68,68,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, 28, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('UAI', cx, cy);

            // Update node positions
            nodesRef.current.forEach(node => {
                node.angle += node.speed;
                const r = orbits[Math.min(node.orbit, orbits.length - 1)];
                node.x = cx + Math.cos(node.angle) * r;
                node.y = cy + Math.sin(node.angle) * r;
            });

            // Draw synergy connections
            synergiesRef.current.forEach(syn => {
                const [idA, idB] = syn.agent_ids;
                const nodeA = nodesRef.current.find(n => n.id === idA);
                const nodeB = nodesRef.current.find(n => n.id === idB);
                if (!nodeA || !nodeB) return;

                const alpha = Math.min(syn.score / 100, 1) * 0.4;
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                // Bezier curve through center
                ctx.quadraticCurveTo(cx, cy, nodeB.x, nodeB.y);
                ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
                ctx.lineWidth = 1 + syn.score / 50;
                ctx.stroke();
            });

            // Draw lines from center to each node
            nodesRef.current.forEach(node => {
                const alpha = node.isSelected ? 0.3 : 0.08;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(node.x, node.y);
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.lineWidth = node.isSelected ? 1.5 : 0.5;
                ctx.stroke();
            });

            // Update and draw particles
            particlesRef.current = particlesRef.current.filter(p => p.progress < 1);
            particlesRef.current.forEach(p => {
                p.progress = Math.min(p.progress + p.speed, 1);
                const t = p.progress;
                // Quadratic bezier through center
                const bx = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * cx + t * t * p.targetX;
                const by = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * cy + t * t * p.targetY;
                ctx.beginPath();
                ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            // Draw nodes
            nodesRef.current.forEach(node => {
                const pulse = Math.sin(ts * 0.002 + node.pulsePhase) * 0.3 + 0.7;

                // Glow
                const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2.5);
                glow.addColorStop(0, node.color + Math.round(pulse * 80).toString(16).padStart(2, '0'));
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                // Selection ring
                if (node.isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color + 'cc';
                ctx.fill();
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Avatar emoji
                ctx.font = `${node.radius * 0.9}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.agent.avatar || '🤖', node.x, node.y);

                // Name label
                ctx.font = 'bold 8px monospace';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(
                    node.agent.name.split(' ')[0].substring(0, 8),
                    node.x,
                    node.y + node.radius + 10
                );
            });

            animFrameRef.current = requestAnimationFrame(render);
        };

        animFrameRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, []);

    // ── Canvas click handler ──────────────────────────────────────────────────

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        let clicked: CanvasNode | null = null;
        for (const node of nodesRef.current) {
            const dx = node.x - mx;
            const dy = node.y - my;
            if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 8) {
                clicked = node;
                break;
            }
        }

        nodesRef.current.forEach(n => { n.isSelected = n.id === clicked?.id; });
        setSelectedAgent(clicked ? clicked.agent : null);

        if (clicked) {
            addLog('select', `Agente seleccionado: ${clicked.agent.name}`);
        }
    }, [addLog]);

    // ── Run mission for selected agent ────────────────────────────────────────

    const runMission = useCallback(async () => {
        if (!missionInput.trim() || isRunning) return;
        setIsRunning(true);
        setRunOutput('');
        const instruction = missionInput.trim();
        setMissionInput('');
        addLog('mission', `Misión enviada: "${instruction.substring(0, 50)}..."`);

        // Spawn particles between all nodes
        const nodes = nodesRef.current;
        if (nodes.length >= 2) {
            for (let i = 0; i < Math.min(nodes.length - 1, 5); i++) {
                const from = nodes[i];
                const to = nodes[(i + 1) % nodes.length];
                particlesRef.current.push({
                    x: from.x, y: from.y,
                    targetX: to.x, targetY: to.y,
                    progress: 0,
                    speed: 0.008 + Math.random() * 0.005,
                    fromId: from.id,
                    toId: to.id,
                    color: from.color,
                });
            }
        }

        try {
            const res = await fetch('/api/agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: instruction,
                    agent: selectedAgent,
                }),
            });
            if (!res.ok) throw new Error('Error en la respuesta del servidor');
            const reader = res.body?.getReader();
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
                            if (event.type === 'node_update' && event.chunk?.messages) {
                                const last = event.chunk.messages[event.chunk.messages.length - 1];
                                const text = typeof last === 'string' ? last : last?.content;
                                if (text && text.length > 5) {
                                    setRunOutput(text);
                                    addLog('process', text.substring(0, 70) + (text.length > 70 ? '...' : ''));
                                }
                            } else if (event.type === 'complete') {
                                addLog('success', 'Misión completada con éxito.');
                                fetchAll();
                            }
                        } catch { /* skip */ }
                    }
                }
            }
        } catch (err: any) {
            addLog('error', `Error: ${err.message}`);
        } finally {
            setIsRunning(false);
        }
    }, [missionInput, isRunning, selectedAgent, addLog, fetchAll]);

    // ── Resize canvas ─────────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            // Rebuild nodes after resize so they use the correct center
            buildNodes();
        };
        // Small delay to ensure parent has layout dimensions
        setTimeout(resize, 50);
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [buildNodes]);

    // ── Render ────────────────────────────────────────────────────────────────

    const logColors: Record<string, string> = {
        system: 'text-white/40',
        synergy: 'text-purple-400',
        mission: 'text-yellow-400',
        process: 'text-blue-400',
        success: 'text-green-400',
        error: 'text-red-400',
        select: 'text-cyan-400',
    };

    return (
        <div className="h-full flex overflow-hidden bg-[#050508]">
            {/* ── Canvas panel ── */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full h-full cursor-crosshair"
                />

                {/* Top-left status */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        UAI HABITAT — EN VIVO
                    </span>
                    {metrics && (
                        <span className="text-[10px] font-mono text-white/20">
                            {metrics.running_now > 0 ? `· ${metrics.running_now} ejecutando` : ''}
                        </span>
                    )}
                </div>

                {/* Top-right quick stats */}
                {metrics && (
                    <div className="absolute top-3 right-3 flex gap-3 text-[10px] font-mono text-white/30">
                        <span>{agents.length} agentes</span>
                        <span>⚡ {synergies.length} sinergias</span>
                        <span>▶ {Number(metrics.total_runs)} runs</span>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                            <span className="text-xs text-white/40 font-mono">Inicializando grafo...</span>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {error && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400">{error}</span>
                    </div>
                )}

                {/* Selected agent panel */}
                <AnimatePresence>
                    {selectedAgent && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute bottom-4 left-4 w-56 bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{selectedAgent.avatar || '🤖'}</span>
                                    <div>
                                        <div className="text-xs font-bold text-white">{selectedAgent.name}</div>
                                        <div className="text-[10px] text-white/40">{selectedAgent.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedAgent(null); nodesRef.current.forEach(n => { n.isSelected = false; }); }}>
                                    <X className="w-3 h-3 text-white/30 hover:text-white" />
                                </button>
                            </div>
                            <div className="text-[10px] text-white/30 mb-2 font-mono">{selectedAgent.model}</div>
                            <div className="flex items-center gap-1 w-full">
                                <input
                                    value={missionInput}
                                    onChange={e => setMissionInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') runMission(); }}
                                    placeholder="Enviar instrucción..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-red-500/50"
                                />
                                <button
                                    onClick={runMission}
                                    disabled={isRunning || !missionInput.trim()}
                                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 disabled:opacity-30 transition-all"
                                >
                                    {isRunning ? <Activity className="w-3 h-3 text-red-400 animate-spin" /> : <Send className="w-3 h-3 text-red-400" />}
                                </button>
                            </div>
                            {runOutput && (
                                <div className="mt-2 text-[9px] text-green-400 font-mono line-clamp-3 bg-green-500/5 rounded p-1">
                                    {runOutput.substring(0, 120)}...
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Right panel ── */}
            <div className="w-72 flex flex-col border-l border-white/5 bg-[#080810]">
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Terminal className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Mission Control</span>
                    </div>
                    <div className="text-[10px] text-white/30">Centro de comando cognitivo UAI</div>
                </div>

                {/* Metrics grid */}
                {metrics && (
                    <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/5">
                        {[
                            { label: 'TOKENS', value: Number(metrics.total_tokens).toLocaleString(), color: 'text-blue-400', icon: '◈' },
                            { label: 'COSTO', value: `$${Number(metrics.total_cost).toFixed(4)}`, color: 'text-green-400', icon: '◆' },
                            { label: 'LATENCIA', value: `${Math.round(Number(metrics.avg_latency_ms))}ms`, color: 'text-yellow-400', icon: '◉' },
                            { label: 'SINERGIAS', value: String(synergies.length), color: 'text-purple-400', icon: '⚡' },
                        ].map(m => (
                            <div key={m.label} className="bg-white/3 rounded-lg p-2">
                                <div className="text-[9px] text-white/30 font-mono mb-1">{m.icon} {m.label}</div>
                                <div className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {(['log', 'missions', 'agents'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-red-400 border-b border-red-500' : 'text-white/20 hover:text-white/50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'log' && (
                        <div className="p-3 space-y-2">
                            {logs.slice().reverse().map(log => (
                                <div key={log.id} className="flex gap-2 text-[10px] font-mono">
                                    <span className="text-white/15 shrink-0">{log.time}</span>
                                    <span className={logColors[log.type] || 'text-white/40'}>{log.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'missions' && (
                        <div className="p-3 space-y-3">
                            {/* Mission input */}
                            <div className="space-y-2">
                                <textarea
                                    value={missionInput}
                                    onChange={e => setMissionInput(e.target.value)}
                                    placeholder="Nueva misión colaborativa..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 resize-none h-16"
                                />
                                <button
                                    onClick={runMission}
                                    disabled={isRunning || !missionInput.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 text-[10px] font-bold text-red-400 uppercase tracking-widest transition-all"
                                >
                                    {isRunning ? <Activity className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    {isRunning ? 'Ejecutando...' : 'Lanzar Misión'}
                                </button>
                            </div>

                            {/* Missions list */}
                            {missions.length === 0 ? (
                                <div className="text-center text-[10px] text-white/20 py-4">Sin misiones activas</div>
                            ) : (
                                missions.slice(0, 8).map(m => (
                                    <div key={m.id} className="bg-white/3 rounded-lg p-3 border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-white">{m.name}</span>
                                            <span className="text-[9px] text-purple-400 font-mono">⚡{m.synergy_score}</span>
                                        </div>
                                        <div className="text-[9px] text-white/30">{m.description?.substring(0, 60)}</div>
                                        <div className="text-[9px] text-white/20 mt-1">{m.assigned_agents?.length || 0} agentes</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'agents' && (
                        <div className="p-3 space-y-2">
                            {agents.length === 0 ? (
                                <div className="text-center text-[10px] text-white/20 py-4">Sin agentes registrados</div>
                            ) : (
                                agents.map(agent => {
                                    const node = nodesRef.current.find(n => n.id === agent.id);
                                    const color = getRoleColor(agent.role);
                                    return (
                                        <button
                                            key={agent.id}
                                            onClick={() => {
                                                nodesRef.current.forEach(n => { n.isSelected = n.id === agent.id; });
                                                setSelectedAgent(agent);
                                                addLog('select', `Agente seleccionado: ${agent.name}`);
                                            }}
                                            className="w-full flex items-center gap-3 bg-white/3 hover:bg-white/6 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all text-left"
                                        >
                                            <span className="text-xl">{agent.avatar || '🤖'}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold text-white truncate">{agent.name}</div>
                                                <div className="text-[9px] text-white/30 truncate">{agent.role}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                <ChevronRight className="w-3 h-3 text-white/20" />
                                            </div>
                                        </button>
                                    );
                                })
                            )}

                            {/* Recent runs */}
                            {recentRuns.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-[9px] text-white/20 font-mono uppercase tracking-widest mb-2">Últimas ejecuciones</div>
                                    {recentRuns.slice(0, 5).map(run => (
                                        <div key={run.mission_id} className="flex items-center justify-between py-1.5 border-b border-white/3 text-[9px] font-mono">
                                            <span className={run.status === 'success' ? 'text-green-400' : run.status === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                                                {run.status === 'success' ? '✓' : run.status === 'error' ? '✗' : '⟳'} {run.status}
                                            </span>
                                            <span className="text-white/30">{Number(run.total_tokens)} tok</span>
                                            <span className="text-white/20">{Math.round(Number(run.latency_ms))}ms</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-green-400">● SISTEMA NOMINAL</span>
                    <button onClick={fetchAll} className="p-1 hover:bg-white/5 rounded transition-all">
                        <RefreshCw className="w-3 h-3 text-white/20 hover:text-white/50" />
                    </button>
                </div>
            </div>
        </div>
    );
}
