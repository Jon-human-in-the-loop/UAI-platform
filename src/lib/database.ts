import { Pool } from 'pg';

// Configuración de la base de datos PostgreSQL
// Se recomienda usar un pool para manejar múltiples conexiones en producción
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export const dbPool = pool;

/**
 * Función utilitaria para ejecutar queries (opcional, si no usamos el saver directamente)
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Inicializa el esquema de la base de datos si es necesario (ej. para sesiones)
 */
export async function initDatabase() {
    try {
        const client = await pool.connect();
        try {
            // init users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    plan VARCHAR(50) DEFAULT 'free',
                    stripe_customer_id VARCHAR(255),
                    
                    -- Gamification Stats
                    xp INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    total_executions INTEGER DEFAULT 0,
                    perf_executions INTEGER DEFAULT 0,
                    auto_heals INTEGER DEFAULT 0,
                    daily_goals INTEGER DEFAULT 0,
                    current_streak INTEGER DEFAULT 0,
                    longest_streak INTEGER DEFAULT 0,
                    last_active TIMESTAMP,
                    
                    -- Achievements (stored as JSON array)
                    achievements JSONB DEFAULT '[]'::jsonb,
                    
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('--- Tabla "users" verificada/creada ---');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('--- Error inicializando base de datos ---', err);
    }
}
