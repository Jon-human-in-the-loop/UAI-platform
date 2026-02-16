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
 * Aplica los bonos de los personajes activos a una ejecución.
 */
export function applyCharacterBonuses(baseValue: number, bonusType: Character['bonusType'], activeCharacters: Character[]): number {
    let totalBonus = 0;
    
    activeCharacters.forEach(char => {
        if (char.bonusType === bonusType) {
            totalBonus += char.bonusValue;
        }
    });

    // Los bonos son porcentuales
    return Math.round(baseValue * (1 + totalBonus / 100));
}

/**
 * Calcula el "Proof of Work" agéntico basado en la calidad de la ejecución.
 */
export function calculateProofOfWork(executionResult: any, activeCharacters: Character[] = []): number {
    let powScore = 0;
    
    // Factores de calidad base
    if (executionResult.success) powScore += 50;
    if (executionResult.tokensUsed < 5000) powScore += 20; // Eficiencia
    if (executionResult.autoHealed) powScore -= 10; // Penalización por error inicial
    
    // Aplicar bonos de personajes (ej. El Centinela aumenta la precisión/PoW)
    powScore = applyCharacterBonuses(powScore, 'ACCURACY', activeCharacters);
    
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

/**
 * Calcula la XP final ganada aplicando bonos de personajes.
 */
export function calculateFinalXP(baseXP: number, activeCharacters: Character[]): number {
    return applyCharacterBonuses(baseXP, 'XP', activeCharacters);
}
