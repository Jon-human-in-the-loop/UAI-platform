import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, dbPool } from '@/lib/database';
import { authorize } from '@/lib/authz';
import bcrypt from 'bcryptjs';

// Admin gets maximum level, XP (Dragón Primordial rank = level 100+) and unlimited credits
const ADMIN_MAX_XP = 5_000_000;
const ADMIN_MAX_LEVEL = 100;
const ADMIN_MAX_CREDITS = 999_999;

async function seedDemoData(client: any, adminId: string) {
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

    // Insert marketplace templates
    const templates = [
        { id: 'tpl-growth-hacker', name: 'Growth Hacker Pro', role: 'Especialista en Crecimiento', desc: 'Agente entrenado para identificar canales de adquisición, optimizar funnels y escalar experimentos de growth.', cat: 'Marketing', price: 150, downloads: 234, rating: 4.8 },
        { id: 'tpl-seo-master', name: 'SEO Master Agent', role: 'Especialista SEO', desc: 'Optimiza el posicionamiento orgánico de cualquier sitio web. Analiza keywords, estructura y backlinks.', cat: 'Marketing', price: 200, downloads: 189, rating: 4.9 },
        { id: 'tpl-sales-closer', name: 'Sales Closer Elite', role: 'Agente de Ventas', desc: 'Especializado en cierre de ventas B2B. Califica leads, maneja objeciones y genera propuestas personalizadas.', cat: 'Ventas', price: 300, downloads: 312, rating: 4.7 },
        { id: 'tpl-content-factory', name: 'Content Factory', role: 'Máquina de Contenido', desc: 'Genera contenido de alta calidad a escala: artículos, posts, newsletters, scripts de video y más.', cat: 'Contenido', price: 100, downloads: 567, rating: 4.6 },
        { id: 'tpl-customer-success', name: 'Customer Success Bot', role: 'Agente de Éxito del Cliente', desc: 'Reduce el churn y aumenta el NPS. Monitorea uso, detecta señales de abandono y activa intervenciones.', cat: 'Customer Success', price: 250, downloads: 145, rating: 4.9 },
        { id: 'tpl-legal-analyst', name: 'Legal Analyst AI', role: 'Analista Legal', desc: 'Revisa contratos, identifica cláusulas de riesgo y genera resúmenes ejecutivos de documentos legales.', cat: 'Legal', price: 400, downloads: 98, rating: 4.8 },
        { id: 'tpl-hr-recruiter', name: 'HR Recruiter Pro', role: 'Reclutador IA', desc: 'Automatiza reclutamiento: screening de CVs, preguntas de entrevista y evaluación de candidatos.', cat: 'RRHH', price: 180, downloads: 203, rating: 4.7 },
        { id: 'tpl-financial-advisor', name: 'Financial Advisor AI', role: 'Asesor Financiero', desc: 'Analiza estados financieros, proyecta flujos de caja y genera recomendaciones de inversión.', cat: 'Finanzas', price: 350, downloads: 167, rating: 4.9 },
    ];

    for (const t of templates) {
        await client.query(
            `INSERT INTO marketplace_templates (id, name, role, description, model, system_prompt, category, price_credits, owner_user_id, published, downloads, rating)
             VALUES ($1, $2, $3, $4, 'gpt-4.1-mini', '', $5, $6, $7, true, $8, $9) ON CONFLICT (id) DO NOTHING`,
            [t.id, t.name, t.role, t.desc, t.cat, t.price, adminId, t.downloads, t.rating]
        );
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

            // Seed demo data (agents, marketplace, learnings, analytics)
            await seedDemoData(client, adminId);

            return NextResponse.json({
                message: res.rows.length === 0
                    ? 'Database initialized, Admin created & Demo data seeded'
                    : reset
                        ? 'DB re-initialized, Admin upgraded & Demo data seeded'
                        : 'Admin upgraded & Demo data seeded',
                bootstrap: isBootstrap,
                adminStats: { level: ADMIN_MAX_LEVEL, xp: ADMIN_MAX_XP, credits: ADMIN_MAX_CREDITS },
                seedData: true,
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Setup logic failed:', error);
        return NextResponse.json({ error: 'Setup failed', details: (error as Error).message }, { status: 500 });
    }
}
