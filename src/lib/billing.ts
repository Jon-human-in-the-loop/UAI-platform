import { dbPool } from './database';
import { stripe } from './stripe';

/**
 * Módulo de Facturación Basada en Tokens (Fase 4)
 * Refina la integración con Stripe para créditos basados en consumo real.
 */

export interface TokenUsage {
    userId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
}

/**
 * Calcula el costo en créditos basado en el modelo y tokens usados.
 */
function calculateCreditCost(usage: TokenUsage): number {
    const { model, promptTokens, completionTokens } = usage;
    const totalTokens = promptTokens + completionTokens;
    
    // Tarifas por cada 1000 tokens (simuladas)
    const rates: Record<string, number> = {
        'gpt-4-turbo': 10,
        'claude-3-opus': 15,
        'gemini-pro': 5,
        'gpt-3.5-turbo': 2
    };
    
    const rate = rates[model] || 5;
    return Math.ceil((totalTokens / 1000) * rate);
}

/**
 * Registra el uso de tokens y deduce créditos del usuario.
 */
export async function trackTokenUsage(usage: TokenUsage) {
    console.log(`--- [Billing] Registrando uso para ${usage.userId}: ${usage.model} ---`);
    
    const cost = calculateCreditCost(usage);
    const client = await dbPool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Actualizar uso y créditos en la tabla de usuarios
        await client.query(`
            UPDATE users 
            SET used_credits = used_credits + $1,
                token_usage_total = token_usage_total + $2,
                total_credits = total_credits - $1
            WHERE id = $3
        `, [cost, usage.promptTokens + usage.completionTokens, usage.userId]);
        
        // 2. Aquí se podría disparar un evento a Stripe si el usuario tiene facturación por consumo
        // const user = await client.query('SELECT stripe_customer_id FROM users WHERE id = $1', [usage.userId]);
        // if (user.rows[0]?.stripe_customer_id) {
        //     await stripe.subscriptionItems.createUsageRecord(
        //         'si_...', // ID del ítem de suscripción
        //         { quantity: cost, timestamp: Math.floor(Date.now() / 1000) }
        //     );
        // }
        
        await client.query('COMMIT');
        return { success: true, cost };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("--- [Billing] Error al registrar uso:", error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Crea una sesión de recarga de créditos en Stripe.
 */
export async function createCreditTopupSession(userId: string, amount: number) {
    // Implementación de Checkout Session de Stripe para comprar créditos
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: { name: `Recarga de ${amount} Créditos UAI` },
                unit_amount: amount * 10, // $0.10 por crédito
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        metadata: { userId, amount: amount.toString() }
    });
    
    return session.url;
}
