'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Play, Pause, Calendar } from 'lucide-react';

interface ScheduledTask {
    id: string;
    agent_id: string;
    mission_template: string;
    cron_expression: string;
    last_run: string | null;
    next_run: string | null;
    status: string;
}

export default function ScheduledTasksView() {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        agentId: '',
        missionTemplate: '',
        cronExpression: '0 0 * * *' // Default: daily at midnight
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/scheduled-tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!formData.agentId || !formData.missionTemplate || !formData.cronExpression) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const res = await fetch('/api/scheduled-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                setTasks([...tasks, data.task]);
                setFormData({ agentId: '', missionTemplate: '', cronExpression: '0 0 * * *' });
                setShowForm(false);
                alert('Tarea programada creada exitosamente');
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error al crear la tarea');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

        try {
            const res = await fetch(`/api/scheduled-tasks?taskId=${taskId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== taskId));
                alert('Tarea eliminada exitosamente');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Error al eliminar la tarea');
        }
    };

    const formatCronExpression = (cron: string): string => {
        const parts = cron.split(' ');
        if (parts.length === 5) {
            const [minute, hour, day, month, dayOfWeek] = parts;
            if (cron === '0 0 * * *') return 'Diariamente a las 00:00';
            if (cron === '0 */6 * * *') return 'Cada 6 horas';
            if (cron === '0 0 * * 1') return 'Cada lunes a las 00:00';
        }
        return cron;
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-accent" />
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Tareas Programadas</h1>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/30 rounded-lg text-accent text-sm font-bold hover:bg-accent/30 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Tarea
                </button>
            </div>

            {/* Formulario */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-white/10 bg-white/[0.02] p-6"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase">ID del Agente</label>
                                <input
                                    type="text"
                                    placeholder="ej: agent-lead-strategy"
                                    value={formData.agentId}
                                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:border-accent/50 focus:ring-0"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase">Plantilla de Misión</label>
                                <textarea
                                    placeholder="Describe la misión que ejecutará el agente..."
                                    value={formData.missionTemplate}
                                    onChange={(e) => setFormData({ ...formData, missionTemplate: e.target.value })}
                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:border-accent/50 focus:ring-0 resize-none min-h-[80px]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase">Expresión Cron</label>
                                <input
                                    type="text"
                                    placeholder="ej: 0 0 * * * (diariamente a las 00:00)"
                                    value={formData.cronExpression}
                                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:border-accent/50 focus:ring-0"
                                />
                                <p className="text-xs text-white/40 mt-2">Formato: minuto hora día mes día-semana</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateTask}
                                    className="flex-1 px-4 py-2 bg-accent/20 border border-accent/30 rounded-lg text-accent text-sm font-bold hover:bg-accent/30 transition-all"
                                >
                                    Crear Tarea
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm font-bold hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lista de Tareas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-accent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/60">Cargando tareas...</p>
                        </div>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/60">No hay tareas programadas</p>
                            <p className="text-xs text-white/40 mt-2">Crea una nueva tarea para comenzar</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 hover:border-accent/30 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{task.mission_template.substring(0, 50)}</h3>
                                            <p className="text-xs text-white/40 mt-1">ID: {task.id.substring(0, 12)}...</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            task.status === 'ENABLED'
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                            {task.status}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 text-xs text-white/60">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatCronExpression(task.cron_expression)}</span>
                                        </div>
                                        {task.last_run && (
                                            <div>
                                                <span className="text-white/40">Última ejecución:</span> {new Date(task.last_run).toLocaleString()}
                                            </div>
                                        )}
                                        {task.next_run && (
                                            <div>
                                                <span className="text-white/40">Próxima ejecución:</span> {new Date(task.next_run).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const newStatus = task.status === 'PAUSED' ? 'ENABLED' : 'PAUSED';
                                                try {
                                                    const res = await fetch('/api/scheduled-tasks', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ taskId: task.id, status: newStatus })
                                                    });
                                                    if (res.ok) {
                                                        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                                                    } else {
                                                        const error = await res.json();
                                                        alert(`Error: ${error.error}`);
                                                    }
                                                } catch (error) {
                                                    console.error('Error toggling task:', error);
                                                    alert('Error al cambiar estado de la tarea');
                                                }
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-bold transition-all ${
                                                task.status === 'PAUSED'
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20'
                                                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                                            }`}
                                        >
                                            {task.status === 'PAUSED' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                                            {task.status === 'PAUSED' ? 'Reanudar' : 'Pausar'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Eliminar
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
