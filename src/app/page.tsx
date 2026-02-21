'use client';

import React from 'react';
import { Bot, Cpu, Zap, Layers, Activity, Play, CheckCircle2, Search, ArrowRight, Shield, Globe, Terminal, Sparkles, Rocket, TrendingUp, Star, Code, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-accent font-sans">
            {/* Navbar Landing - Minimal & Premium */}
            <header className="fixed top-0 w-full h-20 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-20">
                <div className="flex items-center gap-3">
                    <Cpu className="text-accent w-8 h-8" />
                    <span className="text-2xl font-bold tracking-tighter gold-text-gradient">UAI PLATFORM</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <a href="#features" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Tecnología</a>
                    <a href="#power" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Orquestación</a>
                    <a href="#community" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Comunidad</a>
                    <a href="#mission" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Mission Control</a>
                    <a href="#pricing" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">Precios</a>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/registro" className="bg-primary px-8 py-2.5 rounded-full text-[10px] font-black shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:scale-105 active:scale-95 transition-all tracking-[0.2em] uppercase">Comenzar ahora</Link>
                </div>
            </header>

            <main>
                {/* Hero Section: The "Irresistible" Hook */}
                <section id="features" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
                    {/* Atmospheric Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.15)_0,transparent_70%)] pointer-events-none" />
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[180px] animate-pulse pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative z-10 max-w-5xl space-y-10"
                    >
                        <div className="inline-flex items-center gap-2 border border-accent/20 px-6 py-2 rounded-full bg-accent/5 backdrop-blur-xl shadow-[0_0_20px_rgba(139,0,0,0.1)]">
                            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-accent">SOTA AGENTIC ENGINE 2026</span>
                        </div>

                        <h1 className="text-7xl md:text-[110px] font-black tracking-tighter leading-[0.9] text-white uppercase italic">
                            Deja de chatear,<br />
                            <span className="gold-text-gradient italic">Empieza a orquestar.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light">
                            Mientras el resto pierde el tiempo con prompts manuales, <span className="text-white font-medium">UAI construye ecosistemas autónomos</span> que piensan, ejecutan y aprenden. Potenciado por la lógica indomable de <span className="text-accent underline decoration-primary/30 underline-offset-8">Claude 3.7</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                            <Link href="/registro" className="w-full sm:w-auto px-12 py-6 bg-white text-black font-black rounded-3xl flex items-center justify-center gap-4 hover:bg-accent hover:text-white transition-all shadow-[0_30px_60px_rgba(255,255,255,0.1)] group text-lg">
                                ACCESO INMEDIATO
                                <Rocket className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <div className="flex items-center gap-3 text-white/30 text-xs font-bold uppercase tracking-widest">
                                <Shield className="w-4 h-4" />
                                Sin tarjeta de crédito requerida
                            </div>
                        </div>
                    </motion.div>

                    {/* Dashboard Preview - Real High Fidelity */}
                    <motion.div
                        initial={{ opacity: 0, y: 150, rotateX: 20 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: 0.5, duration: 1.5 }}
                        className="mt-24 w-full max-w-6xl mx-auto relative group perspective-1000"
                    >
                        <div className="absolute inset-0 bg-accent/20 blur-[150px] -z-10 group-hover:bg-accent/30 transition-all duration-1000" />
                        <div className="rounded-[40px] border border-white/10 bg-black/80 p-3 backdrop-blur-3xl shadow-[0_-40px_100px_rgba(139,0,0,0.3)] overflow-hidden">
                            <div className="aspect-[16/9] rounded-[30px] bg-[#050505] relative flex items-center justify-center border border-white/5">
                                <Terminal className="w-32 h-32 text-accent opacity-5 animate-pulse" />
                                <div className="absolute inset-0 flex flex-col p-10 justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4">
                                            <div className="h-6 w-64 bg-white/10 rounded-lg animate-shimmer" />
                                            <div className="h-4 w-48 bg-white/5 rounded-lg animate-shimmer" />
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-accent/20 animate-pulse" />
                                    </div>
                                    <div className="flex gap-4 overflow-hidden">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-32 w-48 rounded-2xl border border-white/5 bg-white/[0.02]" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* The "Power" Section - Why UAI? */}
                <section id="power" className="py-40 px-6 lg:px-20 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-10">
                                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
                                    La primera <span className="gold-text-gradient underline decoration-accent/20">capa de razonamiento</span> operativa
                                </h2>
                                <p className="text-xl text-white/40 leading-relaxed font-light">
                                    UAI no es otro "wrapper" de API. Es una infraestructura propietaria de <span className="text-white">Persistencia Cognitiva</span>. Tus agentes no solo responden; recuerdan, analizan errores y refinan sus propias estrategias mediante grafos de decisión recursivos.
                                </p>
                                <ul className="space-y-6">
                                    {[
                                        'Orquestación multi-agente en tiempo real',
                                        'Persistencia de estado vía PostgreSQL',
                                        'Auto-sanación neural de procesos',
                                        'Memoria semántica infinita'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-base font-medium text-white/80">
                                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-accent" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { icon: Search, label: 'Deep Research' },
                                    { icon: Code, label: 'Code Execution' },
                                    { icon: Globe, label: 'Market Intelligence' },
                                    { icon: Activity, label: 'Live Monitoring' }
                                ].map((tool, i) => (
                                    <div key={i} className="glass-card p-8 aspect-square flex flex-col justify-end gap-4 hover:border-accent/30 transition-colors group">
                                        <tool.icon className="w-10 h-10 text-white/20 group-hover:text-accent transition-colors" />
                                        <span className="text-sm font-black uppercase tracking-widest">{tool.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Table: The Unbeatable Prices */}
                <section id="pricing" className="py-40 px-6 lg:px-20 bg-white/[0.01] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(139,0,0,0.05)_0,transparent_50%)]" />

                    <div className="text-center space-y-6 mb-24 relative z-10">
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic">
                            Poder elite.<br />
                            <span className="gold-text-gradient">Precio disruptivo.</span>
                        </h2>
                        <p className="text-white/40 text-xl max-w-2xl mx-auto">
                            Hemos eliminado los márgenes abusivos. Accede a la tecnología que domina el mercado al coste de infraestructura.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[90rem] mx-auto relative z-10">
                        {/* Plan Free */}
                        <div className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02] flex flex-col hover:border-white/10 transition-all">
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">UAI Free</h4>
                                <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold">Explorador cognitivo</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black font-mono">$0</span>
                                <span className="text-white/20 text-[10px] font-bold">/siempre</span>
                            </div>
                            <ul className="flex-1 space-y-4">
                                {['Orquestación de 1 agente', 'Modelos ultra-rápidos', 'Límite: 5 consultas/hora', 'Comunidad open-source'].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-[11px] text-white/40">
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=free" className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-all text-center uppercase tracking-widest">EMPEZAR GRATIS</Link>
                        </div>

                        {/* Plan Básico */}
                        <div className="glass-card p-8 space-y-6 border-white/10 bg-white/[0.03] flex flex-col hover:border-accent/20 transition-all">
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">Básico</h4>
                                <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold">Liderazgo de mercado</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black font-mono">$9</span>
                                <span className="text-white/40 text-[10px] font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-4">
                                {[
                                    'Orquestación de 2 agentes',
                                    'Memoria cognitiva persistente',
                                    'Prioridad en razonamiento',
                                    'Tokens a coste directo',
                                    'Capacidad: 50 consultas/hora'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-[11px] text-white/60">
                                        <CheckCircle2 className="w-4 h-4 text-accent/50" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=essentials" className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all text-center uppercase tracking-widest">ACTIVAR BÁSICO</Link>
                        </div>

                        {/* Plan Advanced - THE NEW STAR */}
                        <div className="relative glass-card p-8 space-y-6 border-accent bg-accent/5 scale-105 shadow-[0_0_60px_rgba(139,0,0,0.2)] flex flex-col z-20">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">
                                RECOMENDADO: EARLY ADOPTER
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">Advanced</h4>
                                <p className="text-[8px] text-accent uppercase tracking-[0.3em] font-bold">Poder de orquestación</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black font-mono text-white">$29</span>
                                <span className="text-white/40 text-[10px] font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-4">
                                {[
                                    'Hasta 5 agentes coordinados',
                                    'Soporte Multi-Canal Full',
                                    'Analítica ROI Avanzada',
                                    'Prioridad de Cómputo Alta',
                                    'Acceso a Marketplace Pro'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-[11px] text-white/90">
                                        <CheckCircle2 className="w-4 h-4 text-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=advanced" className="w-full py-5 rounded-xl bg-primary text-white font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-center text-xs tracking-widest uppercase">DOMINAR AHORA</Link>
                        </div>

                        {/* Plan Pro */}
                        <div className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.02] flex flex-col hover:border-white/10 transition-all">
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold uppercase tracking-tighter">Pro</h4>
                                <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold">Competitivo agresivo</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black font-mono">$79</span>
                                <span className="text-white/20 text-[10px] font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-4">
                                {[
                                    'Agentes Ilimitados',
                                    'Auto-sanación neural',
                                    'Memoria cognitiva infinita',
                                    'Soporte prioritario 24/7',
                                    'Margen plataforma: solo 5%'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-[11px] text-white/40">
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=professional" className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-all text-center uppercase tracking-widest">ACTIVAR PRO</Link>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-40 px-6 text-center bg-accent/5 border-y border-white/5 overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] pointer-events-none" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="relative z-10 space-y-10"
                    >
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic">
                            ¿Estás listo para la<br />
                            <span className="gold-text-gradient underlined decoration-accent/20">soberanía digital?</span>
                        </h2>
                        <p className="text-white/40 text-xl max-w-xl mx-auto">
                            Únete hoy a la élite que ya está automatizando el mañana.
                        </p>
                        <Link href="/registro" className="inline-flex items-center gap-4 bg-white text-black px-16 py-8 rounded-3xl font-black text-2xl hover:bg-accent hover:text-white transition-all shadow-[0_40px_80px_rgba(139,0,0,0.4)] group">
                            COMENZAR LA REVOLUCIÓN
                            <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="py-20 border-t border-white/5 px-6 lg:px-20 text-white/10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3 order-2 md:order-1">
                        <Cpu className="w-6 h-6 grayscale opacity-30" />
                        <span className="text-lg font-bold tracking-tighter uppercase opacity-30">UAI PLATFORM 2026</span>
                    </div>
                    <div className="flex gap-10 order-1 md:order-2">
                        {['Privacy', 'Terms', 'Enterprise', 'API', 'Docs'].map(link => (
                            <a key={link} href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">{link}</a>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    );
}
