import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { isDisposableEmail, checkRateLimit, isVpnOrProxy } from '@/lib/security';

export async function POST(request: Request) {
    try {
        // 0. Rate Limiting (Basic IP check)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Demasiados intentos de registro. Por favor, intenta de nuevo más tarde.' },
                { status: 429 }
            );
        }

        const { name, email, password, plan } = await request.json();

        // 1. Disposable Email Validation
        if (isDisposableEmail(email)) {
            return NextResponse.json(
                { error: 'El uso de correos temporales o desechables no está permitido. Utiliza un correo real.' },
                { status: 403 }
            );
        }

        // 2. VPN/Proxy Detection (Basic check)
        if (isVpnOrProxy(request)) {
            return NextResponse.json(
                { error: 'Se ha detectado el uso de VPN o Proxy. Para mayor seguridad, desactívalo durante el registro.' },
                { status: 403 }
            );
        }

        // Validation
        if (!name || !email || !password || !plan) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 8 caracteres' },
                { status: 400 }
            );
        }

        const validPlans = ['free', 'essentials', 'professional'];
        if (!validPlans.includes(plan)) {
            return NextResponse.json(
                { error: 'Plan no válido' },
                { status: 400 }
            );
        }

        const client = await dbPool.connect();
        try {
            // Check if user already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                return NextResponse.json(
                    { error: 'Ya existe una cuenta con este email' },
                    { status: 409 }
                );
            }

            // Create new user
            const passwordHash = await bcrypt.hash(password, 12);
            const result = await client.query(
                `INSERT INTO users (name, email, password_hash, plan, role, level, xp)
                 VALUES ($1, $2, $3, $4, 'user', 1, 0)
                 RETURNING id`,
                [name, email.toLowerCase(), passwordHash, plan]
            );

            const userId = result.rows[0].id;

            // Determine if payment is required
            const requiresPayment = plan !== 'free';

            return NextResponse.json(
                {
                    message: 'Cuenta creada exitosamente',
                    userId,
                    plan,
                    requiresPayment,
                    ...(requiresPayment && { checkoutUrl: `/checkout?plan=${plan}&userId=${userId}` })
                },
                { status: 201 }
            );
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
