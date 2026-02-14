'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, Brain, Activity, Settings } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    role: string;
    model: string;
    level: number;
    xp: number;
    avatar?: string;
}

interface AgentCardProps {
    agent: Agent;
    onSelect?: (agent: Agent) => void;
}

export default function AgentCard({ agent, onSelect }: AgentCardProps) {
    const xpPercentage = (agent.xp / (agent.level * 1000)) * 100;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect?.(agent)}
            className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-accent/50 transition-all cursor-pointer overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
                <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {agent.avatar ? (
                            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                            <Bot className="w-8 h-8 text-white/40 group-hover:text-accent transition-colors" />
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">
                            {agent.name}
                        </h3>
                        <p className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full inline-block mt-1 border border-white/5">
                            {agent.role}
                        </p>
                    </div>
                </div>

                {/* Level Badge */}
                <div className="flex flex-col items-end">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Nivel</span>
                    <span className="text-2xl font-mono text-accent font-bold">{agent.level}</span>
                </div>
            </div>

            {/* Stats / Model */}
            <div className="mt-6 space-y-4 relative z-10">
                {/* Model */}
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <Brain className="w-3 h-3" />
                    <span className="uppercase tracking-wider">Cerebro:</span>
                    <span className="text-white/80 font-mono">{agent.model}</span>
                </div>

                {/* XP Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40 uppercase font-bold tracking-wider">
                        <span>XP</span>
                        <span>{agent.xp} / {agent.level * 1000}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-accent relative"
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Hover Actions Hint */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <Settings className="w-4 h-4 text-white/20 hover:text-white transition-colors" />
            </div>
        </motion.div>
    );
}
