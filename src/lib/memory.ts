import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// Lazy initialization to avoid build errors when API keys are missing
let pcInstance: Pinecone | null = null;
function getPc() {
    if (!pcInstance) {
        pcInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY || "dummy-key-for-build",
        });
    }
    return pcInstance;
}

function getIndex() {
    return getPc().index(process.env.PINECONE_INDEX_NAME || "uai-memory");
}

let embeddingsInstance: OpenAIEmbeddings | null = null;
function getEmbeddings() {
    if (!embeddingsInstance) {
        embeddingsInstance = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
        });
    }
    return embeddingsInstance;
}

/**
 * Guarda una "reflexión" o aprendizaje en la memoria a largo plazo.
 */
export async function saveReflection(text: string, agent_id: string, mission_id: string | null, learning_type: string, summary: string, details: any | null, keywords: string[], metadata: any = {}) {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        console.warn("[Memoria] API Keys faltantes, saltando guardado de reflexión.");
        return;
    }

    try {
        console.log("--- Guardando Reflexión en Memoria Semántica ---");
        const embeddings = getEmbeddings();
        const index = getIndex();

        const doc = new Document({
            pageContent: summary,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
            },
        });

        const vector = await embeddings.embedDocuments([doc.pageContent]);

        await index.upsert({
            records: [{
                id: `ref_${Date.now()}`,
                values: vector[0],
                metadata: {
                    text: summary,
                    agent_id,
                    user_id: metadata.userId || agent_id, // Consistent key for user-scoped queries
                    mission_id,
                    learning_type,
                    details,
                    keywords,
                    ...doc.metadata
                }
            }]
        });
    } catch (error) {
        console.error("Error guardando reflexión:", error);
    }
}

/**
 * Busca contextos relevantes del pasado con recuperación semántica optimizada.
 */
export async function queryMemory(query: string, limit: number = 3, learning_type: string | null = null, agent_id: string | null = null, userId?: string) {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        return [];
    }

    try {
        console.log(`--- Buscando en Memoria: "${query}" ---`);
        const embeddings = getEmbeddings();
        const index = getIndex();

        const queryVector = await embeddings.embedQuery(query);

        const queryFilter: any = {};
        if (userId) queryFilter.user_id = { $eq: userId };

        const queryResponse = await index.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
            ...(Object.keys(queryFilter).length > 0 && { filter: queryFilter }),
        });

        let filteredMatches = queryResponse.matches;

        if (learning_type) {
            filteredMatches = filteredMatches.filter(match => match.metadata?.learning_type === learning_type);
        }

        if (agent_id) {
            filteredMatches = filteredMatches.filter(match => match.metadata?.agent_id === agent_id);
        }

        return filteredMatches.map(match => match.metadata).filter(Boolean);
    } catch (error) {
        console.error("Error consultando memoria:", error);
        return [];
    }
}


/**
 * Recupera patrones de error recurrentes en las misiones del usuario.
 */
export async function getErrorPatterns(userId: string) {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        return [];
    }

    try {
        console.log(`--- Analizando Patrones de Error para Usuario ${userId} ---`);
        const embeddings = getEmbeddings();
        const index = getIndex();

        const queryVector = await embeddings.embedQuery("Patrones de error, fallos recurrentes y soluciones aplicadas");

        const queryResponse = await index.query({
            vector: queryVector,
            topK: 20,
            includeMetadata: true,
            filter: {
                agent_id: { $eq: userId }
            }
        });

        const patterns: Record<string, { frequency: number; solutions: Set<string> }> = {};

        queryResponse.matches.forEach((match: any) => {
            const text = (match.metadata?.text || "").toLowerCase();
            
            if (text.includes("timeout") || text.includes("lentitud")) {
                const pattern = "Timeout/Rendimiento";
                if (!patterns[pattern]) patterns[pattern] = { frequency: 0, solutions: new Set() };
                patterns[pattern].frequency++;
                patterns[pattern].solutions.add("Simplificar tarea, usar modelo más rápido");
            }
            
            if (text.includes("error") || text.includes("fallo")) {
                const pattern = "Error de LLM";
                if (!patterns[pattern]) patterns[pattern] = { frequency: 0, solutions: new Set() };
                patterns[pattern].frequency++;
                patterns[pattern].solutions.add("Reintentar con modelo alternativo");
            }
            
            if (text.includes("memoria") || text.includes("contexto")) {
                const pattern = "Problema de Contexto";
                if (!patterns[pattern]) patterns[pattern] = { frequency: 0, solutions: new Set() };
                patterns[pattern].frequency++;
                patterns[pattern].solutions.add("Recuperar más contexto, usar RAG");
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
        console.error("Error obteniendo patrones de error:", error);
        return [];
    }
}

/**
 * Recupera estrategias exitosas que pueden aplicarse a nuevas misiones.
 */
export async function getSuccessfulStrategies(userId: string, missionType: string) {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        return [];
    }

    try {
        console.log(`--- Recuperando Estrategias Exitosas para ${missionType} ---`);
        const embeddings = getEmbeddings();
        const index = getIndex();

        const queryVector = await embeddings.embedQuery(`Estrategias exitosas para misiones de tipo ${missionType}`);

        const queryResponse = await index.query({
            vector: queryVector,
            topK: 15,
            includeMetadata: true,
            filter: {
                agent_id: { $eq: userId }
            }
        });

        const strategies: Record<string, { count: number; description: string }> = {};

        queryResponse.matches.forEach((match: any) => {
            const text = match.metadata?.text || "";
            
            if (text.includes("Recomendación") || text.includes("estrategia")) {
                const strategyMatch = text.match(/Recomendación[:\s]+([^.]+)/);
                if (strategyMatch) {
                    const strategy = strategyMatch[1].trim();
                    if (!strategies[strategy]) {
                        strategies[strategy] = { count: 0, description: text.substring(0, 200) };
                    }
                    strategies[strategy].count++;
                }
            }
        });

        return Object.entries(strategies)
            .map(([strategy, data]) => ({
                strategy,
                successRate: (data.count / queryResponse.matches.length) * 100,
                description: data.description,
            }))
            .sort((a, b) => b.successRate - a.successRate);
    } catch (error) {
        console.error("Error obteniendo estrategias exitosas:", error);
        return [];
    }
}

/**
 * Consolida la memoria de largo plazo mediante la agregación de reflexiones relacionadas.
 */
export async function consolidateMemory(userId: string): Promise<string> {
    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
        return "";
    }

    try {
        console.log(`--- Consolidando Memoria de Largo Plazo para Usuario ${userId} ---`);
        const embeddings = getEmbeddings();
        const index = getIndex();

        const queryVector = await embeddings.embedQuery("Resumen general de todas las lecciones aprendidas");

        const queryResponse = await index.query({
            vector: queryVector,
            topK: 50,
            includeMetadata: true,
            filter: {
                agent_id: { $eq: userId }
            }
        });

        const consolidatedText = queryResponse.matches
            .map((match: any) => match.metadata?.text || "")
            .filter((text: string) => text.length > 0)
            .join("\n---\n");

        return consolidatedText;
    } catch (error) {
        console.error("Error consolidando memoria:", error);
        return "";
    }
}
