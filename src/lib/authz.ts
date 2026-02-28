import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbAdapter } from '@/lib/db-adapter';
import { hasPermission, inferRole, type AppRole, type AppPlan, type Permission } from '@/lib/authz-policy';

interface AuthorizeOptions {
    permission?: Permission;
    roles?: AppRole[];
    plans?: AppPlan[];
}


export async function authorize(options: AuthorizeOptions = {}) {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
        };
    }

    const user = await dbAdapter.getUserById(session.user.id);
    if (!user) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 }),
        };
    }

    const role = inferRole(user);

    if (options.roles && !options.roles.includes(role)) {
        console.warn(`[RBAC] Denegado por rol. user=${user.id} role=${role} required=${options.roles.join(',')}`);
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'Prohibido (rol)' }, { status: 403 }),
        };
    }

    if (options.plans && !options.plans.includes(user.plan as AppPlan)) {
        console.warn(`[RBAC] Denegado por plan. user=${user.id} plan=${user.plan} required=${options.plans.join(',')}`);
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'Prohibido (plan)' }, { status: 403 }),
        };
    }

    if (options.permission && !hasPermission(user, options.permission)) {
        console.warn(`[RBAC] Denegado por permiso. user=${user.id} role=${role} permission=${options.permission}`);
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'Prohibido (permiso)' }, { status: 403 }),
        };
    }

    return {
        ok: true as const,
        user,
        role,
    };
}
