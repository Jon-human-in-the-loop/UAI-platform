import type { TokenUsage } from './billing';

export function calculateCreditCost(usage: TokenUsage): number {
    const { model, promptTokens, completionTokens } = usage;
    const totalTokens = promptTokens + completionTokens;

    const rates: Record<string, number> = {
        'gpt-4-turbo': 10,
        'claude-3-opus': 15,
        'gemini-pro': 5,
        'gpt-3.5-turbo': 2,
    };

    const rate = rates[model] || 5;
    return Math.ceil((totalTokens / 1000) * rate);
}
