import { dbPool } from './database';
import { saveReflection, queryMemory } from './memory';

/**
 * Módulo de Memoria Colectiva (Swarm Intelligence)
 * Permite a los agentes abstraer aprendizajes y compartirlos.
 */

export interface LearningRecord {
    agent_id: string;
    mission_id: string | null;
    learning_type: 'error_resolution' | 'best_practice' | 'optimization' | 'insight';
    summary: string;
    details: any;
    keywords: string[];
}

/**
 * Procesa la experiencia de un agente y extrae aprendizajes significativos.
 * En una implementación real, esto usaría un LLM para analizar logs.
 */
export async function abstractLearning(record: LearningRecord) {
    console.log(`--- [Swarm Intelligence] Abstrayendo aprendizaje para el agente ${record.agent_id} ---`);

    try {
        // 1. Guardar en Memoria Semántica (pgvector)
        await saveReflection(
            record.summary,
            record.agent_id,
            record.mission_id,
            record.learning_type,
            record.summary,
            record.details,
            record.keywords
        );

        // 2. Guardar en Base de Datos Relacional (PostgreSQL) para metadatos y auditoría
        const client = await dbPool.connect();
        try {
            await client.query(`
                INSERT INTO agent_learnings (
                    agent_id, mission_id, learning_type, summary, details, keywords
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                record.agent_id,
                record.mission_id,
                record.learning_type,
                record.summary,
                JSON.stringify(record.details),
                record.keywords
            ]);
        } finally {
            client.release();
        }

        console.log(`--- [Swarm Intelligence] Aprendizaje guardado exitosamente ---`);
    } catch (error) {
        console.error(`--- [Swarm Intelligence] Error al abstraer aprendizaje:`, error);
    }
}

/**
 * Recupera aprendizajes relevantes de la memoria colectiva para una consulta dada.
 */
export async function retrieveCollectiveKnowledge(query: string, limit: number = 3) {
    console.log(`--- [Swarm Intelligence] Consultando memoria colectiva para: "${query}" ---`);
    
    try {
        const results = await queryMemory(query, limit);
        return results;
    } catch (error) {
        console.error(`--- [Swarm Intelligence] Error al consultar memoria colectiva:`, error);
        return [];
    }
}
