'use client';

import React from 'react';
import { MessageSquare, Send, Mail, Share2 } from 'lucide-react';
import ChannelManager from '@/components/channels/ChannelManager';

export default function ChannelsPage() {
    const channels = [
        { id: 'telegram', name: 'Telegram', icon: <Send className="w-6 h-6 text-blue-400" />, status: 'Próximamente' },
        { id: 'whatsapp', name: 'WhatsApp', icon: <MessageSquare className="w-6 h-6 text-green-500" />, status: 'Próximamente' },
        { id: 'email', name: 'Email', icon: <Mail className="w-6 h-6 text-red-400" />, status: 'Próximamente' },
        { id: 'discord', name: 'Discord', icon: <Share2 className="w-6 h-6 text-indigo-400" />, status: 'Próximamente' },
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Integración Multi-Canal</h1>
                <p className="text-white/60">Conecta tus agentes con el mundo exterior a través de múltiples plataformas.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {channels.map(channel => (
                            <div key={channel.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-white/5">
                                        {channel.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{channel.name}</h3>
                                        <p className="text-[10px] text-white/40 uppercase font-mono">{channel.status}</p>
                                    </div>
                                </div>
                                <button disabled className="px-4 py-2 rounded-lg bg-white/5 text-[10px] font-bold text-white/20 uppercase">
                                    Configurar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <ChannelManager />
                </div>
            </div>

            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-red-500/10 to-purple-600/10 border border-white/10 text-center">
                <h3 className="text-xl font-bold text-white mb-2">¿Necesitas una integración personalizada?</h3>
                <p className="text-sm text-white/60 mb-6">Estamos trabajando para expandir las capacidades de comunicación de UAI Platform.</p>
                <button className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-600/20">
                    Sugerir Canal
                </button>
            </div>
        </div>
    );
}
