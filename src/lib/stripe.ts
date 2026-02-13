import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.warn("⚠️ STRIPE_SECRET_KEY no está definida. La integración de Stripe no funcionará.");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_dummy_test_key_placeholder', {
    apiVersion: '2026-01-28.clover' as any, // Cast to any to avoid strict typing issues if SDK types lag behind
    typescript: true,
});
