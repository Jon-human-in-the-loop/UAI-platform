import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

// --- CONFIGURACIÓN DE MEMORIA SEMÁNTICA (PINECONE) ---

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-3-small",
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
 * Almacena un pensamiento o resultado en la conciencia a largo plazo con metadatos enriquecidos.
 */
export async function storeInLongTermMemory(text: string, metadata: any = {}) {
    const memory = await getSemanticMemory();
    if (memory) {
        const enrichedMetadata = {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: metadata.source || 'orchestrator',
            importance: metadata.importance || 1
        };
        await memory.addDocuments([{ pageContent: text, metadata: enrichedMetadata }]);
        console.log(`--- PENSAMIENTO ALMACENADO EN MEMORIA SEMÁNTICA (${enrichedMetadata.source}) ---`);
    }
}

/**
 * Recupera contextos relevantes basados en la semántica y filtrado por metadatos.
 */
export async function recallFromMemory(query: string, k = 5, filter: any = null) {
    const memory = await getSemanticMemory();
    if (memory) {
        // Recuperación avanzada con filtrado (ej. solo memoria de un usuario específico)
        const results = await memory.similaritySearch(query, k, filter);
        
        if (results.length === 0) return "No se encontraron recuerdos relevantes.";

        return results.map(doc => {
            const date = doc.metadata.timestamp ? new Date(doc.metadata.timestamp).toLocaleDateString() : 'Fecha desconocida';
            return `[Recuerdo del ${date}]: ${doc.pageContent}`;
        }).join("\n---\n");
    }
    return "";
}

/**
 * Limpia la memoria de corto plazo pero mantiene la semántica (simulado).
 */
export async function consolidateMemory(userId: string) {
    console.log(`[Memory] Consolidando recuerdos para el usuario ${userId}...`);
    // En una implementación real, aquí se podrían resumir múltiples recuerdos pequeños
    // en uno solo más denso para optimizar el contexto.
    return true;
}
