export const PAYMENT_PLANS = {
    free: {
        id: 'free',
        name: 'UAI Free',
        price: 0,
        currency: 'USD',
        features: ['Orquestación de 1 Agente', 'Modelos Ultra-Rápidos', 'Límite: 5 consultas/hora', 'Comunidad Open-Source'],
    },
    essentials: {
        id: 'essentials',
        name: 'Essentials',
        price: 9, // Sincronizado con Landing Oficial
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_ESSENTIALS || 'price_1T0t1QFCIL2k9dafVkXIUzmw',
        mpPlanId: 'cf46ed5e87694454bd36d1b59e222fb1',
        features: ['Orquestación de 2 Agentes', 'Memoria Cognitiva Persistente', 'Prioridad en Razonamiento', 'Tokens a coste directo'],
    },
    advanced: {
        id: 'advanced',
        name: 'Advanced',
        price: 29, // Sincronizado con Landing Oficial
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_ADVANCED || 'price_1T0t1QFCIL2k9dafAdvanced',
        mpPlanId: 'advanced_mp_plan_id',
        features: ['Hasta 5 Agentes Coordinados', 'Soporte Multi-Canal Full', 'Analítica ROI Avanzada', 'Prioridad de Cómputo Alta'],
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 79, // Sincronizado con Landing Oficial (79 según la landing para el plan más alto)
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || 'price_1T0t1QFCIL2k9dafZf008rAa',
        mpPlanId: 'dd7f8a178d544993bb835425a530a4d4',
        features: ['Agentes Ilimitados', 'Auto-Sanación Neural', 'Memoria Cognitiva Infinita', 'Soporte Prioritario 24/7'],
    },
};

export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    MERCADOPAGO: 'mercadopago',
};
