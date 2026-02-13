'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Globe, CreditCard, Zap, Rocket, Shield } from 'lucide-react';
import { PAYMENT_PLANS, PAYMENT_PROVIDERS } from '@/lib/payments.config';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan: string;
}

export default function PricingModal({ isOpen, onClose, currentPlan }: PricingModalProps) {
    const [region, setRegion] = useState<'GLOBAL' | 'LATAM'>('GLOBAL');
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleUpgrade = async (planId: string) => {
        setLoadingPlan(planId);
        try {
            const provider = region === 'GLOBAL' ? PAYMENT_PROVIDERS.STRIPE : PAYMENT_PROVIDERS.MERCADOPAGO;
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, provider }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error al iniciar checkout: ' + (data.error || 'Desconocido'));
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error de conexión');
        } finally {
            setLoadingPlan(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Mejora tu Plan</h2>
                            <p className="text-white/40 text-sm">Desbloquea el verdadero poder de la orquestación</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white/40" />
                        </button>
                    </div>

                    {/* Region Selector */}
                    <div className="p-6 pb-0 flex justify-center">
                        <div className="bg-white/5 p-1 rounded-full flex relative">
                            <div className={`absolute inset-y-1 w-1/2 bg-accent/20 rounded-full transition-all duration-300 ${region === 'GLOBAL' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-full'}`} />
                            <button
                                onClick={() => setRegion('GLOBAL')}
                                className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${region === 'GLOBAL' ? 'text-white' : 'text-white/40'}`}
                            >
                                <Globe className="w-3 h-3" /> Global (Stripe)
                            </button>
                            <button
                                onClick={() => setRegion('LATAM')}
                                className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${region === 'LATAM' ? 'text-white' : 'text-white/40'}`}
                            >
                                <CreditCard className="w-3 h-3" /> LATAM (Mercado Pago)
                            </button>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                        {/* Essentials */}
                        <div className="glass-card p-6 border-accent/30 bg-accent/5 rounded-2xl space-y-6 relative overflow-hidden group hover:border-accent/50 transition-all">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Recomendado</span>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Essentials</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black font-mono text-white">
                                        {region === 'GLOBAL' ? '$29' : '$29.000'}
                                    </span>
                                    <span className="text-white/40 text-xs font-bold">/{region === 'GLOBAL' ? 'mes' : 'h approx'}</span>
                                </div>
                                <p className="text-xs text-white/50">Para creadores y early adopters.</p>
                            </div>
                            <ul className="space-y-3">
                                {['Agentes Ilimitados', 'Modelos SOTA (GPT-4, Claude 3)', 'Prioridad Alta', 'Soporte por Email'].map(feat => (
                                    <li key={feat} className="flex items-center gap-2 text-xs text-white/70">
                                        <CheckCircle2 className="w-4 h-4 text-accent" /> {feat}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleUpgrade('essentials')}
                                disabled={loadingPlan !== null || currentPlan === 'essentials'}
                                className="w-full py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingPlan === 'essentials' ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                                {currentPlan === 'essentials' ? 'Plan Actual' : 'Activar Essentials'}
                            </button>
                        </div>

                        {/* Professional */}
                        <div className="glass-card p-6 border-white/10 bg-white/[0.02] rounded-2xl space-y-6 hover:border-white/20 transition-all">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">Professional</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black font-mono text-white">
                                        {region === 'GLOBAL' ? '$79' : '$79.000'}
                                    </span>
                                    <span className="text-white/40 text-xs font-bold">/{region === 'GLOBAL' ? 'mes' : 'h approx'}</span>
                                </div>
                                <p className="text-xs text-white/50">Para power users y agencias.</p>
                            </div>
                            <ul className="space-y-3">
                                {['Todo en Essentials', 'API Access', 'Fine-tuning', 'Soporte 24/7 Dedicado', 'Early Access Features'].map(feat => (
                                    <li key={feat} className="flex items-center gap-2 text-xs text-white/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" /> {feat}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleUpgrade('professional')}
                                disabled={loadingPlan !== null || currentPlan === 'professional'}
                                className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingPlan === 'professional' ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                                {currentPlan === 'professional' ? 'Plan Actual' : 'Activar Professional'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
