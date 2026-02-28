export interface UsageMetrics {
    plan: string;
    totalCredits: number;
    usedCredits: number;
    availableCredits: number;
    tokenUsageTotal: number;
    usagePercent: number;
}

export function buildUsageMetrics(user: any): UsageMetrics {
    const totalCredits = Number(user?.total_credits || 0);
    const usedCredits = Number(user?.used_credits || 0);
    const tokenUsageTotal = Number(user?.token_usage_total || 0);
    const availableCredits = Math.max(totalCredits - usedCredits, 0);
    const usagePercent = totalCredits > 0
        ? Math.min(Math.round((usedCredits / totalCredits) * 100), 100)
        : 0;

    return {
        plan: user?.plan || 'free',
        totalCredits,
        usedCredits,
        availableCredits,
        tokenUsageTotal,
        usagePercent,
    };
}
