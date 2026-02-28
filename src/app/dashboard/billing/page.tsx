'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Zap, Rocket, Check, History, TrendingUp, Activity, Star } from 'lucide-react';
import { useDashboard } from '@/components/dashboard/DashboardContext';
import { PAYMENT_PLANS } from '@/lib/payments.config';

interface UsageMetrics {
    plan: string;
    totalCredits: number;
    usedCredits: number;
    availableCredits: number;
    tokenUsageTotal: number;
    usagePercent: number;
}

export default function BillingPage() {
    const { profile } = useDashboard();
    const [loading, setLoading] = useState<string | null>(null);
    const [usage, setUsage] = useState<UsageMetrics | null>(null);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch('/api/user/usage');
                if (!res.ok) return;
                const data = await res.json();
                setUsage(data);
            } catch (error) {
                console.error('Error loading usage metrics:', error);
            }
        };

        fetchUsage();
    }, []);

    const plans = [
        {
            id: 'essentials',
            name: 'Básico',
            price: PAYMENT_PLANS.essentials.price.toString(),
            credits: '1,000',
            features: PAYMENT_PLANS.essentials.features,
            color: 'text-blue-500',
            icon: Zap
        },
        {
            id: 'advanced',
            name: 'Advanced',
            price: PAYMENT_PLANS.advanced.price.toString(),
            credits: '2,500',
            features: PAYMENT_PLANS.advanced.features,
            color: 'text-accent',
            icon: Star,
            popular: true
        },
        {
            id: 'professional',
            name: 'Pro',
            price: PAYMENT_PLANS.professional.price.toString(),
            credits: '5,000',
            features: PAYMENT_PLANS.professional.features,
            color: 'text-red-500',
            icon: Rocket
        }
    ];

    const handleSubscribe = async (planId: string) => {
        setLoading(planId);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, provider: 'stripe' })
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setLoading(null);
        }
    };

    const usagePercent = usage?.usagePercent ?? 0;
    const availableCredits = usage?.availableCredits ?? Number((profile as any)?.total_credits || 0);
    const usedCredits = usage?.usedCredits ?? Number((profile as any)?.used_credits || 0);
    const tokenUsageTotal = usage?.tokenUsageTotal ?? 0;

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    <CreditCard className="w-10 h-10 text-red-500" /> Créditos <span className="text-red-500/50">y Facturación</span>
                </h1>
                <p className="text-white/40 text-sm font-medium mt-2 max-w-2xl">
                    Gestiona tu consumo real de créditos y tokens por usuario para ajustar el plan según tu operación.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Zap className="w-32 h-32 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                Plan {usage?.plan || (profile as any)?.plan || 'Free'}
                            </div>
                            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Métricas actualizadas en tiempo real</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Créditos Disponibles</p>
                            <h2 className="text-6xl font-black text-white mt-2">
                                {availableCredits} <span className="text-2xl text-white/30">CR</span>
                            </h2>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                            />
                        </div>
                        <p className="text-xs text-white/40 font-medium italic">
                            Has consumido {usagePercent}% de tus créditos. Uso acumulado: {usedCredits} CR.
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white/40">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Consumo</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Tokens totales</span>
                                <span className="text-white font-bold">{tokenUsageTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60">Créditos usados</span>
                                <span className="text-white font-bold">{usedCredits}</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-4 text-white/80">
                        <History className="w-4 h-4" /> Datos de usuario en vivo
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-[#0a0a0a] border ${plan.popular ? 'border-accent/50 shadow-[0_0_40px_rgba(212,175,55,0.1)]' : 'border-white/5'} rounded-3xl p-8 flex flex-col relative overflow-hidden`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-accent text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                                Recomendado
                            </div>
                        )}
                        <div className="space-y-2">
                            <h3 className={`text-2xl font-black uppercase tracking-tighter ${plan.color}`}>{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">${plan.price}</span>
                                <span className="text-white/40 text-sm font-bold uppercase">/ mes</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 flex-1">
                            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                                <plan.icon className={`w-5 h-5 ${plan.color}`} />
                                <span className="text-sm font-bold text-white">{plan.credits} Créditos <span className="text-white/40 font-normal">incluidos</span></span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                                        <Check className={`w-4 h-4 ${plan.color}`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={loading === plan.id}
                            className={`mt-8 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                plan.popular
                                    ? 'bg-accent text-white hover:bg-accent/80 shadow-xl'
                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                            }`}
                        >
                            {loading === plan.id ? <Activity className="w-4 h-4 animate-spin" /> : 'Seleccionar Plan'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
