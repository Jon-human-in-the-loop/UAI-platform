'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, DollarSign, BrainCircuit } from 'lucide-react';

interface ROIMetrics {
    hoursSaved: number;
    costSaved: number;
    cognitiveLoadReduction: number;
    efficiencyGain: number;
}

export default function ROIDashboard({ metrics }: { metrics: ROIMetrics }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Horas Ahorradas */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Tiempo</span>
                </div>
                <h3 className="text-3xl font-black text-white">{metrics.hoursSaved}h</h3>
                <p className="text-xs text-white/50">Horas de trabajo manual ahorradas</p>
            </motion.div>

            {/* Ahorro Económico */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                        <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-[10px] font-bold text-green-400 uppercase">Ahorro</span>
                </div>
                <h3 className="text-3xl font-black text-white">${metrics.costSaved}</h3>
                <p className="text-xs text-white/50">Valor estimado del tiempo recuperado</p>
            </motion.div>

            {/* Reducción de Carga Cognitiva */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Carga Mental</span>
                </div>
                <h3 className="text-3xl font-black text-white">-{metrics.cognitiveLoadReduction}%</h3>
                <p className="text-xs text-white/50">Menos decisiones triviales tomadas</p>
            </motion.div>

            {/* Ganancia de Eficiencia */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase">Eficiencia</span>
                </div>
                <h3 className="text-3xl font-black text-white">+{metrics.efficiencyGain}%</h3>
                <p className="text-xs text-white/50">Aumento en la velocidad de entrega</p>
            </motion.div>
        </div>
    );
}
