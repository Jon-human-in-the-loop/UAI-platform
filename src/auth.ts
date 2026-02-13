import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth config used by both middleware (edge) and route handlers (node).
 * Credential authorization uses dynamic imports since it only runs in Node.js runtime.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "UAI Account",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "tu@email.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) return null;

                // Dynamic imports to avoid edge runtime issues with PG
                const crypto = await import('crypto');
                const { dbAdapter } = await import('@/lib/db-adapter');

                const hashPassword = (pw: string) => crypto.createHash('sha256').update(pw).digest('hex');

                // Check registered users in DB
                try {
                    const user = await dbAdapter.getUserByEmail(email);
                    if (user && user.password_hash === hashPassword(password)) {
                        return { id: user.id, name: user.name, email: user.email };
                    }
                } catch (e) {
                    console.error('Auth DB Error:', e);
                }

                // Fallback: dev admin account (migrar a DB idealmente)
                if (email === "admin@uai.ai" && password === "uai2026") {
                    // Check if admin exists in DB, if not create it on the fly? 
                    // Better just return the static object for now to ensure access
                    return { id: "1", name: "UAI Admin", email: "admin@uai.ai" };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirigir a login
            }
            return true;
        },
    },
    pages: {
        signIn: "/login",
    },
});
