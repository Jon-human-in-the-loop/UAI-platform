'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MessageSquare, Shield, Check, Phone, Play, Settings, RefreshCw, Smartphone, Radio } from 'lucide-react';

export default function VoiceConfigPage() {
    const [status, setStatus] = useState<'connected' | 'disconnected'>('connected');
    const [isTesting, setIsTesting] = useState(false);

    const configOptions = [
        { label: 'Modelo STT', value: 'Whisper-v3 (OpenAI)', icon: Mic },
        { label: 'Modelo TTS', value: 'ElevenLabs / OpenAI', icon: Radio },
        { label: 'Lenguaje', value: 'Español (Auto-detect)', icon: Settings },
        { label: 'Tono de Voz', value: 'Profesional / Empático', icon: Play },
    ];

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Mic className="w-10 h-10 text-green-500" /> Canales <span className="text-green-500/50">de Voz y WhatsApp</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium mt-2 max-w-2xl">
                        Configura la interacción multimodal de tus agentes. Permite que procesen notas de voz y respondan con audio humano a través de WhatsApp.
                    </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    status === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{status === 'connected' ? 'Servicio Activo' : 'Servicio Offline'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Device / Connection */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 relative z-10">
                                <Smartphone className="w-12 h-12 text-green-500" />
                            </div>
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">+34 600 000 000</h3>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Línea Oficial UAI</p>
                        </div>
                        <div className="w-full h-px bg-white/5" />
                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/40">Mensajes Hoy</span>
                                <span className="text-white font-bold">1,240</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-white/40">Notas de Voz</span>
                                <span className="text-white font-bold">85</span>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Reconectar WhatsApp
                        </button>
                    </div>
                </div>

                {/* Right: Config & Features */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-green-500" /> Configuración de Inteligencia Vocal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {configOptions.map((opt, i) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                        <opt.icon className="w-5 h-5 text-white/40" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">{opt.label}</p>
                                        <p className="text-sm font-bold text-white mt-1">{opt.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-white/5 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Shield className="w-5 h-5 text-green-500" />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Privacidad Vocal</h4>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">
                                Los audios son procesados efímeramente para transcripción. No se almacenan grabaciones de voz del usuario tras la ejecución de la misión.
                            </p>
                        </div>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                            <div className="space-y-2">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Play className="w-4 h-4 text-accent" /> Test de Respuesta
                                </h4>
                                <p className="text-[10px] text-white/30 uppercase">Prueba el tono de voz del asistente</p>
                            </div>
                            <button 
                                onClick={() => setIsTesting(!isTesting)}
                                className="mt-4 w-full py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/80 transition-all flex items-center justify-center gap-2"
                            >
                                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generar Audio de Prueba'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
