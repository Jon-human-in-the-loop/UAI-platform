'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Cpu, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                console.error("Login Result Error:", result.error);
                setError('Credenciales inválidas. Verifica tu email y contraseña.');
                setLoading(false);
            } else {
                // Éxito: Redirigir manualmente
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error("Login Exception:", err);
            setError('Error de conexión con el servidor.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            {/* Fondo con Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-card p-8 space-y-8 relative z-10 border-white/10"
            >
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_10px_30px_rgba(139,0,0,0.3)] mx-auto mb-4">
                        <Cpu className="text-accent w-10 h-10 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-bold gold-text-gradient tracking-tighter">UAI PLATFORM</h1>
                    <p className="text-white/40 text-sm">Ingreso al panel de control cognitivo</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-xs text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-accent/50 transition-colors"
                                    placeholder="admin@uai.ai"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1">Clave de Encriptación</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-accent/50 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-[0_0_30px_rgba(139,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sincronizando...' : 'Iniciar Sesión'}
                    </button>

                    <div className="text-center space-y-2">
                        <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Acceso de seguridad nivel 5</span>
                        <p className="text-sm text-white/40">
                            ¿No tienes cuenta?{' '}
                            <Link href="/registro" className="text-accent hover:text-white transition-colors font-semibold">
                                Crea una gratis
                            </Link>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
