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
        mpPlanId: 'cf46ed5e87694454bd36d1b59e222fb1', // Plan $15.000 ARS Mensual
        features: ['Orquestación de 2 Agentes', 'Memoria Cognitiva Persistente', 'Prioridad en Razonamiento', 'Capacidad: 50 consultas/hora'],
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 79, // USD
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'price_1T0t1QFCIL2k9dafZf008rAa',
        mpPlanId: 'dd7f8a178d544993bb835425a530a4d4', // Plan $131.000 ARS Mensual
        features: ['Hasta 5 Agentes Coordinados', 'Auto-Sanación Neural', 'Memoria Cognitiva Infinita', 'Soporte Prioritario 24/7'],
    },
};

export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    MERCADOPAGO: 'mercadopago',
};
