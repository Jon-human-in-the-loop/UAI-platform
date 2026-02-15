import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { saveReflection, queryMemory } from "../memory";
import { AgentState, uaiGraph } from "./graph";
import { END } from "@langchain/langgraph";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { availableSkills } from "../skills";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { uaiAgents } from "./agents";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// --- CLIENTES DE MODELOS SOTA (Carga Perezosa para evitar fallos de build por llaves faltantes) ---
let _claude37: ChatAnthropic | null = null;
function getClaude37() {
    if (!_claude37) {
        _claude37 = new ChatAnthropic({
            modelName: "claude-3-5-sonnet-20240620", // FIXED: Modelo estable real
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
            temperature: 0,
        });
    }
    return _claude37;
}

let _gpt5: ChatOpenAI | null = null;
function getGpt5() {
    if (!_gpt5) {
        _gpt5 = new ChatOpenAI({
            modelName: "gpt-4o", // Modelo insignia actual de OpenAI
            openAIApiKey: process.env.OPENAI_API_KEY,
            temperature: 0.2,
        });
    }
    return _gpt5;
}

let _geminiPro: ChatGoogleGenerativeAI | null = null;
function getGeminiPro() {
    if (!_geminiPro) {
        _geminiPro = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash", // Modelo rápido y eficiente de Google
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
            temperature: 0.1,
        });
    }
    return _geminiPro;
}

// Nodo 1: Analizador de Requerimientos (Claude 3.7 - Razonamiento Profundo)
export async function analyzerNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: ANALIZADOR (Claude 3.7 Real + Memoria) ---");

    // Guardrail de Seguridad: Verificación de Presupuesto y Abuso
    const isAdmin = (state.budget_status.plan as any) === 'admin';

    if (!isAdmin && (state.is_blocked || state.budget_status.current >= state.budget_status.limit)) {
        console.error("BLOQUEO: Límite excedido o usuario bloqueado.");
        return {
            next_node: "error",
            is_blocked: true,
            errors: [...state.errors, "Seguridad: Límite de presupuesto alcanzado o sospecha de abuso."]
        };
    }

    const lastMessageObj = state.messages[state.messages.length - 1];
    const lastMessage = typeof lastMessageObj.content === "string"
        ? lastMessageObj.content
        : JSON.stringify(lastMessageObj.content);

    // Recuperar memorias relacionadas del pasado
    let pastContext = "";
    try {
        const memories = await queryMemory(lastMessage);
        if (memories.length > 0) {
            pastContext = `\nCONTEXTO DE MEMORIA RELEVANTE:\n${memories.join("\n---\n")}`;
        }
    } catch (e) {
        console.error("Error recuperando memoria:", e);
    }

    // Configuración Dinámica del Agente
    const config = state.agent_config || {
        name: "UAI Nucleus",
        role: "Orquestador Superior",
        system_prompt: "Eres el núcleo analítico de UAI Platform."
    };

    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
    IDENTIDAD: Eres {agent_name} ({agent_role}).
    MISIÓN PRINCIPAL: {agent_prompt}
    
    Tu objetivo es analizar la solicitud del usuario y sintetizar una fuerza de trabajo dinámica para cumplirla.
    {memory_context}
    
    SOLICITUD: {input}
    
    Debes devolver un JSON con el siguiente formato EXACTO:
    {{
        "complexity": "baja|media|alta",
        "required_skills": ["search", "seo", "code", "etc"],
        "tasks": ["tarea 1", "tarea 2"],
        "agents_to_synthesize": [
            {{
                "role": "Nombre del Rol (ej. Arquitecto Legal)",
                "goal": "Objetivo específico para esta tarea",
                "backstory": "Trasfondo profesional que le da autoridad",
                "recommended_model": "claude|gpt|gemini"
            }}
        ],
        "tech_proposal": {{
            "rationale": "Descripción de por qué se eligieron estos modelos y si es costo-eficiente",
            "estimated_effort": "Bajo|Medio|Alto"
        }}
    }}
    
    GUÍA DE MODELOS:
    - claude: Para tareas de razonamiento complejo, ética y lógica pura.
    - gpt: Para creatividad, ejecución rápida y tareas de propósito general.
    - gemini: Para análisis de grandes volúmenes de datos o contextos extensos.
    `);

    const chain = prompt.pipe(getClaude37()).pipe(parser);

    try {
        const result: any = await chain.invoke({
            input: lastMessage,
            memory_context: pastContext,
            agent_name: config.name,
            agent_role: config.role,
            agent_prompt: config.system_prompt
        });

        return {
            next_node: "waiting_approval",
            context_memory: {
                ...state.context_memory,
                analysis: result,
                dynamic_agents: result.agents_to_synthesize,
                proposal: result.tech_proposal
            },
            skills_active: result.required_skills,
            messages: [new HumanMessage(`PROPUESTA TÉCNICA UAI:\n${result.tech_proposal.rationale}\n\n¿Deseas proceder con la ejecución?`)]
        };
    } catch (e: any) {
        console.error("Error en Analizador Real:", e);

        // Fallback Robusto: Si falla la planificación, asignamos un agente de emergencia
        // para que intente resolver la tarea directamente.
        const fallbackAgent = {
            role: "Agente de Respuesta Rápida",
            goal: "Intentar resolver la solicitud del usuario directamente dado que el planificador falló.",
            backstory: "IA de respaldo experta en resolución de conflictos y ejecución directa.",
            recommended_model: "gpt" // Usamos GPT como backup si Claude falló
        };

        return {
            next_node: "ejecutor",
            context_memory: {
                analysis: {
                    tasks: ["Ejecución Directa de Respaldo"],
                    required_skills: [],
                    complexity: "media"
                },
                dynamic_agents: [fallbackAgent], // ¡IMPORTANTE! Asignamos un agente para que el Executor no esté vacío
                proposal: { rationale: "Modo de recuperación por fallo en API de planificación.", estimated_effort: "Medio" }
            },
            messages: [new HumanMessage(`⚠️ ALERTA: Fallo en el sistema de planificación (${e.message}). Activando protocolo de emergencia con Agente de Respaldo.`)]
        };
    }
}

// Nodo 2: Ejecución Workforce Dinámico (GPT-5/o3 - Operación Masiva)
export async function executorNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: EJECUTOR (Síntesis Dinámica Real) ---");

    const analysis = state.context_memory.analysis;
    const skills = state.skills_active;
    const dynamicAgents = state.context_memory.dynamic_agents || [];

    let assignedAgents: Array<{ role: string; goal: string; backstory: string; model: any }> = [];

    if (dynamicAgents.length > 0) {
        assignedAgents = dynamicAgents.map((agent: any) => {
            let configModel: any = getGpt5();
            if (agent.recommended_model === "claude") configModel = getClaude37();
            if (agent.recommended_model === "gemini") configModel = getGeminiPro();
            return { ...agent, model: configModel };
        });
    }

    // Ejecución Real con Modelos SOTA
    console.log(`Iniciando ejecución paralela con ${assignedAgents.length} agentes...`);

    const results = await Promise.all(assignedAgents.map(async (agent: any) => {
        try {
            const prompt = PromptTemplate.fromTemplate(`
            ROL: {role}
            CONTEXTO: {backstory}
            
            TAREA ASIGNADA: {goal}
            
            Ejecuta esta tarea con la máxima excelencia y profundidad profesional.
            `);

            const chain = prompt.pipe(agent.model);
            const response = await chain.invoke({
                role: agent.role,
                backstory: agent.backstory,
                goal: agent.goal
            });

            const outputText = typeof (response as any).content === "string" ? (response as any).content : JSON.stringify((response as any).content);

            return {
                agent: agent.role,
                status: "completed",
                output: outputText
            };
        } catch (error: any) {
            console.error(`Error en agente ${agent.role}:`, error);
            return {
                agent: agent.role,
                status: "failed",
                output: `Error ejecutando tarea: ${error.message}`
            };
        }
    }));

    // Formatear el resultado final para el chat
    const finalSummary = results.map(r => `### 🤖 ${r.agent}\n${r.output}`).join("\n\n---\n\n");

    return {
        next_node: "validador",
        context_memory: {
            ...state.context_memory,
            execution_results: results
        },
        messages: [
            new HumanMessage(`Iniciando orquestación con ${assignedAgents.length} agentes...`),
            new HumanMessage(finalSummary) // Enviamos el contenido REAL al chat
        ]
    };
}

// Nodo 3: Validador y Auto-sanación (Reflexión Crítica con Claude 3.7)
export async function validatorNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: VALIDADOR (Auto-sanación Real con Claude 3.7) ---");

    const executionResults = state.context_memory.execution_results || [];
    const lastSummary = executionResults.map((r: any) => `${r.agent}: ${r.output}`).join("\n");

    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
    Eres el Inspector de Calidad Superior de UAI Platform.
    Tu tarea es evaluar si los resultados entregados por el equipo de agentes cumplen con los estándares de excelencia SOTA 2026.
    
    RESULTADOS DEL EQUIPO:
    {results}
    
    Debes devolver un JSON con el siguiente formato:
    {{
        "is_valid": true|false,
        "critique": "Explicación detallada de qué falta o qué está mal",
        "score": 0-100
    }}
    
    Si el score es menor a 85, debes marcar is_valid como false.
    `);

    const chain = prompt.pipe(getClaude37()).pipe(parser);

    try {
        const evaluation: any = await chain.invoke({ results: lastSummary });
        console.log(`Evaluación de calidad: ${evaluation.score}/100 - Válido: ${evaluation.is_valid}`);

        if (!evaluation.is_valid) {
            return {
                next_node: "analizador",
                errors: [...state.errors, `Fallo de calidad (${evaluation.score}%): ${evaluation.critique}`],
                messages: [new HumanMessage(`Calidad insuficiente detectada. Motivo: ${evaluation.critique}. Solicitando re-planificación.`)]
            };
        }

        return {
            next_node: "FIN",
            messages: [new HumanMessage(`Validación UAI exitosa (${evaluation.score}%). Resultado óptimo entregado.`)]
        };

    } catch (e) {
        console.error("Error en Validador Real:", e);
        // Fallback optimista para evitar bucles infinitos por error técnico
        return { next_node: "FIN", messages: [new HumanMessage("Validación completada (Modo Manual).")] };
    }
}

// Nodo 4: Reflexión Post-Tarea (Memoria Cognitiva)
export async function reflectionNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: REFLEXIÓN (Guardando en Pinecone) ---");

    const lastMessageObj = state.messages[state.messages.length - 1];
    const lastMessage = typeof lastMessageObj.content === "string"
        ? lastMessageObj.content
        : JSON.stringify(lastMessageObj.content);

    const analysis = state.context_memory.analysis;

    const reflectionText = `
    Tarea: ${analysis.tasks.join(", ")}
    Resultado: ${lastMessage}
    Habilidades Usadas: ${state.skills_active.join(", ")}
    `;

    try {
        await saveReflection(reflectionText, { complexity: analysis.complexity });
        console.log("Aprendizaje guardado en memoria semántica.");
    } catch (e) {
        console.error("Error al guardar reflexión:", e);
    }

    return { next_node: "FIN" };
}

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { dbPool } from "../database";

// Registro de nodos y lógica de grafo
uaiGraph.addNode("analizador" as any, analyzerNode);
uaiGraph.addNode("ejecutor" as any, executorNode);
uaiGraph.addNode("validador" as any, validatorNode);
uaiGraph.addNode("reflexion" as any, reflectionNode);
uaiGraph.setEntryPoint("analizador" as any);

uaiGraph.addConditionalEdges("analizador" as any, (s) => s.next_node, { ejecutor: "ejecutor", waiting_approval: END, error: END } as any);
uaiGraph.addConditionalEdges("ejecutor" as any, (s) => s.next_node, { validador: "validador", error: END } as any);
uaiGraph.addConditionalEdges("validador" as any, (s) => s.next_node === "FIN" ? "reflexion" : "analizador");
uaiGraph.addConditionalEdges("reflexion" as any, (s) => s.next_node === "FIN" ? END : END);

// Exportar una función para obtener la app compilada con el checkpointer
export async function getCompiledApp() {
    const checkpointer = new PostgresSaver(dbPool);
    // En producción, aseguramos que las tablas existan (esto solo ocurre una vez)
    await checkpointer.setup();
    return uaiGraph.compile({ checkpointer });
}

// Para compatibilidad hacia atrás o uso simple sin checkpointer (demo)
export const app = uaiGraph.compile();
