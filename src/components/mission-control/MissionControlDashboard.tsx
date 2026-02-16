'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, Target, Activity } from 'lucide-react';

export default function MissionControlDashboard() {
    const [synergies, setSynergies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/mission-control/synergies')
            .then(res => res.json())
            .then(data => {
                setSynergies(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading synergies:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Target className="w-8 h-8 text-red-500" />
                    Mission Control
                </h2>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase">
                        Sistema Activo
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Synergy Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase">Sinergias Detectadas</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">{synergies.length}</h3>
                        <p className="text-xs text-white/60">Nuevas oportunidades de colaboración</p>
                    </div>
                </motion.div>

                {/* Active Missions Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-green-500/20">
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase">Misiones Activas</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">0</h3>
                        <p className="text-xs text-white/60">Agentes trabajando en conjunto</p>
                    </div>
                </motion.div>

                {/* Performance Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase">Eficiencia Colectiva</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-white">--%</h3>
                        <p className="text-xs text-white/60">Basado en misiones completadas</p>
                    </div>
                </motion.div>
            </div>

            {/* Synergies List */}
            <div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Últimas Sinergias</h3>
                </div>
                <div className="p-4">
                    {loading ? (
                        <div className="py-10 text-center text-white/20 animate-pulse">Cargando datos neurales...</div>
                    ) : synergies.length > 0 ? (
                        <div className="space-y-3">
                            {synergies.map((s: any) => (
                                <div key={s.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                            {s.score}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{s.description}</h4>
                                            <p className="text-[10px] text-white/40 uppercase">{s.type}</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition-colors">
                                        CREAR MISIÓN
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-white/20">No se han detectado sinergias aún. Ejecuta más agentes para encontrarlas.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
