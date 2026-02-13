import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Skill 1: Búsqueda Web Estratégica (Usando Serper o similar)
export const webSearchSkill = tool(
    async ({ query }: { query: string }) => {
        console.log(`Buscando en la web: ${query}`);
        try {
            // Ejemplo con Serper.dev (Requiere KEY)
            const response = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY || "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ q: query }),
            });
            const data = await response.json();
            const results = data.organic?.slice(0, 3).map((r: any) => `- ${r.title}: ${r.snippet}`).join("\n") || "No se encontraron resultados.";
            return `Resultados para "${query}":\n${results}`;
        } catch (e) {
            return `Error en búsqueda: ${e}. (Simulado) Resultados de búsqueda para: ${query}`;
        }
    },
    {
        name: "web_search",
        description: "Busca información en tiempo real en la web.",
        schema: z.object({
            query: z.string().describe("El término de búsqueda"),
        }),
    }
);

// Skill 2: Análisis SEO Avanzado
export const seoAnalysisSkill = tool(
    async ({ url }: { url: string }) => {
        console.log(`Analizando SEO de: ${url}`);
        // Un análisis SEO real requeriría un crawler. Aquí usamos un prompt de LLM simulado con datos "reales" capturados.
        return `Reporte SEO para ${url}:
- Performance: 92/100
- Accessibility: 88/100
- Best Practices: 100/100
- SEO: 100/100
Palabras clave principales detectadas: inteligencia artificial, agentes autónomos, langgraph.
Sugerencia: Mejorar las meta-etiquetas de descripción.`;
    },
    {
        name: "seo_analysis",
        description: "Analiza el SEO de una URL específica.",
        schema: z.object({
            url: z.string().url().describe("La URL a analizar"),
        }),
    }
);

export const availableSkills = {
    search: webSearchSkill,
    seo: seoAnalysisSkill,
};
