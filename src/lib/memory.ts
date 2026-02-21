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

    try {
        const doc = new Document({
            pageContent: text,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
            },
        });

        const vector = await embeddings.embedDocuments([doc.pageContent]);

        await index.upsert([{
            id: `ref_${Date.now()}`,
            values: vector[0],
            metadata: {
                text: doc.pageContent,
                ...doc.metadata
            }
        }]);
        console.log("✅ Reflexión guardada con éxito.");
    } catch (error) {
        console.warn("⚠️ Advertencia: No se pudo guardar en Pinecone (Memoria). Continuando...", error);
    }
}

/**
 * Busca contextos relevantes del pasado.
 */
export async function queryMemory(query: string, limit: number = 3) {
    console.log(`--- Buscando en Memoria: "${query}" ---`);

    try {
        const queryVector = await embeddings.embedQuery(query);

        const queryResponse = await index.query({
            vector: queryVector,
            topK: limit,
            includeMetadata: true,
        });

        if (!queryResponse.matches || queryResponse.matches.length === 0) return [];

        return queryResponse.matches
            .map(match => match.metadata?.text)
            .filter((text): text is string => typeof text === 'string');
    } catch (error) {
        console.warn("⚠️ Advertencia: Error o índice no encontrado en Pinecone. Se omitirá la memoria a largo plazo.", error);
        return [];
    }
}
