/**
 * verify-env.ts — Pre-deploy environment variable validation
 *
 * Run before deploying to catch missing secrets early.
 * Usage: npx tsx scripts/verify-env.ts
 *
 * Exit code 1 if any REQUIRED variable is missing.
 * Exit code 0 if all required vars are present (optional vars emit warnings).
 */

interface EnvVar {
    name: string;
    required: boolean;
    description: string;
    group: string;
}

const ENV_VARS: EnvVar[] = [
    // ── Auth ──────────────────────────────────────────────────────────────────
    { name: 'AUTH_SECRET',          required: true,  description: 'NextAuth signing secret (min 32 chars)', group: 'Auth' },
    { name: 'AUTH_TRUST_HOST',      required: true,  description: 'Set to "true" on Vercel', group: 'Auth' },

    // ── Database ──────────────────────────────────────────────────────────────
    { name: 'DATABASE_URL',         required: true,  description: 'Neon PostgreSQL connection string (pooler endpoint)', group: 'Database' },

    // ── AI Models ─────────────────────────────────────────────────────────────
    { name: 'ANTHROPIC_API_KEY',    required: true,  description: 'Claude 3.7 — primary orchestration model', group: 'AI' },
    { name: 'OPENAI_API_KEY',       required: true,  description: 'GPT-4o (analyzer/executor) + embeddings (text-embedding-3-small)', group: 'AI' },
    { name: 'GOOGLE_API_KEY',       required: false, description: 'Gemini 1.5 Flash — fast fallback model', group: 'AI' },

    // ── Monitoring ────────────────────────────────────────────────────────────
    { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, description: 'Sentry error tracking DSN', group: 'Monitoring' },
    { name: 'SENTRY_AUTH_TOKEN',    required: false, description: 'Sentry source maps upload token', group: 'Monitoring' },
    { name: 'SENTRY_ORG',           required: false, description: 'Sentry organization slug', group: 'Monitoring' },
    { name: 'SENTRY_PROJECT',       required: false, description: 'Sentry project slug', group: 'Monitoring' },

    // ── Payments ──────────────────────────────────────────────────────────────
    { name: 'STRIPE_SECRET_KEY',         required: false, description: 'Stripe secret key (sk_live_...)', group: 'Payments' },
    { name: 'STRIPE_WEBHOOK_SECRET',     required: false, description: 'Stripe webhook signing secret (whsec_...)', group: 'Payments' },
    { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', required: false, description: 'Stripe publishable key (pk_live_...)', group: 'Payments' },
    { name: 'MERCADOPAGO_ACCESS_TOKEN',  required: false, description: 'MercadoPago access token', group: 'Payments' },

    // ── Communications ────────────────────────────────────────────────────────
    { name: 'TWILIO_ACCOUNT_SID',   required: false, description: 'Twilio account SID (WhatsApp multi-channel)', group: 'Comms' },
    { name: 'TWILIO_AUTH_TOKEN',    required: false, description: 'Twilio auth token', group: 'Comms' },
    { name: 'TWILIO_PHONE_NUMBER',  required: false, description: 'Twilio WhatsApp phone number', group: 'Comms' },

    // ── Admin ─────────────────────────────────────────────────────────────────
    { name: 'ADMIN_EMAIL',          required: false, description: 'Seed admin account email', group: 'Admin' },
    { name: 'ADMIN_PASSWORD',       required: false, description: 'Seed admin account password', group: 'Admin' },
    { name: 'SETUP_SECRET',         required: false, description: 'Secret for /api/setup endpoint', group: 'Admin' },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

const RED   = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD  = '\x1b[1m';
const RESET = '\x1b[0m';

let hasErrors = false;
let hasWarnings = false;

const byGroup = ENV_VARS.reduce<Record<string, EnvVar[]>>((acc, v) => {
    (acc[v.group] ??= []).push(v);
    return acc;
}, {});

console.log(`\n${BOLD}🔍 UAI Platform — Environment Verification${RESET}\n`);

for (const [group, vars] of Object.entries(byGroup)) {
    console.log(`${BOLD}${group}${RESET}`);

    for (const v of vars) {
        const value = process.env[v.name];
        const present = !!value && value.length > 0;

        if (present) {
            const preview = value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : '***';
            console.log(`  ${GREEN}✓${RESET} ${v.name} ${GREEN}(${preview})${RESET}`);
        } else if (v.required) {
            console.log(`  ${RED}✗ MISSING (REQUIRED): ${v.name}${RESET}`);
            console.log(`    ${RED}→ ${v.description}${RESET}`);
            hasErrors = true;
        } else {
            console.log(`  ${YELLOW}⚠ missing (optional): ${v.name}${RESET}`);
            console.log(`    ${YELLOW}→ ${v.description}${RESET}`);
            hasWarnings = true;
        }
    }

    console.log('');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

if (hasErrors) {
    console.log(`${RED}${BOLD}❌ Verification FAILED — fix required variables before deploying.${RESET}\n`);
    process.exit(1);
} else if (hasWarnings) {
    console.log(`${YELLOW}${BOLD}⚠  Verification passed with warnings — optional features may be disabled.${RESET}\n`);
    process.exit(0);
} else {
    console.log(`${GREEN}${BOLD}✅ All environment variables verified successfully.${RESET}\n`);
    process.exit(0);
}
