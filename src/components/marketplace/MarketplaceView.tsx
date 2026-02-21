'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Download, Lock, Unlock, Search, Filter } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    role: string;
    description: string;
    price_credits: number;
    category: string;
    downloads?: number;
    rating?: number;
}

export default function MarketplaceView() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [purchased, setPurchased] = useState<string[]>([]);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMarketplaceData();
    }, []);

    const fetchMarketplaceData = async () => {
        try {
            const [templatesRes, purchasedRes, creditsRes] = await Promise.all([
                fetch('/api/marketplace?action=templates'),
                fetch('/api/marketplace?action=purchased'),
                fetch('/api/marketplace?action=credits')
            ]);

            if (templatesRes.ok) {
                const data = await templatesRes.json();
                setTemplates(data.templates || []);
            }

            if (purchasedRes.ok) {
                const data = await purchasedRes.json();
                setPurchased(data.map((t: any) => t.id));
            }

            if (creditsRes.ok) {
                const data = await creditsRes.json();
                setCredits(data.credits || 0);
            }
        } catch (error) {
            console.error('Error fetching marketplace data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (templateId: string, price: number) => {
        if (credits < price) {
            alert('Créditos insuficientes');
            return;
        }

        try {
            const res = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId })
            });

            if (res.ok) {
                setPurchased([...purchased, templateId]);
                setCredits(credits - price);
                alert('Template adquirido exitosamente');
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error purchasing template:', error);
            alert('Error al adquirir el template');
        }
    };

    const categories = ['all', ...new Set(templates.map(t => t.category))];
    const filteredTemplates = templates.filter(t => {
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-accent" />
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Marketplace</h1>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                        <span className="text-sm text-white/60">Créditos disponibles:</span>
                        <span className="font-bold text-lg text-accent">{credits}</span>
                    </div>
                </div>

                {/* Search y Filtros */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Buscar templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:border-accent/50 focus:ring-0"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-accent text-white'
                                        : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                                }`}
                            >
                                {cat === 'all' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid de Templates */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-accent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/60">Cargando marketplace...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {filteredTemplates.map((template, idx) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 hover:border-accent/30 transition-all group"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white group-hover:text-accent transition-colors">{template.name}</h3>
                                            <p className="text-xs text-white/40 mt-1">{template.role}</p>
                                        </div>
                                        <div className="text-right">
                                            {purchased.includes(template.id) ? (
                                                <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                                                    <Unlock className="w-3 h-3" />
                                                    Adquirido
                                                </div>
                                            ) : (
                                                <div className="text-accent font-bold text-sm">{template.price_credits} ⭐</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Descripción */}
                                    <p className="text-xs text-white/60 mb-4 line-clamp-2">{template.description}</p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mb-4 text-xs text-white/40">
                                        {template.downloads && (
                                            <div className="flex items-center gap-1">
                                                <Download className="w-3 h-3" />
                                                {template.downloads}
                                            </div>
                                        )}
                                        {template.rating && (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                {template.rating.toFixed(1)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Categoría */}
                                    <div className="mb-4">
                                        <span className="inline-block px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/60">
                                            {template.category}
                                        </span>
                                    </div>

                                    {/* Botón */}
                                    {purchased.includes(template.id) ? (
                                        <button
                                            disabled
                                            className="w-full py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-500 text-xs font-bold cursor-default"
                                        >
                                            ✓ Adquirido
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePurchase(template.id, template.price_credits)}
                                            disabled={credits < template.price_credits}
                                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                                                credits < template.price_credits
                                                    ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
                                                    : 'bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30'
                                            }`}
                                        >
                                            {credits < template.price_credits ? 'Créditos insuficientes' : 'Adquirir'}
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filteredTemplates.length === 0 && (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/60">No se encontraron templates</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
