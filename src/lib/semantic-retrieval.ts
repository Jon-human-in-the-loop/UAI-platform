import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitters";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small", // Modelo eficiente para embeddings
});

/**
 * Optimiza la recuperación semántica de reflexiones en Pinecone.
 * Utiliza búsqueda por similitud con filtrado por usuario y contexto.
 * @param query La consulta de búsqueda.
 * @param userId El ID del usuario para filtrar resultados.
 * @param topK El número de resultados a retornar.
 * @returns Un array de reflexiones relevantes.
 */
export async function semanticRetrievalOptimized(
    query: string,
    userId: string,
    topK: number = 5
): Promise<Array<{ id: string; text: string; score: number; metadata: any }>> {
    try {
        const index = pinecone.Index("uai-memory");

        // Generar embedding de la consulta
        const queryEmbedding = await embeddings.embedQuery(query);

        // Buscar en Pinecone con filtro por usuario
        const results = await index.query({
            vector: queryEmbedding,
            topK,
            filter: {
                userId: { $eq: userId },
            },
            includeMetadata: true,
        });

        // Procesar resultados
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
        throw new Error("Fallo en la recuperación semántica de memoria.");
    }
}

/**
 * Recupera reflexiones relacionadas con un tema específico.
 * Utiliza búsqueda semántica para encontrar patrones y lecciones aprendidas.
 * @param topic El tema a buscar.
 * @param userId El ID del usuario.
 * @returns Un array de reflexiones relacionadas.
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
 * @param userId El ID del usuario.
 * @returns Un array de patrones de error identificados.
 */
export async function retrieveErrorPatterns(userId: string): Promise<Array<{ pattern: string; frequency: number; solutions: string[] }>> {
    const query = "Patrones de error, fallos recurrentes y soluciones aplicadas";
    const results = await semanticRetrievalOptimized(query, userId, 20);

    // Agrupar por patrón de error
    const patterns: Record<string, { frequency: number; solutions: Set<string> }> = {};

    results.forEach(result => {
        const text = result.text.toLowerCase();
        
        // Detectar patrones comunes
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

    // Convertir a array y ordenar por frecuencia
    return Object.entries(patterns)
        .map(([pattern, data]) => ({
            pattern,
            frequency: data.frequency,
            solutions: Array.from(data.solutions),
        }))
        .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Recupera estrategias exitosas que pueden aplicarse a nuevas misiones.
 * @param userId El ID del usuario.
 * @param missionType El tipo de misión (ej. "planning", "technical_analysis").
 * @returns Un array de estrategias exitosas.
 */
export async function retrieveSuccessfulStrategies(
    userId: string,
    missionType: string
): Promise<Array<{ strategy: string; successRate: number; description: string }>> {
    const query = `Estrategias exitosas para misiones de tipo ${missionType}`;
    const results = await semanticRetrievalOptimized(query, userId, 15);

    // Extraer estrategias de los resultados
    const strategies: Record<string, { count: number; description: string }> = {};

    results.forEach(result => {
        const text = result.text;
        
        // Buscar menciones de estrategias
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

    // Convertir a array y calcular tasa de éxito
    return Object.entries(strategies)
        .map(([strategy, data]) => ({
            strategy,
            successRate: (data.count / results.length) * 100,
            description: data.description,
        }))
        .sort((a, b) => b.successRate - a.successRate);
}

/**
 * Mejora la memoria de largo plazo mediante la consolidación de reflexiones relacionadas.
 * Agrupa reflexiones similares y genera un resumen consolidado.
 * @param userId El ID del usuario.
 * @returns Un resumen consolidado de las lecciones aprendidas.
 */
export async function consolidateLongTermMemory(userId: string): Promise<string> {
    try {
        const index = pinecone.Index("uai-memory");

        // Recuperar todas las reflexiones del usuario
        const query = "Resumen general de todas las lecciones aprendidas";
        const queryEmbedding = await embeddings.embedQuery(query);

        const results = await index.query({
            vector: queryEmbedding,
            topK: 50,
            filter: {
                userId: { $eq: userId },
            },
            includeMetadata: true,
        });

        // Consolidar reflexiones
        const consolidatedText = results.matches
            .map((match: any) => match.metadata?.text || "")
            .filter((text: string) => text.length > 0)
            .join("\n---\n");

        // Generar resumen consolidado
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
        throw new Error("Fallo en la consolidación de memoria.");
    }
}
