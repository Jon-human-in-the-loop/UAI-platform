/**
 * MISSION CONTROL - UAI Platform
 * Lógica avanzada para la detección de sinergias y gestión de misiones colaborativas.
 */

export interface Synergy {
    type: 'TECHNICAL' | 'STRATEGIC' | 'CREATIVE' | 'OPERATIONAL' | 'NEURAL';
    score: number;
    description: string;
    compatibleAgents: string[];
    potentialOutput: string;
}

export interface Mission {
    id: string;
    name: string;
    description: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    synergyScore: number;
    assignedAgents: string[];
    createdAt: Date;
    metadata?: Record<string, any>;
}

/**
 * Matriz de compatibilidad de roles para el motor de sinergias.
 */
export const ROLE_SYNERGY_MATRIX: Record<string, Record<string, { score: number, type: Synergy['type'], desc: string }>> = {
    'investigador': {
        'coder': { score: 95, type: 'TECHNICAL', desc: 'Ciclo de I+D acelerado: De la teoría al código en un solo paso.' },
        'analista': { score: 88, type: 'STRATEGIC', desc: 'Profundidad analítica: Datos validados con investigación de campo.' },
        'escritor': { score: 92, type: 'CREATIVE', desc: 'Contenido de autoridad: Narrativa respaldada por datos rigurosos.' }
    },
    'seo': {
        'marketing': { score: 94, type: 'STRATEGIC', desc: 'Dominio de mercado: Visibilidad orgánica con alta conversión.' },
        'analista': { score: 85, type: 'OPERATIONAL', desc: 'Optimización basada en datos: Ajustes técnicos según métricas reales.' }
    },
    'arquitecto': {
        'coder': { score: 98, type: 'TECHNICAL', desc: 'Estructura robusta: Implementación fiel a patrones de diseño avanzados.' },
        'seguridad': { score: 96, type: 'NEURAL', desc: 'Blindaje cognitivo: Sistemas diseñados con seguridad desde la base.' }
    }
};

/**
 * Analiza la compatibilidad entre dos agentes basándose en sus roles, modelos y capacidades.
 */
export function analyzeSynergy(agentA: any, agentB: any): Synergy {
    const roleA = agentA.role?.toLowerCase() || 'general';
    const roleB = agentB.role?.toLowerCase() || 'general';
    
    // Buscar en la matriz de compatibilidad
    const synergyData = ROLE_SYNERGY_MATRIX[roleA]?.[roleB] || ROLE_SYNERGY_MATRIX[roleB]?.[roleA];
    
    if (synergyData) {
        return {
            type: synergyData.type,
            score: synergyData.score,
            description: synergyData.desc,
            compatibleAgents: [agentA.id, agentB.id],
            potentialOutput: `Aumento del ${synergyData.score - 50}% en la precisión del resultado final.`
        };
    }

    // Sinergia por modelo (ej. Claude + GPT-4)
    if (agentA.model !== agentB.model) {
        return {
            type: 'NEURAL',
            score: 75,
            description: 'Validación cruzada: Reducción de alucinaciones mediante diversidad de modelos.',
            compatibleAgents: [agentA.id, agentB.id],
            potentialOutput: 'Mayor fiabilidad en tareas críticas.'
        };
    }

    return { 
        type: 'OPERATIONAL', 
        score: 50, 
        description: 'Colaboración estándar de flujo de trabajo.', 
        compatibleAgents: [agentA.id, agentB.id],
        potentialOutput: 'Ejecución secuencial básica.'
    };
}

/**
 * Calcula el puntaje de sinergia total para un equipo de agentes.
 */
export function calculateTeamSynergy(agents: any[]): number {
    if (agents.length < 2) return 0;
    
    let totalScore = 0;
    let pairs = 0;

    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const synergy = analyzeSynergy(agents[i], agents[j]);
            totalScore += synergy.score;
            pairs++;
        }
    }

    return Math.round(totalScore / pairs);
}

/**
 * Crea una nueva misión colaborativa con cálculo de sinergia inicial.
 */
export async function createCollaborativeMission(name: string, description: string, agents: any[]): Promise<Mission> {
    const synergyScore = calculateTeamSynergy(agents);
    
    const mission: Mission = {
        id: crypto.randomUUID(),
        name,
        description,
        status: 'PENDING',
        synergyScore,
        assignedAgents: agents.map(a => a.id),
        createdAt: new Date(),
        metadata: {
            teamSize: agents.length,
            primarySynergyType: agents.length >= 2 ? analyzeSynergy(agents[0], agents[1]).type : 'OPERATIONAL'
        }
    };
    
    console.log(`[Mission Control] Misión colaborativa creada: ${name} (Sinergia: ${synergyScore}%)`);
    return mission;
}
