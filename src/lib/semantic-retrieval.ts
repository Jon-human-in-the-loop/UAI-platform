/**
 * semantic-retrieval.ts — Advanced semantic retrieval via pgvector
 *
 * Migrated from Pinecone to pgvector (Neon PostgreSQL).
 * Provides optimized semantic search, topic-based retrieval,
 * error pattern analysis, and memory consolidation.
 */

import { dbPool } from './database';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// ─── Embedding Generation ──────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) return [];

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text.slice(0, 8000),
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI Embeddings error: ${await response.text()}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
}

// ─── Core Semantic Search ──────────────────────────────────────────────────────

/**
 * Optimized semantic retrieval from pgvector memory_vectors table.
 */
export async function semanticRetrievalOptimized(
    query: string,
    userId: string,
    topK: number = 5
): Promise<Array<{ id: string; text: string; score: number; metadata: Record<string, unknown> }>> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[Semantic Retrieval] OPENAI_API_KEY ausente, retornando vacío.');
        return [];
    }

    try {
        const embedding = await generateEmbedding(query);
        if (embedding.length === 0) return [];

        const embeddingLiteral = `[${embedding.join(',')}]`;

        const result = await dbPool.query(
            `SELECT id, summary, details, keywords, learning_type, agent_id, mission_id,
                    1 - (embedding <=> $1::vector) AS score
             FROM memory_vectors
             WHERE user_id = $2
             ORDER BY embedding <=> $1::vector
             LIMIT $3`,
            [embeddingLiteral, userId, topK]
        );

        const retrievedItems = result.rows.map(row => ({
            id: row.id,
            text: row.summary || '',
            score: parseFloat(row.score) || 0,
            metadata: {
                learning_type: row.learning_type,
                agent_id: row.agent_id,
                mission_id: row.mission_id,
                details: row.details,
                keywords: row.keywords,
            },
        }));

        console.log(`[Semantic Retrieval] ${retrievedItems.length} resultados para usuario ${userId}.`);
        return retrievedItems;
    } catch (error) {
        console.error('[Semantic Retrieval] Error:', error);
        return [];
    }
}

// ─── Topic-Based Retrieval ─────────────────────────────────────────────────────

/**
 * Recupera reflexiones relacionadas con un tema específico.
 */
export async function retrieveReflectionsByTopic(
    topic: string,
    userId: string
): Promise<Array<{ id: string; text: string; score: number }>> {
    const query = `Reflexiones y lecciones aprendidas sobre: ${topic}`;
    const results = await semanticRetrievalOptimized(query, userId, 10);
    return results.map(r => ({ id: r.id, text: r.text, score: r.score }));
}

// ─── Error Pattern Analysis ────────────────────────────────────────────────────

/**
 * Recupera patrones de error recurrentes en las misiones del usuario.
 */
export async function retrieveErrorPatterns(
    userId: string
): Promise<Array<{ pattern: string; frequency: number; solutions: string[] }>> {
    const results = await semanticRetrievalOptimized(
        'error resolution recovery strategy failure',
        userId,
        20
    );

    const errorResults = results.filter(
        r => r.metadata?.learning_type === 'error_resolution' || r.score > 0.75
    );

    if (errorResults.length === 0) return [];

    const high = errorResults.filter(r => r.score > 0.85);
    const mid = errorResults.filter(r => r.score <= 0.85 && r.score > 0.75);

    const patterns: Array<{ pattern: string; frequency: number; solutions: string[] }> = [];

    if (high.length > 0) {
        patterns.push({
            pattern: high[0].text.substring(0, 80),
            frequency: high.length,
            solutions: high.map(r => r.text.substring(0, 150)),
        });
    }
    if (mid.length > 0) {
        patterns.push({
            pattern: mid[0].text.substring(0, 80),
            frequency: mid.length,
            solutions: mid.map(r => r.text.substring(0, 150)),
        });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
}

// ─── Successful Strategies ─────────────────────────────────────────────────────

/**
 * Recupera estrategias exitosas que pueden aplicarse a nuevas misiones.
 */
export async function retrieveSuccessfulStrategies(
    userId: string,
    missionType: string
): Promise<Array<{ strategy: string; successRate: number; description: string }>> {
    const results = await semanticRetrievalOptimized(
        `successful strategies best practices ${missionType}`,
        userId,
        15
    );

    const bestPractices = results.filter(
        r => r.metadata?.learning_type === 'best_practice' ||
             r.metadata?.learning_type === 'optimization' ||
             r.score > 0.78
    );

    return bestPractices.map(r => ({
        strategy: r.text.substring(0, 100),
        successRate: Math.round(r.score * 100),
        description: r.text.substring(0, 250),
    })).sort((a, b) => b.successRate - a.successRate);
}

// ─── Memory Consolidation ──────────────────────────────────────────────────────

/**
 * Consolida la memoria de largo plazo usando un LLM para generar resúmenes.
 */
export async function consolidateLongTermMemory(userId: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        return 'OPENAI_API_KEY requerida para consolidación de memoria.';
    }

    try {
        const results = await semanticRetrievalOptimized(
            'Resumen general de todas las lecciones aprendidas',
            userId,
            50
        );

        const consolidatedText = results
            .map(r => r.text)
            .filter(t => t.length > 0)
            .join('\n---\n');

        if (consolidatedText.length === 0) return 'No hay reflexiones para consolidar.';

        const { ChatOpenAI } = await import('@langchain/openai');
        const llm = new ChatOpenAI({
            modelName: 'gpt-4o',
            openAIApiKey: process.env.OPENAI_API_KEY,
            temperature: 0.2,
        });

        const { PromptTemplate } = await import('@langchain/core/prompts');
        const consolidationPrompt = PromptTemplate.fromTemplate(`
        Analiza las siguientes reflexiones y lecciones aprendidas del usuario, y genera un resumen consolidado que incluya:
        - Los temas principales aprendidos.
        - Patrones de éxito y fracaso.
        - Recomendaciones para el futuro.
        
        Reflexiones:
        {reflections}
        
        Resumen consolidado:
        `);

        const chain = consolidationPrompt.pipe(llm);
        const response: any = await chain.invoke({ reflections: consolidatedText });

        return response.content.toString();
    } catch (error) {
        console.error('[Semantic Retrieval] Error consolidando memoria:', error);
        return 'Error en la consolidación de memoria.';
    }
}

// ─── Text Splitter utility (kept for document ingestion) ───────────────────────

export { RecursiveCharacterTextSplitter };
