'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send, Mail, Share2, Loader2 } from 'lucide-react';
import ChannelManager from '@/components/channels/ChannelManager';
import ChannelConfigModal, {
    ChannelConfigData,
    ChannelType,
} from '@/components/channels/ChannelConfigModal';

// ─────────────────────────────────────────────
// Tipos y constantes
// ─────────────────────────────────────────────

interface ChannelStatus {
    label: string;
    color: string;
}

const CHANNELS: {
    id: ChannelType;
    name: string;
    icon: React.ReactNode;
    description: string;
}[] = [
    {
        id: 'TELEGRAM',
        name: 'Telegram',
        icon: <Send className="w-6 h-6 text-blue-400" />,
        description: 'Bots de Telegram con respuesta automática via BotFather.',
    },
    {
        id: 'WHATSAPP',
        name: 'WhatsApp',
        icon: <MessageSquare className="w-6 h-6 text-green-500" />,
        description: 'Mensajería de WhatsApp Business via Twilio.',
    },
    {
        id: 'DISCORD',
        name: 'Discord',
        icon: <Share2 className="w-6 h-6 text-indigo-400" />,
        description: 'Slash commands e interacciones en servidores de Discord.',
    },
    {
        id: 'EMAIL',
        name: 'Email',
        icon: <Mail className="w-6 h-6 text-red-400" />,
        description: 'Respuestas automáticas por correo electrónico.',
    },
];

function deriveStatus(_channelId: ChannelType, config: ChannelConfigData | undefined): ChannelStatus {
    if (!config) {
        return { label: 'DESCONECTADO', color: 'text-white/40' };
    }
    if (config.enabled) {
        return { label: 'CONECTADO', color: 'text-green-500' };
    }
    return { label: 'INACTIVO', color: 'text-yellow-500' };
}

// ─────────────────────────────────────────────
// Skeleton de carga
// ─────────────────────────────────────────────

function ChannelCardSkeleton() {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-white/10" />
                    <div className="h-3 w-16 rounded bg-white/5" />
                </div>
            </div>
            <div className="h-8 w-20 rounded-lg bg-white/10" />
        </div>
    );
}

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────

export default function ChannelsPage() {
    const [configs, setConfigs] = useState<ChannelConfigData[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [modalChannel, setModalChannel] = useState<ChannelType | null>(null);

    // ── Carga de configs ──────────────────────
    const fetchConfigs = useCallback(async () => {
        try {
            const res = await fetch('/api/channels/config');
            if (!res.ok) throw new Error('Error al cargar configuraciones');
            const data: ChannelConfigData[] = await res.json();
            setConfigs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[ChannelsPage] Error cargando configs:', err);
            setConfigs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // ── Handlers ──────────────────────────────
    const handleConfigureClick = (channelId: ChannelType) => {
        setModalChannel(channelId);
    };

    const handleModalClose = () => setModalChannel(null);

    const handleSaved = () => {
        // Recarga configs tras guardar exitosamente
        fetchConfigs();
    };

    // Config activa del canal que está en el modal
    const activeConfig = modalChannel
        ? configs.find(c => c.channel_type === modalChannel) ?? null
        : null;

    // ─────────────────────────────────────────
    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Encabezado */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                    Integración Multi-Canal
                </h1>
                <p className="text-white/60 mt-1">
                    Conecta tus agentes con el mundo exterior a través de múltiples plataformas.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Columna principal: tarjetas de canales ── */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loading
                            ? CHANNELS.map(ch => <ChannelCardSkeleton key={ch.id} />)
                            : CHANNELS.map(channel => {
                                  const config = configs.find(
                                      c => c.channel_type === channel.id
                                  );
                                  const status = deriveStatus(channel.id, config);

                                  return (
                                      <div
                                          key={channel.id}
                                          className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/[0.07] transition-all group"
                                      >
                                          <div className="flex items-center gap-4">
                                              <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                                                  {channel.icon}
                                              </div>
                                              <div>
                                                  <h3 className="font-bold text-white">
                                                      {channel.name}
                                                  </h3>
                                                  <p
                                                      className={`text-[10px] uppercase font-mono font-bold ${status.color}`}
                                                  >
                                                      {status.label}
                                                  </p>
                                              </div>
                                          </div>
                                          <button
                                              onClick={() => handleConfigureClick(channel.id)}
                                              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase hover:bg-white hover:text-black transition-all"
                                          >
                                              Configurar
                                          </button>
                                      </div>
                                  );
                              })}
                    </div>

                    {/* Indicador de carga tras el grid si recarga en background */}
                    {!loading && (
                        <p className="mt-4 text-[11px] text-white/20 text-right select-none">
                            {configs.length} canal{configs.length !== 1 ? 'es' : ''} configurado
                            {configs.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* ── Columna lateral: ChannelManager ── */}
                <div>
                    <ChannelManager />
                </div>
            </div>

            {/* ── Bloque "Sugerir Canal" ── */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-red-500/10 to-purple-600/10 border border-white/10 text-center">
                <h3 className="text-xl font-bold text-white mb-2">
                    ¿Necesitas una integración personalizada?
                </h3>
                <p className="text-sm text-white/60 mb-6">
                    Estamos trabajando para expandir las capacidades de comunicación de UAI Platform.
                </p>
                <button className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    Sugerir Canal
                </button>
            </div>

            {/* ── Modal de configuración ── */}
            {modalChannel && (
                <ChannelConfigModal
                    isOpen={true}
                    onClose={handleModalClose}
                    channelType={modalChannel}
                    currentConfig={activeConfig}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}
