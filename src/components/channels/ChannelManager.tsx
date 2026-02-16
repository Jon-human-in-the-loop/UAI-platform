'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Mail, Share2, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ChannelManager() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/channels/config')
            .then(res => res.json())
            .then(data => {
                setConfigs(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading channel configs:', err);
                setLoading(false);
            });
    }, []);

    const channels = [
        { id: 'TELEGRAM', name: 'Telegram', icon: <Send className="w-5 h-5 text-blue-400" /> },
        { id: 'WHATSAPP', name: 'WhatsApp', icon: <MessageSquare className="w-5 h-5 text-green-500" /> },
        { id: 'EMAIL', name: 'Email', icon: <Mail className="w-5 h-5 text-red-400" /> },
        { id: 'DISCORD', name: 'Discord', icon: <Share2 className="w-5 h-5 text-indigo-400" /> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestión de Canales</h3>
                <Settings2 className="w-4 h-4 text-white/20" />
            </div>
            
            <div className="space-y-2">
                {channels.map(channel => {
                    const config = configs.find(c => c.channel_type === channel.id);
                    const isEnabled = config?.enabled || false;

                    return (
                        <div key={channel.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-white/5">
                                    {channel.icon}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{channel.name}</h4>
                                    <p className="text-[10px] text-white/40 uppercase">
                                        {isEnabled ? 'Conectado' : 'Desconectado'}
                                    </p>
                                </div>
                            </div>
                            <button className={`p-2 rounded-lg transition-colors ${isEnabled ? 'text-green-500' : 'text-white/20'}`}>
                                {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
