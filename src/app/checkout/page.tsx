'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cpu, CheckCircle2, CreditCard, Shield, Zap, Rocket, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Globe } from 'lucide-react';

import { PAYMENT_PLANS, PAYMENT_PROVIDERS } from '@/lib/payments.config';

type PlanId = 'essentials' | 'professional';

export default function CheckoutPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <CheckoutPage />
        </Suspense>
    );
}

function CheckoutPage() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') as PlanId | null;
    const userId = searchParams.get('userId');

    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState<'GLOBAL' | 'LATAM'>('GLOBAL');

    useEffect(() => {
        if (!plan || !userId || !PAYMENT_PLANS[plan as keyof typeof PAYMENT_PLANS]) {
            window.location.href = '/registro';
        }
    }, [plan, userId]);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const provider = region === 'GLOBAL' ? PAYMENT_PROVIDERS.STRIPE : PAYMENT_PROVIDERS.MERCADOPAGO;
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan, provider, userId }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error al iniciar checkout: ' + (data.error || 'Desconocido'));
                setLoading(false);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error de conexión');
            setLoading(false);
        }
    };

    if (!plan || !PAYMENT_PLANS[plan as keyof typeof PAYMENT_PLANS]) return null;

    const selectedPlan = PAYMENT_PLANS[plan as keyof typeof PAYMENT_PLANS];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-accent font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.1)_0,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Header */}
            <header className="w-full h-20 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-20">
                <Link href="/" className="flex items-center gap-3">
                    <Cpu className="text-accent w-8 h-8" />
                    <span className="text-2xl font-bold tracking-tighter gold-text-gradient">UAI PLATFORM</span>
                </Link>
                <div className="flex items-center gap-3 text-white/20 text-xs font-bold uppercase tracking-widest">
                    <Shield className="w-4 h-4" />
                    Pago Seguro
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-10"
                >
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-5 py-2 border border-accent/20 rounded-full bg-accent/5 backdrop-blur-xl">
                            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">CHECKOUT SEGURO</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
                            Completa Tu <span className="gold-text-gradient">Suscripción.</span>
                        </h1>
                        <p className="text-white/40 text-lg max-w-2xl mx-auto">
                            Estás a un paso de desbloquear el poder completo de UAI Platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Plan Summary */}
                        <div className="glass-card p-8 space-y-6 border-accent bg-accent/5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedPlan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black font-mono">
                                        {region === 'GLOBAL' ? `$${(selectedPlan as any).price}` : `$${(selectedPlan as any).mpPrice?.toLocaleString()}`}
                                    </span>
                                    <span className="text-white/40 text-sm font-bold">/{region === 'GLOBAL' ? 'mes' : 'h approx'}</span>
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            <ul className="space-y-4">
                                {selectedPlan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Payment Form Placeholder */}
                        <div className="glass-card p-8 space-y-6 border-white/10">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-accent" />
                                <h3 className="text-xl font-black uppercase tracking-tight">Método de Pago</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Region Selector */}
                                <div className="bg-white/5 p-1 rounded-full flex relative mb-6">
                                    <div className={`absolute inset-y-1 w-1/2 bg-accent/20 rounded-full transition-all duration-300 ${region === 'GLOBAL' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-full'}`} />
                                    <button
                                        onClick={() => setRegion('GLOBAL')}
                                        className={`relative z-10 w-1/2 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${region === 'GLOBAL' ? 'text-white' : 'text-white/40'}`}
                                    >
                                        <Globe className="w-3 h-3" /> Global (Stripe)
                                    </button>
                                    <button
                                        onClick={() => setRegion('LATAM')}
                                        className={`relative z-10 w-1/2 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${region === 'LATAM' ? 'text-white' : 'text-white/40'}`}
                                    >
                                        <CreditCard className="w-3 h-3" /> LATAM (M. Pago)
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center space-y-3">
                                    <Zap className="w-12 h-12 mx-auto text-accent" />
                                    <p className="text-sm text-white/60">
                                        Serás redirigido a la pasarela de pago seleccionada para completar el proceso de forma segura.
                                    </p>
                                    <p className="text-xs text-white/40">
                                        Tras el pago, tu cuenta será activada automáticamente.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full py-5 rounded-2xl bg-primary text-white font-black shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-lg tracking-widest uppercase flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            CONTINUAR AL DASHBOARD
                                            <Rocket className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest">
                                    Pago seguro encriptado con SSL
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-8 pt-10 opacity-40">
                        <Shield className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">Pago 100% Seguro</span>
                        <div className="h-4 w-px bg-white/20" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cancela en Cualquier Momento</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
