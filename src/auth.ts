import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

/**
 * Full Auth configuration including Node-only providers (Credentials + DB).
 * This runs in Node.js runtime (API Routes, Server Components).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    providers: [
        Credentials({
            name: "UAI Account",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                const bcrypt = await import('bcryptjs');
                const crypto = await import('crypto');
                const { dbAdapter } = await import('@/lib/db-adapter');
                const { dbPool } = await import('@/lib/database');

                try {
                    const user = await dbAdapter.getUserByEmail(email);
                    if (user) {
                        let isValid = await bcrypt.compare(password, user.password_hash);

                        // Migration escape hatch: support legacy SHA-256 hashes
                        if (!isValid) {
                            const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
                            if (user.password_hash === sha256Hash) {
                                // Re-hash with bcrypt and save
                                const newHash = await bcrypt.hash(password, 12);
                                await dbPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
                                isValid = true;
                                console.log('Auth: Migrated password hash to bcrypt for', email);
                            }
                        }

                        if (isValid) {
                            console.log('Auth Success:', email);
                            return { id: user.id, name: user.name, email: user.email };
                        }
                    }
                    console.warn('Auth Failed: Invalid credentials for', email);
                } catch (e) {
                    console.error('Auth DB Error:', e);
                }

                // Fallback: dev admin account
                if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL &&
                    process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
                    console.log('Auth Success (Admin Fallback):', email);
                    return { id: "admin-1", name: "UAI Admin", email: process.env.ADMIN_EMAIL };
                }

                return null;
            },
        }),
    ],
});
