/**
 * MISSION CONTROL - UAI Platform
 * Lógica para la detección de sinergias y gestión de misiones colaborativas.
 */

export interface Synergy {
    type: 'TECHNICAL' | 'STRATEGIC' | 'CREATIVE' | 'OPERATIONAL';
    score: number;
    description: string;
    compatibleAgents: string[];
}

export interface Mission {
    id: string;
    name: string;
    description: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    synergyScore: number;
    assignedAgents: string[];
    createdAt: Date;
}

/**
 * Analiza la compatibilidad entre dos agentes basándose en sus roles y habilidades.
 */
export function analyzeSynergy(agentA: any, agentB: any): Synergy {
    // Lógica de detección de sinergias basada en roles
    const roles = [agentA.role.toLowerCase(), agentB.role.toLowerCase()];
    
    let score = 0;
    let type: Synergy['type'] = 'OPERATIONAL';
    let description = '';

    if (roles.includes('investigador') && roles.includes('coder')) {
        score = 95;
        type = 'TECHNICAL';
        description = 'Sinergia de Desarrollo Rápido: Investigación técnica directa a implementación.';
    } else if (roles.includes('seo') && roles.includes('marketing')) {
        score = 90;
        type = 'STRATEGIC';
        description = 'Sinergia de Crecimiento: Optimización de visibilidad con psicología de conversión.';
    } else {
        score = 50;
        type = 'OPERATIONAL';
        description = 'Colaboración estándar de flujo de trabajo.';
    }

    return { type, score, description, compatibleAgents: [agentA.id, agentB.id] };
}

/**
 * Crea una nueva misión colaborativa.
 */
export async function createCollaborativeMission(name: string, description: string, agentIds: string[]): Promise<Mission> {
    const mission: Mission = {
        id: crypto.randomUUID(),
        name,
        description,
        status: 'PENDING',
        synergyScore: 0, // Se calculará al iniciar
        assignedAgents: agentIds,
        createdAt: new Date(),
    };
    
    // Aquí iría la persistencia en base de datos
    console.log(`[Mission Control] Misión creada: ${name}`);
    return mission;
}
