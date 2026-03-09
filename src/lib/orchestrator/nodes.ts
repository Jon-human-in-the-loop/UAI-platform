import { HumanMessage, AIMessage, BaseMessage, MessageContent } from "@langchain/core/messages";
import { createMultimodalHumanMessage, containsMultimodalContent } from "../multimodal";
import { saveReflection, queryMemory } from "../memory";
import { AgentState, uaiGraph } from "./graph";
import { diagnoseError, logHealingEvent } from "../auto-healing";
import { END } from "@langchain/langgraph";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { availableSkills } from "../skills";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { IDENTITY_PROMPT_TEMPLATE } from "./identity";
import { analyzeSynergy, calculateTeamSynergy, ROLE_SYNERGY_MATRIX } from "../mission-control";

// --- NODO DE AUTO-SANACIÓN ---
export async function healingNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: AUTO-SANACIÓN (Estrategias de Recuperación) ---");

    const lastError = state.errors[state.errors.length - 1];
    console.warn(`[AUTO-SANACIÓN] Error detectado: ${lastError}`);

    const strategy = diagnoseError(lastError);
    console.log(`[AUTO-SANACIÓN] Estrategia seleccionada: ${strategy.action} - ${strategy.description}`);

    // Registrar en BD de forma asíncrona (sin bloquear el flujo)
    const agentId = (state.agent_config as any)?.id || 'unknown';
    logHealingEvent(state.userId, agentId, lastError, strategy).catch(e =>
        console.error('[AUTO-SANACIÓN] Error guardando evento:', e)
    );

    if (strategy.action === 'SWITCH_MODEL' || strategy.action === 'RETRY') {
        return {
            next_node: "analizador",
            messages: [...state.messages, new AIMessage(`Auto-sanación activada: ${strategy.description}`)],
            errors: [...state.errors, `Reintento aplicado: ${strategy.action}`]
        };
    }

    if (strategy.action === 'SIMPLIFY_PROMPT') {
        return {
            next_node: "analizador",
            messages: [...state.messages, new AIMessage(`Auto-sanación: ${strategy.description}`)],
            errors: [...state.errors, "Tarea simplificada"]
        };
    }

    // FALLBACK: error no recuperable
    console.error("[AUTO-SANACIÓN] No se pudo aplicar una estrategia automática. Requiere intervención.");
    return {
        next_node: "FIN",
        messages: [...state.messages, new AIMessage("Error crítico no recuperable automáticamente. Se requiere intervención manual.")]
    };
}


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
    let lastMessage: string | HumanMessage;

    if (containsMultimodalContent(lastMessageObj)) {
        lastMessage = lastMessageObj as HumanMessage;
    } else {
        lastMessage = typeof lastMessageObj.content === "string"
            ? lastMessageObj.content
            : JSON.stringify(lastMessageObj.content);
    }

    // Recuperar memorias relacionadas del pasado
    let pastContext = "";
    try {
        let pastReflections = "";
        try {
            const memories = await queryMemory(typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage));
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

    // --- ROUTER AVANZADO (Multimodal) ---
    try {
        const routerPrompt = PromptTemplate.fromTemplate(`
        ${IDENTITY_PROMPT_TEMPLATE}
        
        Analiza la solicitud y clasifícala:
        1. "PLANNING": Estrategia o plan de acción.
        2. "TECHNICAL_INFO": Explicaciones técnicas o comparaciones.
        3. "EXECUTE": Acción concreta o confirmación.
        4. "QUESTION": Si la solicitud es una pregunta que requiere aclaración o es ambigua.

        Responde SOLO JSON: {{"category": "PLANNING" | "TECHNICAL_INFO" | "EXECUTE" | "QUESTION"}}
        
        Solicitud: {input}
        `);

        let category = "TECHNICAL_INFO";
        try {
            const routerChain = routerPrompt.pipe(getGpt5()).pipe(new JsonOutputParser());
            const routeResult: any = await routerChain.invoke({ input: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage) });
            category = routeResult.category;

            // HIGIENE COGNITIVA: Si el tema cambia drásticamente, reseteamos el contexto anterior
            const previousContext = state.context_memory.analysis?.audit || "";
            const changeDetectorPrompt = PromptTemplate.fromTemplate(`
            ¿El nuevo mensaje trata sobre el mismo tema que el contexto anterior?
            Contexto previo: {prev}
            Nuevo mensaje: {next}
            Responde SOLO "SAME" o "CHANGE".
            `);
            const changeChain = changeDetectorPrompt.pipe(getGpt5());
            const changeDecision = await changeChain.invoke({ prev: previousContext, next: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage) });

            if (changeDecision.content.toString().includes("CHANGE")) {
                console.log("[HIGIENE] Cambio de tema detectado. Limpiando memoria de corto plazo.");
                state.context_memory.analysis = null;
                state.context_memory.dynamic_agents = [];
            }

            // Mejora: Si es EXECUTE pero el mensaje es largo, probablemente hay instrucciones nuevas -> PLANNING
            if (category === "EXECUTE" && ((typeof lastMessage === "string" ? lastMessage : (lastMessage as any).content).length > 100)) {
                category = "PLANNING";
            }

            console.log(`[ROUTER] Categoría: ${category}`);
        } catch (e) {
            console.warn("[ROUTER] Fallo clasificación.");
        }

        if (category === "QUESTION") {
            const questionPrompt = PromptTemplate.fromTemplate(`
            ${IDENTITY_PROMPT_TEMPLATE}
            
            El usuario ha hecho una pregunta o su solicitud es ambigua. 
            Responde de forma técnica y cínica, pidiendo los datos que faltan si es necesario.
            
            Solicitud: {input}
            `);
            const questionChain = questionPrompt.pipe(getOrchestratorModel());
            const response: any = await questionChain.invoke({ input: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage) });
            return {
                next_node: "FIN",
                messages: [new AIMessage(response.content.replace(/\*\*/g, "").replace(/#/g, ""))]
            };
        }

        if (category === "EXECUTE") {
            return {
                next_node: "ejecutor",
                context_memory: { ...state.context_memory, direct_execution: true },
                messages: [new AIMessage("Entendido. Procediendo con la ejecución.")]
            };
        }

        if (category === "PLANNING") {
            const planningPrompt = PromptTemplate.fromTemplate(`
            ${IDENTITY_PROMPT_TEMPLATE}
            
            Eres el Estratega de UAI Platform. Si hay números en el input, DEBES realizar cálculos de ROI y sustitución.
            
            REGLAS:
            - PROHIBIDO crear planes genéricos o metodologías.
            - Si te dan $5,000, opera con esos $5,000.
            - Crea agentes con roles de ANALISTA TÉCNICO, no de gestor.
            
            Responde JSON:
            {{
                "audit": "Análisis crítico real del problema.",
                "tasks": ["Lista de hitos técnicos concretos"],
                "routes": [{{ "name": "Nombre", "strategy": "Descripción" }}],
                "recommendation": "Cuál elegir y por qué.",
                "agents": [{{ "role": "...", "goal": "Misión específica INCLUYENDO los datos del usuario ($5k, bufete, etc.)", "backstory": "...", "required_skills": [...] }}]
            }}
            `);

            const chain = planningPrompt.pipe(getOrchestratorModel()).pipe(new JsonOutputParser());
            const res: any = await chain.invoke({ input: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage) });

            // Analizar sinergias entre los agentes propuestos
            let synergisticAgents = res.agents;
            if (synergisticAgents && synergisticAgents.length > 1) {
                const potentialSynergies = [];
                for (let i = 0; i < synergisticAgents.length; i++) {
                    for (let j = i + 1; j < synergisticAgents.length; j++) {
                        const agentA = synergisticAgents[i];
                        const agentB = synergisticAgents[j];
                        const synergy = analyzeSynergy(agentA, agentB);
                        if (synergy.score > 50) { // Considerar sinergias significativas
                            potentialSynergies.push(`- **${agentA.role}** y **${agentB.role}**: ${synergy.description} (${synergy.potentialOutput})`);
                        }
                    }
                }
                if (potentialSynergies.length > 0) {
                    res.audit += `\n\n**Sinergias Potenciales Detectadas:**\n${potentialSynergies.join("\n")}`;
                }
            }

            const formattedPlan = `
${res.audit}

Opciones estratégicas:
${res.routes.map((r: any) => `${r.name}: ${r.strategy}`).join("\n\n")}

Recomendación: ${res.recommendation}
            `.trim().replace(/\*\*/g, "").replace(/#/g, "");

            return {
                next_node: "challenger",
                context_memory: { ...state.context_memory, analysis: res, dynamic_agents: res.agents },
                messages: [new AIMessage(formattedPlan)]
            };
        }

        const technicalPrompt = PromptTemplate.fromTemplate(`
        ${IDENTITY_PROMPT_TEMPLATE}
        
        Eres ingeniero de UAI Platform e integrante senior de Vanguard Crux. Responde a: {input}
        
        REGLAS DE FORMATO:
        - TOTALMENTE PROHIBIDO usar asteriscos para negrita (**).
        - TOTALMENTE PROHIBIDO usar numerales para títulos (#).
        - Usa solo texto plano y saltos de línea.
        - Sé profundo y técnico.
        `);

            const techChain = technicalPrompt.pipe(getOrchestratorModel());
            const techResponse: any = await techChain.invoke({ input: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage) });
        const cleanContent = techResponse.content.replace(/\*\*/g, "").replace(/#/g, "");

        return {
            next_node: "FIN",
            messages: [new AIMessage(cleanContent)]
        };

    } catch (e: any) {
        console.error("Error Ejecutor:", e);
        return {
            next_node: "healing",
            errors: [...state.errors, `Error en Ejecutor: ${e.message}`],
            messages: [new AIMessage("Error en ejecución. Intentando auto-sanación.")]
        };
    }
}


// Nodo 2: Ejecución Workforce Dinámico (GPT-5/o3 - Operación Masiva)
export async function executorNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: EJECUTOR (Síntesis Dinámica Real) ---");

    const analysis = state.context_memory.analysis;
    const skills = state.skills_active;
    const dynamicAgents = state.context_memory.dynamic_agents || [];
    const lastMessage = state.messages[state.messages.length - 1];
    const lastMessageObj = {
        content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content)
    };

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
            // Mapeo EXPLÍCITO de herramientas (Sin adivinanzas)
            const agentSkills = agent.required_skills || [];
            const agentTools = agentSkills.map((s: string) => skillMap[s]).filter(Boolean);

            // Vincular herramientas al modelo
            const modelWithTools = agentTools.length > 0 ? (agent.model as any).bindTools(agentTools) : agent.model;

            const prompt = PromptTemplate.fromTemplate(`
            // Si el mensaje es multimodal, el input será un objeto, no un string.
            // El modelo debe ser capaz de manejarlo.
            // {input} se reemplazará con el contenido del mensaje, que puede ser un string o un array de objetos.
            
            ${IDENTITY_PROMPT_TEMPLATE}
            
            ROL: {role}
            CONCHAS: El usuario está pagando por INGENIERÍA, no por formato.
            
            TAREA: {goal}
            
            RESTRICCIONES FÍSICAS DE SALIDA (LEER O MORIR):
            - PROHIBIDO USAR NINGÚN SÍMBOLO DE MARKDOWN.
            - PROHIBIDO: No saludes, no expliques qué vas a hacer, no des teorías.
            - OBLIGATORIO: Empieza directamente con los datos, cálculos y el análisis de riesgo brutal.
            - Si no hay números ni métricas en tu respuesta técnica, será rechazada.
            - Responde como una terminal de datos pura.
            `);

            // Ejecutamos la tarea
            const chain = prompt.pipe(modelWithTools);
            const response: any = await chain.invoke({
                input: lastMessageObj.content,
                role: agent.role,
                goal: agent.goal,
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

    // PURGA NUCLEAR DE SÍMBOLOS MARKDOWN
    const finalSummary = results.map(r => {
        // Eliminar numerales, asteriscos, guiones al inicio de línea y mayor que (bloques)
        const cleanOutput = r.output
            .replace(/[#*]/g, "") // Elimina todo # y * en cualquier parte
            .replace(/^[ \t]*[-+>][ \t]+/gm, "") // Elimina viñetas y blockquotes
            .replace(/\n{3,}/g, "\n\n") // Colapsa saltos de línea excesivos
            .trim();
        return `Agente ${r.agent}:\n\n${cleanOutput}`;
    }).join("\n\n");

    return {
        next_node: "validador",
        context_memory: {
            ...state.context_memory,
            execution_results: results
        },
        messages: [
            new AIMessage(`Sincronización completada. Aquí tienes los resultados de la ejecución de ${assignedAgents.length} agentes especializados:`),
            new AIMessage(finalSummary)
        ]
    };
}

// Nodo 2.5: The Challenger (Auditoría Técnica Hostil)
// "Tu único trabajo es DESTRUIR este plan."
export async function challengerNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: CHALLENGER (Protocolo de Verdades Incómodas) ---");

    const analysis = state.context_memory.analysis;
    // Si ya falló 2 veces, aprobamos por desgaste para evitar bucle infinito (pero con advertencia)
    const failureCount = state.errors.filter(e => e.includes("RECHAZADO POR CHALLENGER")).length;

    if (failureCount >= 2) {
        console.warn("MAX RETRIES REACHED. Aprobando por desgaste.");
        return {
            next_node: "waiting_approval",
            messages: [new AIMessage("Aprobado con reservas (límite de reintentos alcanzado).")]
        };
    }

    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
    ${IDENTITY_PROMPT_TEMPLATE}
    
    Eres el "Technical Skeptic" y Auditor de Lealtad de Vanguard Crux. 
    Tu trabajo es DESTRUIR el plan si detectas:
    1. Evasión de cálculos cuando hay datos financieros ($).
    2. Lenguaje de marketing o planes abstractos.
    3. Falta de advertencia sobre responsabilidad civil (ej. el riesgo legal de herrar en un contrato).
    4. Fuego Amigo contra Vanguard Crux.
    
    PLAN A AUDITAR:
    {plan}

    BUSCA 3 FALLOS TÉCNICOS FATALES (Hard Truths):
    1. ¿Ignora limitaciones de infraestructura real? (Ej: DNS, Latencia, Rate Limits).
    2. ¿Usa "Tecno-Magia"? (Ej: Pinecone para marketing).
    3. ¿Es genérico o específico?

    Si encuentras fallos, RECHAZA. Si es sólido, APRUEBA.

    Responde SOLO JSON:
    {{
        "status": "APPROVED" | "REJECTED",
        "critique": "Razón técnica del rechazo (si aplica). Sé brutal.",
        "score": 0-100
    }}
    `);

    try {
        // Ejecutar Auditoría Lógica Real (Protocolo jbrukh/Logic)
        const logicalAudit = await availableSkills.critical._call({
            claim: `PLAN PROPUESTO: ${JSON.stringify(analysis)}`
        });

        const prompt = PromptTemplate.fromTemplate(`
        Eres el Auditor Adversario de UAI Platform.
        Has recibido este análisis lógico preventivo:
        {audit}

        PLAN ORIGINAL:
        {plan}

        Tu misión es dar el veredicto FINAL. No seas blando. Si el plan tiene "tech-magic" o es genérico, RECHÁZALO.
        
        Responde SOLO JSON:
        {{
            "status": "APPROVED" | "REJECTED",
            "critique": "Razón técnica brutal",
            "score": 0-100
        }}
        `);

        const chain = prompt.pipe(getGpt5()).pipe(parser);
        const result: any = await chain.invoke({
            audit: logicalAudit,
            plan: JSON.stringify(analysis)
        });

        console.log(`[CHALLENGER] Veredicto: ${result.status} (${result.score}/100)`);

        if (result.status === "REJECTED" || result.score < 85) {
            return {
                next_node: "analizador",
                errors: [...state.errors, `RECHAZADO POR CHALLENGER: ${result.critique}`],
                messages: [
                    new AIMessage(`Auditoría Crítica: \n${logicalAudit}\n\nVeredicto: ${result.critique}. Estoy re-evaluando la arquitectura para corregir estos puntos.`)
                ]
            };
        }

        return {
            next_node: "waiting_approval",
            messages: [new AIMessage(`La auditoría ha sido superada con éxito.\n\n${logicalAudit}`)]
        };

    } catch (e) {
        console.error("Error en Challenger Real:", e);
        return { next_node: "waiting_approval" };
    }
}


// Nodo 3: Validador y Auto-sanación (Reflexión Crítica con GPT-4o)
export async function validatorNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: VALIDADOR (Auto-sanación Real con GPT-4o) ---");

    const executionResults = state.context_memory.execution_results || [];
    const lastSummary = executionResults.map((r: any) => `${r.agent}: ${r.output}`).join("\n");

    const parser = new JsonOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
    ${IDENTITY_PROMPT_TEMPLATE}
    
    Eres el Inspector de Calidad Superior y Guardián de Identidad de Vanguard Crux.
    Tu tarea es evaluar si los resultados cumplen con los estándares y NO contienen críticas incoherentes hacia la agencia (Fuego Amigo).
    
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
                messages: [new AIMessage(`Rechazado por calidad (${evaluation.score}/100): ${evaluation.critique}`)]
            };
        }

        return {
            next_node: "FIN",
            messages: [new AIMessage(`Validación exitosa: Los resultados cumplen con los estándares de calidad.`)]
        };

    } catch (e: any) {
        console.error("Error en Validador Real:", e);
        return {
            next_node: "healing",
            errors: [...state.errors, `Error en Validador: ${e.message}`],
            messages: [new AIMessage("Error en validación. Intentando auto-sanación.")]
        };
    }
}

// Nodo 4: Reflexión Post-Tarea (Memoria Cognitiva)
export async function reflectionNode(state: AgentState): Promise<Partial<AgentState>> {
    console.log("--- NODO: REFLEXIÓN (Guardando en Pinecone) ---");

    const lastMessageObj = state.messages[state.messages.length - 1];
    let lastMessage: string | HumanMessage;

    if (containsMultimodalContent(lastMessageObj)) {
        lastMessage = lastMessageObj as HumanMessage;
    } else {
        lastMessage = typeof lastMessageObj.content === "string"
            ? lastMessageObj.content
            : JSON.stringify(lastMessageObj.content);
    }

    const analysis = state.context_memory.analysis;

    const reflectionText = `
    Tarea: ${analysis?.tasks?.join(", ") || "Tarea general de ejecución"}
    Resultado: ${lastMessage}
    Habilidades Usadas: ${state.skills_active?.join(", ") || "Ninguna"}
    `;

    try {
        await saveReflection(
            reflectionText, 
            "uai-nucleus-orchestrator", 
            null, 
            "MISSION_REFLECTION", 
            `Reflexión sobre misión: ${analysis?.tasks?.join(", ") || "Ejecución"}`, 
            { complexity: analysis?.complexity, skills: state.skills_active }, 
            analysis?.keywords || ["reflexion", "uai"],
            { complexity: analysis?.complexity }
        );
        console.log("Aprendizaje guardado en memoria semántica.");
    } catch (e) {
        console.error("Error al guardar reflexión:", e);
    }

    // Otorgar XP al usuario usando la lógica correcta de gamificación
    try {
        const { dbAdapter } = await import('../db-adapter');
        const { calculateLevel, XP_REWARDS } = await import('../gamification');
        const xpEarned = XP_REWARDS.CICLO_COMPLETADO;
        const currentUser = await dbAdapter.getUserById(state.userId);
        if (currentUser) {
            const newTotalXp = (currentUser.xp || 0) + xpEarned;
            const newLevel = calculateLevel(newTotalXp);
            await dbAdapter.updateUserGamification(state.userId, {
                xp: newTotalXp,
                level: newLevel,
                lastActive: new Date()
            });
        }
    } catch (e) {
        console.error("Error al actualizar el progreso del usuario:", e);
    }

    return { next_node: "FIN" };
}

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { dbPool } from "../database";

// Registro de nodos y lógica de grafo
uaiGraph.addNode("analizador" as any, analyzerNode);
uaiGraph.addNode("challenger" as any, challengerNode); // ADDED
uaiGraph.addNode("ejecutor" as any, executorNode);
uaiGraph.addNode("validador" as any, validatorNode);
uaiGraph.addNode("reflexion" as any, reflectionNode);
uaiGraph.addNode("healing" as any, healingNode);
uaiGraph.setEntryPoint("analizador" as any);

// Updated Edges for Challenger Protocol
uaiGraph.addConditionalEdges("analizador" as any, (s) => s.next_node, { challenger: "challenger", ejecutor: "ejecutor", waiting_approval: END, FIN: END, error: "healing" } as any);
uaiGraph.addConditionalEdges("challenger" as any, (s) => s.next_node, { analizador: "analizador", waiting_approval: END, error: "healing" } as any);
uaiGraph.addConditionalEdges("ejecutor" as any, (s) => s.next_node, { validador: "validador", error: "healing" } as any);
uaiGraph.addConditionalEdges("validador" as any, (s) => s.next_node === "FIN" ? "reflexion" : "healing");
uaiGraph.addConditionalEdges("reflexion" as any, (s) => s.next_node === "FIN" ? END : END);
uaiGraph.addConditionalEdges("healing" as any, (s) => s.next_node === "analizador" ? "analizador" : END);

// Exportar una función para obtener la app compilada con el checkpointer
export async function getCompiledApp() {
    const checkpointer = new PostgresSaver(dbPool);
    // En producción, aseguramos que las tablas existan (esto solo ocurre una vez)
    await checkpointer.setup();
    return uaiGraph.compile({ checkpointer });
}

// Para compatibilidad hacia atrás o uso simple sin checkpointer (demo)
export const app = uaiGraph.compile();
