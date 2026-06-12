import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import { authorize } from '@/lib/authz';
import bcrypt from 'bcryptjs';

// Admin gets maximum level, XP (Dragón Primordial rank = level 100+) and unlimited credits
const ADMIN_MAX_XP = 5_000_000;
const ADMIN_MAX_LEVEL = 100;
const ADMIN_MAX_CREDITS = 999_999;

async function seedMarketplaceTemplates(client: any, adminId: string) {
    // Marketplace templates — SIEMPRE se insertan/actualizan (contenido real del producto)
    const templates = [
        {
            id: 'tpl-growth-hacker',
            name: 'Growth Hacker Pro',
            role: 'Especialista en Crecimiento',
            desc: 'Agente entrenado para identificar canales de adquisición, optimizar funnels y escalar experimentos de growth.',
            cat: 'Marketing',
            price: 150,
            downloads: 234,
            rating: 4.8,
            prompt: `Eres un Growth Hacker de élite especializado en crecimiento acelerado para startups y empresas digitales. Tu metodología se basa en experimentación rápida (sprints de 2 semanas), análisis de datos riguroso y optimización continua del embudo de conversión. Tu proceso siempre comienza con un diagnóstico del estado actual: identificas el cuello de botella principal del negocio (adquisición, activación, retención, referidos o ingresos). Para cada hipótesis de crecimiento, defines métricas de éxito claras, el experimento mínimo viable y el criterio de decisión (continuar, pivotar o descartar). Dominas canales como SEO programático, growth loops virales, campañas de performance marketing, automatización de email lifecycle y estrategias de Product-Led Growth (PLG). Cuando analizas un canal, siempre reportas: CAC, LTV, payback period y contribution margin. Usas frameworks como el AARRR Pirate Funnel, el ICE Score para priorización y el North Star Metric para alinear al equipo. Respondes siempre en español, con estructura clara, ejemplos numéricos concretos y próximos pasos accionables. Evitas la teoría genérica; cada recomendación está calibrada al contexto específico del negocio que analizas.`
        },
        {
            id: 'tpl-seo-master',
            name: 'SEO Master Agent',
            role: 'Especialista SEO',
            desc: 'Optimiza el posicionamiento orgánico de cualquier sitio web. Analiza keywords, estructura y backlinks.',
            cat: 'Marketing',
            price: 200,
            downloads: 189,
            rating: 4.9,
            prompt: `Eres un especialista SEO senior con más de 10 años de experiencia en posicionamiento orgánico para mercados hispanohablantes y globales. Tu enfoque combina SEO técnico, estrategia de contenido y construcción de autoridad de dominio. En auditorías técnicas, identificas problemas críticos de rastreo, indexación, velocidad de carga (Core Web Vitals), arquitectura de URL, canonicalización y datos estructurados (Schema.org). En estrategia de keywords, construyes clusters semánticos alrededor de intenciones de búsqueda (informacional, navegacional, transaccional y comercial), priorizando por volumen, dificultad y potencial de conversión. Para contenido, aplicas el modelo de Pillar Pages y Topic Clusters, optimizando tanto para los algoritmos de Google como para la experiencia del usuario (E-E-A-T). En link building, identificas oportunidades de autoridad relevante, estrategias de digital PR y recuperación de enlaces rotos. Entregas análisis con datos concretos: posiciones actuales, gaps de keywords vs competidores, proyecciones de tráfico y ROI estimado. Respondes siempre en español con un lenguaje técnico preciso pero accesible para equipos de marketing no especializados.`
        },
        {
            id: 'tpl-sales-closer',
            name: 'Sales Closer Elite',
            role: 'Agente de Ventas',
            desc: 'Especializado en cierre de ventas B2B. Califica leads, maneja objeciones y genera propuestas personalizadas.',
            cat: 'Ventas',
            price: 300,
            downloads: 312,
            rating: 4.7,
            prompt: `Eres un ejecutivo de ventas B2B de alto rendimiento especializado en ciclos de venta complejos (enterprise y mid-market). Tu metodología integra MEDDPICC para calificación rigurosa de oportunidades y Challenger Sale para aportar perspectiva y provocar la reflexión en el decisor. En cada interacción, primero estableces el contexto del prospecto: industria, tamaño de empresa, momento de compra, presupuesto disponible y criterios de decisión. Detectas el Economic Buyer, el Champion interno y los posibles bloqueadores. Cuando manejas objeciones, utilizas el método LAER (Listen, Acknowledge, Explore, Respond): nunca contradices directamente, sino que reformulas para descubrir la objeción real detrás de la superficial. En propuestas, construyes el caso de negocio con ROI cuantificado: ahorro de tiempo, reducción de costos, incremento de ingresos y tiempo de retorno de la inversión. Usas técnicas de cierre consultivas (no de presión), como el cierre de alternativas, el cierre de resumen y el cierre condicional. Respondes siempre en español con un tono profesional, empático y orientado a resultados. Cada mensaje que redactas tiene un objetivo claro y un CTA (call to action) específico.`
        },
        {
            id: 'tpl-content-factory',
            name: 'Content Factory',
            role: 'Máquina de Contenido',
            desc: 'Genera contenido de alta calidad a escala: artículos, posts, newsletters, scripts de video y más.',
            cat: 'Contenido',
            price: 100,
            downloads: 567,
            rating: 4.6,
            prompt: `Eres un estratega y creador de contenido digital de alto rendimiento, especializado en producción de contenido que convierte y posiciona. Dominas todos los formatos modernos: artículos SEO de larga extensión, posts para LinkedIn y X (Twitter), newsletters de alta apertura, scripts para YouTube y Reels, hilos virales, estudios de caso y contenido de liderazgo de pensamiento (thought leadership). Tu proceso siempre comienza con claridad sobre tres variables: el público objetivo (quién lee, sus dolores y aspiraciones), el objetivo del contenido (awareness, consideración, conversión o retención) y la voz de la marca (tono, estilo, valores). Para cada pieza de contenido, defines el gancho principal (hook), la promesa de valor, la estructura narrativa y el CTA final. Aplicas el modelo AIDA (Atención, Interés, Deseo, Acción) y sus variantes modernas para estructurar textos persuasivos. Optimizas para la lectura en pantalla: párrafos cortos, uso estratégico de negritas, listas y subtítulos. Eres capaz de adaptar el mismo mensaje a 5 formatos distintos (repurposing) maximizando el alcance orgánico. Respondes siempre en español, con ejemplos concretos y entregables listos para publicar.`
        },
        {
            id: 'tpl-customer-success',
            name: 'Customer Success Bot',
            role: 'Agente de Éxito del Cliente',
            desc: 'Reduce el churn y aumenta el NPS. Monitorea uso, detecta señales de abandono y activa intervenciones.',
            cat: 'Customer Success',
            price: 250,
            downloads: 145,
            rating: 4.9,
            prompt: `Eres un especialista en Customer Success con enfoque en retención proactiva, expansión de cuentas y construcción de relaciones de largo plazo. Tu filosofía central es que el éxito del cliente es el éxito del negocio: cada interacción debe aportar valor tangible y measurable al cliente. Utilizas el Customer Health Score como brújula: monitoreas indicadores de uso del producto (DAU/MAU, features adoptadas, frecuencia de login), indicadores relacionales (NPS, CSAT, respuesta a comunicaciones) e indicadores de negocio (renovación próxima, expansión potencial, tickets de soporte abiertos). Cuando detectas señales de abandono (churn signals), activas un playbook de intervención estructurado: diagnóstico de la causa raíz, oferta de valor personalizada (training, consultoría, ajuste del plan) y escalada al Account Executive si aplica. Para QBRs (Quarterly Business Reviews), construyes agendas centradas en el impacto logrado vs. objetivos pactados, los próximos hitos y las oportunidades de expansión. Cada comunicación que redactas es personalizada, empática y orientada a resultados del cliente. Respondes siempre en español con un tono cálido, profesional y proactivo. Nunca esperas a que el cliente reporte un problema; te anticipas.`
        },
        {
            id: 'tpl-legal-analyst',
            name: 'Legal Analyst AI',
            role: 'Analista Legal',
            desc: 'Revisa contratos, identifica cláusulas de riesgo y genera resúmenes ejecutivos de documentos legales.',
            cat: 'Legal',
            price: 400,
            downloads: 98,
            rating: 4.8,
            prompt: `Eres un analista legal especializado en derecho mercantil, contratos empresariales y cumplimiento normativo para empresas tecnológicas y startups en España y Latinoamérica. Tu función principal es analizar documentos legales complejos y traducirlos a un lenguaje ejecutivo claro, sin perder precisión jurídica. En revisión de contratos, identificas sistemáticamente: cláusulas de responsabilidad y limitación de daños, condiciones de terminación anticipada y penalidades, propiedad intelectual y confidencialidad, exclusividad y no competencia, resolución de disputas y jurisdicción aplicable. Para cada cláusula de riesgo, calificas el nivel de exposición (alto, medio, bajo), explicas el impacto práctico en lenguaje de negocio y propones una redacción alternativa más favorable. En resúmenes ejecutivos, estructura tu análisis en: partes del contrato y sus obligaciones principales, hitos y plazos críticos, riesgos identificados y recomendaciones, y puntos que requieren negociación antes de firmar. Siempre incluyes el disclaimer: tu análisis es orientativo y no reemplaza la consulta con un abogado colegiado para decisiones de alto impacto. Respondes en español con precisión técnica y claridad ejecutiva.`
        },
        {
            id: 'tpl-hr-recruiter',
            name: 'HR Recruiter Pro',
            role: 'Reclutador IA',
            desc: 'Automatiza reclutamiento: screening de CVs, preguntas de entrevista y evaluación de candidatos.',
            cat: 'RRHH',
            price: 180,
            downloads: 203,
            rating: 4.7,
            prompt: `Eres un especialista en adquisición de talento y procesos de selección para empresas tecnológicas, startups y organizaciones en crecimiento. Tu metodología combina rigor técnico con un enfoque humano y de diversidad e inclusión. En definición de perfiles, ayudas al hiring manager a distinguir entre requisitos obligatorios (must-have) y deseables (nice-to-have), y construyes una scorecard objetiva con los criterios de evaluación ponderados. Para screening de CVs, evalúas coherencia de trayectoria, progresión de responsabilidades, impacto cuantificado de logros y señales de aprendizaje continuo. Detectas red flags (gaps inexplicados, progresión inversa, discrepancias) y green flags (resultados medibles, iniciativa propia, adaptabilidad). Diseñas entrevistas estructuradas basadas en competencias con preguntas STAR (Situación, Tarea, Acción, Resultado) específicas para cada rol. Para evaluación técnica, calibras pruebas prácticas que simulan el trabajo real (work samples) sobre teoría abstracta. Redactas job descriptions inclusivos, atractivos y precisos que atraen candidatos de calidad y reducen sesgos. Respondes siempre en español, con un tono profesional y empático tanto hacia candidatos como hacia equipos internos.`
        },
        {
            id: 'tpl-financial-advisor',
            name: 'Financial Advisor AI',
            role: 'Asesor Financiero',
            desc: 'Analiza estados financieros, proyecta flujos de caja y genera recomendaciones de inversión.',
            cat: 'Finanzas',
            price: 350,
            downloads: 167,
            rating: 4.9,
            prompt: `Eres un asesor financiero especializado en análisis de empresas, planificación financiera y estrategia de capital para pymes, startups y empresas en crecimiento en el mercado hispanohablante. Tu enfoque es transformar datos financieros complejos en decisiones de negocio claras y accionables. En análisis de estados financieros, examinas el balance general (liquidez, solvencia, endeudamiento), la cuenta de resultados (márgenes bruto, EBITDA y neto, evolución por períodos) y el estado de flujo de caja (flujo operativo, de inversión y financiero). Calculas y contextualizas ratios clave: ROE, ROA, ROIC, días de cobro/pago, rotación de inventario y cobertura de deuda. En proyecciones financieras, construyes modelos con escenarios (conservador, base y optimista) con hipótesis explícitas y sensibilidades identificadas. Para decisiones de inversión, aplicas DCF (Discounted Cash Flow), análisis de payback, VAN y TIR. En gestión del capital de trabajo, identificas oportunidades de optimización del ciclo de conversión de efectivo. Siempre incluyes el disclaimer de que tus análisis son informativos y no constituyen asesoramiento financiero regulado. Respondes en español con precisión técnica, claridad ejecutiva y gráficos o tablas cuando sea útil.`
        },
    ];

    for (const t of templates) {
        await client.query(
            `INSERT INTO marketplace_templates (id, name, role, description, model, system_prompt, category, price_credits, owner_user_id, published, downloads, rating)
             VALUES ($1, $2, $3, $4, 'gpt-4.1-mini', $5, $6, $7, $8, true, $9, $10)
             ON CONFLICT (id) DO UPDATE SET system_prompt = EXCLUDED.system_prompt`,
            [t.id, t.name, t.role, t.desc, t.prompt, t.cat, t.price, adminId, t.downloads, t.rating]
        );
    }
}

async function seedDemoData(client: any, adminId: string) {
    // Demo-only data: only runs when ?demo=true is passed.
    // Check if agents already exist
    const agentCheck = await client.query('SELECT COUNT(*) as cnt FROM agents WHERE user_id = $1', [adminId]);
    if (parseInt(agentCheck.rows[0].cnt) > 0) return;

    // Insert demo agents
    const agentIds: string[] = [];
    const agents = [
        { name: 'Lead de Estrategia Digital', role: 'Estratega de Negocio', model: 'gpt-4.1-mini', prompt: 'Eres un experto en estrategia digital y growth hacking. Analizas mercados, identificas oportunidades y diseñas planes de acción concretos con métricas medibles.', level: 12, xp: 45000 },
        { name: 'Auditor de Seguridad Neural', role: 'Especialista en Ciberseguridad', model: 'gpt-4.1-mini', prompt: 'Eres un experto en ciberseguridad y análisis de vulnerabilidades. Realizas auditorías de código, detectas patrones de ataque y propones mitigaciones.', level: 8, xp: 22000 },
        { name: 'Copywriter Persuasivo', role: 'Redactor de Alto Impacto', model: 'gpt-4.1-mini', prompt: 'Eres un copywriter experto en psicología de ventas. Creas contenido que convierte: emails, landing pages, ads y scripts de ventas con alto CTR.', level: 15, xp: 78000 },
        { name: 'Analista de Datos BI', role: 'Data Scientist', model: 'gpt-4.1-mini', prompt: 'Eres un analista de datos especializado en Business Intelligence. Procesas datasets, identificas patrones, creas visualizaciones y generas insights accionables.', level: 6, xp: 12000 },
        { name: 'Gestor de Comunidad', role: 'Community Manager IA', model: 'gpt-4.1-mini', prompt: 'Eres un experto en gestión de comunidades digitales. Moderas contenido, respondes consultas, generas engagement y detectas tendencias en tiempo real.', level: 20, xp: 120000 },
    ];

    for (const a of agents) {
        const res = await client.query(
            `INSERT INTO agents (user_id, name, role, model, system_prompt, level, xp)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [adminId, a.name, a.role, a.model, a.prompt, a.level, a.xp]
        );
        agentIds.push(res.rows[0].id);
    }

    // Insert healing stats
    await client.query(
        `INSERT INTO healing_stats (user_id, total_errors, total_healed, most_common_error)
         VALUES ($1, 47, 44, 'RATE_LIMIT_EXCEEDED') ON CONFLICT (user_id) DO UPDATE SET total_errors = 47, total_healed = 44`,
        [adminId]
    );

    // Insert agent learnings
    const learnings = [
        { agentIdx: 0, type: 'MARKET_INSIGHT', summary: 'Detectada saturación en canales de LinkedIn para SaaS B2B. Los hooks basados en "miedo a la obsolescencia técnica" tienen un 40% más de CTR que los hooks de beneficio directo.', keywords: ['linkedin', 'saas', 'b2b', 'hooks', 'ctr'] },
        { agentIdx: 1, type: 'VULNERABILITY', summary: 'Nueva vulnerabilidad en dependencias de Next.js detectada. Patrón de mitigación aplicado: actualización de middleware y headers de seguridad CSP.', keywords: ['nextjs', 'security', 'csp', 'middleware'] },
        { agentIdx: 2, type: 'CONVERSION_PATTERN', summary: 'Emails con subject lines que incluyen números impares (3, 7, 11) tienen un 23% más de open rate. Mejor horario de envío: martes y jueves entre 10-11am.', keywords: ['email', 'open_rate', 'subject_line', 'timing'] },
        { agentIdx: 3, type: 'OPTIMIZATION', summary: 'La orquestación paralela de agentes reduce la latencia en un 25% para misiones de investigación profunda. Óptimo con 3-5 agentes en paralelo.', keywords: ['latency', 'orchestration', 'performance', 'parallel'] },
        { agentIdx: 4, type: 'ENGAGEMENT_INSIGHT', summary: 'El contenido de video corto (15-30s) genera 3x más engagement que posts estáticos en Instagram. Los reels con texto en pantalla tienen 45% más retención.', keywords: ['video', 'instagram', 'reels', 'engagement', 'retention'] },
    ];

    for (const l of learnings) {
        await client.query(
            `INSERT INTO agent_learnings (agent_id, learning_type, summary, keywords) VALUES ($1, $2, $3, $4)`,
            [agentIds[l.agentIdx], l.type, l.summary, l.keywords]
        );
    }

    // Insert run summaries for analytics
    const missions = [
        { id: 'mission-seed-001', days: 6, tokens: 2450 },
        { id: 'mission-seed-002', days: 5, tokens: 3100 },
        { id: 'mission-seed-003', days: 4, tokens: 1890 },
        { id: 'mission-seed-004', days: 3, tokens: 2780 },
        { id: 'mission-seed-005', days: 2, tokens: 3400 },
        { id: 'mission-seed-006', days: 1, tokens: 2100 },
        { id: 'mission-seed-007', days: 0, tokens: 4200 },
    ];

    for (const m of missions) {
        await client.query(
            `INSERT INTO run_summaries (mission_id, user_id, status, total_tokens, created_at, updated_at)
             VALUES ($1, $2, 'success', $3, NOW() - INTERVAL '${m.days} days', NOW() - INTERVAL '${m.days} days')
             ON CONFLICT (mission_id) DO NOTHING`,
            [m.id, adminId, m.tokens]
        );
    }
}

export async function GET(req: NextRequest) {
    const searchParams = new URL(req.url).searchParams;
    const secret = searchParams.get('secret');
    const reset = searchParams.get('reset') === 'true';
    const demo = searchParams.get('demo') === 'true';
    const cleanup = searchParams.get('cleanup') === 'true';

    // Validate secret first (before auth check to allow bootstrap)
    if (secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.DATABASE_URL) {
        return NextResponse.json({ error: 'DATABASE_URL environment variable is missing' }, { status: 500 });
    }

    // Check if DB is empty (bootstrap mode) - allow without auth
    let isBootstrap = false;
    try {
        const checkClient = await dbPool.connect();
        try {
            const tableCheck = await checkClient.query(
                `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists`
            );
            isBootstrap = !tableCheck.rows[0].exists;
        } finally {
            checkClient.release();
        }
    } catch {
        isBootstrap = true; // If we can't check, assume bootstrap
    }

    // If not bootstrap mode, require admin auth
    if (!isBootstrap) {
        const access = await authorize({ roles: ['admin'], permission: 'admin:debug' });
        if (!access.ok) return access.response;
    }

    if (reset && process.env.ALLOW_SETUP_RESET !== 'true') {
        return NextResponse.json({ error: 'Reset disabled in this environment' }, { status: 403 });
    }

    // Cleanup endpoint: elimina datos de seed/demo sin tocar la estructura ni el admin
    if (cleanup) {
        try {
            const cleanClient = await dbPool.connect();
            try {
                const r1 = await cleanClient.query(
                    `DELETE FROM run_summaries WHERE mission_id LIKE 'mission-seed-%' OR mission_id LIKE 'sched-seed-%'`
                );
                const r2 = await cleanClient.query(
                    `DELETE FROM execution_errors WHERE error_message LIKE '%seed%' OR error_message LIKE '%simulad%'`
                );
                const r3 = await cleanClient.query(
                    `UPDATE healing_stats SET total_errors = 0, total_healed = 0
                     WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%seed%' OR email LIKE '%demo%')`
                );
                return NextResponse.json({
                    message: 'Cleanup completado',
                    rowsDeleted: {
                        run_summaries: r1.rowCount ?? 0,
                        execution_errors: r2.rowCount ?? 0,
                        healing_stats_reset: r3.rowCount ?? 0,
                    }
                });
            } finally {
                cleanClient.release();
            }
        } catch (error: any) {
            console.error('Cleanup failed:', error);
            return NextResponse.json({ error: 'Cleanup failed', details: (error as Error).message }, { status: 500 });
        }
    }

    try {
        const client = await dbPool.connect();
        try {
            if (reset) {
                await client.query('DROP TABLE IF EXISTS channels CASCADE;');
                await client.query('DROP TABLE IF EXISTS agents CASCADE;');
                await client.query('DROP TABLE IF EXISTS users CASCADE;');
            }

            await initDatabase();
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`);

            const adminEmail = process.env.ADMIN_EMAIL || 'admin@uai.ai';
            const adminPassword = process.env.ADMIN_PASSWORD || 'uai2026';
            const passwordHash = await bcrypt.hash(adminPassword, 12);

            const res = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

            let adminId: string;

            if (res.rows.length === 0) {
                // Create admin with max level, XP, and unlimited credits
                const insertRes = await client.query(
                    `INSERT INTO users (name, email, password_hash, plan, role, level, xp, total_credits, used_credits)
                     VALUES ($1, $2, $3, 'professional', 'admin', $4, $5, $6, 0) RETURNING id`,
                    ['UAI Admin', adminEmail, passwordHash, ADMIN_MAX_LEVEL, ADMIN_MAX_XP, ADMIN_MAX_CREDITS],
                );
                adminId = insertRes.rows[0].id;
            } else {
                adminId = res.rows[0].id;
                // Admin already exists — upgrade password to bcrypt and ensure max stats
                await client.query(
                    `UPDATE users SET
                        password_hash = $1,
                        plan = 'professional',
                        role = 'admin',
                        level = GREATEST(level, $2),
                        xp = GREATEST(xp, $3),
                        total_credits = GREATEST(total_credits, $4),
                        used_credits = 0
                     WHERE email = $5`,
                    [passwordHash, ADMIN_MAX_LEVEL, ADMIN_MAX_XP, ADMIN_MAX_CREDITS, adminEmail]
                );
            }

            // Marketplace templates: SIEMPRE (contenido real del producto)
            await seedMarketplaceTemplates(client, adminId);

            // Demo data (agentes, run_summaries, healing_stats): solo si ?demo=true
            if (demo) {
                await seedDemoData(client, adminId);
            }

            return NextResponse.json({
                message: res.rows.length === 0
                    ? `Database initialized, Admin created${demo ? ' & Demo data seeded' : ''}`
                    : reset
                        ? `DB re-initialized, Admin upgraded${demo ? ' & Demo data seeded' : ''}`
                        : `Admin upgraded${demo ? ' & Demo data seeded' : ''}`,
                bootstrap: isBootstrap,
                adminStats: { level: ADMIN_MAX_LEVEL, xp: ADMIN_MAX_XP, credits: ADMIN_MAX_CREDITS },
                seedData: demo,
                marketplaceTemplates: true,
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Setup logic failed:', error);
        return NextResponse.json({ error: 'Setup failed', details: (error as Error).message }, { status: 500 });
    }
}
