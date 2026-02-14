import { dbPool } from './database';
import { UserStats, Achievement } from './gamification';

export interface DBUser {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    plan: string;
    stripe_customer_id?: string;
    xp: number;
    level: number;
    total_executions: number;
    perf_executions: number;
    auto_heals: number;
    daily_goals: number;
    current_streak: number;
    longest_streak: number;
    last_active: Date | null;
    achievements: Achievement[];
    executions_today: number;
    created_at: Date;
}

export const dbAdapter = {
    async getUserByEmail(email: string): Promise<DBUser | null> {
        const res = await dbPool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) return null;
        return res.rows[0];
    },

    async getUserById(id: string): Promise<DBUser | null> {
        const res = await dbPool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        return res.rows[0];
    },

    async createUser(user: { name: string; email: string; passwordHash: string }) {
        const res = await dbPool.query(
            `INSERT INTO users (name, email, password_hash) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [user.name, user.email, user.passwordHash]
        );
        return res.rows[0];
    },

    async updateUserPlan(userId: string, plan: string, customerId?: string) {
        if (customerId) {
            await dbPool.query(
                `UPDATE users SET plan = $1, stripe_customer_id = $2 WHERE id = $3`,
                [plan, customerId, userId]
            );
        } else {
            await dbPool.query(
                `UPDATE users SET plan = $1 WHERE id = $2`,
                [plan, userId]
            );
        }
    },

    async updateUserGamification(userId: string, updates: Partial<UserStats> & { xp?: number, level?: number, achievements?: Achievement[], lastActive?: Date, executionsToday?: number }) {
        // Construct dynamic update query
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.xp !== undefined) { fields.push(`xp = $${idx++}`); values.push(updates.xp); }
        if (updates.level !== undefined) { fields.push(`level = $${idx++}`); values.push(updates.level); }
        if (updates.totalExecutions !== undefined) { fields.push(`total_executions = $${idx++}`); values.push(updates.totalExecutions); }
        if (updates.perfectExecutions !== undefined) { fields.push(`perf_executions = $${idx++}`); values.push(updates.perfectExecutions); }
        if (updates.autoHeals !== undefined) { fields.push(`auto_heals = $${idx++}`); values.push(updates.autoHeals); }
        if (updates.dailyGoalsCompleted !== undefined) { fields.push(`daily_goals = $${idx++}`); values.push(updates.dailyGoalsCompleted); }
        if (updates.currentStreak !== undefined) { fields.push(`current_streak = $${idx++}`); values.push(updates.currentStreak); }
        if (updates.longestStreak !== undefined) { fields.push(`longest_streak = $${idx++}`); values.push(updates.longestStreak); }

        // Handle dates and json
        if (updates.lastActive !== undefined) {
            fields.push(`last_active = $${idx++}`);
            values.push(updates.lastActive);
        }
        if (updates.achievements !== undefined) {
            fields.push(`achievements = $${idx++}`);
            values.push(JSON.stringify(updates.achievements));
        }
        if (updates.executionsToday !== undefined) {
            fields.push(`executions_today = $${idx++}`);
            values.push(updates.executionsToday);
        }

        if (fields.length === 0) return;

        values.push(userId);
        await dbPool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
            values
        );
    },

    async getAgentById(agentId: string) {
        const res = await dbPool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
        if (res.rows.length === 0) return null;
        return res.rows[0];
    },

    async updateAgent(agentId: string, updates: { xp?: number; level?: number }) {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.xp !== undefined) { fields.push(`xp = $${idx++}`); values.push(updates.xp); }
        if (updates.level !== undefined) { fields.push(`level = $${idx++}`); values.push(updates.level); }

        if (fields.length === 0) return;

        values.push(agentId);
        await dbPool.query(
            `UPDATE agents SET ${fields.join(', ')} WHERE id = $${idx}`,
            values
        );
    }
};
