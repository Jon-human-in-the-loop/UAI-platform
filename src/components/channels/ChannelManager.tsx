'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Mail, Share2, Settings2, ToggleLeft, ToggleRight, X, Save, Activity } from 'lucide-react';

export default function ChannelManager() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingChannel, setEditingChannel] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/channels/config');
            const data = await res.json();
            setConfigs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading channel configs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (channelId: string, currentEnabled: boolean) => {
        try {
            const config = configs.find(c => c.channel_type === channelId) || { channel_type: channelId };
            const res = await fetch('/api/channels/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelType: channelId,
                    enabled: !currentEnabled,
                    apiKey: config.api_key || '',
                    webhookUrl: config.webhook_url || '',
                    metadata: config.metadata || {}
                })
            });
            if (res.ok) fetchConfigs();
        } catch (err) {
            console.error('Error toggling channel:', err);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/channels/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelType: editingChannel.id,
                    enabled: editingChannel.enabled,
                    apiKey: editingChannel.apiKey,
                    webhookUrl: editingChannel.webhookUrl,
                    metadata: {}
                })
            });
            if (res.ok) {
                fetchConfigs();
                setEditingChannel(null);
            }
        } catch (err) {
            console.error('Error saving config:', err);
        } finally {
            setSaving(false);
        }
    };

    const channels = [
        { id: 'TELEGRAM', name: 'Telegram', icon: <Send className="w-5 h-5 text-blue-400" /> },
        { id: 'WHATSAPP', name: 'WhatsApp', icon: <MessageSquare className="w-5 h-5 text-green-500" /> },
        { id: 'EMAIL', name: 'Email', icon: <Mail className="w-5 h-5 text-red-400" /> },
        { id: 'DISCORD', name: 'Discord', icon: <Share2 className="w-5 h-5 text-indigo-400" /> },
    ];

    return (
        <div className="space-y-4 relative">
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
                                <div className="cursor-pointer" onClick={() => setEditingChannel({
                                    id: channel.id,
                                    name: channel.name,
                                    enabled: isEnabled,
                                    apiKey: config?.api_key || '',
                                    webhookUrl: config?.webhook_url || ''
                                })}>
                                    <h4 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">{channel.name}</h4>
                                    <p className="text-[10px] text-white/40 uppercase">
                                        {isEnabled ? 'Conectado' : 'Desconectado'} • <span className="text-red-500/50">Configurar</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleToggle(channel.id, isEnabled)}
                                className={`p-2 rounded-lg transition-colors ${isEnabled ? 'text-green-500' : 'text-white/20'}`}
                            >
                                {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Configuración */}
            <AnimatePresence>
                {editingChannel && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Configurar {editingChannel.name}</h3>
                                <button onClick={() => setEditingChannel(null)} className="p-2 hover:bg-white/5 rounded-full">
                                    <X className="w-5 h-5 text-white/40" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key / Token</label>
                                    <input 
                                        type="password"
                                        value={editingChannel.apiKey}
                                        onChange={e => setEditingChannel({...editingChannel, apiKey: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none transition-all"
                                        placeholder="Ingresa el token del bot..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Webhook URL (Opcional)</label>
                                    <input 
                                        type="text"
                                        value={editingChannel.webhookUrl}
                                        onChange={e => setEditingChannel({...editingChannel, webhookUrl: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none transition-all"
                                        placeholder="https://tu-webhook.com/..."
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                                >
                                    {saving ? <Activity className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Guardar Configuración</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
