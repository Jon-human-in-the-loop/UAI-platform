import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Brain, Sparkles, Wand2 } from 'lucide-react';

interface CreateAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (agent: any) => void;
}

const MODELS = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

const ROLES = [
    "Investigador", "Redactor", "Programador", "Analista de Datos", "Asistente Virtual", "Consultor SEO", "Experto en Marketing"
];

export default function CreateAgentModal({ isOpen, onClose, onCreated }: CreateAgentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        model: 'gpt-4-turbo',
        system_prompt: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            if (!res.ok) throw new Error('Error al crear agente');

            const newAgent = await res.json();
            onCreated(newAgent);
            onClose();
            // Reset form
            setFormData({ name: '', role: '', model: 'gpt-4-turbo', system_prompt: '', avatar: '' });
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
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

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                    placeholder="Ej: Alpha One"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-white/50">Rol</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    list="roles-list"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                                    placeholder="Ej: Investigador"
                                />
                                <datalist id="roles-list">
                                    {ROLES.map(r => <option key={r} value={r} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-white/50 flex items-center gap-2">
                                Modelo Base <Brain className="w-3 h-3" />
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, model: model.id })}
                                        className={`px-4 py-3 rounded-lg border text-left transition-all relative overflow-hidden ${formData.model === model.id
                                                ? 'bg-accent/10 border-accent text-white'
                                                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-sm font-bold">{model.name}</div>
                                        <div className="text-[10px] opacity-50">{model.provider}</div>
                                        {formData.model === model.id && (
                                            <motion.div layoutId="model-selected" className="absolute inset-0 border-2 border-accent rounded-lg" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* System Prompt */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-white/50 flex items-center gap-2">
                                Instrucciones Maestras (System Prompt) <Sparkles className="w-3 h-3 text-accent" />
                            </label>
                            <textarea
                                value={formData.system_prompt}
                                onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none text-sm font-mono"
                                placeholder="Define la personalidad, habilidades y limitaciones de tu agente. Ej: Eres un experto en marketing digital sarcástico..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
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
