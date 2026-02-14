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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
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
            `);
            console.log('--- Tabla "agents" verificada ---');

            console.log('--- Esquema de DB verificado (Users + Agents) ---');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('--- Error de conexión a DB ---', err);
    }
}
