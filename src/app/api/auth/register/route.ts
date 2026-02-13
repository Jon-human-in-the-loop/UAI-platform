import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Simple file-based user storage (replace with MongoDB/PostgreSQL in production)
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

interface UserRecord {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    plan: string;
    createdAt: string;
    rank: string;
    level: number;
}

async function getUsers(): Promise<UserRecord[]> {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveUsers(users: UserRecord[]) {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
    try {
        const { name, email, password, plan } = await request.json();

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

        const users = await getUsers();

        // Check if user already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return NextResponse.json(
                { error: 'Ya existe una cuenta con este email' },
                { status: 409 }
            );
        }

        const newUser: UserRecord = {
            id: crypto.randomUUID(),
            name,
            email: email.toLowerCase(),
            passwordHash: hashPassword(password),
            plan,
            createdAt: new Date().toISOString(),
            rank: 'Aprendiz Arcano',
            level: 1,
        };

        users.push(newUser);
        await saveUsers(users);

        return NextResponse.json(
            { message: 'Cuenta creada exitosamente', userId: newUser.id, plan: newUser.plan },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
