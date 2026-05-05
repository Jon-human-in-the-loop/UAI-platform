/**
 * orchestrator/memory.ts — Semantic memory for the orchestrator via pgvector
 *
 * Migrated from Pinecone to pgvector (Neon PostgreSQL).
 * Uses the same memory_vectors table created in database.ts.
 */

import { saveReflection, queryMemory, consolidateMemory as consolidateMemoryBase } from '../memory';

/**
 * Almacena un pensamiento o resultado en la conciencia a largo plazo con metadatos enriquecidos.
 */
export async function storeInLongTermMemory(text: string, metadata: Record<string, unknown> = {}) {
    try {
        const enrichedMetadata = {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: (metadata.source as string) || 'orchestrator',
            importance: metadata.importance ?? 1,
        };

        await saveReflection(
            text,
            (metadata.agentId as string) || 'uai-orchestrator',
            (metadata.missionId as string) || null,
            (metadata.learningType as string) || 'insight',
            text,
            enrichedMetadata,
            (metadata.keywords as string[]) || ['orchestrator'],
            enrichedMetadata
        );

        console.log(`--- PENSAMIENTO ALMACENADO EN MEMORIA SEMÁNTICA (pgvector) ---`);
    } catch (error) {
        console.error('[Orchestrator Memory] Error almacenando en memoria:', error);
    }
}

/**
 * Recupera contextos relevantes basados en la semántica y filtrado por metadatos.
 */
export async function recallFromMemory(query: string, k = 5, filter: Record<string, unknown> | null = null) {
    try {
        const userId = filter?.userId as string | undefined;
        const results = await queryMemory(query, k, null, null, userId);

        if (results.length === 0) return "No se encontraron recuerdos relevantes.";

        return results.map(doc => {
            const timestamp = doc.timestamp as string | undefined;
            const date = timestamp ? new Date(timestamp).toLocaleDateString() : 'Fecha desconocida';
            return `[Recuerdo del ${date}]: ${doc.text || doc.summary || ''}`;
        }).join("\n---\n");
    } catch (error) {
        console.error('[Orchestrator Memory] Error recuperando memoria:', error);
        return "";
    }
}

/**
 * Limpia la memoria de corto plazo pero mantiene la semántica.
 */
export async function consolidateMemory(userId: string) {
    console.log(`[Memory] Consolidando recuerdos para el usuario ${userId}...`);
    const result = await consolidateMemoryBase(userId);
    return result.length > 0;
}

/**
 * Legacy compatibility: getSemanticMemory returns null
 * (Pinecone VectorStore is no longer used — queries go through queryMemory)
 */
export async function getSemanticMemory() {
    // pgvector queries happen directly through queryMemory / dbPool
    // This function is kept for backward-compatibility with any code
    // that checks `if (memory) { ... }`
    return null;
}
