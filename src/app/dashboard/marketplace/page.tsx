'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Bot, Zap, Code, BarChart3, Briefcase, Plus, Check, Star, Rocket, Activity, AlertCircle } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';

interface Template {
    id: string;
    name: string;
    role: string;
    description: string;
    model: string;
    system_prompt: string;
    skills: string[];
    category: 'marketing' | 'development' | 'data' | 'business';
    price_credits: number;
}

export default function MarketplacePage() {
    const { profile, refreshProfile } = useDashboard();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tRes, pRes] = await Promise.all([
                fetch('/api/marketplace?action=templates'),
                fetch('/api/marketplace?action=purchased')
            ]);

            const tData = await tRes.json();
            const pData = await pRes.json();

            if (tData.success) {
                setTemplates(tData.templates || []);
            } else if (Array.isArray(tData)) {
                setTemplates(tData);
            } else {
                setError('No se pudieron cargar los templates');
            }

            if (Array.isArray(pData)) {
                setPurchasedIds(pData.map(p => p.id));
            }
        } catch (err) {
            console.error('Error loading marketplace:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (template: Template) => {
        if (purchasingId) return;
        setPurchasingId(template.id);
        
        try {
            const res = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: template.id })
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                setPurchasedIds(prev => [...prev, template.id]);
                refreshProfile();
            } else {
                alert(data.error || 'Error al adquirir la plantilla');
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Error de conexión');
        } finally {
            setPurchasingId(null);
        }
    };

    const categories = [
        { id: 'all', name: 'Todos', icon: ShoppingBag },
        { id: 'marketing', name: 'Marketing', icon: Zap },
        { id: 'development', name: 'Desarrollo', icon: Code },
        { id: 'data', name: 'Datos', icon: BarChart3 },
        { id: 'business', name: 'Negocios', icon: Briefcase },
    ];

    const filteredTemplates = selectedCategory === 'all' 
        ? templates 
        : templates.filter(t => t.category === selectedCategory);

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <ShoppingBag className="w-10 h-10 text-red-500" /> Marketplace <span className="text-red-500/50">de Agentes</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium mt-2 max-w-2xl">
                        Adquiere plantillas de agentes pre-optimizados por expertos para tareas específicas. 
                        Cada agente viene con prompts refinados y habilidades integradas.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest leading-none">Tus Créditos</p>
                        <p className="text-xl font-black text-red-500 leading-none mt-1">{(profile as any)?.total_credits || 0}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <button className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                            selectedCategory === cat.id 
                            ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <cat.icon className="w-4 h-4" />
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                        <AnimatePresence>
                            {filteredTemplates.map((template, index) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-red-500/30 transition-all relative overflow-hidden"
                                >
                                    {/* Category Badge */}
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Bot className="w-20 h-20 -rotate-12" />
                                    </div>

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-red-500/50 transition-colors">
                                            <Bot className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] font-black text-yellow-500">PRO</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-red-500 transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{template.role}</p>
                                    </div>

                                    <p className="text-sm text-white/50 leading-relaxed line-clamp-3 relative z-10">
                                        {template.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 relative z-10">
                                        {template.skills.slice(0, 2).map(skill => (
                                            <span key={skill} className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/40 uppercase">
                                                {skill.replace('-skill', '')}
                                            </span>
                                        ))}
                                        {template.skills.length > 2 && (
                                            <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/40 uppercase">
                                                +{template.skills.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Inversión</span>
                                            <span className="text-lg font-black text-white">{template.price_credits} <span className="text-xs text-white/40">CR</span></span>
                                        </div>
                                        
                                        <button
                                            onClick={() => handlePurchase(template)}
                                            disabled={purchasingId === template.id || purchasedIds.includes(template.id)}
                                            className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                purchasedIds.includes(template.id)
                                                ? 'bg-green-500/20 text-green-500 border border-green-500/20'
                                                : 'bg-white/5 hover:bg-red-500 text-white border border-white/10 hover:border-red-500 shadow-xl'
                                            }`}
                                        >
                                            {purchasingId === template.id ? (
                                                <Activity className="w-4 h-4 animate-spin" />
                                            ) : purchasedIds.includes(template.id) ? (
                                                <>
                                                    <Check className="w-4 h-4" /> Adquirido
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="w-4 h-4" /> Clonar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
