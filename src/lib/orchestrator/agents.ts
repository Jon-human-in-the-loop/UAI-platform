import { ChatOpenAI } from "@langchain/openai";

// Modelo para la ejecución de tareas de los agentes
const gpt5 = new ChatOpenAI({
    modelName: "gpt-5-preview",
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.2,
});

export interface AgentConfig {
    role: string;
    goal: string;
    backstory: string;
    tools: string[];
    model: any;
}

export const uaiAgents: Record<string, AgentConfig> = {
    researcher: {
        role: "Investigador de Vanguardia",
        goal: "Descubrir tendencias SOTA y datos precisos sobre {topic}",
        backstory: "Eres un experto en recolección de información con capacidad crítica. No te conformas con la superficie; buscas la raíz técnica.",
        tools: ["search"],
        model: gpt5,
    },
    seo_specialist: {
        role: "Arquitecto de Visibilidad (SEO)",
        goal: "Optimizar la presencia digital y autoridad de {url}",
        backstory: "Dominas los algoritmos de búsqueda del 2026. Tu enfoque es la relevancia semántica y la autoridad de marca.",
        tools: ["seo"],
        model: gpt5,
    },
    coder: {
        role: "Ingeniero Prototipador",
        goal: "Escribir código eficiente y limpio para {objective}",
        backstory: "Vives en la terminal. Tu código es arte funcional y siempre consideras la escalabilidad y seguridad.",
        tools: ["code"],
        model: gpt5,
    },
};
