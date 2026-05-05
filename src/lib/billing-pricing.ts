import type { TokenUsage } from './billing';
import { MODEL_MAP } from './models';

export function calculateCreditCost(usage: TokenUsage): number {
    const { model, promptTokens, completionTokens } = usage;
    
    // Look up model rates in the central catalog
    const modelConfig = MODEL_MAP.get(model);
    
    const rateIn = modelConfig?.creditRateIn ?? 5;
    const rateOut = modelConfig?.creditRateOut ?? 15;
    
    const costIn = (promptTokens / 1000) * rateIn;
    const costOut = (completionTokens / 1000) * rateOut;

    return Math.ceil(costIn + costOut);
}
