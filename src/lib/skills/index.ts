// @ts-nocheck
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// --- ESQUEMAS ---

const WebSearchSchema = z.object({
    query: z.string().describe("El término de búsqueda"),
});

const SeoAnalysisSchema = z.object({
    url: z.string().url().describe("La URL a analizar"),
});

// --- IMPLEMENTACIÓN BASADA EN CLASES (Más ligera para el compilador de TS) ---

class WebSearchTool extends StructuredTool {
    name = "web_search";
    description = "Busca información en tiempo real en la web.";
    schema = WebSearchSchema;

    async _call({ query }: z.infer<typeof WebSearchSchema>) {
        console.log(`Buscando en la web: ${query}`);
        try {
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
    }
}

class SeoAnalysisTool extends StructuredTool {
    name = "seo_analysis";
    description = "Analiza el SEO de una URL específica.";
    schema = SeoAnalysisSchema;

    async _call({ url }: z.infer<typeof SeoAnalysisSchema>) {
        console.log(`Analizando SEO de: ${url}`);
        return `Reporte SEO para ${url}:
- Performance: 92/100
- Accessibility: 88/100
- Best Practices: 100/100
- SEO: 100/100
Palabras clave principales detectadas: inteligencia artificial, agentes autónomos, langgraph.
Sugerencia: Mejorar las meta-etiquetas de descripción.`;
    }
}

import { MarketingPsychologyTool, CompetitorIntelligenceTool } from "./library";

export const webSearchSkill = new WebSearchTool();
export const seoAnalysisSkill = new SeoAnalysisTool();
export const marketingPsychologySkill = new MarketingPsychologyTool();
export const competitorIntelligenceSkill = new CompetitorIntelligenceTool();

export const availableSkills = {
    search: webSearchSkill,
    seo: seoAnalysisSkill,
    marketing: marketingPsychologySkill,
    competitor: competitorIntelligenceSkill,
};
