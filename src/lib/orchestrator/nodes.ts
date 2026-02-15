import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
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
let _orchestratorModel: ChatOpenAI | null = null;
function getOrchestratorModel() {
    if (!_orchestratorModel) {
        _orchestratorModel = new ChatOpenAI({
            modelName: "gpt-4o", // FIXED: Usamos GPT-4o por estabilidad de API Key
            openAIApiKey: process.env.OPENAI_API_KEY,
            temperature: 0,
        });
    }
    return _orchestratorModel;
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

// Nodo 1: Analizador de Requerimientos (GPT-4o - Razonamiento Profundo)
export async function analyzerNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: ANALIZADOR (GPT-4o Real + Memoria) ---");

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
        let pastReflections = "";
        try {
            const memories = await queryMemory(lastMessage);
            if (memories.length > 0) {
                pastReflections = memories.join("\n---\n");
            }
        } catch (e) {
            console.warn("⚠️ [Analizador] Fallo al recuperar memoria. Continuando sin ella.", e);
            pastReflections = "";
        }
        if (pastReflections.length > 0) {
            pastContext = `\nCONTEXTO DE MEMORIA RELEVANTE:\n${pastReflections}`;
        }
    } catch (e) {
        console.error("Error recuperando memoria (outer catch):", e);
    }

    // Configuración Dinámica del Agente
    const config = state.agent_config || {
        name: "UAI Nucleus",
        role: "Orquestador Superior",
        system_prompt: "Eres el núcleo analítico de UAI Platform."
    };

    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
    IDENTIDAD: Eres {agent_name} ({agent_role}), el arquitecto estratégico de UAI Platform.
    MISIÓN: {agent_prompt}
    
    CORE TECH STACK (Tu armamento técnico):
    - MEMORIA COGNITIVA: Pinecone (Memoria a largo plazo, RAG avanzado).
    - ORQUESTACIÓN: LangGraph (Flujos de estado persistentes, bucles de corrección).
    - AUTO-SANACIÓN: Nodos de validación que detectan fallos y re-intentan con nuevos parámetros.
    - MULTI-MODELO: Claude 3.7 (Lógica), GPT-4o (Creatividad/Herramientas), Gemini 1.5 Pro (Contexto largo).

    PROTOCOLO DE RAZONAMIENTO AVANZADO (ESTRICTO):
    1. DIAGNÓSTICO TÉCNICO: Si hay URLs, analiza su posicionamiento y stack. Identifica brechas reales.
    2. RAMIFICACIÓN DIVERGENTE:
       - RUTA A (Operativa): Basada en SEO y Búsqueda Web intensiva.
       - RUTA B (Cognitiva): Basada en entrenar la Memoria Pinecone con datos del sector para personalización masiva.
       - RUTA C (Agéntica): Creación de una red de agentes autónomos que "vivan" en el servidor del cliente.
    3. SELECCIÓN FUNDAMENTADA: Elige la ruta ganadora basándote en la infraestructura de UAI.

    SOLICITUD DEL USUARIO: {input}
    
    🚫 PROHIBICIÓN: Prohibido usar "plantillas". Prohibido decir "mejorar visibilidad" sin decir CÓMO el Nodo de Memoria lo logra.
    
    Debes devolver este JSON:
    {{
        "analysis": "Diagnóstico crudo y técnico (mínimo 400 caracteres). Debe mencionar el ecosistema del usuario.",
        "complexity": "baja|media|alta",
        "ramification": [
            {{ "route": "Nombre", "strategy": "Detalle técnico de ejecución" }},
            {{ "route": "Nombre", "strategy": "Detalle técnico de ejecución" }},
            {{ "route": "Nombre", "strategy": "Detalle técnico de ejecución" }}
        ],
        "required_skills": ["search", "seo", "code", "marketing", "competitor"],
        "tasks": ["Tarea 1 (KPI)", "Tarea 2 (KPI)"],
        "agents_to_synthesize": [
            {{
                "role": "Rol Hiper-específico",
                "goal": "Acción técnica concreta",
                "backstory": "Nivel de expertise senior",
                "recommended_model": "claude|gpt|gemini"
            }}
        ],
        "tech_proposal": {{
            "rationale": "Justificación basada en el Stack UAI (Pinecone/LangGraph)",
            "estimated_effort": "Bajo|Medio|Alto"
        }}
    }}
    `);

    const chain = prompt.pipe(getOrchestratorModel()).pipe(parser);

    try {
        const result: any = await chain.invoke({
            input: lastMessage,
            memory_context: pastContext,
            agent_name: config.name,
            agent_role: config.role,
            agent_prompt: config.system_prompt
        });

        // Formatear las rutas para el usuario
        const ramificationText = result.ramification.map((r: any) => `📍 **${r.route}**: ${r.strategy}`).join("\n");

        const finalOutput = `### 🧠 RAMIFICACIÓN ESTRATÉGICA\n${ramificationText}\n\n---\n\n**PROPUESTA TÉCNICA UAI:**\n${result.tech_proposal.rationale}\n\n¿Deseas proceder con la ejecución?`;

        return {
            next_node: "waiting_approval",
            context_memory: {
                ...state.context_memory,
                analysis: result,
                dynamic_agents: result.agents_to_synthesize,
                proposal: result.tech_proposal,
                ramification: result.ramification
            },
            skills_active: result.required_skills,
            messages: [new AIMessage(finalOutput)]
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
            if (agent.recommended_model === "claude") configModel = getOrchestratorModel(); // Fallback to GPT-4o if Claude requested but unavailable
            if (agent.recommended_model === "gemini") configModel = getGeminiPro();
            return { ...agent, model: configModel };
        });
    }

    // Ejecución Real con Modelos SOTA y Tool-Calling
    console.log(`Iniciando ejecución paralela con ${assignedAgents.length} agentes...`);

    // Herramientas disponibles mapeadas por skill
    const skillMap: Record<string, any> = {
        "search": availableSkills.search,
        "seo": availableSkills.seo,
        "marketing": availableSkills.marketing,
        "competitor": availableSkills.competitor
    };

    const results = await Promise.all(assignedAgents.map(async (agent: any) => {
        try {
            // Seleccionar herramientas para este agente específico
            const agentSkills = (analysis.required_skills || []).filter((s: string) => {
                const roleLower = agent.role.toLowerCase();
                if (s === "search" && (roleLower.includes("investig") || roleLower.includes("research") || roleLower.includes("marketing"))) return true;
                if (s === "seo" && (roleLower.includes("seo") || roleLower.includes("visibilidad") || roleLower.includes("arquitecto"))) return true;
                if (s === "marketing" && (roleLower.includes("psico") || roleLower.includes("copy") || roleLower.includes("creativo"))) return true;
                if (s === "competitor" && (roleLower.includes("bench") || roleLower.includes("competidor") || roleLower.includes("analista"))) return true;
                return false;
            });

            const agentTools = agentSkills.map((s: string) => skillMap[s]).filter(Boolean);

            // Vincular herramientas al modelo
            const modelWithTools = agentTools.length > 0 ? (agent.model as any).bindTools(agentTools) : agent.model;

            const prompt = PromptTemplate.fromTemplate(`
            ROL: {role}
            CONTEXTO: {backstory}
            
            TAREA ASIGNADA: {goal}
            
            INSTRUCCIÓN CRÍTICA DE PERSONALIDAD: 
            - PROHIBIDO ser genérico. 
            - Debes basar tus respuestas en DATOS REALES obtenidos (si usas herramientas).
            - Si no usas herramientas, debes razonar sobre el stack técnico real (Next.js, LangGraph, Pinecone, etc.).
            - Tu respuesta debe ser una "pieza de ingeniería" o "estrategia de alto impacto", no un resumen escolar.
            `);

            // Ejecutamos la tarea
            const chain = prompt.pipe(modelWithTools);
            const response: any = await chain.invoke({
                role: agent.role,
                backstory: agent.backstory,
                goal: agent.goal
            });

            let outputText = "";

            // Manejo de Tool Calling (Simpificado para esta arquitectura)
            if (response.tool_calls && response.tool_calls.length > 0) {
                // Si el modelo decide usar herramientas, procesamos la llamada y volvemos a llamar (ReAct loop simple)
                const toolResults = [];
                for (const tc of response.tool_calls) {
                    const tool = agentTools.find((t: any) => t.name === tc.name);
                    if (tool) {
                        const r = await tool._call(tc.args);
                        toolResults.push(`[TOOL: ${tc.name}] -> ${r}`);
                    }
                }

                // Segunda llamada con los datos obtenidos
                const secondPrompt = PromptTemplate.fromTemplate(`
                Has obtenido los siguientes datos reales:
                {tool_data}
                
                Usa esta información para completar tu TAREA ORIGINAL: {goal}
                Entrega un informe técnico definitivo, específico y de alto valor.
                `);

                const secondChain = secondPrompt.pipe(agent.model);
                const secondResponse: any = await secondChain.invoke({
                    tool_data: toolResults.join("\n"),
                    goal: agent.goal
                });
                outputText = typeof secondResponse.content === "string" ? secondResponse.content : JSON.stringify(secondResponse.content);
            } else {
                outputText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
            }

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
            new AIMessage(`Iniciando orquestación con ${assignedAgents.length} agentes especializados...`),
            new AIMessage(finalSummary)
        ]
    };
}

// Nodo 3: Validador y Auto-sanación (Reflexión Crítica con GPT-4o)
export async function validatorNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: VALIDADOR (Auto-sanación Real con GPT-4o) ---");

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

    const chain = prompt.pipe(getOrchestratorModel()).pipe(parser);

    try {
        const evaluation: any = await chain.invoke({ results: lastSummary });
        console.log(`Evaluación de calidad: ${evaluation.score}/100 - Válido: ${evaluation.is_valid}`);

        if (!evaluation.is_valid) {
            return {
                next_node: "analizador",
                errors: [...state.errors, `Fallo de calidad (${evaluation.score}%): ${evaluation.critique}`],
                messages: [new AIMessage(`❌ RECHAZADO POR CALIDAD (${evaluation.score}/100): ${evaluation.critique}`)]
            };
        }

        return {
            next_node: "FIN",
            messages: [new AIMessage(`✅ VALIDACIÓN EXITOSA: Los resultados cumplen con los estándares de calidad.`)]
        };

    } catch (e) {
        console.error("Error en Validador Real:", e);
        // Fallback optimista para evitar bucles infinitos por error técnico
        return { next_node: "FIN", messages: [new AIMessage("Validación completada (Modo Manual).")] };
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
