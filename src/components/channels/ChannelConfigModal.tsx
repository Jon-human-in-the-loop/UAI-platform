'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, MessageSquare, Mail, Share2, Save, Loader2,
    AlertTriangle, ToggleLeft, ToggleRight, Webhook, Clock
} from 'lucide-react';

export type ChannelType = 'TELEGRAM' | 'WHATSAPP' | 'DISCORD' | 'EMAIL';

export interface ChannelConfigData {
    id?: string;
    channel_type: string;
    enabled: boolean;
    api_key?: string | null;
    webhook_url?: string | null;
    metadata?: Record<string, any> | null;
    agent_id?: string | null;
}

interface ChannelConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelType: ChannelType;
    currentConfig?: ChannelConfigData | null;
    onSaved: () => void;
}

interface CredentialFields {
    botToken: string;
    accountSid: string;
    authToken: string;
    fromNumber: string;
    publicKey: string;
    applicationId: string;
    guildId: string;
}

const EMPTY_FIELDS: CredentialFields = {
    botToken: '',
    accountSid: '',
    authToken: '',
    fromNumber: '',
    publicKey: '',
    applicationId: '',
    guildId: '',
};

const CHANNEL_META: Record<ChannelType, { name: string; icon: React.ReactNode; webhookPath: string }> = {
    TELEGRAM: { name: 'Telegram', icon: <Send className="w-5 h-5 text-blue-400" />, webhookPath: '/api/webhooks/telegram' },
    WHATSAPP: { name: 'WhatsApp', icon: <MessageSquare className="w-5 h-5 text-green-500" />, webhookPath: '/api/webhooks/whatsapp' },
    DISCORD: { name: 'Discord', icon: <Share2 className="w-5 h-5 text-indigo-400" />, webhookPath: '/api/webhooks/discord' },
    EMAIL: { name: 'Email', icon: <Mail className="w-5 h-5 text-red-400" />, webhookPath: '' },
};

const INPUT_CLASS =
    'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20';
const LABEL_CLASS = 'text-xs uppercase font-bold text-white/50';

export default function ChannelConfigModal({ isOpen, onClose, channelType, currentConfig, onSaved }: ChannelConfigModalProps) {
    const [fields, setFields] = useState<CredentialFields>(EMPTY_FIELDS);
    const [enabled, setEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [appUrl, setAppUrl] = useState(process.env.NEXT_PUBLIC_APP_URL || '');

    const meta = CHANNEL_META[channelType];
    const configMetadata: Record<string, any> = currentConfig?.metadata || {};
    const webhookUrl = `${appUrl || '{APP_URL}'}${meta.webhookPath}`;

    // Resolver la URL pública en el navegador si no hay variable de entorno
    useEffect(() => {
        if (!appUrl && typeof window !== 'undefined') {
            setAppUrl(window.location.origin);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reiniciar el formulario cada vez que se abre el modal o cambia el canal
    useEffect(() => {
        if (!isOpen) return;
        const md: Record<string, any> = currentConfig?.metadata || {};
        setFields({
            ...EMPTY_FIELDS,
            // Pre-cargar solo datos NO sensibles (los secretos nunca viajan completos)
            fromNumber: md.fromNumber || '',
            publicKey: md.publicKey || '',
            applicationId: md.applicationId || '',
            guildId: md.guildId || '',
        });
        setEnabled(currentConfig?.enabled ?? true);
        setError('');
        setWarning('');
        setSaving(false);
    }, [isOpen, channelType, currentConfig]);

    const setField = (key: keyof CredentialFields, value: string) =>
        setFields(prev => ({ ...prev, [key]: value }));

    /**
     * Construye el payload del POST. Si el usuario no escribió credenciales
     * nuevas y ya existe una config guardada, solo se actualiza el toggle.
     */
    const buildPayload = (): Record<string, any> => {
        if (channelType === 'TELEGRAM') {
            const botToken = fields.botToken.trim();
            if (!botToken) {
                if (currentConfig) return { channelType, enabled };
                throw new Error('Ingresa el Bot Token de tu bot de Telegram');
            }
            if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
                throw new Error('El Bot Token no tiene un formato válido (ej: 123456789:AAEjemploDeToken)');
            }
            return { channelType, enabled, credentials: { botToken } };
        }

        if (channelType === 'WHATSAPP') {
            const accountSid = fields.accountSid.trim();
            const authToken = fields.authToken.trim();
            const fromNumber = fields.fromNumber.trim();
            if (!accountSid && !authToken) {
                if (currentConfig) return { channelType, enabled };
                throw new Error('Completa las credenciales de tu cuenta de Twilio');
            }
            if (!accountSid || !authToken || !fromNumber) {
                throw new Error('Completa Account SID, Auth Token y Número de WhatsApp');
            }
            if (!accountSid.startsWith('AC')) {
                throw new Error('El Account SID de Twilio debe comenzar con "AC"');
            }
            if (!/^\+[1-9]\d{6,14}$/.test(fromNumber)) {
                throw new Error('El número debe estar en formato E.164 (ej: +14155238886)');
            }
            return { channelType, enabled, credentials: { accountSid, authToken, fromNumber } };
        }

        if (channelType === 'DISCORD') {
            const publicKey = fields.publicKey.trim();
            const applicationId = fields.applicationId.trim();
            const guildId = fields.guildId.trim();
            if (!publicKey && !applicationId) {
                if (currentConfig) return { channelType, enabled };
                throw new Error('Completa la Public Key y el Application ID de tu app de Discord');
            }
            if (!/^[0-9a-fA-F]{64}$/.test(publicKey)) {
                throw new Error('La Public Key debe ser una cadena hexadecimal de 64 caracteres');
            }
            if (!/^\d{10,25}$/.test(applicationId)) {
                throw new Error('El Application ID debe ser numérico');
            }
            return { channelType, enabled, credentials: { publicKey, applicationId, guildId } };
        }

        throw new Error('Canal no soportado');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setWarning('');

        let payload: Record<string, any>;
        try {
            payload = buildPayload();
        } catch (err: any) {
            setError(err.message);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/channels/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar la configuración');
            }
            onSaved();
            if (data.warning) {
                // La config se guardó, pero hay algo que el usuario debe saber
                setWarning(data.warning);
            } else {
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Error desconocido al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const renderInstructions = (steps: string[]) => (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Instrucciones</p>
            <ol className="space-y-1.5">
                {steps.map((step, i) => (
                    <li key={i} className="text-[11px] text-white/50 leading-relaxed flex gap-2">
                        <span className="text-accent font-bold shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                    </li>
                ))}
            </ol>
        </div>
    );

    const renderWebhookBox = (description: string) => (
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-2">
            <p className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5" /> Webhook
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed">{description}</p>
            <code className="block w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/80 font-mono break-all">
                {webhookUrl}
            </code>
        </div>
    );

    const savedSecretHint = (label: string, masked?: string | null) =>
        masked ? (
            <p className="text-[10px] text-white/30">
                {label} guardado: <span className="font-mono text-white/50">{masked}</span> — deja el campo vacío para conservarlo.
            </p>
        ) : null;

    const renderChannelForm = () => {
        switch (channelType) {
            case 'TELEGRAM':
                return (
                    <>
                        {renderInstructions([
                            'Abre Telegram y habla con @BotFather.',
                            'Envía el comando /newbot y sigue los pasos para crear tu bot.',
                            'Copia el token que te entrega BotFather y pégalo aquí abajo.',
                        ])}
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Bot Token</label>
                            <input
                                type="password"
                                value={fields.botToken}
                                onChange={e => setField('botToken', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="123456789:AAEjemploDeTokenDeBotFather"
                                autoComplete="off"
                            />
                            {savedSecretHint('Token', currentConfig?.api_key)}
                        </div>
                        {renderWebhookBox('Al guardar, registraremos automáticamente esta URL como webhook de tu bot en Telegram:')}
                    </>
                );

            case 'WHATSAPP':
                return (
                    <>
                        {renderInstructions([
                            'Necesitas una cuenta de Twilio con WhatsApp habilitado (Sandbox o número aprobado).',
                            'Copia el Account SID y el Auth Token desde la consola de Twilio.',
                            'Configura el webhook entrante de WhatsApp en Twilio apuntando a la URL de abajo.',
                        ])}
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Account SID</label>
                            <input
                                type="text"
                                value={fields.accountSid}
                                onChange={e => setField('accountSid', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                autoComplete="off"
                            />
                            {savedSecretHint('Account SID', currentConfig?.api_key)}
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Auth Token</label>
                            <input
                                type="password"
                                value={fields.authToken}
                                onChange={e => setField('authToken', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="Tu Auth Token de Twilio"
                                autoComplete="off"
                            />
                            {savedSecretHint('Auth Token', configMetadata.authToken)}
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Número de WhatsApp de Twilio</label>
                            <input
                                type="text"
                                value={fields.fromNumber}
                                onChange={e => setField('fromNumber', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="+14155238886"
                                autoComplete="off"
                            />
                            <p className="text-[10px] text-white/30">Formato E.164: código de país + número, sin espacios.</p>
                        </div>
                        {renderWebhookBox('Configura este endpoint como webhook entrante ("When a message comes in") en tu número de Twilio:')}
                    </>
                );

            case 'DISCORD':
                return (
                    <>
                        {renderInstructions([
                            'Crea una aplicación en discord.com/developers/applications.',
                            'Copia la Public Key y el Application ID desde "General Information".',
                            'Configura el "Interactions Endpoint URL" apuntando a la URL de abajo.',
                            '(Opcional) Agrega el Guild ID de tu servidor para vincular las interacciones a tu cuenta.',
                        ])}
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Public Key</label>
                            <input
                                type="text"
                                value={fields.publicKey}
                                onChange={e => setField('publicKey', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="Cadena hexadecimal de 64 caracteres"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Application ID</label>
                            <input
                                type="text"
                                value={fields.applicationId}
                                onChange={e => setField('applicationId', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="1234567890123456789"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Guild ID (opcional)</label>
                            <input
                                type="text"
                                value={fields.guildId}
                                onChange={e => setField('guildId', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="ID de tu servidor de Discord"
                                autoComplete="off"
                            />
                        </div>
                        {renderWebhookBox('Usa esta URL como "Interactions Endpoint URL" en el portal de desarrolladores de Discord:')}
                    </>
                );

            case 'EMAIL':
                return (
                    <div className="py-10 flex flex-col items-center text-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <Mail className="w-10 h-10 text-red-400" />
                        </div>
                        <div className="flex items-center gap-2 text-yellow-500/80">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Próximamente</span>
                        </div>
                        <p className="text-sm text-white/60 max-w-xs">
                            Integración disponible próximamente. Estamos trabajando para que tus agentes
                            puedan responder correos automáticamente.
                        </p>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg">{meta.icon}</div>
                            <h2 className="text-xl font-bold text-white">Configurar {meta.name}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </div>

                    {channelType === 'EMAIL' ? (
                        <div className="flex flex-col overflow-y-auto">
                            <div className="p-6">{renderChannelForm()}</div>
                            <div className="flex p-6 pt-0 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {warning && (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>Configuración guardada. {warning}</span>
                                    </div>
                                )}

                                {renderChannelForm()}

                                {/* Toggle habilitado/deshabilitado */}
                                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <div>
                                        <p className="text-sm font-bold text-white">Canal habilitado</p>
                                        <p className="text-[11px] text-white/40">
                                            Si está activo, los mensajes entrantes serán procesados por tus agentes.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEnabled(!enabled)}
                                        className={`p-1 rounded-lg transition-colors ${enabled ? 'text-green-500' : 'text-white/20'}`}
                                        aria-label={enabled ? 'Deshabilitar canal' : 'Habilitar canal'}
                                    >
                                        {enabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                                    </button>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-3 p-6 pt-0 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Guardar Configuración
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
