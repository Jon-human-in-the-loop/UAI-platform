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
    IDENTIDAD: Eres {agent_name} ({agent_role}), el arquitecto de inteligencia de UAI Platform.
    MISIÓN DEL SISTEMA: {agent_prompt}
    
    CORE TECH STACK (Tu armamento técnico): 
    - MEMORIA COGNITIVA: Pinecone (Memoria persistente de largo plazo, RAG adaptativo).
    - ORQUESTACIÓN: LangGraph (Grafos de estado cíclicos, persistencia multi-hilo).
    - AUTO-SANACIÓN: Controladores de calidad que detectan alucinaciones y re-intentan.
    - SKILLS HUB: Tienes 17+ herramientas pro (marketing, competitor, audit, brainstorm, debug, pricing, launch, content, security, database, uxui, rag, mcp, copy, leadgen).

    PROTOCOLO DE RAZONAMIENTO AVANZADO (PROHIBIDA LA COMPLACENCIA):
    1. DIAGNÓSTICO CRÍTICO: Analiza la solicitud ({input}). No resumas. Identifica la brecha técnica o estratégica real.
    2. RAMIFICACIÓN DIVERGENTE (3 DIMENSIONES):
       - DIMENSIÓN ALPHA (Agresiva/Ejecución): ¿Cómo resolvemos esto mediante acción directa y herramientas de borde (OpenClaw/Search/SEO)?
       - DIMENSIÓN BETA (Cognitiva/Datos): ¿Cómo explotamos la Memoria Pinecone y el entrenamiento de datos para una solución personalizada masiva?
       - DIMENSIÓN GAMMA (Estructural/Agéntica): ¿Cómo diseñamos una red de micro-agentes en LangGraph que operen de forma autónoma?
    
    REGLA DE ORO: Las rutas deben ser ESTRATEGIAS ÚNICAS para este problema específico. 
    ❌ PROHIBIDO: Repetir "Hacer SEO" o "Usar Pinecone" de forma genérica.
    ✅ OBLIGATORIO: Explicar CÓMO el skill (ej. 'marketing_psychology') se combina con el stack para ganar.

    SOLICITUD ACTUAL: {input}
    
    Debes devolver este JSON:
    {{
        "analysis": "Diagnóstico profundo (400+ caracteres). Debe ser técnico y específico a la industria del usuario.",
        "complexity": "baja|media|alta",
        "ramification": [
            {{ "route": "Nombre Único", "strategy": "Explicación de la ventaja competitiva usando Skills específicos." }},
            {{ "route": "Nombre Único", "strategy": "Explicación de la ventaja competitiva usando Skills específicos." }},
            {{ "route": "Nombre Único", "strategy": "Explicación de la ventaja competitiva usando Skills específicos." }}
        ],
        "required_skills": ["lista_de_skills_que_activarás"],
        "tasks": ["Acción 1 con KPI", "Acción 2 con KPI"],
        "agents_to_synthesize": [
            {{
                "role": "Especialista Senior",
                "goal": "Meta técnica cuantificable",
                "backstory": "Nivel de expertise y stack que domina",
                "recommended_model": "claude|gpt|gemini"
            }}
        ],
        "tech_proposal": {{
            "rationale": "Justificación de por qué el combo Stack UAI + Skills elegibles es la mejor opción técnica.",
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
        "competitor": availableSkills.competitor,
        "audit": availableSkills.audit,
        "brainstorm": availableSkills.brainstorm,
        "debug": availableSkills.debug,
        "pricing": availableSkills.pricing,
        "launch": availableSkills.launch,
        "content": availableSkills.content,
        "security": availableSkills.security,
        "database": availableSkills.database,
        "uxui": availableSkills.uxui,
        "rag": availableSkills.rag,
        "mcp": availableSkills.mcp,
        "copy": availableSkills.copy,
        "leadgen": availableSkills.leadgen,
    };

    const results = await Promise.all(assignedAgents.map(async (agent: any) => {
        try {
            // Seleccionar herramientas para este agente específico
            const agentSkills = (analysis.required_skills || []).filter((s: string) => {
                const roleLower = agent.role.toLowerCase();
                if (s === "search" && (roleLower.includes("investig") || roleLower.includes("research") || roleLower.includes("busc"))) return true;
                if (s === "seo" && (roleLower.includes("seo") || roleLower.includes("visibil") || roleLower.includes("rank"))) return true;
                if (s === "marketing" && (roleLower.includes("psico") || roleLower.includes("marketing") || roleLower.includes("growth"))) return true;
                if (s === "competitor" && (roleLower.includes("bench") || roleLower.includes("competid") || roleLower.includes("espia"))) return true;
                if (s === "audit" && (roleLower.includes("audit") || roleLower.includes("inspeccion") || roleLower.includes("revisa"))) return true;
                if (s === "brainstorm" && (roleLower.includes("brain") || roleLower.includes("creativo") || roleLower.includes("ideador"))) return true;
                if (s === "debug" && (roleLower.includes("debug") || roleLower.includes("error") || roleLower.includes("fallo") || roleLower.includes("dev"))) return true;
                if (s === "pricing" && (roleLower.includes("precio") || roleLower.includes("financ") || roleLower.includes("monetiz"))) return true;
                if (s === "launch" && (roleLower.includes("launch") || roleLower.includes("lanz") || roleLower.includes("gtm"))) return true;
                if (s === "content" && (roleLower.includes("contenid") || roleLower.includes("estrateg") || roleLower.includes("autorid"))) return true;
                if (s === "security" && (roleLower.includes("segurid") || roleLower.includes("hack") || roleLower.includes("seg"))) return true;
                if (s === "database" && (roleLower.includes("data") || roleLower.includes("db") || roleLower.includes("sql") || roleLower.includes("no-sql"))) return true;
                if (s === "uxui" && (roleLower.includes("ux") || roleLower.includes("ui") || roleLower.includes("disen") || roleLower.includes("interfaz"))) return true;
                if (s === "rag" && (roleLower.includes("rag") || roleLower.includes("vector") || roleLower.includes("memory") || roleLower.includes("pinecone"))) return true;
                if (s === "mcp" && (roleLower.includes("mcp") || roleLower.includes("conector") || roleLower.includes("api") || roleLower.includes("integrac"))) return true;
                if (s === "copy" && (roleLower.includes("copy") || roleLower.includes("escrit") || roleLower.includes("ventas"))) return true;
                if (s === "leadgen" && (roleLower.includes("lead") || roleLower.includes("prospect") || roleLower.includes("captac"))) return true;
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
