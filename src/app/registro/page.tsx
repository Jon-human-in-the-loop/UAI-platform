'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cpu, CheckCircle2, Mail, Lock, User, ArrowRight, Sparkles, Shield, Zap, Rocket, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type PlanId = 'free' | 'essentials' | 'advanced' | 'professional';

const plans: { id: PlanId; name: string; price: string; period: string; badge?: string; features: string[]; highlight: boolean; cta: string }[] = [
    {
        id: 'free', name: 'UAI Free', price: '$0', period: '/siempre',
        features: ['Orquestación de 1 Agente', 'Modelos Ultra-Rápidos', 'Límite: 5 consultas/hora', 'Comunidad Open-Source'],
        highlight: false, cta: 'Comenzar Gratis'
    },
    {
        id: 'essentials', name: 'Básico', price: '$9', period: '/mes',
        badge: 'RECOMENDADO',
        features: ['Orquestación de 2 Agentes', 'Memoria Cognitiva Persistente', 'Prioridad en Razonamiento', 'Tokens a Coste Directo (0% Margen)', 'Capacidad: 50 consultas/hora'],
        highlight: true, cta: 'Activar Essentials'
    },
    {
        id: 'advanced', name: 'Advanced', price: '$29', period: '/mes',
        features: ['Hasta 5 Agentes Coordinados', 'Soporte Multi-Canal Full', 'Analítica ROI Avanzada', 'Prioridad de Cómputo Alta'],
        highlight: false, cta: 'Activar Advanced'
    },
    {
        id: 'professional', name: 'Pro', price: '$79', period: '/mes',
        features: ['Agentes Ilimitados', 'Auto-Sanación Neural', 'Memoria Cognitiva Infinita', 'Soporte Prioritario 24/7', 'Margen Plataforma: solo 5%'],
        highlight: false, cta: 'Activar Professional'
    }
];

export default function RegistroPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <RegistroPage />
        </Suspense>
    );
}

function RegistroPage() {
    const searchParams = useSearchParams();
    const planFromUrl = searchParams.get('plan') as PlanId | null;

    const [step, setStep] = useState<'plan' | 'account'>(planFromUrl ? 'account' : 'plan');
    const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(planFromUrl || null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectPlan = (planId: PlanId) => {
        setSelectedPlan(planId);
        setStep('account');
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!selectedPlan || !name || !email || !password) return;
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, plan: selectedPlan })
            });

            if (res.ok) {
                const data = await res.json();
                setSuccess(true);

                if (data.requiresPayment) {
                    setTimeout(() => {
                        window.location.href = data.checkoutUrl;
                    }, 2000);
                } else {
                    try {
                        const loginRes = await signIn('credentials', {
                            email,
                            password,
                            redirect: false,
                        });

                        if (loginRes?.error) {
                            console.error('Auto-login error:', loginRes.error);
                            setTimeout(() => {
                                window.location.href = '/login';
                            }, 2000);
                        } else {
                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1500);
                        }
                    } catch (err) {
                        console.error('SignIn catch error:', err);
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    }
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Error al crear la cuenta');
            }
        } catch (err) {
            console.error('Registration Exception:', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlanData = plans.find(p => p.id === selectedPlan);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-accent font-sans relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.1)_0,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <header className="w-full h-20 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-20">
                <Link href="/" className="flex items-center gap-3 group">
                    <ChevronLeft className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                    <Cpu className="text-accent w-8 h-8" />
                    <span className="text-2xl font-bold tracking-tighter gold-text-gradient">UAI PLATFORM</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">
                        Ya tengo cuenta
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <AnimatePresence mode="wait">
                    {step === 'plan' && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-16"
                        >
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center gap-2 px-5 py-2 border border-accent/20 rounded-full bg-accent/5 backdrop-blur-xl">
                                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">PASO 1 DE 2</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                                    Elige Tu <span className="gold-text-gradient">Poder.</span>
                                </h1>
                                <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
                                    Cada plan te da acceso inmediato a la plataforma. Empieza gratis o desbloquea el potencial completo desde el primer día.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {plans.map((plan) => (
                                    <motion.div
                                        key={plan.id}
                                        whileHover={{ y: -8 }}
                                        className={`relative rounded-[32px] p-8 space-y-6 border cursor-pointer transition-all duration-300 flex flex-col ${plan.highlight
                                            ? 'border-accent bg-accent/5 shadow-[0_0_60px_rgba(139,0,0,0.2)] scale-105 z-10'
                                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                            }`}
                                        onClick={() => handleSelectPlan(plan.id)}
                                    >
                                        {plan.badge && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                                                {plan.badge}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`font-black font-mono ${plan.highlight ? 'text-5xl' : 'text-4xl'}`}>{plan.price}</span>
                                            <span className="text-white/30 text-sm font-bold">{plan.period}</span>
                                        </div>
                                        <ul className="flex-1 space-y-3">
                                            {plan.features.map(f => (
                                                <li key={f} className={`flex items-center gap-3 text-[11px] ${plan.highlight ? 'text-white/80' : 'text-white/40'}`}>
                                                    {plan.highlight
                                                        ? <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                                                        : <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
                                                    }
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${plan.highlight
                                            ? 'bg-primary text-white shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:scale-105 active:scale-95'
                                            : 'bg-white/5 text-white hover:bg-white/10'
                                            }`}>
                                            {plan.cta}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center gap-3 text-white/20 text-xs font-bold uppercase tracking-widest">
                                    <Shield className="w-4 h-4" />
                                    Sin Tarjeta de Crédito Para Plan Free · Cancela en Cualquier Momento
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'account' && (
                        <motion.div
                            key="account"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-lg mx-auto space-y-10"
                        >
                            <button onClick={() => setStep('plan')} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Cambiar plan
                            </button>

                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center gap-2 px-5 py-2 border border-accent/20 rounded-full bg-accent/5 backdrop-blur-xl">
                                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">PASO 2 DE 2</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                                    Crea Tu Cuenta.
                                </h1>
                                {selectedPlanData && (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${selectedPlanData.highlight ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/60'
                                        }`}>
                                        <Zap className="w-4 h-4" />
                                        <span className="text-sm font-bold">{selectedPlanData.name} — {selectedPlanData.price}{selectedPlanData.period}</span>
                                    </div>
                                )}
                            </div>

                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-6 py-16"
                                >
                                    <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter">¡Cuenta Creada!</h2>
                                    <p className="text-white/40">Redirigiendo para sincronizar acceso...</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleCreateAccount} className="space-y-6">
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-xs text-center font-bold flex items-center justify-center gap-2"
                                            >
                                                <Shield className="w-4 h-4" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="glass-card p-8 space-y-6 border-white/10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Nombre Completo</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Email Corporativo</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    required
                                                    type="email"
                                                    placeholder="john@uai.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Contraseña Maestra</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input
                                                    required
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={loading}
                                            className="w-full group relative overflow-hidden py-5 rounded-xl bg-primary text-white font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(139,0,0,0.3)] disabled:opacity-50"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-3">
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        Crear Mi Cuenta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-center text-white/20 uppercase tracking-widest leading-relaxed">
                                        Al registrarte, aceptas nuestros <span className="text-white/40">Términos de Servicio</span> y <span className="text-white/40">Política de Privacidad</span>.
                                    </p>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
