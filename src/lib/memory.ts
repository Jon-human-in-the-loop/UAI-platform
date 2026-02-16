import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index(process.env.PINECONE_INDEX_NAME || "uai-memory");

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * Guarda una "reflexión" o aprendizaje en la memoria a largo plazo.
 */
export async function saveReflection(text: string, agent_id: string, mission_id: string | null, learning_type: string, summary: string, details: any | null, keywords: string[], metadata: any = {}) {
    console.log("--- Guardando Reflexión en Memoria Semántica ---");

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
                mission_id,
                learning_type,
                details,
                keywords,
                ...doc.metadata
            }
        }]
    });
}

/**
 * Busca contextos relevantes del pasado.
 */
export async function queryMemory(query: string, limit: number = 3, learning_type: string | null = null, agent_id: string | null = null) {
    console.log(`--- Buscando en Memoria: "${query}" ---`);

    const queryVector = await embeddings.embedQuery(query);

    const queryResponse = await index.query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
    });

    let filteredMatches = queryResponse.matches;

    if (learning_type) {
        filteredMatches = filteredMatches.filter(match => match.metadata?.learning_type === learning_type);
    }

    if (agent_id) {
        filteredMatches = filteredMatches.filter(match => match.metadata?.agent_id === agent_id);
    }

    return filteredMatches.map(match => match.metadata).filter(Boolean);
}
