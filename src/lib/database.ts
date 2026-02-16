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

            console.log('--- DB Schema Verified (Full Phase 1) ---');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('--- DB Connection/Init Error ---', err);
    }
}
