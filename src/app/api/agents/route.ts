import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbPool } from '@/lib/database';
import { MODEL_MAP } from '@/lib/models';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await dbPool.connect();
        try {
            const res = await client.query(
                `SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC`,
                [session.user.id]
            );
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting: máximo 10 creaciones de agentes por usuario por minuto
    const rate = checkRateLimit(`agents-create:${userId}`, 10, 60_000);
    if (!rate.allowed) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Espera unos segundos antes de crear más agentes.' },
            { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds ?? 60) } }
        );
    }

    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Cuerpo de la solicitud inválido: se esperaba JSON.' }, { status: 400 });
        }

        // Validación de inputs
        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        const role = typeof body?.role === 'string' ? body.role.trim() : '';
        const model = typeof body?.model === 'string' ? body.model.trim() : '';
        const system_prompt = typeof body?.system_prompt === 'string' ? body.system_prompt : '';
        const personal_context = typeof body?.personal_context === 'string' ? body.personal_context : '';
        const avatar = typeof body?.avatar === 'string' ? body.avatar : '';

        if (!name || !role || !model) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios: name, role y model son requeridos.' },
                { status: 400 }
            );
        }
        if (name.length > 255) {
            return NextResponse.json(
                { error: 'El nombre del agente no puede superar los 255 caracteres.' },
                { status: 400 }
            );
        }
        if (role.length > 255) {
            return NextResponse.json(
                { error: 'El rol del agente no puede superar los 255 caracteres.' },
                { status: 400 }
            );
        }
        if (!MODEL_MAP.has(model)) {
            return NextResponse.json(
                { error: `El modelo "${model}" no existe en el catálogo de UAI. Elige un modelo válido.` },
                { status: 400 }
            );
        }

        const client = await dbPool.connect();
        try {
            // Verificar que el usuario de la sesión sigue existiendo en la tabla users.
            // Nota: capturamos 22P02 (UUID inválido, p. ej. sesiones legacy de admin
            // por variables de entorno) y lo tratamos como usuario inexistente.
            let userExists = false;
            try {
                const userRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
                userExists = userRes.rows.length > 0;
            } catch (err: any) {
                if (err?.code !== '22P02') throw err;
            }
            if (!userExists) {
                return NextResponse.json(
                    { error: 'Tu sesión ya no es válida: el usuario no existe en la base de datos. Cierra sesión y vuelve a iniciarla.' },
                    { status: 401 }
                );
            }

            const res = await client.query(
                `INSERT INTO agents (user_id, name, role, model, system_prompt, personal_context, avatar)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [userId, name, role, model, system_prompt, personal_context, avatar]
            );
            return NextResponse.json(res.rows[0], { status: 201 });
        } finally {
            client.release();
        }
    } catch (error: any) {
        // Incluimos el código de error de Postgres (ej: 42703 columna inexistente,
        // 23503 violación de FK) para diagnosticar fallos de schema en producción.
        console.error(`Error creating agent [pg_code=${error?.code ?? 'N/A'}]:`, error);
        return NextResponse.json({ error: `Error al crear el agente: ${error.message}` }, { status: 500 });
    }
}

