export type AppRole = 'admin' | 'user';
export type AppPlan = 'free' | 'essentials' | 'advanced' | 'professional';
export type Permission =
    | 'admin:debug'
    | 'marketplace:write'
    | 'billing:checkout'
    | 'billing:portal'
    | 'remote:execute'
    | 'remote:read'
    | 'marketplace:publish'
    | 'channels:manage'
    | 'agents:unlimited'
    | 'scheduler:manage'
    | 'analytics:full'
    | 'memory:full';

// All permissions in the system — admin has every one of them
const ALL_PERMISSIONS: Permission[] = [
    'admin:debug', 'marketplace:write', 'billing:checkout', 'billing:portal',
    'remote:execute', 'remote:read', 'marketplace:publish',
    'channels:manage', 'agents:unlimited', 'scheduler:manage', 'analytics:full', 'memory:full',
];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
    admin: ALL_PERMISSIONS,
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
    // Admin always passes, including any future permissions not yet in the list
    if (role === 'admin') return true;
    return ROLE_PERMISSIONS[role].includes(permission);
}
