import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

// Definición del Estado del Agente
export interface AgentState {
    userId: string;
    messages: BaseMessage[]; // Permite mensajes multimodales
    next_node: string;
    errors: string[];
    skills_active: string[];
    context_memory: any;
    budget_status: {
        current: number;
        limit: number;
        plan: "free" | "essentials" | "professional";
    };
    is_blocked: boolean;
    agent_config: {
        name: string;
        role: string;
        model: string;
        system_prompt: string;
    };
    dynamic_agents?: Array<{
        role: string;
        goal: string;
        backstory: string;
        recommended_model: string;
        required_skills: string[];
    }>;
}


// Inicialización del Grafo
const workflow = new StateGraph<AgentState>({
    channels: {
        userId: {
            value: (x: string, y: string) => y ?? x,
            default: () => "",
        },
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => [],
        },
        next_node: {
            value: (x: string, y: string) => y ?? x,
            default: () => "analizador",
        },
        errors: {
            value: (x: string[], y: string[]) => x.concat(y),
            default: () => [],
        },
        skills_active: {
            value: (x: string[], y: string[]) => y ?? x,
            default: () => [],
        },
        context_memory: {
            value: (x: any, y: any) => ({ ...x, ...y }),
            default: () => ({}),
        },
        budget_status: {
            value: (x: any, y: any) => y ?? x,
            default: () => ({ current: 0, limit: 100, plan: "free" } as any),
        },
        is_blocked: {
            value: (x: boolean, y: boolean) => y ?? x,
            default: () => false,
        },
        agent_config: {
            value: (x: any, y: any) => y ?? x,
            default: () => ({ name: "UAI Core", role: "Orquestador", model: "claude-3-opus", system_prompt: "Eres el núcleo de la plataforma." }),
        }
    }
});

// Nota: Los nodos reales (analizador, ejecutor, validador) 
// se implementarán tras la configuración del entorno.

export const uaiGraph = workflow;
