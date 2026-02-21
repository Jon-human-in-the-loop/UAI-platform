/**
 * Módulo de Marketplace de Agentes (Fase 3 & 4)
 * Gestiona las plantillas de agentes pre-optimizados y el sistema de compras.
 */

import { dbPool } from "./database";

export interface AgentTemplate {
    id: string;
    name: string;
    role: string;
    description: string;
    model: string;
    system_prompt: string;
    skills: string[];
    category: 'marketing' | 'development' | 'data' | 'business' | 'Strategy' | 'Security' | 'Research' | 'Content';
    price_credits: number;
    rating?: number;
    downloads?: number;
    created_at?: Date;
}

export const MARKETPLACE_TEMPLATES: AgentTemplate[] = [
    {
        id: 'tpl_ph_launcher',
        name: 'Lanzador Product Hunt',
        role: 'Experto en lanzamientos virales',
        description: 'Optimizado para crear campañas de lanzamiento en Product Hunt, incluyendo copywriting, estrategia de assets y plan de engagement.',
        model: 'claude-3-opus',
        system_prompt: 'Eres un experto en lanzamientos de Product Hunt con un historial de éxitos en el Top 3. Tu objetivo es maximizar el impacto de los productos de tus usuarios.',
        skills: ['content-marketer-skill', 'viral-app-trend-builder'],
        category: 'marketing',
        price_credits: 50
    },
    {
        id: 'tpl_seo_master',
        name: 'SEO Master Auditor',
        role: 'Especialista en posicionamiento orgánico',
        description: 'Realiza auditorías técnicas completas de SEO, análisis de palabras clave y sugerencias de contenido para dominar los SERPs.',
        model: 'gpt-4-turbo',
        system_prompt: 'Eres un consultor SEO senior con 15 años de experiencia. Analizas sitios web con precisión quirúrgica para encontrar oportunidades de crecimiento orgánico.',
        skills: ['seo-specialist-skill', 'market-researcher-skill'],
        category: 'marketing',
        price_credits: 40
    },
    {
        id: 'tpl_fullstack_arch',
        name: 'Arquitecto Fullstack',
        role: 'Diseñador de sistemas escalables',
        description: 'Diseña arquitecturas de software modernas, selecciona el stack tecnológico adecuado y genera wireframes técnicos.',
        model: 'claude-3-opus',
        system_prompt: 'Eres un arquitecto de software especializado en sistemas distribuidos y aplicaciones web de alto rendimiento. Priorizas la escalabilidad y la mantenibilidad.',
        skills: ['fullstack-developer-skill', 'solution-architect-skill'],
        category: 'development',
        price_credits: 60
    },
    {
        id: 'tpl_sec_auditor',
        name: 'Auditor de Seguridad Senior',
        role: 'Experto en penetración y seguridad',
        description: 'Identifica vulnerabilidades en el código, configuraciones de red y procesos empresariales para prevenir ataques.',
        model: 'gpt-4-turbo',
        system_prompt: 'Eres un experto en ciberseguridad con mentalidad de hacker ético. Tu misión es proteger los activos digitales del usuario encontrando debilidades antes que los atacantes.',
        skills: ['security-auditor-skill', 'penetration-tester-skill'],
        category: 'development',
        price_credits: 75
    }
];

/**
 * Obtiene todas las plantillas del marketplace.
 */
export function getMarketplaceTemplates() {
    return MARKETPLACE_TEMPLATES;
}

/**
 * Obtiene una plantilla específica por ID.
 */
export function getTemplateById(id: string) {
    return MARKETPLACE_TEMPLATES.find(t => t.id === id);
}

/**
 * Registra una compra de un template o skill.
 */
export async function recordPurchase(
    userId: string,
    itemId: string,
    itemType: 'agent_template' | 'skill',
    pricePaid: number
): Promise<void> {
    const client = await dbPool.connect();
    try {
        // Registrar la compra
        await client.query(
            `INSERT INTO user_purchases (user_id, item_id, item_type, price_paid, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [userId, itemId, itemType, pricePaid]
        );

        // Actualizar el contador de descargas del template
        await client.query(
            `UPDATE marketplace_templates SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1`,
            [itemId]
        );

        // Restar créditos del usuario
        await client.query(
            `UPDATE users SET used_credits = COALESCE(used_credits, 0) + $1 WHERE id = $2`,
            [pricePaid, userId]
        );
    } finally {
        client.release();
    }
}

/**
 * Verifica si un usuario ya ha adquirido un template específico.
 */
export async function hasUserPurchased(userId: string, itemId: string): Promise<boolean> {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT COUNT(*) FROM user_purchases WHERE user_id = $1 AND item_id = $2`,
            [userId, itemId]
        );
        return parseInt(res.rows[0].count) > 0;
    } finally {
        client.release();
    }
}

/**
 * Obtiene los créditos disponibles de un usuario.
 */
export async function getUserCredits(userId: string): Promise<number> {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT total_credits, used_credits FROM users WHERE id = $1`,
            [userId]
        );
        if (res.rows[0]) {
            return res.rows[0].total_credits - (res.rows[0].used_credits || 0);
        }
        return 0;
    } finally {
        client.release();
    }
}

/**
 * Obtiene los templates de agentes que un usuario ha adquirido.
 */
export async function getUserPurchasedTemplates(userId: string): Promise<AgentTemplate[]> {
    const client = await dbPool.connect();
    try {
        const res = await client.query(
            `SELECT mt.* FROM marketplace_templates mt
             INNER JOIN user_purchases up ON mt.id = up.item_id
             WHERE up.user_id = $1 AND up.item_type = 'agent_template'`,
            [userId]
        );
        return res.rows;
    } finally {
        client.release();
    }
}
