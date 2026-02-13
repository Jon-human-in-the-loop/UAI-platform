import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";

// --- CONFIGURACIÓN DE MEMORIA SEMÁNTICA (PINECONE) ---

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-3-small", // SOTA 2026 Ready
});

const indexName = process.env.PINECONE_INDEX_NAME || "uai-memory";

/**
 * Inicializa el almacén de vectores premium de UAI.
 */
export async function getSemanticMemory() {
    try {
        const index = pinecone.Index(indexName);
        return await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    } catch (e) {
        console.warn("Memoria semántica no inicializada. Verifique PINECONE_API_KEY.");
        return null;
    }
}

/**
 * Almacena un pensamiento o resultado en la conciencia a largo plazo.
 */
export async function storeInLongTermMemory(text: string, metadata: any = {}) {
    const memory = await getSemanticMemory();
    if (memory) {
        await memory.addDocuments([{ pageContent: text, metadata }]);
        console.log("--- PENSAMIENTO ALMACENADO EN MEMORIA SEMÁNTICA ---");
    }
}

/**
 * Recupera contextos relevantes basados en la semántica.
 */
export async function recallFromMemory(query: string, k = 3) {
    const memory = await getSemanticMemory();
    if (memory) {
        const results = await memory.similaritySearch(query, k);
        return results.map(doc => doc.pageContent).join("\n---\n");
    }
    return "";
}
