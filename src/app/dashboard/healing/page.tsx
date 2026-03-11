'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Zap, Activity, RefreshCw, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import HealingStats from '@/components/healing/HealingStats';

interface HealingEvent {
    id: string;
    error_type: string;
    strategy: string;
    recovered: boolean;
    timestamp: string;
}

const STRATEGIES = [
    {
        name: 'Rate Limit Recovery',
        desc: 'Cambio automático de modelo ante cuotas agotadas. Fallback inteligente a modelos alternativos sin interrumpir la ejecución.',
        effectiveness: 96,
        color: 'blue',
    },
    {
        name: 'JSON Repair',
        desc: 'Corrección de sintaxis en tiempo real para outputs de LLM. Detecta y repara JSON malformado antes de procesar.',
        effectiveness: 99,
        color: 'green',
    },
    {
        name: 'Context Compression',
        desc: 'Resumen inteligente cuando se excede el límite de tokens. Preserva la información crítica y descarta el ruido.',
        effectiveness: 91,
        color: 'purple',
    },
    {
        name: 'Retry with Backoff',
        desc: 'Reintentos exponenciales con jitter para errores transitorios de red o API. Máximo 3 reintentos antes de escalar.',
        effectiveness: 88,
        color: 'orange',
    },
    {
        name: 'Graceful Degradation',
        desc: 'Cuando un agente falla, las tareas se redistribuyen automáticamente entre agentes disponibles del enjambre.',
        effectiveness: 94,
        color: 'yellow',
    },
];

const DEMO_EVENTS: HealingEvent[] = [
    { id: '1', error_type: 'RATE_LIMIT', strategy: 'MODEL_FALLBACK', recovered: true, timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '2', error_type: 'JSON_PARSE_ERROR', strategy: 'JSON_REPAIR', recovered: true, timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: '3', error_type: 'CONTEXT_OVERFLOW', strategy: 'CONTEXT_COMPRESSION', recovered: true, timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: '4', error_type: 'NETWORK_TIMEOUT', strategy: 'RETRY_BACKOFF', recovered: true, timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
    { id: '5', error_type: 'AGENT_CRASH', strategy: 'GRACEFUL_DEGRADATION', recovered: false, timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
];

export default function HealingPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-green-500" />
                        Auto-Sanación <span className="text-green-500/50">Neural</span>
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        Monitorea la resiliencia de tus agentes y las estrategias de recuperación aplicadas automáticamente.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Sistema Activo</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HealingStats />
            </div>

            {/* Estrategias de Recuperación */}
            <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Estrategias de Recuperación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STRATEGIES.map((strategy, idx) => (
                        <motion.div
                            key={strategy.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white">{strategy.name}</h3>
                                <span className={`text-xs font-black ${
                                    strategy.effectiveness >= 95 ? 'text-green-500' :
                                    strategy.effectiveness >= 90 ? 'text-blue-500' : 'text-yellow-500'
                                }`}>
                                    {strategy.effectiveness}%
                                </span>
                            </div>
                            <p className="text-[11px] text-white/40 leading-relaxed">{strategy.desc}</p>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${strategy.effectiveness}%` }}
                                    transition={{ duration: 1, delay: idx * 0.15 }}
                                    className={`h-full rounded-full ${
                                        strategy.color === 'blue' ? 'bg-blue-500' :
                                        strategy.color === 'green' ? 'bg-green-500' :
                                        strategy.color === 'purple' ? 'bg-purple-500' :
                                        strategy.color === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'
                                    }`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Historial de Eventos */}
            <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-white/40" />
                    Historial de Eventos Recientes
                </h2>
                <div className="space-y-3">
                    {DEMO_EVENTS.map((event, idx) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all"
                        >
                            {/* Status Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                event.recovered ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                                {event.recovered
                                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    : <XCircle className="w-5 h-5 text-red-500" />
                                }
                            </div>

                            {/* Error Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white uppercase">{event.error_type.replace(/_/g, ' ')}</span>
                                    <ArrowRight className="w-3 h-3 text-white/20" />
                                    <span className="text-xs font-bold text-accent/80 uppercase">{event.strategy.replace(/_/g, ' ')}</span>
                                </div>
                                <span className="text-[10px] text-white/30 font-mono">
                                    {new Date(event.timestamp).toLocaleString()}
                                </span>
                            </div>

                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                                event.recovered
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                                {event.recovered ? 'Recuperado' : 'Escalado'}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
