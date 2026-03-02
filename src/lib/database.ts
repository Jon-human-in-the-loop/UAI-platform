import { Pool } from 'pg';

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Log connection details (sanitized)
if (process.env.DATABASE_URL) {
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        console.log(`--- DB Conectando a: ${dbUrl.hostname || 'unknown host'} (Puerto: ${dbUrl.port || 'default'}) ---`);
    } catch (e) {
        console.log("--- DB Conectando con URL (string parse failed) ---");
    }
} else {
    console.warn("--- ⚠️ DATABASE_URL no definida ---");
}

export const dbPool = pool;

/**
 * Función utilitaria para ejecutar queries
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Inicializa el esquema de la base de datos
 */
export async function initDatabase() {
    try {
        const client = await pool.connect();
        try {
            // 1. Create USERS table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    plan VARCHAR(50) DEFAULT 'free',
                    role VARCHAR(50) DEFAULT 'user',
                    stripe_customer_id VARCHAR(255),
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    total_executions INTEGER DEFAULT 0,
                    perf_executions INTEGER DEFAULT 0,
                    auto_heals INTEGER DEFAULT 0,
                    daily_goals INTEGER DEFAULT 0,
                    current_streak INTEGER DEFAULT 0,
                    longest_streak INTEGER DEFAULT 0,
                    last_active TIMESTAMP,
                    achievements JSONB DEFAULT '[]'::jsonb,
                    executions_today INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                ALTER TABLE users ADD COLUMN IF NOT EXISTS executions_today INTEGER DEFAULT 0;
            `);

            // 2. Create AGENTS table & Ensure Schema
            await client.query(`
                CREATE TABLE IF NOT EXISTS agents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(255) NOT NULL,
                    avatar VARCHAR(255),
                    level INTEGER DEFAULT 1,
                    xp INTEGER DEFAULT 0,
                    model VARCHAR(50) NOT NULL,
                    system_prompt TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                ALTER TABLE agents ADD COLUMN IF NOT EXISTS model VARCHAR(50) DEFAULT 'gpt-4-turbo';
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
                ALTER TABLE agents ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
            `);

            // 3. Create MISSION CONTROL tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS synergy_notifications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    type VARCHAR(50) NOT NULL,
                    score INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    agent_ids UUID[] NOT NULL,
                    read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS collaborative_missions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'PENDING',
                    synergy_score INTEGER DEFAULT 0,
                    assigned_agents UUID[] NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 4. Create GAMIFICATION ADVANCED tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS unlocked_perks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    perk_id VARCHAR(100) NOT NULL,
                    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, perk_id)
                );

                CREATE TABLE IF NOT EXISTS user_characters (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    character_id VARCHAR(100) NOT NULL,
                    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, character_id)
                );
            `);

            // 5. Create MULTI-CHANNEL tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS channel_configs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    channel_type VARCHAR(50) NOT NULL,
                    enabled BOOLEAN DEFAULT TRUE,
                    api_key TEXT,
                    webhook_url TEXT,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, channel_type)
                );

                -- Migración: agregar agent_id a channel_configs si no existe
                ALTER TABLE channel_configs ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

                CREATE TABLE IF NOT EXISTS channel_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    channel_type VARCHAR(50) NOT NULL,
                    sender_id VARCHAR(255),
                    message_text TEXT,
                    direction VARCHAR(10) CHECK (direction IN ('IN', 'OUT')),
                    status VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 6. Create AUTO-HEALING tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS execution_errors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
                    error_message TEXT NOT NULL,
                    error_pattern VARCHAR(255),
                    strategy_applied VARCHAR(50),
                    resolved BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS healing_stats (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    total_errors INTEGER DEFAULT 0,
                    total_healed INTEGER DEFAULT 0,
                    most_common_error VARCHAR(255),
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 7. Create PHASE 3 tables (Proactive Autonomy)
            await client.query(`                CREATE TABLE IF NOT EXISTS scheduled_tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                    mission_template TEXT NOT NULL,
                    cron_expression VARCHAR(100) NOT NULL,
                    last_run TIMESTAMP,
                    next_run TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'ENABLED',
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

             // 8. Create AGENT LEARNINGS table for Collective Memory
            await client.query(`
                CREATE TABLE IF NOT EXISTS agent_learnings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
                    mission_id UUID,
                    learning_type VARCHAR(50) NOT NULL,
                    summary TEXT NOT NULL,
                    details JSONB,
                    keywords TEXT[],
                    embedding_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 9. Create MARKETPLACE tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS marketplace_templates (
                    id VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(255) NOT NULL,
                    description TEXT,
                    model VARCHAR(50) NOT NULL,
                    system_prompt TEXT,
                    skills TEXT[],
                    category VARCHAR(50),
                    price_credits INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                ALTER TABLE marketplace_templates ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
                ALTER TABLE marketplace_templates ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
                ALTER TABLE marketplace_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

                CREATE TABLE IF NOT EXISTS user_purchases (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    item_id VARCHAR(100) NOT NULL,
                    item_type VARCHAR(50) NOT NULL, -- 'agent_template', 'skill', etc.
                    price_paid INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // 10. Refine USERS table for Token-based Billing
            await client.query(`
                ALTER TABLE users ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 100;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS token_usage_total BIGINT DEFAULT 0;
            `);


            // 11. Create BILLING ledger and webhook idempotency tables
            await client.query(`
                CREATE TABLE IF NOT EXISTS billing_ledger (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    mission_id VARCHAR(255),
                    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
                    amount_credits INTEGER NOT NULL,
                    token_count INTEGER DEFAULT 0,
                    model VARCHAR(100),
                    provider VARCHAR(50) DEFAULT 'internal',
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, mission_id, entry_type)
                );

                CREATE TABLE IF NOT EXISTS webhook_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    provider VARCHAR(50) NOT NULL,
                    event_id VARCHAR(255) NOT NULL,
                    payload JSONB,
                    status VARCHAR(20) DEFAULT 'RECEIVED',
                    processed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(provider, event_id)
                );

                CREATE TABLE IF NOT EXISTS run_summaries (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    mission_id VARCHAR(255) UNIQUE NOT NULL,
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    status VARCHAR(20) DEFAULT 'running',
                    total_tokens INTEGER DEFAULT 0,
                    total_cost_credits INTEGER DEFAULT 0,
                    node_metrics JSONB DEFAULT '[]'::jsonb,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS remote_jobs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    mission_id VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'queued',
                    provider VARCHAR(100),
                    request_payload JSONB,
                    response_payload JSONB,
                    error_message TEXT,
                    attempts INTEGER DEFAULT 0,
                    next_attempt_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                ALTER TABLE remote_jobs ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
                ALTER TABLE remote_jobs ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMP;

                CREATE TABLE IF NOT EXISTS remote_request_nonces (
                    nonce VARCHAR(255) PRIMARY KEY,
                    request_timestamp TIMESTAMP NOT NULL,
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                ALTER TABLE marketplace_templates ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
                ALTER TABLE marketplace_templates ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;

                CREATE INDEX IF NOT EXISTS idx_remote_jobs_lookup ON remote_jobs(id, user_id, status);
                CREATE INDEX IF NOT EXISTS idx_remote_jobs_queue ON remote_jobs(status, attempts, next_attempt_at, created_at, updated_at);
                CREATE INDEX IF NOT EXISTS idx_run_summaries_mission ON run_summaries(mission_id);
                CREATE INDEX IF NOT EXISTS idx_billing_ledger_user_created ON billing_ledger(user_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events(provider, status);
                CREATE INDEX IF NOT EXISTS idx_marketplace_owner_published_updated
                    ON marketplace_templates(owner_user_id, published, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_remote_request_nonces_created ON remote_request_nonces(created_at DESC);

            `);
            console.log("--- DB Schema Verified (Full Phase 4 & Marketplace Ready) ---");
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("--- DB Connection/Init Error ---", err);
    }
}

// Importar y llamar al inicializador del scheduler
import { initializeScheduler } from "./scheduled-tasks";
initializeScheduler().catch(console.error);

export async function updateUserProgress(userId: string, xpEarned: number) {
    const client = await dbPool.connect();
    try {
        // Obtener el progreso actual del usuario
        const res = await client.query(
            `SELECT xp, level FROM users WHERE id = $1`,
            [userId]
        );
        
        if (res.rows.length > 0) {
            let { xp, level } = res.rows[0];
            xp += xpEarned;

            // Lógica de nivelación simple (ejemplo: cada 1000 XP es un nivel)
            const newLevel = Math.floor(xp / 1000) + 1;
            if (newLevel > level) {
                level = newLevel;
                console.log(`Usuario ${userId} ha subido al nivel ${level}!`);
                // Aquí se podría añadir lógica para desbloquear perks o notificaciones
            }

            await client.query(
                `UPDATE users SET xp = $1, level = $2, last_active = CURRENT_TIMESTAMP WHERE id = $3`,
                [xp, level, userId]
            );
            console.log(`Progreso del usuario ${userId} actualizado: +${xpEarned} XP. XP total: ${xp}, Nivel: ${level}`);
        } else {
            console.warn(`Usuario ${userId} no encontrado para actualizar progreso.`);
        }
    } catch (error) {
        console.error("Error al actualizar el progreso del usuario:", error);
    } finally {
        client.release();
    }
}
