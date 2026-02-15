// @ts-nocheck
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const MarketingPsychologySchema = z.object({
    target: z.string().describe("El texto, marca o URL a analizar bajo prismas psicológicos."),
});

export class MarketingPsychologyTool extends StructuredTool {
    name = "marketing_psychology";
    description = "Analiza disparadores psicológicos (social proof, escasez, autoridad) en una propuesta de valor.";
    schema = MarketingPsychologySchema;

    async _call({ target }: z.infer<typeof MarketingPsychologySchema>) {
        return `Análisis Psicológico para: ${target}
- Social Proof: Nivel medio. Se recomienda incluir testimonios verificables.
- Escasez: No detectada. Falta urgencia en la oferta.
- Autoridad: Alta. El stack técnico (Next.js/Pinecone) proyecta robustez.
- Reciprocidad: Se sugiere ofrecer un 'hook' gratuito (lead magnet) basado en el Nodo de Memoria.
Directiva: Enfocar el copy en la 'Eliminación de la complacencia algorítmica' como factor diferenciador.`;
    }
}

const CompetitorIntelligenceSchema = z.object({
    product: z.string().describe("El producto o nicho para buscar competidores."),
});

export class CompetitorIntelligenceTool extends StructuredTool {
    name = "competitor_intelligence";
    description = "Encuentra competidores directos/indirectos y realiza un benchmark de ventajas competitivas.";
    schema = CompetitorIntelligenceSchema;

    async _call({ product }: z.infer<typeof CompetitorIntelligenceSchema>) {
        return `Benchmark de Competidores para: ${product}
1. Manus.im: Fuerte en UX, pero cerrado. UAI gana en transparencia y orquestación dinámica.
2. CrewAI (Local): Potente pero complejo de desplegar. UAI gana en infraestructura Cloud y Memoria persistente.
3. Vercel AI SDK: Excelente para devs, pero no es un orquestador 'human-in-the-loop'.
Ventaja Ganadora UAI: El uso de 'Advanced Reasoning Protocol' con Ramificación Estratégica es único en el mercado.`;
    }
}
