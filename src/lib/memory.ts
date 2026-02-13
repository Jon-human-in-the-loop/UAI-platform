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
export async function saveReflection(text: string, metadata: any = {}) {
    console.log("--- Guardando Reflexión en Memoria Semántica ---");

    const doc = new Document({
        pageContent: text,
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
                text: doc.pageContent,
                ...doc.metadata
            }
        }]
    });
}

/**
 * Busca contextos relevantes del pasado.
 */
export async function queryMemory(query: string, limit: number = 3) {
    console.log(`--- Buscando en Memoria: "${query}" ---`);

    const queryVector = await embeddings.embedQuery(query);

    const queryResponse = await index.query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
    });

    return queryResponse.matches.map(match => match.metadata?.text).filter(Boolean);
}
