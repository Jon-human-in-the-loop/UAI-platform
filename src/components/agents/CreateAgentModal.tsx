'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Brain, Sparkles, Wand2, Zap, ChevronDown, ChevronUp, Loader2, Briefcase } from 'lucide-react';
import { ALL_MODELS, DEFAULT_AGENT_MODEL } from '@/lib/models';
import { usePromptOptimizer } from '@/hooks/usePromptOptimizer';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (agent: any) => void;
}

const PROVIDER_LABELS: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
};

const PROVIDER_COLORS: Record<string, string> = {
    anthropic: 'text-orange-400',
    openai: 'text-green-400',
    google: 'text-blue-400',
};

const TIER_COLORS: Record<string, string> = {
    experimental: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    premium: 'bg-red-500/20 text-red-400 border-red-500/30',
    balanced: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    fast: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const TIER_LABELS: Record<string, string> = {
    experimental: 'Experimental',
    premium: 'Premium',
    balanced: 'Equilibrado',
    fast: 'Rápido',
};

const ROLES = [
    "SDR Autónomo", "Growth Hacker", "AI Strategist",
    "Arquitecto de Agentes", "Analista de Datos BI", "Evals Engineer",
    "Brand Guardian", "Content Multiplier", "Customer Success",
    "Legal Tech Advisor", "Specialized Researcher", "UX/UI Auditor",
    "DevOps Automator", "Expert Copywriter", "Prompt Engineer"
];


const MODELS_BY_PROVIDER = [
    { key: 'anthropic', label: 'Anthropic / Claude', models: ALL_MODELS.filter(m => m.provider === 'anthropic' && m.available) },
    { key: 'openai', label: 'OpenAI / GPT', models: ALL_MODELS.filter(m => m.provider === 'openai' && m.available) },
    { key: 'google', label: 'Google / Gemini', models: ALL_MODELS.filter(m => m.provider === 'google' && m.available) },
];

export default function CreateAgentModal({ isOpen, onClose, onCreated }: CreateAgentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        model: DEFAULT_AGENT_MODEL,
        system_prompt: '',
        personal_context: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedProvider, setExpandedProvider] = useState<string | null>('anthropic');

    const { isOptimizing, optimizerInput, setOptimizerInput, showOptimizerInput, setShowOptimizerInput, handleOptimize } =
        usePromptOptimizer({
            onSuccess: (prompt) => setFormData(prev => ({ ...prev, system_prompt: prompt })),
            onError: (msg) => setError(msg),
        });

    const selectedModel = ALL_MODELS.find(m => m.id === formData.model);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al crear agente');
            }

            const newAgent = await res.json();
            onCreated(newAgent);
            onClose();
            setFormData({ name: '', role: '', model: DEFAULT_AGENT_MODEL, system_prompt: '', personal_context: '', avatar: '' });
            setExpandedProvider('anthropic');
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg">
                                <Bot className="w-5 h-5 text-accent" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Diseñar Nuevo Agente</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">{error}</div>}

                            {/* Name & Role */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-white/50">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Ej: Alpha One"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-white/50">Rol / Especialidad</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        list="roles-list"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Elige o escribe un rol..."
                                    />
                                    <datalist id="roles-list">
                                        {ROLES.map(r => <option key={r} value={r} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className="space-y-3">
                                <label className="text-xs uppercase font-bold text-white/50 flex items-center gap-2">
                                    <Brain className="w-3 h-3" /> Modelo Base
                                </label>

                                {/* Selected model preview */}
                                {selectedModel && (
                                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{selectedModel.name}</span>
                                                {selectedModel.isNew && (
                                                    <span className="text-[9px] font-black bg-accent text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">Nuevo</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-white/40 mt-0.5">{selectedModel.description}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${TIER_COLORS[selectedModel.tier]}`}>
                                            {TIER_LABELS[selectedModel.tier]}
                                        </span>
                                    </div>
                                )}

                                {/* Provider Accordions */}
                                <div className="space-y-2">
                                    {MODELS_BY_PROVIDER.map(group => (
                                        <div key={group.key} className="border border-white/10 rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedProvider(expandedProvider === group.key ? null : group.key)}
                                                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                                <span className={`text-xs font-bold uppercase tracking-wider ${PROVIDER_COLORS[group.key]}`}>
                                                    {group.label}
                                                </span>
                                                {expandedProvider === group.key ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                                            </button>

                                            <AnimatePresence>
                                                {expandedProvider === group.key && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {group.models.map(model => (
                                                                <button
                                                                    key={model.id}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, model: model.id })}
                                                                    className={`px-4 py-3 rounded-xl border text-left transition-all relative ${formData.model === model.id
                                                                        ? 'bg-accent/10 border-accent'
                                                                        : 'bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/15'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <span className="text-sm font-bold text-white truncate">{model.name}</span>
                                                                                {model.isNew && (
                                                                                    <span className="text-[9px] font-black bg-accent/80 text-white px-1 py-0.5 rounded uppercase shrink-0">Nuevo</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TIER_COLORS[model.tier]}`}>
                                                                                    {TIER_LABELS[model.tier]}
                                                                                </span>
                                                                                {model.priceInUSD !== null && (
                                                                                    <span className="text-[9px] text-white/30 font-mono">
                                                                                        ${model.priceInUSD}/${model.priceOutUSD}/1M
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {formData.model === model.id && (
                                                                            <Zap className="w-3.5 h-3.5 text-accent shrink-0 mt-1" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed line-clamp-2">
                                                                        {model.description}
                                                                    </p>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Personal Context */}
                            <div className="space-y-3">
                                <label className="text-xs uppercase font-bold text-white/50 flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-accent" /> Contexto de Marca / Personal
                                </label>
                                <p className="text-[11px] text-white/40">
                                    Aquí puedes escribir información sobre ti, tu empresa, o el tono específico que deseas. Esto se inyecta en el agente sin modificar sus instrucciones maestras.
                                </p>
                                <textarea
                                    value={formData.personal_context}
                                    onChange={e => setFormData({ ...formData, personal_context: e.target.value })}
                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none text-sm"
                                    placeholder="Ej: 'Me llamo Carlos, vendo seguros en España. Quiero que el agente sea muy cercano, trate de tú y mencione nuestros 20 años de experiencia...'"
                                />
                            </div>

                            {/* System Prompt */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs uppercase font-bold text-white/50 flex items-center gap-2">
                                        Instrucciones Maestras <Sparkles className="w-3 h-3 text-accent" />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowOptimizerInput(!showOptimizerInput)}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-accent hover:text-white border border-accent/30 hover:border-accent/70 px-3 py-1.5 rounded-lg transition-all hover:bg-accent/10"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Generar con IA
                                    </button>
                                </div>

                                {/* Optimizer input */}
                                <AnimatePresence>
                                    {showOptimizerInput && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                                                <p className="text-xs text-white/50">
                                                    ✨ Describe en lenguaje simple qué debe hacer tu agente. La IA generará un System Prompt profesional.
                                                </p>
                                                <textarea
                                                    value={optimizerInput}
                                                    onChange={e => setOptimizerInput(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-accent focus:outline-none resize-none"
                                                    placeholder="Ej: Un agente que ayude a dueños de negocios locales a vender más por redes sociales, con un tono amigable y cercano..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleOptimize(formData.name, formData.role)}
                                                    disabled={isOptimizing || !optimizerInput.trim()}
                                                    className="w-full py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isOptimizing ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                                                    ) : (
                                                        <><Sparkles className="w-4 h-4" /> Optimizar con IA</>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <textarea
                                    value={formData.system_prompt}
                                    onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none text-sm font-mono"
                                    placeholder="Define la personalidad, habilidades y limitaciones de tu agente, o usa 'Generar con IA' para que lo hagamos por ti..."
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-6 pt-0 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : (
                                    <>
                                        <Wand2 className="w-4 h-4" /> Instanciar Agente
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
