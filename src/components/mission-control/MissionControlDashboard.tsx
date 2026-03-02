'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Zap, Shield, Radio,
    Rocket, Brain, Terminal, Settings,
    TrendingUp, Cpu, RefreshCw, X, Plus
} from 'lucide-react';
import { useDashboard, Agent } from '@/components/dashboard/DashboardContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Room {
    id: string;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    borderColor: string;
    icon: React.ElementType;
    description: string;
}

interface AgentNode {
    id: string;
    name: string;
    avatar: string;
    color: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    roomId: string;
    status: 'idle' | 'working' | 'communicating' | 'moving';
    level: number;
}

interface ChatBubble {
    id: string;
    agentId: string;
    agentName: string;
    agentColor: string;
    message: string;
    x: number;
    y: number;
    createdAt: number;
}

interface LogEntry {
    id: number;
    type: 'info' | 'success' | 'warning' | 'synergy' | 'mission';
    text: string;
    time: string;
    icon: string;
}

interface Mission {
    id: string;
    name: string;
    description: string;
    status: string;
    assigned_agents: string[];
    synergy_score: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROOMS: Room[] = [
    { id: 'bridge',    name: 'Puente de Mando',    x: 30,  y: 5,  w: 40, h: 25, color: 'rgba(59,130,246,0.08)',  borderColor: 'rgba(59,130,246,0.5)',  icon: Rocket,   description: 'Coordinación estratégica' },
    { id: 'reactor',   name: 'Reactor de Créditos', x: 2,   y: 38, w: 28, h: 25, color: 'rgba(234,179,8,0.08)',   borderColor: 'rgba(234,179,8,0.5)',   icon: Zap,      description: 'Gestión de tokens' },
    { id: 'engine',    name: 'Motor de Agentes',    x: 70,  y: 38, w: 28, h: 25, color: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.5)', icon: Settings, description: 'Ejecución y procesamiento' },
    { id: 'comms',     name: 'Comunicaciones',      x: 2,   y: 70, w: 28, h: 25, color: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.5)', icon: Radio,    description: 'Canales y webhooks' },
    { id: 'security',  name: 'Auto-Sanación',       x: 70,  y: 70, w: 28, h: 25, color: 'rgba(239,68,68,0.08)',  borderColor: 'rgba(239,68,68,0.5)',  icon: Shield,   description: 'Monitoreo y recuperación' },
    { id: 'cafeteria', name: 'Cafetería',           x: 30,  y: 38, w: 40, h: 25, color: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.5)', icon: Brain,    description: 'Zona de sincronización' },
    { id: 'memory',    name: 'Memoria Colectiva',   x: 30,  y: 70, w: 40, h: 25, color: 'rgba(236,72,153,0.08)', borderColor: 'rgba(236,72,153,0.5)', icon: Brain,    description: 'Almacenamiento vectorial' },
];

const AGENT_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'];

const SYNERGY_MESSAGES: Record<string, string[]> = {
    bridge:    ['Analizando KPIs del trimestre...', 'Coordinando estrategia LATAM', 'Optimizando pipeline de conversión', 'Revisando métricas de retención'],
    reactor:   ['Calculando costo por token...', 'Optimizando uso de créditos', 'Detectando patrones de consumo', 'Balanceando carga de modelos'],
    engine:    ['Ejecutando tarea paralela...', 'Compilando respuesta multimodal', 'Sincronizando orquestador', 'Procesando cola de misiones'],
    comms:     ['Enviando webhook a n8n...', 'Sincronizando Telegram', 'Procesando mensaje entrante', 'Actualizando estado de canal'],
    security:  ['Detectando anomalía...', 'Iniciando protocolo de recuperación', 'Validando integridad', 'Escaneando errores recientes'],
    cafeteria: ['Intercambiando contexto...', 'Compartiendo memoria episódica', 'Negociando prioridad', 'Generando sinergia colaborativa'],
    memory:    ['Indexando embedding...', 'Recuperando memoria a largo plazo', 'Consolidando conocimiento', 'Actualizando grafo de entidades'],
};

const IDLE_MESSAGES = ['En espera...', 'Monitoreando...', 'Procesando...', 'Analizando contexto...', 'Listo para ejecutar...'];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MissionControlDashboard() {
    const { agents } = useDashboard();

    const [agentNodes, setAgentNodes] = useState<AgentNode[]>([]);
    const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
    const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 1, type: 'info',    text: 'Sistema UAI inicializado correctamente.',     time: new Date().toLocaleTimeString(), icon: '🚀' },
        { id: 2, type: 'success', text: 'Todos los agentes en línea y sincronizados.', time: new Date().toLocaleTimeString(), icon: '✅' },
        { id: 3, type: 'info',    text: 'Orquestador cognitivo activo.',               time: new Date().toLocaleTimeString(), icon: '🧠' },
    ]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [metrics, setMetrics] = useState({ tokens: 0, cost: 0, latency: 0, synergies: 0, executions: 0 });
    const [activeTab, setActiveTab] = useState<'log' | 'missions' | 'agents'>('log');
    const [isCreatingMission, setIsCreatingMission] = useState(false);
    const [newMissionName, setNewMissionName] = useState('');
    const [newMissionDesc, setNewMissionDesc] = useState('');

    const logIdRef = useRef(10);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number | null>(null);

    // ─── Inicializar agentes ──────────────────────────────────────────────────

    useEffect(() => {
        const sourceAgents: Agent[] = agents.length > 0 ? agents : [
            { id: 'uai-lead',     name: 'UAI Lead',  role: 'Estratega',   model: 'gpt-4o', level: 7, xp: 3200, avatar: '🐉' },
            { id: 'uai-analyst',  name: 'Analyst',   role: 'Analítico',   model: 'gpt-4o', level: 5, xp: 1800, avatar: '🔬' },
            { id: 'uai-builder',  name: 'Builder',   role: 'Constructor', model: 'claude', level: 4, xp: 1200, avatar: '⚙️' },
            { id: 'uai-guardian', name: 'Guardian',  role: 'Seguridad',   model: 'gpt-4o', level: 6, xp: 2400, avatar: '🛡️' },
        ];
        const nodes: AgentNode[] = sourceAgents.map((agent, i) => {
            const room = ROOMS[i % ROOMS.length];
            const x = room.x + room.w / 2 + (Math.random() * 8 - 4);
            const y = room.y + room.h / 2 + (Math.random() * 8 - 4);
            return { id: agent.id, name: agent.name, avatar: agent.avatar || '🤖', color: AGENT_COLORS[i % AGENT_COLORS.length], x, y, targetX: x, targetY: y, roomId: room.id, status: 'idle', level: agent.level || 1 };
        });
        setAgentNodes(nodes);
    }, [agents]);

    // ─── Animación suave ──────────────────────────────────────────────────────

    useEffect(() => {
        const animate = () => {
            setAgentNodes(prev => prev.map(node => {
                const dx = node.targetX - node.x;
                const dy = node.targetY - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.3) return { ...node, x: node.targetX, y: node.targetY, status: node.status === 'moving' ? 'idle' : node.status };
                return { ...node, x: node.x + dx * 0.06, y: node.y + dy * 0.06, status: 'moving' as const };
            }));
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
        return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
    }, []);

    // ─── Comportamiento de agentes ────────────────────────────────────────────

    useEffect(() => {
        if (agentNodes.length === 0) return;

        const behaviorInterval = setInterval(() => {
            setAgentNodes(prev => {
                const updated = prev.map(node => {
                    if (Math.random() > 0.75) {
                        const targetRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
                        const tx = targetRoom.x + targetRoom.w * 0.2 + Math.random() * targetRoom.w * 0.6;
                        const ty = targetRoom.y + targetRoom.h * 0.2 + Math.random() * targetRoom.h * 0.6;
                        return { ...node, targetX: tx, targetY: ty, roomId: targetRoom.id, status: 'moving' as const };
                    }
                    const room = ROOMS.find(r => r.id === node.roomId);
                    if (room) {
                        const tx = Math.max(room.x + 2, Math.min(room.x + room.w - 2, node.targetX + (Math.random() * 4 - 2)));
                        const ty = Math.max(room.y + 2, Math.min(room.y + room.h - 2, node.targetY + (Math.random() * 4 - 2)));
                        return { ...node, targetX: tx, targetY: ty };
                    }
                    return node;
                });

                updated.forEach((a1, i) => {
                    updated.forEach((a2, j) => {
                        if (i >= j) return;
                        if (a1.roomId === a2.roomId && Math.random() > 0.85) {
                            const msgs = SYNERGY_MESSAGES[a1.roomId] || IDLE_MESSAGES;
                            const msg = msgs[Math.floor(Math.random() * msgs.length)];
                            const bubbleId = `bubble-${Date.now()}-${i}-${j}`;
                            setChatBubbles(prev => [...prev.slice(-8), { id: bubbleId, agentId: a1.id, agentName: a1.name, agentColor: a1.color, message: msg, x: a1.x, y: a1.y - 8, createdAt: Date.now() }]);
                            setMetrics(m => ({ ...m, synergies: m.synergies + 1 }));
                            const logId = ++logIdRef.current;
                            setLogs(prev => [...prev.slice(-49), { id: logId, type: 'synergy', text: `Sinergia: ${a1.name} + ${a2.name} — "${msg}"`, time: new Date().toLocaleTimeString(), icon: '⚡' }]);
                        }
                    });
                });
                return updated;
            });
        }, 2800);

        const bubbleCleanup = setInterval(() => {
            setChatBubbles(prev => prev.filter(b => Date.now() - b.createdAt < 6000));
        }, 1000);

        const metricsInterval = setInterval(() => {
            setMetrics(m => ({ ...m, tokens: m.tokens + Math.floor(Math.random() * 120), cost: parseFloat((m.cost + Math.random() * 0.003).toFixed(4)), latency: Math.floor(180 + Math.random() * 300), executions: m.executions + (Math.random() > 0.7 ? 1 : 0) }));
        }, 3000);

        return () => { clearInterval(behaviorInterval); clearInterval(bubbleCleanup); clearInterval(metricsInterval); };
    }, [agentNodes.length]);

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    const loadMissions = useCallback(async () => {
        try {
            const res = await fetch('/api/mission-control/missions');
            if (res.ok) setMissions(await res.json());
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => { loadMissions(); }, [loadMissions]);

    const createMission = async () => {
        if (!newMissionName.trim()) return;
        try {
            const res = await fetch('/api/mission-control/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newMissionName, description: newMissionDesc, agentIds: agentNodes.slice(0, 2).map(a => a.id), synergyScore: Math.floor(Math.random() * 40 + 60) }),
            });
            if (res.ok) {
                await loadMissions();
                setIsCreatingMission(false);
                setNewMissionName('');
                setNewMissionDesc('');
                const logId = ++logIdRef.current;
                setLogs(prev => [...prev, { id: logId, type: 'mission', text: `Nueva misión creada: "${newMissionName}"`, time: new Date().toLocaleTimeString(), icon: '🎯' }]);
            }
        } catch { /* silencioso */ }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#0a0a0f] text-white">

            {/* ── Ecosistema ── */}
            <div className="relative flex-1 overflow-hidden min-h-0">

                {/* Header del mapa */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs font-mono text-green-400 uppercase tracking-widest">UAI Habitat — En Vivo</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono">
                        <span>{agentNodes.length} agentes</span>
                        <span>⚡ {metrics.synergies} sinergias</span>
                        <span>🔄 {metrics.executions} ejecuciones</span>
                    </div>
                </div>

                {/* Mapa SVG */}
                <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    style={{ paddingTop: '2rem', background: 'radial-gradient(ellipse at 50% 50%, #0d0d1a 0%, #050508 100%)' }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.2" />
                        </pattern>
                        <filter id="agentGlow">
                            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />

                    {/* Salas */}
                    {ROOMS.map(room => (
                        <g key={room.id} onMouseEnter={() => setHoveredRoom(room.id)} onMouseLeave={() => setHoveredRoom(null)} style={{ cursor: 'pointer' }}>
                            <rect x={room.x} y={room.y} width={room.w} height={room.h} rx="1.5" ry="1.5"
                                fill={hoveredRoom === room.id ? room.color.replace('0.08', '0.15') : room.color}
                                stroke={room.borderColor} strokeWidth={hoveredRoom === room.id ? '0.5' : '0.3'}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                            <text x={room.x + room.w / 2} y={room.y + 4} textAnchor="middle" fontSize="1.8" fill="rgba(255,255,255,0.5)" fontFamily="monospace" fontWeight="bold">
                                {room.name.toUpperCase()}
                            </text>
                            {hoveredRoom === room.id && (
                                <text x={room.x + room.w / 2} y={room.y + room.h - 2} textAnchor="middle" fontSize="1.4" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
                                    {room.description}
                                </text>
                            )}
                            {(() => {
                                const count = agentNodes.filter(a => a.roomId === room.id).length;
                                return count > 0 ? (
                                    <text x={room.x + room.w - 2} y={room.y + 4} textAnchor="end" fontSize="1.5" fill={room.borderColor} fontFamily="monospace">×{count}</text>
                                ) : null;
                            })()}
                        </g>
                    ))}

                    {/* Líneas de sinergia */}
                    {agentNodes.map((a1, i) =>
                        agentNodes.slice(i + 1).map((a2) => {
                            if (a1.roomId !== a2.roomId) return null;
                            const dist = Math.sqrt((a1.x - a2.x) ** 2 + (a1.y - a2.y) ** 2);
                            if (dist > 20) return null;
                            return (
                                <line key={`${a1.id}-${a2.id}`} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
                                    stroke={a1.color} strokeWidth="0.2" strokeOpacity={0.3} strokeDasharray="0.5 0.5" />
                            );
                        })
                    )}

                    {/* Avatares */}
                    {agentNodes.map(node => (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}
                            onClick={() => setSelectedAgent(selectedAgent?.id === node.id ? null : node)}
                            style={{ cursor: 'pointer' }} filter="url(#agentGlow)"
                        >
                            {selectedAgent?.id === node.id && (
                                <circle r="3.5" fill="none" stroke={node.color} strokeWidth="0.4" strokeOpacity="0.8" strokeDasharray="1 0.5">
                                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="3s" repeatCount="indefinite" />
                                </circle>
                            )}
                            <circle r="2.5" fill={node.color} fillOpacity="0.9" />
                            {node.status === 'working' && (
                                <circle r="2.5" fill="none" stroke={node.color} strokeWidth="0.3">
                                    <animate attributeName="r" values="2.5;4;2.5" dur="1.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
                                </circle>
                            )}
                            <text textAnchor="middle" dominantBaseline="central" fontSize="2.2" style={{ userSelect: 'none' }}>{node.avatar}</text>
                            <text y="4" textAnchor="middle" fontSize="1.3" fill="rgba(255,255,255,0.7)" fontFamily="monospace">{node.name.split(' ')[0]}</text>
                            <text x="2" y="-2" fontSize="1" fill={node.color} fontFamily="monospace" fontWeight="bold">Lv{node.level}</text>
                        </g>
                    ))}

                    {/* Burbujas de chat */}
                    {chatBubbles.map(bubble => (
                        <g key={bubble.id} transform={`translate(${bubble.x}, ${bubble.y})`}>
                            <rect x="-12" y="-4" width="24" height="5" rx="1" fill="rgba(0,0,0,0.85)" stroke={bubble.agentColor} strokeWidth="0.2" />
                            <text textAnchor="middle" y="-1" fontSize="1.2" fill="rgba(255,255,255,0.9)" fontFamily="monospace">
                                {bubble.message.length > 28 ? bubble.message.slice(0, 28) + '…' : bubble.message}
                            </text>
                            <polygon points="0,1 -1,2 1,2" fill={bubble.agentColor} fillOpacity="0.8" />
                        </g>
                    ))}
                </svg>

                {/* Panel de agente seleccionado */}
                <AnimatePresence>
                    {selectedAgent && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="absolute bottom-4 left-4 w-56 bg-black/80 backdrop-blur-md border rounded-xl p-3 z-30"
                            style={{ borderColor: selectedAgent.color + '60' }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{selectedAgent.avatar}</span>
                                    <div>
                                        <p className="text-xs font-bold text-white">{selectedAgent.name}</p>
                                        <p className="text-[10px] text-white/40">Nivel {selectedAgent.level}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAgent(null)} className="text-white/30 hover:text-white/70"><X size={12} /></button>
                            </div>
                            <div className="text-[10px] text-white/50 space-y-1">
                                <div className="flex justify-between"><span>Sala</span><span className="text-white/80">{ROOMS.find(r => r.id === selectedAgent.roomId)?.name}</span></div>
                                <div className="flex justify-between"><span>Estado</span><span style={{ color: selectedAgent.color }} className="capitalize">{selectedAgent.status}</span></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Dashboard de Control ── */}
            <div className="w-80 flex flex-col border-l border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden shrink-0">

                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Terminal size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Mission Control</span>
                    </div>
                    <p className="text-[10px] text-white/30">Centro de comando cognitivo UAI</p>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/5 shrink-0">
                    {[
                        { label: 'Tokens',    value: metrics.tokens.toLocaleString(), icon: Cpu,       color: 'text-blue-400' },
                        { label: 'Costo',     value: `$${metrics.cost.toFixed(4)}`,   icon: TrendingUp, color: 'text-green-400' },
                        { label: 'Latencia',  value: `${metrics.latency}ms`,          icon: Activity,   color: 'text-yellow-400' },
                        { label: 'Sinergias', value: metrics.synergies.toString(),    icon: Zap,        color: 'text-purple-400' },
                    ].map(m => (
                        <div key={m.label} className="bg-white/3 rounded-lg p-2 border border-white/5">
                            <div className="flex items-center gap-1 mb-1">
                                <m.icon size={10} className={m.color} />
                                <span className="text-[9px] text-white/40 uppercase">{m.label}</span>
                            </div>
                            <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 shrink-0">
                    {(['log', 'missions', 'agents'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-red-400 border-b border-red-400' : 'text-white/30 hover:text-white/60'}`}
                        >
                            {tab === 'log' ? 'Log' : tab === 'missions' ? 'Misiones' : 'Agentes'}
                        </button>
                    ))}
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto min-h-0">

                    {/* Log */}
                    {activeTab === 'log' && (
                        <div className="p-2 space-y-1">
                            {logs.map(entry => (
                                <div key={entry.id} className={`flex gap-2 p-1.5 rounded text-[10px] border ${
                                    entry.type === 'synergy' ? 'border-purple-500/20 bg-purple-500/5' :
                                    entry.type === 'success' ? 'border-green-500/20 bg-green-500/5' :
                                    entry.type === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
                                    entry.type === 'mission' ? 'border-red-500/20 bg-red-500/5' :
                                    'border-white/5 bg-white/2'
                                }`}>
                                    <span className="shrink-0">{entry.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/70 leading-tight break-words">{entry.text}</p>
                                        <p className="text-white/20 mt-0.5 font-mono">{entry.time}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}

                    {/* Misiones */}
                    {activeTab === 'missions' && (
                        <div className="p-3 space-y-3">
                            <button onClick={() => setIsCreatingMission(!isCreatingMission)}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-white/10 text-[11px] text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
                            >
                                <Plus size={12} /> Nueva Misión
                            </button>
                            <AnimatePresence>
                                {isCreatingMission && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                                        <input value={newMissionName} onChange={e => setNewMissionName(e.target.value)} placeholder="Nombre de la misión..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-red-500/50" />
                                        <textarea value={newMissionDesc} onChange={e => setNewMissionDesc(e.target.value)} placeholder="Descripción..." rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-red-500/50 resize-none" />
                                        <button onClick={createMission} className="w-full py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-xs font-bold text-white transition-colors">
                                            Lanzar Misión
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {missions.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-[11px] text-white/20">No hay misiones activas.</p>
                                    <p className="text-[10px] text-white/10 mt-1">Crea una para coordinar agentes.</p>
                                </div>
                            ) : (
                                missions.map(m => (
                                    <div key={m.id} className="p-3 rounded-xl bg-white/3 border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-white truncate">{m.name}</p>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500/20 text-green-400 uppercase shrink-0 ml-2">{m.status || 'activa'}</span>
                                        </div>
                                        {m.description && <p className="text-[10px] text-white/40 line-clamp-2">{m.description}</p>}
                                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                            <div className="flex -space-x-1">
                                                {(m.assigned_agents || []).slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px]"
                                                        style={{ background: AGENT_COLORS[i % AGENT_COLORS.length] }}>🤖</div>
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-mono text-white/30">Sinergia: {m.synergy_score}%</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Agentes */}
                    {activeTab === 'agents' && (
                        <div className="p-3 space-y-2">
                            {agentNodes.map(node => {
                                const room = ROOMS.find(r => r.id === node.roomId);
                                return (
                                    <div key={node.id} onClick={() => setSelectedAgent(selectedAgent?.id === node.id ? null : node)}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                                        style={{ borderColor: selectedAgent?.id === node.id ? node.color + '60' : undefined }}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                                                style={{ background: node.color + '30', border: `1px solid ${node.color}60` }}>
                                                {node.avatar}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black"
                                                style={{ background: node.status === 'moving' ? '#f59e0b' : '#10b981' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{node.name}</p>
                                            <p className="text-[10px] text-white/40 truncate">{room?.name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-mono" style={{ color: node.color }}>Lv{node.level}</p>
                                            <p className="text-[9px] text-white/20 capitalize">{node.status}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="mt-4 pt-3 border-t border-white/5">
                                <p className="text-[9px] text-white/20 uppercase tracking-widest mb-2">Salas del Habitat</p>
                                {ROOMS.map(room => {
                                    const count = agentNodes.filter(a => a.roomId === room.id).length;
                                    return (
                                        <div key={room.id} className="flex items-center justify-between py-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: room.borderColor }} />
                                                <span className="text-[10px] text-white/40">{room.name}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/20">{count} agente{count !== 1 ? 's' : ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] text-white/30 font-mono">SISTEMA NOMINAL</span>
                    </div>
                    <button onClick={loadMissions} className="text-white/20 hover:text-white/50 transition-colors" title="Refrescar">
                        <RefreshCw size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
}
