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

                {/* Community & Marketplace Section */}
                <section id="community" className="py-40 px-6 lg:px-20 relative overflow-hidden bg-white/[0.01]">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto space-y-32">
                        {/* Header & Rewards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <div className="order-2 lg:order-1 relative">
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { user: "Alex @ Quant", msg: "He compartido mi agente de 'Arbitraje de Cripto V3'. Un 15% más eficiente.", likes: 842, rank: "Robot Dragon 3000", color: "text-red-500" },
                                        { user: "Elena Studio", msg: "Mi flujo de 'SEO Multi-Idioma' ya está disponible. ¡Usadlo con Claude 3.7!", likes: 1205, rank: "Cyber Phoenix", color: "text-orange-400" },
                                        { user: "SaaS Builder", msg: "Implementada la auto-sanación en mi bot de soporte. Cero caídas.", likes: 673, rank: "Neon Titan", color: "text-blue-400" }
                                    ].map((post, i) => (
                                        <motion.div
                                            key={i}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            initial={{ opacity: 0, x: -50 }}
                                            transition={{ delay: i * 0.2 }}
                                            className="glass-card p-6 border-white/5 space-y-3 bg-white/[0.03] hover:border-accent/20 transition-all cursor-default relative overflow-hidden group"
                                        >
                                            {i === 1 && (
                                                <div className="absolute top-0 right-0 bg-accent text-[8px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest text-white shadow-lg animate-pulse">
                                                    Premiado: Plan Essentials Gratis
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white uppercase tracking-widest">{post.user}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${post.color} flex items-center gap-1`}>
                                                        <TrendingUp className="w-3 h-3" />
                                                        {post.rank}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-white/20">
                                                    <Star className="w-3 h-3 fill-current group-hover:text-accent transition-colors" />
                                                    <span className="text-[10px] font-mono">{post.likes}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/60 italic">"{post.msg}"</p>
                                            <div className="flex gap-2">
                                                <span className="text-[8px] border border-white/10 px-2 py-0.5 rounded-full text-white/30 uppercase group-hover:border-white/20">Clonar Agente</span>
                                                <span className="text-[8px] border border-white/10 px-2 py-0.5 rounded-full text-white/30 uppercase group-hover:border-white/20">Ver Grafo</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-10 order-1 lg:order-2">
                                <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-right">
                                    Gana la <br />
                                    <span className="gold-text-gradient underline decoration-accent/20 italic">soberanía de rango</span>
                                </h2>
                                <p className="text-xl text-white/40 leading-relaxed font-light text-right">
                                    No solo compartes; escalas. Cada aporte te acerca a nuevos Rangos Épicos. Activa personajes exclusivos y desbloquea <span className="text-accent font-bold italic">Planes Professional de por vida</span> al convertirte en una leyenda del UAI Hub.
                                </p>
                                <div className="flex justify-end gap-10">
                                    <div className="text-right">
                                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">Niveles RPG</h4>
                                        <p className="text-[10px] text-accent uppercase tracking-[0.2em] font-black">Personajes exclusivos</p>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">Premios reales</h4>
                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Essentials & Pro gratis</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rank Progression Visualization */}
                        <div className="pt-20">
                            <div className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 border border-white/10 rounded-full bg-white/5">
                                <Layers className="w-4 h-4 text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Escala de progresión UAI</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { level: "Lvl 1-10", name: "Aprendiz arcano", benefit: "Plan Free", color: "bg-white/10", icon: Bot },
                                    { level: "Lvl 11-30", name: "Forjador de nexos", benefit: "Descuento 50%", color: "bg-blue-500/20", icon: Shield },
                                    { level: "Lvl 31-70", name: "Oráculo estelar", benefit: "Essentials gratis", color: "bg-orange-500/20", icon: Zap },
                                    { level: "Lvl 71-99", name: "Arquitecto celestial", benefit: "Pro de por vida", color: "bg-red-500/20", icon: Rocket }
                                ].map((rank, i) => (
                                    <motion.div
                                        key={rank.name}
                                        whileHover={{ y: -10 }}
                                        className={`p-8 rounded-[32px] border border-white/5 ${rank.color} backdrop-blur-xl space-y-6 relative overflow-hidden group`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <rank.icon className="w-10 h-10 text-white/60 group-hover:text-white transition-colors" />
                                            <span className="text-[10px] font-mono text-white/30">{rank.level}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-xl font-black uppercase tracking-tighter italic">{rank.name}</h5>
                                            <p className="text-[10px] text-accent font-black uppercase tracking-widest">{rank.benefit}</p>
                                        </div>
                                        <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <rank.icon className="w-32 h-32" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* DRAGÓN PRIMORDIAL — Ultimate Rank */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                whileHover={{ scale: 1.02 }}
                                className="mt-6 relative group"
                            >
                                {/* Animated border glow */}
                                <div className="absolute -inset-[1px] rounded-[36px] bg-gradient-to-r from-red-600 via-orange-500 via-yellow-400 to-red-600 opacity-40 group-hover:opacity-80 blur-sm transition-all duration-700 animate-pulse" />
                                <div className="absolute -inset-[1px] rounded-[36px] bg-gradient-to-r from-red-600 via-orange-500 via-yellow-400 to-red-600 opacity-20 group-hover:opacity-50 transition-all duration-700" />

                                <div className="relative p-10 md:p-12 rounded-[36px] bg-gradient-to-br from-red-950/60 via-black to-orange-950/40 border border-red-500/20 group-hover:border-red-500/50 backdrop-blur-xl overflow-hidden transition-all duration-500">
                                    {/* Background fire effects */}
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.15)_0,transparent_70%)]" />
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-900/10 to-transparent" />
                                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all duration-700" />
                                    <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all duration-700" />

                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                                        {/* Dragon Icon */}
                                        <div className="flex-shrink-0 relative">
                                            <div className="text-8xl md:text-9xl filter drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] group-hover:drop-shadow-[0_0_50px_rgba(220,38,38,0.8)] transition-all duration-500">🐉</div>
                                            <Flame className="absolute -top-2 -right-2 w-8 h-8 text-orange-400 opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-500" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-4 text-center md:text-left">
                                            <div className="flex flex-col md:flex-row items-center md:items-end gap-3">
                                                <h5 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-red-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                                                    Dragón primordial
                                                </h5>
                                                <span className="text-[10px] font-mono text-red-400/60 border border-red-500/20 px-3 py-1 rounded-full bg-red-500/5">Lvl 100+</span>
                                            </div>
                                            <p className="text-white/40 text-sm md:text-base max-w-2xl leading-relaxed">
                                                El rango supremo. Solo los verdaderos maestros de la orquestación alcanzan este nivel.
                                                Requiere <span className="text-white font-medium">dominio absoluto</span> del ecosistema UAI, contribuciones excepcionales a la comunidad
                                                y un historial impecable de misiones completadas.
                                            </p>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                                                    🔥 Acceso vitalicio a todo
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20">
                                                    ⚡ Agentes ilimitados
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                                                    👑 Consejo fundador
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rarity indicator */}
                                        <div className="flex-shrink-0 text-center space-y-2">
                                            <div className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Rareza</div>
                                            <div className="text-3xl font-black text-red-400 font-mono">&lt;0.1%</div>
                                            <div className="text-[8px] text-white/15 uppercase tracking-widest">de los usuarios</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Mission Control: Gamified Agent Communities */}
                <section id="mission" className="py-40 px-6 lg:px-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,0,0,0.08)_0,transparent_60%)]" />
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                    <div className="max-w-7xl mx-auto relative z-10 space-y-20">
                        {/* Header */}
                        <div className="text-center space-y-6">
                            <div className="inline-flex items-center gap-2 px-5 py-2 border border-accent/20 rounded-full bg-accent/5 backdrop-blur-xl">
                                <Activity className="w-4 h-4 text-accent animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">MISSION CONTROL</span>
                            </div>
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic">
                                Despliega tu escuadrón.<br />
                                <span className="gold-text-gradient">Conquista en equipo.</span>
                            </h2>
                            <p className="text-xl text-white/40 max-w-3xl mx-auto leading-relaxed font-light">
                                Crea comunidades gamificadas donde tus agentes, con <span className="text-white font-medium">avatares únicos</span>, detectan sinergias con otros agentes y <span className="text-accent font-medium">te notifican</span>. Tú conectas con el otro usuario, y a partir de ahí, los agentes hacen todo el trabajo pesado en equipo.
                            </p>
                        </div>

                        {/* Mission Control Dashboard Mockup */}
                        <div className="rounded-[40px] border border-white/10 bg-black/80 p-4 backdrop-blur-3xl shadow-[0_0_120px_rgba(139,0,0,0.15)] overflow-hidden">
                            <div className="rounded-[30px] bg-[#030303] border border-white/5 p-8 space-y-8">
                                {/* Top Bar */}
                                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Misión Activa: Proyecto Aurora</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] text-white/20 font-mono">4 Agentes Conectados</span>
                                        <span className="text-[10px] text-accent font-mono animate-pulse">● LIVE</span>
                                    </div>
                                </div>

                                {/* Agent Grid - The "War Room" */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { name: "KRAKEN-9", owner: "@alex_quant", role: "Estrategia Financiera", status: "Devorando datos de mercado...", color: "border-red-500/30 bg-red-500/5", avatar: "🦑", rank: "Arquitecto Celestial" },
                                        { name: "VALKYRIA", owner: "@elena_studio", role: "SEO & Contenido", status: "Orquestando narrativas...", color: "border-orange-500/30 bg-orange-500/5", avatar: "⚔️", rank: "Oráculo Estelar" },
                                        { name: "RONIN-X", owner: "@saas_builder", role: "DevOps & Monitoreo", status: "Patrullando perímetros...", color: "border-blue-500/30 bg-blue-500/5", avatar: "🥷", rank: "Forjador de Nexos" },
                                        { name: "CHIMERA", owner: "@creative_ops", role: "Diseño Generativo", status: "Fusionando dimensiones visuales...", color: "border-purple-500/30 bg-purple-500/5", avatar: "🐲", rank: "Aprendiz Arcano" }
                                    ].map((agent, i) => (
                                        <motion.div
                                            key={agent.name}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.15 }}
                                            className={`p-6 rounded-3xl border ${agent.color} space-y-4 relative group hover:scale-105 transition-all duration-300`}
                                        >
                                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <div className="text-4xl">{agent.avatar}</div>
                                            <div className="space-y-1">
                                                <h5 className="text-sm font-black uppercase tracking-wider">{agent.name}</h5>
                                                <p className="text-[10px] text-white/30 font-mono">{agent.owner} · {agent.rank}</p>
                                            </div>
                                            <p className="text-xs text-white/50 uppercase tracking-widest font-bold">{agent.role}</p>
                                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                                <span className="text-[10px] text-accent/80 font-mono italic leading-tight">{agent.status}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Connection Lines / Synergy Visualization */}
                                <div className="flex items-center justify-center gap-3 py-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                                    <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-white/[0.02]">
                                        <Layers className="w-5 h-5 text-accent" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Sinergia Activa</span>
                                        <span className="text-sm font-mono text-accent font-bold">98.7%</span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                                </div>

                                {/* Live Activity Feed */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { time: "hace 2s", msg: "KRAKEN-9 compartió análisis con VALKYRIA", type: "sync" },
                                        { time: "hace 15s", msg: "RONIN-X detectó brecha de optimización", type: "alert" },
                                        { time: "hace 1m", msg: "CHIMERA fusionó 12 assets para el proyecto", type: "complete" }
                                    ].map((log, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${log.type === 'sync' ? 'bg-blue-400' : log.type === 'alert' ? 'bg-orange-400' : 'bg-green-400'}`} />
                                            <div>
                                                <p className="text-[10px] text-white/60">{log.msg}</p>
                                                <span className="text-[8px] text-white/20 font-mono">{log.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Benefits Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10">
                            {[
                                { icon: Globe, title: "Proyectos globales", desc: "Lanza misiones con colaboradores de cualquier parte del mundo. Tus agentes trabajan 24/7." },
                                { icon: Zap, title: "Sinergias inteligentes", desc: "Los agentes detectan oportunidades de colaboración y te avisan. Tú decides, ellos ejecutan el trabajo pesado." },
                                { icon: Rocket, title: "Resultados exponenciales", desc: "Conecta con otros usuarios, pon a trabajar a tus agentes en equipo y multiplica los resultados 10x." }
                            ].map((benefit, i) => (
                                <div key={i} className="text-center space-y-4 p-8 glass-card border-white/5 hover:border-accent/20 transition-colors group">
                                    <benefit.icon className="w-10 h-10 mx-auto text-white/20 group-hover:text-accent transition-colors" />
                                    <h4 className="text-lg font-black uppercase tracking-tight">{benefit.title}</h4>
                                    <p className="text-sm text-white/40">{benefit.desc}</p>
                                </div>
                            ))}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto relative z-10">
                        {/* Plan Free */}
                        <div className="glass-card p-10 space-y-8 border-white/5 bg-white/[0.02] flex flex-col">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold uppercase tracking-tighter">UAI Free</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Explorador cognitivo</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black font-mono">$0</span>
                                <span className="text-white/20 text-sm font-bold">/siempre</span>
                            </div>
                            <ul className="flex-1 space-y-5">
                                {['Orquestación de 1 agente', 'Modelos ultra-rápidos', 'Límite: 5 consultas/hora', 'Comunidad open-source'].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-white/40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=free" className="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-center">EMPEZAR GRATIS</Link>
                        </div>

                        {/* Plan Básico - THE STAR */}
                        <div className="relative glass-card p-10 space-y-8 border-accent bg-accent/5 scale-105 shadow-[0_0_80px_rgba(139,0,0,0.25)] flex flex-col z-20">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-white px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-xl">
                                RECOMENDADO
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold uppercase tracking-tighter">Básico</h4>
                                <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-bold">Liderazgo de mercado</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-7xl font-black font-mono">$9</span>
                                <span className="text-white/40 text-sm font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-5">
                                {[
                                    'Orquestación de 2 agentes',
                                    'Memoria cognitiva persistente',
                                    'Prioridad en razonamiento',
                                    'Tokens a coste directo (0% margen)',
                                    'Capacidad: 50 consultas/hora'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-white/90">
                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=essentials" className="w-full py-6 rounded-2xl bg-primary text-white font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-center text-lg tracking-widest">ACTIVAR ESSENTIALS</Link>
                        </div>

                        {/* Plan Advanced */}
                        <div className="glass-card p-10 space-y-8 border-white/5 bg-white/[0.02] flex flex-col">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold uppercase tracking-tighter">Advanced</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Control total</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black font-mono">$29</span>
                                <span className="text-white/20 text-sm font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-5">
                                {[
                                    'Hasta 5 agentes coordinados',
                                    'Soporte multi-canal full',
                                    'Analítica ROI avanzada',
                                    'Prioridad de cómputo alta'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-white/40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=advanced" className="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-center">ACTIVAR ADVANCED</Link>
                        </div>

                        {/* Plan Pro */}
                        <div className="glass-card p-10 space-y-8 border-white/5 bg-white/[0.02] flex flex-col">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold uppercase tracking-tighter">Pro</h4>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Dominio absoluto</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-6xl font-black font-mono">$79</span>
                                <span className="text-white/20 text-sm font-bold">/mes</span>
                            </div>
                            <ul className="flex-1 space-y-5">
                                {[
                                    'Agentes ilimitados',
                                    'Auto-sanación neural',
                                    'Memoria cognitiva infinita',
                                    'Soporte prioritario 24/7',
                                    'Margen plataforma: solo 5%'
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-white/40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/registro?plan=professional" className="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-center">ACTIVAR PROFESSIONAL</Link>
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

