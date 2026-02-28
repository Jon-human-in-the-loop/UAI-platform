export type AppRole = 'admin' | 'user';
export type AppPlan = 'free' | 'essentials' | 'advanced' | 'professional';
export type Permission =
    | 'admin:debug'
    | 'marketplace:write'
    | 'billing:checkout'
    | 'billing:portal'
    | 'remote:execute'
    | 'remote:read'
    | 'marketplace:publish';

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
    admin: ['admin:debug', 'marketplace:write', 'billing:checkout', 'billing:portal', 'remote:execute', 'remote:read', 'marketplace:publish'],
    user: ['marketplace:write', 'billing:checkout', 'billing:portal', 'remote:execute', 'remote:read'],
};

export function inferRole(user: any): AppRole {
    if (!user) return 'user';
    if (user.role === 'admin') return 'admin';
    if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) return 'admin';
    return 'user';
}

export function hasPermission(user: any, permission: Permission): boolean {
    const role = inferRole(user);
    return ROLE_PERMISSIONS[role].includes(permission);
}
