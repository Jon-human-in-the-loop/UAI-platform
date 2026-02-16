/**
 * GAMIFICATION ADVANCED - UAI Platform
 * Evolución del sistema RPG: Personajes, Perks y Proof of Work.
 */

import { UserStats } from './gamification';

export interface Character {
    id: string;
    name: string;
    role: string;
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    bonusType: 'XP' | 'SPEED' | 'ACCURACY' | 'COST';
    bonusValue: number;
    unlockedAtLevel: number;
}

export const CHARACTERS: Character[] = [
    { id: 'sentinel', name: 'El Centinela', role: 'Auditor', rarity: 'COMMON', bonusType: 'ACCURACY', bonusValue: 5, unlockedAtLevel: 5 },
    { id: 'architect', name: 'Arquitecto de Datos', role: 'Ingeniero', rarity: 'RARE', bonusType: 'SPEED', bonusValue: 10, unlockedAtLevel: 15 },
    { id: 'dragon', name: 'Dragón Primordial', role: 'Soberano', rarity: 'LEGENDARY', bonusType: 'XP', bonusValue: 25, unlockedAtLevel: 100 },
];

export interface Perk {
    id: string;
    name: string;
    description: string;
    costXP: number;
    effect: (stats: UserStats) => Partial<UserStats>;
}

/**
 * Calcula el "Proof of Work" agéntico basado en la calidad de la ejecución.
 */
export function calculateProofOfWork(executionResult: any): number {
    let powScore = 0;
    
    // Factores de calidad
    if (executionResult.success) powScore += 50;
    if (executionResult.tokensUsed < 5000) powScore += 20; // Eficiencia
    if (executionResult.autoHealed) powScore -= 10; // Penalización por error inicial, pero compensado por éxito
    
    return Math.max(0, powScore);
}

/**
 * Verifica si un usuario ha desbloqueado un nuevo personaje.
 */
export function checkCharacterUnlocks(level: number): Character[] {
    return CHARACTERS.filter(c => level >= c.unlockedAtLevel);
}

/**
 * Sistema de Confianza (Trust Level)
 * Aumenta con ejecuciones exitosas sin auto-sanación.
 */
export function calculateTrustLevel(totalExecutions: number, perfectExecutions: number): number {
    if (totalExecutions === 0) return 0;
    return Math.floor((perfectExecutions / totalExecutions) * 100);
}
