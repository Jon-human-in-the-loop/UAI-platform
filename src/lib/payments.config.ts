export const PAYMENT_PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        features: ['Orquestación de 1 Agente', 'Modelos Ultra-Rápidos', 'Límite: 5 consultas/hora', 'Comunidad Open-Source'],
    },
    essentials: {
        id: 'essentials',
        name: 'Essentials',
        price: 9, // USD
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_ESSENTIALS || 'price_1T0t1QFCIL2k9dafVkXIUzmw',
        // Mercado Pago often uses preference creation with direct price, but can use pre-defined plan IDs too.
        // We'll use dynamic preference creation for MP to keep it simple initially.
        mpPrice: 9000, // ARS approximate or specific currency logic needed
        features: ['Orquestación de 2 Agentes', 'Memoria Cognitiva Persistente', 'Prioridad en Razonamiento', 'Capacidad: 50 consultas/hora'],
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 79, // USD
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'price_1T0t1QFCIL2k9dafZf008rAa',
        mpPrice: 79000, // ARS approximate
        features: ['Hasta 5 Agentes Coordinados', 'Auto-Sanación Neural', 'Memoria Cognitiva Infinita', 'Soporte Prioritario 24/7'],
    },
};

export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    MERCADOPAGO: 'mercadopago',
};
