'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Globe, CreditCard, Zap, Rocket, Shield, Star } from 'lucide-react';
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

    const plans = [
        { id: 'essentials', config: PAYMENT_PLANS.essentials, icon: Zap, color: 'text-blue-400', border: 'border-blue-500/20' },
        { id: 'advanced', config: PAYMENT_PLANS.advanced, icon: Star, color: 'text-accent', border: 'border-accent', recommended: true },
        { id: 'professional', config: PAYMENT_PLANS.professional, icon: Rocket, color: 'text-red-500', border: 'border-red-500/20' }
    ];

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
                    className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Mejora tu plan</h2>
                            <p className="text-white/40 text-sm">Desbloquea el verdadero poder de la orquestación</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white/40" />
                        </button>
                    </div>

                    {/* Region Selector */}
                    <div className="p-6 pb-0 flex justify-center">
                        <div className="bg-white/5 p-1 rounded-full flex relative">
                            <div className={`absolute inset-y-1 w-1/2 bg-red-500/20 rounded-full transition-all duration-300 ${region === 'GLOBAL' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-full'}`} />
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
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                        {plans.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`glass-card p-6 ${plan.border} ${plan.recommended ? 'bg-accent/5 scale-105' : 'bg-white/[0.02]'} rounded-2xl space-y-6 flex flex-col relative overflow-hidden group hover:border-white/30 transition-all`}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 right-0 p-3">
                                        <span className="bg-accent text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Recomendado</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h3 className={`text-xl font-bold ${plan.recommended ? 'text-white' : 'text-white/80'}`}>{plan.config.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black font-mono text-white">
                                            {region === 'GLOBAL' ? `$${plan.config.price}` : `$${plan.config.price * 1000}`}
                                        </span>
                                        <span className="text-white/40 text-[10px] font-bold">/mes</span>
                                    </div>
                                </div>
                                <ul className="space-y-3 flex-1">
                                    {plan.config.features.map(feat => (
                                        <li key={feat} className="flex items-center gap-2 text-[11px] text-white/70">
                                            <CheckCircle2 className={`w-4 h-4 ${plan.recommended ? 'text-accent' : 'text-white/20'}`} /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlan !== null || currentPlan === plan.id}
                                    className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs uppercase tracking-widest ${
                                        plan.recommended 
                                        ? 'bg-accent text-white hover:bg-accent/80 shadow-lg shadow-accent/20' 
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    {loadingPlan === plan.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <plan.icon className="w-4 h-4" />}
                                    {currentPlan === plan.id ? 'Plan Actual' : `Activar ${plan.config.name}`}
                                </button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
