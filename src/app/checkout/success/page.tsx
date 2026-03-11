'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Rocket, Sparkles, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = '/dashboard';
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8 max-w-lg mx-auto px-6"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center"
                >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>

                {/* Title */}
                <div className="space-y-3">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-green-500/20 rounded-full bg-green-500/5"
                    >
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Pago Confirmado</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl md:text-5xl font-black tracking-tighter uppercase"
                    >
                        Bienvenido a <span className="gold-text-gradient">UAI Platform</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/40 text-lg"
                    >
                        Tu suscripción ha sido activada exitosamente. Tu flota de agentes IA está lista para operar.
                    </motion.p>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-4"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-black text-lg tracking-widest uppercase shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Rocket className="w-5 h-5" />
                        Ir al Dashboard
                    </Link>

                    <p className="text-xs text-white/20">
                        Redirigiendo automáticamente en {countdown} segundos...
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
