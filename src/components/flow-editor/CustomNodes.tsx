'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { Brain, Cpu, ShieldCheck, Zap } from 'lucide-react';

const UaiNode = ({ data, selected }: NodeProps) => {
    const isAnalizador = data.label.includes('Analizador');
    const isEjecutor = data.label.includes('Ejecutor');
    const isValidador = data.label.includes('Validador');
    const isReflexion = data.label.includes('Reflexión');

    const getIcon = () => {
        if (isAnalizador) return <Brain className="w-5 h-5 text-blue-400" />;
        if (isEjecutor) return <Cpu className="w-5 h-5 text-yellow-400" />;
        if (isValidador) return <ShieldCheck className="w-5 h-5 text-red-400" />;
        if (isReflexion) return <Zap className="w-5 h-5 text-green-400" />;
        return <Brain className="w-5 h-5 text-white" />;
    };

    const getBorderColor = () => {
        if (isAnalizador) return 'border-blue-500/50';
        if (isEjecutor) return 'border-yellow-500/50';
        if (isValidador) return 'border-red-500/50';
        if (isReflexion) return 'border-green-500/50';
        return 'border-gray-500/50';
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-4 py-3 rounded-xl bg-[#14161a] border-2 ${getBorderColor()} ${selected ? 'shadow-[0_0_20px_rgba(212,175,55,0.3)] border-yellow-500' : ''} text-white min-w-[200px] flex items-center gap-3 relative overflow-hidden group`}
        >
            {/* Glow Background */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none ${isAnalizador ? 'bg-blue-500' : isEjecutor ? 'bg-yellow-500' : isValidador ? 'bg-red-500' : 'bg-green-500'}`} />

            <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                {getIcon()}
            </div>

            <div className="flex flex-col">
                <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Node Type</span>
                <span className="text-sm font-medium tracking-tight uppercase">{data.label}</span>
            </div>

            <Handle type="target" position={Position.Left} className="!bg-white/20 !border-white/10" />
            <Handle type="source" position={Position.Right} className="!bg-white/20 !border-white/10" />
        </motion.div>
    );
};

export default memo(UaiNode);
