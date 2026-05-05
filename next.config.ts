import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    // ── Security Headers ───────────────────────────────────────────────────────
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    // Prevent clickjacking
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    // Prevent MIME type sniffing
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    // Force HTTPS for 1 year (including subdomains)
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains; preload",
                    },
                    // Control referrer information
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    // Disable browser features not needed
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), payment=(self)",
                    },
                    // Content Security Policy
                    // Note: unsafe-inline needed for Tailwind inline styles + Framer Motion
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            // Scripts: self + Vercel analytics/insights + Sentry tunnel
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.sentry.io",
                            // Styles: self + inline (Tailwind)
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            // Fonts
                            "font-src 'self' https://fonts.gstatic.com data:",
                            // Images: self + data URIs + common CDNs
                            "img-src 'self' data: blob: https:",
                            // API connections: self + AI providers + Sentry + Vercel
                            "connect-src 'self' https://api.anthropic.com https://api.openai.com https://*.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com wss:",
                            // Media
                            "media-src 'self' blob:",
                            // Workers (needed for Framer Motion)
                            "worker-src 'self' blob:",
                            // Object/embed: none
                            "object-src 'none'",
                            // Base URI: only self
                            "base-uri 'self'",
                            // Form submissions: only self
                            "form-action 'self'",
                            // Sentry tunnel route
                            "frame-ancestors 'none'",
                        ].join("; "),
                    },
                    // X-DNS-Prefetch-Control
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                ],
            },
            // ── API Routes: CORS for agent streaming ───────────────────────────
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "X-Robots-Tag",
                        value: "noindex",
                    },
                ],
            },
        ];
    },

    // ── Webpack: Ignore server-only modules in client bundle ──────────────────
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                pg: false,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

export default withSentryConfig(nextConfig, {
    // Sentry build-time options
    silent: true,
    org: process.env.SENTRY_ORG ?? "uai-platform",
    project: process.env.SENTRY_PROJECT ?? "uai-platform",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Route browser requests through Next.js to bypass ad-blockers
    tunnelRoute: "/monitoring",

    sourcemaps: {
        disable: false,
    },

    webpack: {
        // Remove Sentry debug logging in production
        treeshake: { removeDebugLogging: true },
        // Automatically instrument Vercel Cron Jobs
        automaticVercelMonitors: true,
    }
});
