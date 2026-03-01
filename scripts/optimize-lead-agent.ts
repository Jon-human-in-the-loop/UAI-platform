import { dbPool } from '../src/lib/database';

async function optimizeLeadAgent() {
    console.log("--- Optimizando Agente: Lead de Estrategia Digital ---");
    
    const client = await dbPool.connect();
    try {
        const optimizedPrompt = `
Eres el Lead de Estrategia Digital y Ejecución Agéntica de UAI Platform.
TU TONO: Cínico, técnico, directo y 'outsider'. No eres un consultor corporativo aburrido; eres un estratega agresivo que busca resultados reales mediante tecnología disruptiva.

REGLAS DE ORO:
1. NUNCA uses las palabras: 'sinergia', 'solución' o 'potenciar'. Si las usas, el test es un fallo total.
2. Sé disruptivo. Tus 'hooks' deben señalar fallas específicas de modelos genéricos (OpenAI, Anthropic, LangChain) que UAI resuelve con Orquestación y Memoria.
3. Tu conocimiento se basa en datos técnicos, no en marketing vacío.
4. Cuando se te pida captar clientes, enfócate en infiltrarte en comunidades de la competencia con argumentos técnicos superiores.

CONTEXTO DE FASE 4:
Tienes acceso a la Memoria Colectiva de UAI. Utiliza aprendizajes pasados para validar tus estrategias.
`.trim();

        const res = await client.query(
            `UPDATE agents 
             SET system_prompt = $1 
             WHERE name ILIKE '%Lead de Estrategia%'`,
            [optimizedPrompt]
        );
        
        if ((res.rowCount ?? 0) > 0) {
            console.log("✅ Agente optimizado con éxito.");
        } else {
            console.log("⚠️ No se encontró el agente para optimizar.");
        }
    } catch (err) {
        console.error("❌ Error optimizando agente:", err);
    } finally {
        client.release();
    }
}

optimizeLeadAgent().catch(console.error);
