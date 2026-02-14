'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bot, Search, Loader2 } from 'lucide-react';
import AgentCard from '@/components/agents/AgentCard';
import CreateAgentModal from '@/components/agents/CreateAgentModal';

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentCreated = (newAgent: any) => {
        setAgents([newAgent, ...agents]);
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        Comando de <span className="text-accent">Agentes</span>
                    </h1>
                    <p className="text-white/40">Gestiona, entrena y despliega tus unidades de inteligencia artificial.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-accent hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Nuevo Agente</span>
                </button>
            </div>

            {/* Search & Filters */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            ) : filteredAgents.length > 0 ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredAgents.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onSelect={(a) => console.log('Selected:', a)}
                        />
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <Bot className="w-10 h-10 text-white/20" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">No tienes agentes activos</h3>
                        <p className="text-white/40 max-w-sm mx-auto mt-2">
                            Comienza creando tu primer agente para delegar tareas y automatizar procesos.
                        </p>
                    </div>
                </div>
            )}

            <CreateAgentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={handleAgentCreated}
            />
        </div>
    );
}
