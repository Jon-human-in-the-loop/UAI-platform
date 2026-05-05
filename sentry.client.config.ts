import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance Monitoring — capture 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay — 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        Sentry.replayIntegration({
            // Mask sensitive fields in replays
            maskAllText: false,
            blockAllMedia: false,
        }),
    ],

    debug: false,
    environment: process.env.NODE_ENV,
});
