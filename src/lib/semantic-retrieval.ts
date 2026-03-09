import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Lazy initialization to avoid build errors when API keys are missing
let pineconeInstance: Pinecone | null = null;
function getPinecone() {
    if (!pineconeInstance) {
        pineconeInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY || "dummy-key-for-build",
        });
    }
    return pineconeInstance;
}

let embeddingsInstance: OpenAIEmbeddings | null = null;
function getEmbeddings() {
    if (!embeddingsInstance) {
        embeddingsInstance = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
            modelName: "text-embedding-3-small",
        });
    }
    return embeddingsInstance;
}

/**
 * Optimiza la recuperación semántica de reflexiones en Pinecone.
 */
export async function semanticRetrievalOptimized(
    query: string,
    userId: string,
    topK: number = 5
): Promise<Array<{ id: string; text: string; score: number; metadata: any }>> {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        console.warn("[Recuperación Semántica] API Keys faltantes, retornando resultados vacíos.");
        return [];
    }

    try {
        const pinecone = getPinecone();
        const embeddings = getEmbeddings();
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || "uai-memory");

        const queryEmbedding = await embeddings.embedQuery(query);

        const results = await index.query({
            vector: queryEmbedding,
            topK,
            filter: {
                user_id: { $eq: userId },
            },
            includeMetadata: true,
        });

        const retrievedItems = results.matches.map((match: any) => ({
            id: match.id,
            text: match.metadata?.text || "",
            score: match.score,
            metadata: match.metadata,
        }));

        console.log(`[Recuperación Semántica] Encontrados ${retrievedItems.length} resultados relevantes para el usuario ${userId}.`);

        return retrievedItems;
    } catch (error) {
        console.error("Error en recuperación semántica:", error);
        return [];
    }
}

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

/**
 * Recupera patrones de error recurrentes en las misiones del usuario.
 */
export async function retrieveErrorPatterns(userId: string): Promise<Array<{ pattern: string; frequency: number; solutions: string[] }>> {
    // Use Pinecone metadata filter on learning_type instead of brittle keyword matching
    const results = await semanticRetrievalOptimized(
        "error resolution recovery strategy failure",
        userId,
        20
    );

    // Filter results that have error_resolution learning_type from metadata
    const errorResults = results.filter(r => r.metadata?.learning_type === 'error_resolution' || r.score > 0.75);

    if (errorResults.length === 0) return [];

    // Group by score bands as frequency proxy
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

/**
 * Recupera estrategias exitosas que pueden aplicarse a nuevas misiones.
 */
export async function retrieveSuccessfulStrategies(
    userId: string,
    missionType: string
): Promise<Array<{ strategy: string; successRate: number; description: string }>> {
    // Filter by best_practice learning_type via metadata instead of keyword matching
    const results = await semanticRetrievalOptimized(
        `successful strategies best practices ${missionType}`,
        userId,
        15
    );

    const bestPractices = results.filter(
        r => r.metadata?.learning_type === 'best_practice' || r.metadata?.learning_type === 'optimization' || r.score > 0.78
    );

    return bestPractices.map(r => ({
        strategy: r.text.substring(0, 100),
        successRate: Math.round(r.score * 100),
        description: r.text.substring(0, 250),
    })).sort((a, b) => b.successRate - a.successRate);
}

/**
 * Mejora la memoria de largo plazo mediante la consolidación de reflexiones relacionadas.
 */
export async function consolidateLongTermMemory(userId: string): Promise<string> {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        return "API Keys faltantes para consolidación de memoria.";
    }

    try {
        const pinecone = getPinecone();
        const embeddings = getEmbeddings();
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || "uai-memory");

        const query = "Resumen general de todas las lecciones aprendidas";
        const queryEmbedding = await embeddings.embedQuery(query);

        const results = await index.query({
            vector: queryEmbedding,
            topK: 50,
            filter: {
                user_id: { $eq: userId },
            },
            includeMetadata: true,
        });

        const consolidatedText = results.matches
            .map((match: any) => match.metadata?.text || "")
            .filter((text: string) => text.length > 0)
            .join("\n---\n");

        if (consolidatedText.length === 0) return "No hay reflexiones para consolidar.";

        const { ChatOpenAI } = await import("@langchain/openai");
        const llm = new ChatOpenAI({
            modelName: "gpt-4o",
            openAIApiKey: process.env.OPENAI_API_KEY,
            temperature: 0.2,
        });

        const { PromptTemplate } = await import("@langchain/core/prompts");
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
        console.error("Error consolidando memoria de largo plazo:", error);
        return "Error en la consolidación de memoria.";
    }
}
