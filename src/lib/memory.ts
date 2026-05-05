/**
 * memory.ts — Capa de Memoria Semántica con pgvector (Neon)
 *
 * Migrado de Pinecone a pgvector para eliminar dependencia externa.
 * Neon soporta pgvector nativamente — sin costos adicionales.
 *
 * Requiere: OPENAI_API_KEY para generar embeddings (text-embedding-3-small)
 * Tablas: memory_vectors (creada en initDatabase)
 */

import { dbPool } from './database';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MemoryRecord {
    id?: string;
    agent_id: string;
    user_id?: string;
    mission_id?: string | null;
    learning_type: string;
    summary: string;
    details?: Record<string, unknown> | null;
    keywords?: string[];
    created_at?: Date;
}

// ─── Embeddings (OpenAI text-embedding-3-small) ───────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[Memory] OPENAI_API_KEY no configurada. Saltando embedding.');
        return [];
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text.slice(0, 8000), // límite del modelo
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI Embeddings API error: ${err}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
}

// ─── Guardar Reflexión ─────────────────────────────────────────────────────────

/**
 * Guarda un aprendizaje en la memoria vectorial (pgvector).
 * Firma compatible con la API anterior (Pinecone).
 */
export async function saveReflection(
    text: string,
    agent_id: string,
    mission_id: string | null,
    learning_type: string,
    summary: string,
    details: Record<string, unknown> | null,
    keywords: string[],
    metadata: Record<string, unknown> = {}
): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[Memory] Saltando guardado — OPENAI_API_KEY ausente.');
        return;
    }

    try {
        console.log('[Memory] Guardando reflexión en pgvector...');
        const embedding = await generateEmbedding(summary);

        if (embedding.length === 0) return;

        const userId = (metadata?.userId as string) || agent_id;
        const embeddingLiteral = `[${embedding.join(',')}]`;

        await dbPool.query(
            `INSERT INTO memory_vectors
                (agent_id, user_id, mission_id, learning_type, summary, details, keywords, embedding)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
            [
                agent_id,
                userId,
                mission_id,
                learning_type,
                summary,
                JSON.stringify(details ?? {}),
                keywords,
                embeddingLiteral,
            ]
        );

        console.log('[Memory] Reflexión guardada en pgvector.');
    } catch (error) {
        console.error('[Memory] Error guardando reflexión:', error);
    }
}

// ─── Consultar Memoria ─────────────────────────────────────────────────────────

/**
 * Busca memorias similares por coseno de similitud.
 * Firma compatible con la API anterior (Pinecone).
 */
export async function queryMemory(
    query: string,
    limit: number = 3,
    learning_type: string | null = null,
    agent_id: string | null = null,
    userId?: string
): Promise<Record<string, unknown>[]> {
    if (!process.env.OPENAI_API_KEY) {
        return [];
    }

    try {
        console.log(`[Memory] Buscando memorias similares a: "${query.slice(0, 60)}..."`);
        const embedding = await generateEmbedding(query);
        if (embedding.length === 0) return [];

        const embeddingLiteral = `[${embedding.join(',')}]`;

        // Construir filtros dinámicos
        const conditions: string[] = [];
        const params: unknown[] = [embeddingLiteral, limit];
        let paramIdx = 3;

        if (userId) {
            conditions.push(`user_id = $${paramIdx++}`);
            params.push(userId);
        }
        if (learning_type) {
            conditions.push(`learning_type = $${paramIdx++}`);
            params.push(learning_type);
        }
        if (agent_id) {
            conditions.push(`agent_id = $${paramIdx++}`);
            params.push(agent_id);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await dbPool.query(
            `SELECT id, agent_id, user_id, mission_id, learning_type, summary, details, keywords,
                    1 - (embedding <=> $1::vector) AS similarity
             FROM memory_vectors
             ${whereClause}
             ORDER BY embedding <=> $1::vector
             LIMIT $2`,
            params
        );

        return result.rows.map(row => ({
            text: row.summary,
            agent_id: row.agent_id,
            user_id: row.user_id,
            mission_id: row.mission_id,
            learning_type: row.learning_type,
            details: row.details,
            keywords: row.keywords,
            similarity: row.similarity,
        }));
    } catch (error) {
        console.error('[Memory] Error consultando memoria:', error);
        return [];
    }
}

// ─── Análisis de Patrones de Error ────────────────────────────────────────────

export async function getErrorPatterns(userId: string): Promise<
    Array<{ pattern: string; frequency: number; solutions: string[] }>
> {
    if (!process.env.OPENAI_API_KEY) return [];

    try {
        const results = await queryMemory(
            'Patrones de error, fallos recurrentes y soluciones aplicadas',
            20,
            'error_resolution',
            null,
            userId
        );

        const patterns: Record<string, { frequency: number; solutions: Set<string> }> = {};

        results.forEach((match) => {
            const text = ((match.text as string) || '').toLowerCase();

            if (text.includes('timeout') || text.includes('lentitud')) {
                const key = 'Timeout/Rendimiento';
                if (!patterns[key]) patterns[key] = { frequency: 0, solutions: new Set() };
                patterns[key].frequency++;
                patterns[key].solutions.add('Simplificar tarea, usar modelo más rápido');
            }
            if (text.includes('error') || text.includes('fallo')) {
                const key = 'Error de LLM';
                if (!patterns[key]) patterns[key] = { frequency: 0, solutions: new Set() };
                patterns[key].frequency++;
                patterns[key].solutions.add('Reintentar con modelo alternativo');
            }
            if (text.includes('memoria') || text.includes('contexto')) {
                const key = 'Problema de Contexto';
                if (!patterns[key]) patterns[key] = { frequency: 0, solutions: new Set() };
                patterns[key].frequency++;
                patterns[key].solutions.add('Recuperar más contexto, usar RAG');
            }
        });

        return Object.entries(patterns)
            .map(([pattern, data]) => ({
                pattern,
                frequency: data.frequency,
                solutions: Array.from(data.solutions),
            }))
            .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
        console.error('[Memory] Error obteniendo patrones de error:', error);
        return [];
    }
}

// ─── Estrategias Exitosas ──────────────────────────────────────────────────────

export async function getSuccessfulStrategies(
    userId: string,
    missionType: string
): Promise<Array<{ strategy: string; successRate: number; description: string }>> {
    if (!process.env.OPENAI_API_KEY) return [];

    try {
        const results = await queryMemory(
            `Estrategias exitosas para misiones de tipo ${missionType}`,
            15,
            'best_practice',
            null,
            userId
        );

        const strategies: Record<string, { count: number; description: string }> = {};

        results.forEach((match) => {
            const text = (match.text as string) || '';
            const strategyMatch = text.match(/Recomendaci[oó]n[:\s]+([^.]+)/);
            if (strategyMatch) {
                const strategy = strategyMatch[1].trim();
                if (!strategies[strategy]) {
                    strategies[strategy] = { count: 0, description: text.slice(0, 200) };
                }
                strategies[strategy].count++;
            }
        });

        const total = results.length || 1;
        return Object.entries(strategies)
            .map(([strategy, data]) => ({
                strategy,
                successRate: (data.count / total) * 100,
                description: data.description,
            }))
            .sort((a, b) => b.successRate - a.successRate);
    } catch (error) {
        console.error('[Memory] Error obteniendo estrategias exitosas:', error);
        return [];
    }
}

// ─── Consolidar Memoria ────────────────────────────────────────────────────────

export async function consolidateMemory(userId: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) return '';

    try {
        const results = await queryMemory(
            'Resumen general de todas las lecciones aprendidas',
            50,
            null,
            null,
            userId
        );

        return results
            .map((r) => (r.text as string) || '')
            .filter((t) => t.length > 0)
            .join('\n---\n');
    } catch (error) {
        console.error('[Memory] Error consolidando memoria:', error);
        return '';
    }
}
