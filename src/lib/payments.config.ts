export const PAYMENT_PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        features: ['Hasta 3 agentes básicos', '100 ejecuciones/mes', 'Soporte comunitario'],
    },
    essentials: {
        id: 'essentials',
        name: 'Essentials',
        price: 29, // USD
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_ESSENTIALS || '',
        // Mercado Pago often uses preference creation with direct price, but can use pre-defined plan IDs too.
        // We'll use dynamic preference creation for MP to keep it simple initially.
        mpPrice: 29000, // ARS approximate or specific currency logic needed
        features: ['Agentes ilimitados', 'Ejecuciones ilimitadas', 'Modelos SOTA (GPT-4, Claude 3)', 'Soporte prioritario'],
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        price: 79, // USD
        currency: 'USD',
        stripePriceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL || '',
        mpPrice: 79000, // ARS approximate
        features: ['Todo en Essentials', 'API Access', 'Fine-tuning', 'Soporte dedicado 24/7', 'Early access a nuevas features'],
    },
};

export const PAYMENT_PROVIDERS = {
    STRIPE: 'stripe',
    MERCADOPAGO: 'mercadopago',
};
