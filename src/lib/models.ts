/**
 * models.ts — Catálogo centralizado de modelos de IA disponibles en UAI Platform
 *
 * Fuente de verdad para IDs de API, precios, contexto y capacidades.
 * Actualizado a Mayo 2026.
 */

export interface UAIModel {
    id: string;            // ID de API
    name: string;          // Nombre para mostrar
    provider: 'anthropic' | 'openai' | 'google';
    contextInput: number;  // tokens
    contextOutput: number; // tokens
    /** Créditos UAI por 1k tokens de entrada */
    creditRateIn: number;
    /** Créditos UAI por 1k tokens de salida */
    creditRateOut: number;
    /** USD por 1M tokens entrada */
    priceInUSD: number | null;
    /** USD por 1M tokens salida */
    priceOutUSD: number | null;
    tier: 'experimental' | 'premium' | 'balanced' | 'fast';
    description: string;
    capabilities: string[];
    available: boolean;
    isNew?: boolean;
}

// ─── Anthropic / Claude ────────────────────────────────────────────────────────

export const CLAUDE_MODELS: UAIModel[] = [
    {
        id: 'claude-mythos-preview',
        name: 'Claude Mythos Preview',
        provider: 'anthropic',
        contextInput: 1_000_000,
        contextOutput: 128_000,
        creditRateIn: 30,
        creditRateOut: 120,
        priceInUSD: null,
        priceOutUSD: null,
        tier: 'experimental',
        description: 'El modelo más potente y experimental de Anthropic, con capacidades de razonamiento extremas.',
        capabilities: ['razonamiento-extendido', 'codigo', 'agentes', 'analisis-profundo'],
        available: true,
        isNew: true,
    },
    {
        id: 'claude-opus-4-7',
        name: 'Claude Opus 4.7',
        provider: 'anthropic',
        contextInput: 1_000_000,
        contextOutput: 128_000,
        creditRateIn: 20,
        creditRateOut: 100,
        priceInUSD: 5,
        priceOutUSD: 25,
        tier: 'premium',
        description: '+13% en resolución de código complejo vs 4.6. Autonomía de largo horizonte.',
        capabilities: ['codigo', 'agentes', 'razonamiento', 'analisis-profundo', '1m-contexto'],
        available: true,
        isNew: true,
    },
    {
        id: 'claude-opus-4-6',
        name: 'Claude Opus 4.6',
        provider: 'anthropic',
        contextInput: 1_000_000,
        contextOutput: 128_000,
        creditRateIn: 20,
        creditRateOut: 100,
        priceInUSD: 5,
        priceOutUSD: 25,
        tier: 'premium',
        description: 'Primer Opus con ventana de 1M tokens. Ideal para bases de código y documentos legales extensos.',
        capabilities: ['codigo', 'agentes', 'razonamiento', '1m-contexto'],
        available: true,
    },
    {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        provider: 'anthropic',
        contextInput: 1_000_000,
        contextOutput: 64_000,
        creditRateIn: 12,
        creditRateOut: 60,
        priceInUSD: 3,
        priceOutUSD: 15,
        tier: 'balanced',
        description: 'Modelo predeterminado en Claude.ai. Incluye Computer Use y ventana de 1M tokens. Relación precio/rendimiento óptima.',
        capabilities: ['codigo', 'razonamiento', 'escritura', '1m-contexto', 'computer-use'],
        available: true,
        isNew: true,
    },
    {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        contextInput: 200_000,
        contextOutput: 4_096,
        creditRateIn: 4,
        creditRateOut: 20,
        priceInUSD: 1,
        priceOutUSD: 5,
        tier: 'fast',
        description: 'El modelo más rápido de la familia Claude 4. Ideal para clasificación, extracción y tareas de alto volumen.',
        capabilities: ['velocidad', 'economia', 'clasificacion', 'extraccion'],
        available: true,
    },
    {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude Haiku 3.5',
        provider: 'anthropic',
        contextInput: 200_000,
        contextOutput: 8_192,
        creditRateIn: 1,
        creditRateOut: 5,
        priceInUSD: 0.25,
        priceOutUSD: 1.25,
        tier: 'fast',
        description: 'Extremadamente rápido para tareas de alto volumen. El más económico de Anthropic.',
        capabilities: ['velocidad', 'economia', 'clasificacion'],
        available: true,
    },
];

// ─── OpenAI / GPT ──────────────────────────────────────────────────────────────

export const OPENAI_MODELS: UAIModel[] = [
    {
        id: 'gpt-5.5',
        name: 'GPT-5.5',
        provider: 'openai',
        contextInput: 1_000_000,
        contextOutput: 128_000,
        creditRateIn: 20,
        creditRateOut: 120,
        priceInUSD: 5,
        priceOutUSD: 30,
        tier: 'premium',
        description: 'Modelo insignia de OpenAI para razonamiento complejo y codificación. Multimodal con visión.',
        capabilities: ['multimodal', 'codigo', 'razonamiento', 'vision', '1m-contexto'],
        available: true,
        isNew: true,
    },
    {
        id: 'gpt-5.4',
        name: 'GPT-5.4',
        provider: 'openai',
        contextInput: 1_000_000,
        contextOutput: 128_000,
        creditRateIn: 10,
        creditRateOut: 60,
        priceInUSD: 2.5,
        priceOutUSD: 15,
        tier: 'balanced',
        description: 'El más asequible de la familia GPT-5. Ideal para codificación y trabajo profesional con visión.',
        capabilities: ['multimodal', 'codigo', 'razonamiento', 'vision'],
        available: true,
        isNew: true,
    },
    {
        id: 'gpt-5.4-mini',
        name: 'GPT-5.4 Mini',
        provider: 'openai',
        contextInput: 400_000,
        contextOutput: 128_000,
        creditRateIn: 3,
        creditRateOut: 18,
        priceInUSD: 0.75,
        priceOutUSD: 4.5,
        tier: 'fast',
        description: 'El mini más potente de OpenAI. Perfecto para subagentes y computer use.',
        capabilities: ['velocidad', 'codigo', 'multimodal', 'vision'],
        available: true,
        isNew: true,
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        contextInput: 128_000,
        contextOutput: 16_384,
        creditRateIn: 10,
        creditRateOut: 40,
        priceInUSD: 2.5,
        priceOutUSD: 10,
        tier: 'balanced',
        description: 'Modelo multimodal versátil de OpenAI. Sólido para análisis, redacción y ejecución.',
        capabilities: ['multimodal', 'codigo', 'razonamiento', 'vision'],
        available: true,
    },
    {
        id: 'o1',
        name: 'o1 Razonamiento',
        provider: 'openai',
        contextInput: 200_000,
        contextOutput: 100_000,
        creditRateIn: 60,
        creditRateOut: 240,
        priceInUSD: 15,
        priceOutUSD: 60,
        tier: 'premium',
        description: 'Entrenado con RL para razonamiento profundo. Piensa antes de responder.',
        capabilities: ['razonamiento', 'matematicas', 'ciencia', 'codigo'],
        available: true,
    },
    {
        id: 'o3-mini',
        name: 'o3-mini',
        provider: 'openai',
        contextInput: 200_000,
        contextOutput: 100_000,
        creditRateIn: 4,
        creditRateOut: 18,
        priceInUSD: 1.1,
        priceOutUSD: 4.4,
        tier: 'fast',
        description: 'Razonamiento a bajo costo y latencia. Soporta salida estructurada y function calling.',
        capabilities: ['razonamiento', 'velocidad', 'economia', 'estructurado'],
        available: true,
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        contextInput: 128_000,
        contextOutput: 16_384,
        creditRateIn: 3,
        creditRateOut: 12,
        priceInUSD: 0.15,
        priceOutUSD: 0.6,
        tier: 'fast',
        description: 'Versión reducida de GPT-4o. Excelente relación coste-rendimiento para tareas simples.',
        capabilities: ['velocidad', 'economia', 'codigo'],
        available: true,
    },
];

// ─── Google / Gemini ───────────────────────────────────────────────────────────

export const GOOGLE_MODELS: UAIModel[] = [
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        contextInput: 1_000_000,
        contextOutput: 8_192,
        creditRateIn: 2,
        creditRateOut: 8,
        priceInUSD: 0.1,
        priceOutUSD: 0.4,
        tier: 'fast',
        description: 'El modelo más rápido y económico de Google con contexto de 1M tokens.',
        capabilities: ['velocidad', '1m-contexto', 'multimodal'],
        available: true,
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'google',
        contextInput: 1_000_000,
        contextOutput: 8_192,
        creditRateIn: 2,
        creditRateOut: 8,
        priceInUSD: 0.075,
        priceOutUSD: 0.3,
        tier: 'fast',
        description: 'Modelo rápido de Google con ventana de 1M tokens. Perfecto como fallback.',
        capabilities: ['velocidad', '1m-contexto'],
        available: true,
    },
];

// ─── Catálogo completo ─────────────────────────────────────────────────────────

export const ALL_MODELS: UAIModel[] = [
    ...CLAUDE_MODELS,
    ...OPENAI_MODELS,
    ...GOOGLE_MODELS,
];

export const MODEL_MAP = new Map<string, UAIModel>(
    ALL_MODELS.map(m => [m.id, m])
);

/** Modelo por defecto del orquestador */
export const DEFAULT_ORCHESTRATOR_MODEL = 'gpt-4o';

/** Modelo por defecto para agentes nuevos */
export const DEFAULT_AGENT_MODEL = 'gpt-4o';

/** Modelos permitidos por plan */
/** Modelos permitidos por plan */
export const PLAN_ALLOWED_MODELS: Record<string, string[]> = {
    free: [
        'claude-3-5-haiku-20241022',
        'gpt-4o-mini',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
    ],
    essentials: [
        'claude-3-5-haiku-20241022',
        'gpt-4o',
        'gpt-4o-mini',
        'o3-mini',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
    ],
    professional: ALL_MODELS.filter(m => m.available).map(m => m.id),
    admin: ALL_MODELS.filter(m => m.available).map(m => m.id),
};
