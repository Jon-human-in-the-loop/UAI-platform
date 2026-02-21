/**
 * UAI Platform - Sistema de Gamificación Nativo
 * Mecánicas alineadas con orquestación de agentes IA
 * 
 * Filosofía: Cada recompensa refuerza el USO de la plataforma,
 * no mecánicas genéricas. El progreso viene de orquestar agentes,
 * no de "abrir la app".
 */

// === Rangos ===
export interface Rank {
    name: string;
    minLevel: number;
    maxLevel: number;
    emoji: string;
    color: string;
    gradient: string;
    perk: string; // Lo que desbloquea este rango
}

export const RANKS: Rank[] = [
    { name: 'Aprendiz Arcano', minLevel: 1, maxLevel: 10, emoji: '🌑', color: 'text-white/60', gradient: 'from-gray-500 to-gray-400', perk: 'Plan Free' },
    { name: 'Forjador de Nexos', minLevel: 11, maxLevel: 30, emoji: '🔗', color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-400', perk: '50% descuento' },
    { name: 'Oráculo Estelar', minLevel: 31, maxLevel: 70, emoji: '🔮', color: 'text-orange-400', gradient: 'from-orange-500 to-yellow-400', perk: 'Básico gratis' },
    { name: 'Arquitecto Celestial', minLevel: 71, maxLevel: 99, emoji: '🏛️', color: 'text-red-400', gradient: 'from-red-500 to-pink-400', perk: 'Pro de por vida' },
    { name: 'Dragón Primordial', minLevel: 100, maxLevel: Infinity, emoji: '🐉', color: 'text-yellow-400', gradient: 'from-yellow-500 to-red-500', perk: 'Acceso vitalicio total' },
];

// === Recompensas de XP (nativas a la plataforma) ===
export const XP_REWARDS = {
    // Core: Orquestación
    CICLO_COMPLETADO: 25,        // Completar un ciclo del grafo
    CICLO_COMPLETO_4_NODOS: 50,  // Los 4 nodos ejecutados (analizador→ejecutor→validador→reflexión)
    EJECUCION_PERFECTA: 30,      // Sin errores ni auto-heal = ejecución limpia
    AUTO_SANACION: 15,            // El validador corrigió un error automáticamente

    // Eficiencia (lo que hace UAI especial)
    MULTI_MODELO: 20,            // Ciclo usó 2+ modelos diferentes (Claude + GPT + Gemini)
    BAJO_COSTO: 10,              // Ejecución por debajo del 50% del presupuesto estimado

    // Consistencia
    PRIMERA_MISION_DIA: 75,      // Primera orquestación del día
    OPERACION_CONTINUA: 15,      // Bonus por cada día consecutivo de operaciones
    META_DIARIA: 60,             // Completar 3 ciclos de orquestación en un día
} as const;

// === Meta Diaria: Ciclos de Orquestación ===
export const DAILY_GOAL = 3;

// === Logros (todos vinculados a uso real de la plataforma) ===
export interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    condition: (stats: UserStats) => boolean;
}

export interface UserStats {
    totalExecutions: number;
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    perfectExecutions: number;
    dailyGoalsCompleted: number;
    autoHeals: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'primer_ciclo',
        name: 'Ignición',
        description: 'Ejecutaste tu primer ciclo de orquestación',
        emoji: '🚀',
        condition: (s) => s.totalExecutions >= 1,
    },
    {
        id: 'operador_activo',
        name: 'Operador Activo',
        description: '3 días consecutivos de operaciones',
        emoji: '🔥',
        condition: (s) => s.currentStreak >= 3,
    },
    {
        id: 'infraestructura_viva',
        name: 'Infraestructura Viva',
        description: '7 días con agentes en operación continua',
        emoji: '⚡',
        condition: (s) => s.currentStreak >= 7,
    },
    {
        id: 'sistema_autonomo',
        name: 'Sistema Autónomo',
        description: '30 días de operación continua sin fallos',
        emoji: '🤖',
        condition: (s) => s.currentStreak >= 30,
    },
    {
        id: 'precision_quirurgica',
        name: 'Precisión Quirúrgica',
        description: '10 ejecuciones perfectas (0 errores)',
        emoji: '🎯',
        condition: (s) => s.perfectExecutions >= 10,
    },
    {
        id: 'auto_heal_master',
        name: 'Resiliencia',
        description: 'Tus agentes se auto-sanaron 20 veces',
        emoji: '🩹',
        condition: (s) => s.autoHeals >= 20,
    },
    {
        id: 'centurion',
        name: 'Centurión',
        description: '100 ciclos de orquestación completados',
        emoji: '🏛️',
        condition: (s) => s.totalExecutions >= 100,
    },
    {
        id: 'constancia',
        name: 'Disciplina Operativa',
        description: 'Cumpliste la meta diaria 7 veces',
        emoji: '⭐',
        condition: (s) => s.dailyGoalsCompleted >= 7,
    },
    {
        id: 'veterano',
        name: 'Veterano del Grafo',
        description: 'Alcanzaste nivel 50',
        emoji: '⚔️',
        condition: (s) => s.level >= 50,
    },
];

// === Cálculos de XP ===

export function xpForLevel(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.5));
}

export function totalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) total += xpForLevel(i);
    return total;
}

export function calculateLevel(totalXp: number): number {
    let level = 1;
    let xpNeeded = 0;
    while (true) {
        xpNeeded += xpForLevel(level + 1);
        if (totalXp < xpNeeded) break;
        level++;
        if (level >= 200) break;
    }
    return level;
}

export function getRank(level: number): Rank {
    for (const rank of RANKS) {
        if (level >= rank.minLevel && level <= rank.maxLevel) return rank;
    }
    return RANKS[RANKS.length - 1];
}

export function levelProgress(totalXp: number): {
    level: number; currentXp: number; xpToNext: number; progress: number; rank: Rank;
} {
    const level = calculateLevel(totalXp);
    const xpForCurrentLevel = totalXpForLevel(level);
    const xpForNextLevel = totalXpForLevel(level + 1);
    const currentXp = totalXp - xpForCurrentLevel;
    const xpToNext = xpForNextLevel - xpForCurrentLevel;
    const progress = Math.min(100, Math.floor((currentXp / xpToNext) * 100));
    return { level, currentXp, xpToNext, progress, rank: getRank(level) };
}

// === Racha de Operaciones ===

export function calculateStreak(lastActiveDate: string | undefined, currentDate: string): {
    isActive: boolean; streakBroken: boolean;
} {
    if (!lastActiveDate) return { isActive: false, streakBroken: false };
    const last = new Date(lastActiveDate);
    const current = new Date(currentDate);
    const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return { isActive: true, streakBroken: false };
    return { isActive: false, streakBroken: true };
}

/**
 * Calcula XP de una ejecución del grafo — recompensas nativas
 */
export function calculateExecutionXp(result: {
    success: boolean;
    autoHealed: boolean;
    nodesCompleted: number;
    isFirstOfDay: boolean;
    currentStreak: number;
    executionsToday: number;
}): { total: number; breakdown: { reason: string; xp: number; emoji: string }[] } {
    const breakdown: { reason: string; xp: number; emoji: string }[] = [];

    if (result.success) {
        breakdown.push({ reason: 'Ciclo completado', xp: XP_REWARDS.CICLO_COMPLETADO, emoji: '✅' });
    }

    if (result.nodesCompleted >= 4) {
        breakdown.push({ reason: 'Grafo completo (4 nodos)', xp: XP_REWARDS.CICLO_COMPLETO_4_NODOS, emoji: '🧠' });
    }

    if (result.success && !result.autoHealed) {
        breakdown.push({ reason: 'Ejecución perfecta', xp: XP_REWARDS.EJECUCION_PERFECTA, emoji: '💎' });
    }

    if (result.autoHealed) {
        breakdown.push({ reason: 'Auto-sanación exitosa', xp: XP_REWARDS.AUTO_SANACION, emoji: '🩹' });
    }

    if (result.nodesCompleted >= 3) {
        breakdown.push({ reason: 'Sinergia multi-modelo', xp: XP_REWARDS.MULTI_MODELO, emoji: '🔀' });
    }

    if (result.isFirstOfDay) {
        breakdown.push({ reason: 'Primera misión del día', xp: XP_REWARDS.PRIMERA_MISION_DIA, emoji: '☀️' });
    }

    if (result.currentStreak > 0) {
        const streakXp = XP_REWARDS.OPERACION_CONTINUA * Math.min(result.currentStreak, 30);
        breakdown.push({ reason: `Operación continua ×${result.currentStreak}`, xp: streakXp, emoji: '🔥' });
    }

    if (result.executionsToday + 1 === DAILY_GOAL) {
        breakdown.push({ reason: 'Meta diaria cumplida', xp: XP_REWARDS.META_DIARIA, emoji: '🎯' });
    }

    const total = breakdown.reduce((sum, item) => sum + item.xp, 0);
    return { total, breakdown };
}

// === Mensajes de Operación ===

export function getStreakMessage(streak: number): string {
    if (streak === 0) return 'Inicia operaciones hoy';
    if (streak === 1) return '1 día operando. Mantén tus agentes activos 🔥';
    if (streak <= 3) return `${streak} días en operación continua 🔥`;
    if (streak <= 7) return `${streak} días 🔥 Tus agentes no descansan`;
    if (streak <= 14) return `${streak} días 🔥🔥 Infraestructura imparable`;
    if (streak <= 30) return `${streak} días 🔥🔥🔥 Operador élite`;
    return `${streak} días 🔥🔥🔥🔥 SISTEMA AUTÓNOMO`;
}

export function getUnlockedAchievements(stats: UserStats): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.condition(stats));
}
