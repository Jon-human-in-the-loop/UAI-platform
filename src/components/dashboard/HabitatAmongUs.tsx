'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from './DashboardContext';
import { Rocket, Zap, Shield, MessageSquare, Coffee, Settings, Share2, Sparkles } from 'lucide-react';

interface AgentPosition {
    id: string;
    x: number;
    y: number;
    room: string;
    color: string;
    avatar: string;
    name: string;
}

interface Synergy {
    id: string;
    agents: [string, string];
    description: string;
    status: 'pending' | 'active' | 'rejected';
}

const ROOMS = [
    { id: 'bridge', name: 'Puente de Mando', x: 40, y: 10, icon: Rocket, color: 'bg-blue-500/20' },
    { id: 'reactor', name: 'Reactor de Créditos', x: 10, y: 40, icon: Zap, color: 'bg-yellow-500/20' },
    { id: 'security', name: 'Auto-Sanación', x: 70, y: 40, icon: Shield, color: 'bg-red-500/20' },
    { id: 'comms', name: 'Comunicaciones', x: 40, y: 70, icon: MessageSquare, color: 'bg-green-500/20' },
    { id: 'cafeteria', name: 'Cafetería', x: 40, y: 40, icon: Coffee, color: 'bg-orange-500/20' },
    { id: 'engine', name: 'Motor de Agentes', x: 10, y: 70, icon: Settings, color: 'bg-purple-500/20' },
];

export default function HabitatAmongUs() {
    const { agents, profile, awardXp } = useDashboard();
    const [agentPositions, setAgentPositions] = useState<AgentPosition[]>([]);
    const [synergies, setSynergies] = useState<Synergy[]>([]);
    const [activeSynergyId, setActiveSynergyId] = useState<string | null>(null);
    const isAdmin = profile?.email === 'jon@uai.com' || (profile as any)?.role === 'admin';

    // Inicializar posiciones de agentes
    useEffect(() => {
        if (agents && agents.length > 0) {
            const initialPositions = agents.map((agent, index) => ({
                id: agent.id,
                name: agent.name,
                avatar: agent.avatar || '🤖',
                color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 6],
                room: 'cafeteria',
                x: 40 + (Math.random() * 10 - 5),
                y: 40 + (Math.random() * 10 - 5),
            }));
            setAgentPositions(initialPositions);
        }
    }, [agents]);

    // Simular movimiento y detección de sinergias
    useEffect(() => {
        const interval = setInterval(() => {
            setAgentPositions(prev => {
                const newPositions = prev.map(agent => {
                    // 20% de probabilidad de moverse a una nueva sala
                    if (Math.random() > 0.8) {
                        const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
                        return {
                            ...agent,
                            room: randomRoom.id,
                            x: randomRoom.x + (Math.random() * 15 - 7.5),
                            y: randomRoom.y + (Math.random() * 15 - 7.5),
                        };
                    }
                    // Pequeño movimiento dentro de la sala
                    return {
                        ...agent,
                        x: agent.x + (Math.random() * 2 - 1),
                        y: agent.y + (Math.random() * 2 - 1),
                    };
                });

                // Detectar sinergias por proximidad en la misma sala
                newPositions.forEach((a1, i) => {
                    newPositions.forEach((a2, j) => {
                        if (i < j && a1.room === a2.room && a1.room !== 'cafeteria') {
                            // 10% de probabilidad de generar una sinergia si están en la misma sala
                            if (Math.random() > 0.9) {
                                const synergyId = `${a1.id}-${a2.id}`;
                                setSynergies(prevSyn => {
                                    if (prevSyn.find(s => s.id === synergyId)) return prevSyn;
                                    return [...prevSyn, {
                                        id: synergyId,
                                        agents: [a1.id, a2.id],
                                        description: `Optimización de flujo en ${ROOMS.find(r => r.id === a1.room)?.name}`,
                                        status: 'pending'
                                    }];
                                });
                            }
                        }
                    });
                });

                return newPositions;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleAcceptSynergy = (synergy: Synergy) => {
        setSynergies(prev => prev.map(s => s.id === synergy.id ? { ...s, status: 'active' } : s));
        setActiveSynergyId(synergy.id);
        
        // Corregido: awardXp requiere (success: boolean, autoHealed: boolean, nodesCompleted: number)
        awardXp(true, false, 5); 
        
        setTimeout(() => setActiveSynergyId(null), 5000); // La animación dura 5s
    };

    const handleRejectSynergy = (id: string) => {
        setSynergies(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="relative w-full aspect-video bg-[#050505] rounded-3xl border border-white/10 overflow-hidden shadow-2xl group">
            {/* Fondo de Estrellas Animado */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="stars-container animate-pulse">
                    {[...Array(50)].map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute bg-white rounded-full"
                            style={{
                                width: Math.random() * 2 + 'px',
                                height: Math.random() * 2 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Dibujo de la Base / Salas */}
            <div className="absolute inset-0 p-8 grid grid-cols-3 grid-rows-3 gap-4">
                {ROOMS.map(room => (
                    <div 
                        key={room.id}
                        className={`relative rounded-2xl border border-white/5 ${room.color} backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all hover:border-white/20`}
                        style={{
                            gridColumn: room.x < 30 ? 1 : room.x < 60 ? 2 : 3,
                            gridRow: room.y < 30 ? 1 : room.y < 60 ? 2 : 3,
                        }}
                    >
                        <room.icon className="w-8 h-8 text-white/20" />
                        <span className="text-[8px] uppercase font-black tracking-widest text-white/40">{room.name}</span>
                    </div>
                ))}
            </div>

            {/* Líneas de Sinergia Activa */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {synergies.filter(s => s.status === 'active' && s.id === activeSynergyId).map(s => {
                    const a1 = agentPositions.find(a => a.id === s.agents[0]);
                    const a2 = agentPositions.find(a => a.id === s.agents[1]);
                    if (!a1 || !a2) return null;
                    return (
                        <motion.line
                            key={s.id}
                            x1={`${a1.x}%`} y1={`${a1.y}%`}
                            x2={`${a2.x}%`} y2={`${a2.y}%`}
                            stroke="url(#synergyGradient)"
                            strokeWidth="4"
                            strokeDasharray="10,5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <animate attributeName="stroke-dashoffset" from="0" to="30" dur="1s" repeatCount="indefinite" />
                        </motion.line>
                    );
                })}
                <defs>
                    <linearGradient id="synergyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Agentes (Tripulantes) */}
            <AnimatePresence>
                {agentPositions.map(agent => (
                    <motion.div
                        key={agent.id}
                        layoutId={agent.id}
                        initial={false}
                        animate={{ 
                            left: `${agent.x}%`, 
                            top: `${agent.y}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        className="absolute z-20 flex flex-col items-center cursor-pointer group/agent"
                    >
                        {/* Etiqueta de Nombre */}
                        <div className="opacity-0 group-hover/agent:opacity-100 transition-opacity absolute -top-8 bg-black/80 border border-white/10 px-2 py-1 rounded text-[8px] font-bold text-white whitespace-nowrap pointer-events-none">
                            {agent.name}
                        </div>

                        {/* Cuerpo del Tripulante */}
                        <div className="relative w-10 h-12">
                            <div 
                                className="absolute left-0 top-3 w-3 h-7 rounded-l-lg"
                                style={{ backgroundColor: agent.color, filter: 'brightness(0.7)' }}
                            />
                            <div 
                                className="absolute right-0 w-8 h-12 rounded-t-2xl rounded-b-lg border-2 border-black/40"
                                style={{ backgroundColor: agent.color }}
                            >
                                <div className="absolute top-2 left-1 w-6 h-4 bg-blue-200/80 rounded-full border border-black/20 overflow-hidden">
                                    <div className="absolute top-0 left-1 w-3 h-1 bg-white/60 rounded-full" />
                                </div>
                            </div>
                            {isAdmin && agentPositions[0].id === agent.id && (
                                <div className="absolute -top-4 left-1 text-xl animate-bounce">👑</div>
                            )}
                        </div>
                        <div className="w-6 h-1 bg-black/40 rounded-full blur-sm mt-1" />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Notificaciones de Sinergia Pendiente */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 max-w-[200px]">
                <AnimatePresence>
                    {synergies.filter(s => s.status === 'pending').map(synergy => (
                        <motion.div
                            key={synergy.id}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="bg-black/90 backdrop-blur-xl border border-accent/30 p-3 rounded-xl shadow-2xl space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                                <span className="text-[9px] font-black uppercase text-white">Sinergia Detectada</span>
                            </div>
                            <p className="text-[8px] text-white/60 leading-tight">{synergy.description}</p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAcceptSynergy(synergy)}
                                    className="flex-1 py-1 bg-accent text-white text-[8px] font-bold uppercase rounded hover:bg-accent/80 transition-colors"
                                >
                                    Aceptar
                                </button>
                                <button 
                                    onClick={() => handleRejectSynergy(synergy.id)}
                                    className="px-2 py-1 bg-white/5 text-white/40 text-[8px] font-bold uppercase rounded hover:bg-white/10"
                                >
                                    X
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Overlay de Interfaz */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-red-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">UAI Habitat: Online</span>
                </div>
                {activeSynergyId && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-accent/20 border border-accent/50 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                        <Share2 className="w-3 h-3 text-accent animate-spin" />
                        <span className="text-[9px] font-black uppercase text-accent">Sinergia en Proceso...</span>
                    </motion.div>
                )}
            </div>

            {/* Botón de Emergencia */}
            <div className="absolute bottom-4 right-4">
                <button className="w-12 h-12 bg-red-600 rounded-full border-4 border-red-800 shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group/btn">
                    <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-red-700 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white group-hover/btn:animate-ping">!</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
