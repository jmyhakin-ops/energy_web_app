/**
 * Comprehensive Permission System for Role-Based Access Control
 * Matches mobile app implementation exactly
 */

// Permission Categories
export enum PermissionCategory {
    DASHBOARD = 'DASHBOARD',
    SALES = 'SALES',
    REPORTS = 'REPORTS',
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    PUMP_MANAGEMENT = 'PUMP_MANAGEMENT',
    SHIFT_MANAGEMENT = 'SHIFT_MANAGEMENT',
    SETTINGS = 'SETTINGS',
    TRANSACTIONS = 'TRANSACTIONS',
    LICENSING = 'LICENSING',
}

export interface Permission {
    id: string
    name: string
    description: string
    category: PermissionCategory
    icon: string
}

// All available permissions in the app
export const AppPermissions: Record<string, Permission> = {
    // Dashboard Permissions
    VIEW_DASHBOARD: { id: 'view_dashboard', name: 'View Dashboard', description: 'Access admin dashboard with stats', category: PermissionCategory.DASHBOARD, icon: '📊' },
    VIEW_DASHBOARD_STATS: { id: 'view_dashboard_stats', name: 'View Dashboard Stats', description: 'See sales totals and metrics', category: PermissionCategory.DASHBOARD, icon: '📈' },

    // Sales Permissions
    MAKE_SALE: { id: 'make_sale', name: 'Make Sale', description: 'Record new sales transactions', category: PermissionCategory.SALES, icon: '💳' },
    VIEW_SALES: { id: 'view_sales', name: 'View Sales', description: 'See sales history', category: PermissionCategory.SALES, icon: '👁️' },
    CANCEL_SALE: { id: 'cancel_sale', name: 'Cancel Sale', description: 'Cancel pending transactions', category: PermissionCategory.SALES, icon: '❌' },
    REFUND_SALE: { id: 'refund_sale', name: 'Refund Sale', description: 'Process refunds', category: PermissionCategory.SALES, icon: '💰' },

    // Reports Permissions
    VIEW_REPORTS: { id: 'view_reports', name: 'View Reports', description: 'Access sales reports', category: PermissionCategory.REPORTS, icon: '📋' },
    EXPORT_REPORTS: { id: 'export_reports', name: 'Export Reports', description: 'Download report data', category: PermissionCategory.REPORTS, icon: '📤' },
    VIEW_ANALYTICS: { id: 'view_analytics', name: 'View Analytics', description: 'Access charts and trends', category: PermissionCategory.REPORTS, icon: '📉' },

    // User Management Permissions
    VIEW_USERS: { id: 'view_users', name: 'View Users', description: 'See user list', category: PermissionCategory.USER_MANAGEMENT, icon: '👥' },
    CREATE_USER: { id: 'create_user', name: 'Create User', description: 'Add new users', category: PermissionCategory.USER_MANAGEMENT, icon: '➕' },
    EDIT_USER: { id: 'edit_user', name: 'Edit User', description: 'Modify user details', category: PermissionCategory.USER_MANAGEMENT, icon: '✏️' },
    DELETE_USER: { id: 'delete_user', name: 'Delete User', description: 'Remove users', category: PermissionCategory.USER_MANAGEMENT, icon: '🗑️' },
    MANAGE_ATTENDANTS: { id: 'manage_attendants', name: 'Manage Attendants', description: 'Control pump attendants login/logout', category: PermissionCategory.USER_MANAGEMENT, icon: '👷' },
    MANAGE_LOGIN: { id: 'manage_login', name: 'Manage Login', description: 'Control user login access', category: PermissionCategory.USER_MANAGEMENT, icon: '🔐' },

    // Pump Management Permissions
    VIEW_PUMPS: { id: 'view_pumps', name: 'View Pumps', description: 'See pump list', category: PermissionCategory.PUMP_MANAGEMENT, icon: '⛽' },
    CREATE_PUMP: { id: 'create_pump', name: 'Create Pump', description: 'Add new pumps', category: PermissionCategory.PUMP_MANAGEMENT, icon: '➕' },
    EDIT_PUMP: { id: 'edit_pump', name: 'Edit Pump', description: 'Modify pump details', category: PermissionCategory.PUMP_MANAGEMENT, icon: '✏️' },
    DELETE_PUMP: { id: 'delete_pump', name: 'Delete Pump', description: 'Remove pumps', category: PermissionCategory.PUMP_MANAGEMENT, icon: '🗑️' },

    // Shift Management Permissions
    VIEW_SHIFTS: { id: 'view_shifts', name: 'View Shifts', description: 'See shift schedule', category: PermissionCategory.SHIFT_MANAGEMENT, icon: '📅' },
    OPEN_SHIFT: { id: 'open_shift', name: 'Open Shift', description: 'Start a new shift', category: PermissionCategory.SHIFT_MANAGEMENT, icon: '▶️' },
    CLOSE_SHIFT: { id: 'close_shift', name: 'Close Shift', description: 'End a shift', category: PermissionCategory.SHIFT_MANAGEMENT, icon: '⏹️' },
    MANAGE_SHIFT_DEFINITIONS: { id: 'manage_shift_definitions', name: 'Manage Shift Definitions', description: 'Define shift times', category: PermissionCategory.SHIFT_MANAGEMENT, icon: '⏰' },

    // Settings Permissions
    VIEW_SETTINGS: { id: 'view_settings', name: 'View Settings', description: 'Access settings', category: PermissionCategory.SETTINGS, icon: '⚙️' },
    MANAGE_ROLES: { id: 'manage_roles', name: 'Manage Roles', description: 'Configure user roles', category: PermissionCategory.SETTINGS, icon: '🛡️' },
    SYSTEM_CONFIG: { id: 'system_config', name: 'System Configuration', description: 'Advanced settings', category: PermissionCategory.SETTINGS, icon: '🔧' },

    // Transaction Permissions
    VIEW_TRANSACTIONS: { id: 'view_transactions', name: 'View Transactions', description: 'See all transactions', category: PermissionCategory.TRANSACTIONS, icon: '📝' },
    EDIT_TRANSACTION: { id: 'edit_transaction', name: 'Edit Transaction', description: 'Modify transactions', category: PermissionCategory.TRANSACTIONS, icon: '✏️' },

    // Licensing Permissions (SUPERUSER/SUPERADMIN ONLY)
    MANAGE_LICENSES: { id: 'manage_licenses', name: 'Manage Licenses', description: 'Create and manage system licenses', category: PermissionCategory.LICENSING, icon: '🔑' },
    VIEW_LICENSES: { id: 'view_licenses', name: 'View Licenses', description: 'View license information', category: PermissionCategory.LICENSING, icon: '📄' },
    REVOKE_LICENSES: { id: 'revoke_licenses', name: 'Revoke Licenses', description: 'Revoke/suspend licenses', category: PermissionCategory.LICENSING, icon: '🚫' },
}

// Get all permissions as array
export const getAllPermissions = (): Permission[] => Object.values(AppPermissions)

// Get permissions by category
export const getPermissionsByCategory = (category: PermissionCategory): Permission[] => {
    return getAllPermissions().filter(p => p.category === category)
}

// Role Permission Template Interface
export interface RolePermissionTemplate {
    roleId: number
    roleName: string
    description: string
    colorHex: string
    icon: string
    permissions: Set<string>
    isEditable: boolean
    isSystemRole: boolean
}

// Default Role Permissions - matches mobile app exactly
export const DefaultRolePermissions: Record<string, RolePermissionTemplate> = {
    SUPER_ADMIN: {
        roleId: 1,
        roleName: 'Super Admin',
        description: 'Full system access with all permissions including licensing',
        colorHex: '#7C3AED',
        icon: '👑',
        permissions: new Set(getAllPermissions().map(p => p.id)),
        isEditable: false, // Cannot be modified
        isSystemRole: true,
    },
    ADMIN: {
        roleId: 2,
        roleName: 'Admin',
        description: 'Full access except licensing and superuser management',
        colorHex: '#EC4899',
        icon: '🎯',
        permissions: new Set([
            'view_dashboard', 'view_dashboard_stats',
            'make_sale', 'view_sales', 'cancel_sale', 'refund_sale',
            'view_reports', 'export_reports', 'view_analytics',
            'view_users', 'create_user', 'edit_user', 'delete_user', 'manage_attendants', 'manage_login',
            'view_pumps', 'create_pump', 'edit_pump', 'delete_pump',
            'view_shifts', 'open_shift', 'close_shift', 'manage_shift_definitions',
            'view_settings', 'manage_roles', 'system_config',
            'view_transactions', 'edit_transaction',
        ]),
        isEditable: true,
        isSystemRole: true,
    },
    MANAGER: {
        roleId: 3,
        roleName: 'Manager',
        description: 'Full operational control - manage stations, pumps, users, shifts',
        colorHex: '#06B6D4',
        icon: '💼',
        permissions: new Set([
            'view_dashboard', 'view_dashboard_stats',
            'make_sale', 'view_sales', 'cancel_sale',
            'view_reports', 'export_reports', 'view_analytics',
            'view_users', 'create_user', 'edit_user', 'manage_attendants', 'manage_login',
            'view_pumps', 'create_pump', 'edit_pump',
            'view_shifts', 'open_shift', 'close_shift', 'manage_shift_definitions',
            'view_settings',
            'view_transactions',
        ]),
        isEditable: true,
        isSystemRole: true,
    },
    SUPERVISOR: {
        roleId: 4,
        roleName: 'Supervisor',
        description: 'Oversee attendants and shifts - can logout pump attendants',
        colorHex: '#F97316',
        icon: '👔',
        permissions: new Set([
            'view_dashboard', 'view_dashboard_stats',
            'view_sales',
            'view_reports',
            'view_users', 'manage_attendants',
            'view_pumps',
            'view_shifts', 'open_shift', 'close_shift',
            'view_transactions',
        ]),
        isEditable: true,
        isSystemRole: true,
    },
    PUMP_ATTENDANT: {
        roleId: 5,
        roleName: 'Pump Attendant',
        description: 'Record sales only - no dashboard access',
        colorHex: '#22C55E',
        icon: '⛽',
        permissions: new Set([
            'make_sale', 'view_sales',
        ]),
        isEditable: true,
        isSystemRole: true,
    },
}

/**
 * Get permissions for a role by name or ID
 */
export function getPermissionsForRole(roleName?: string | null, roleId: number = 0): Set<string> {
    // First try by role name
    const normalizedName = roleName?.toLowerCase()?.trim()

    switch (normalizedName) {
        case 'super admin':
        case 'superadmin':
        case 'superuser':
            return DefaultRolePermissions.SUPER_ADMIN.permissions
        case 'admin':
            return DefaultRolePermissions.ADMIN.permissions
        case 'manager':
            return DefaultRolePermissions.MANAGER.permissions
        case 'supervisor':
            return DefaultRolePermissions.SUPERVISOR.permissions
        case 'pump attendant':
        case 'attendant':
            return DefaultRolePermissions.PUMP_ATTENDANT.permissions
        default:
            // Fallback to roleId
            switch (roleId) {
                case 1: return DefaultRolePermissions.SUPER_ADMIN.permissions
                case 2: return DefaultRolePermissions.ADMIN.permissions
                case 3: return DefaultRolePermissions.MANAGER.permissions
                case 4: return DefaultRolePermissions.SUPERVISOR.permissions
                case 5: return DefaultRolePermissions.PUMP_ATTENDANT.permissions
                default: return DefaultRolePermissions.PUMP_ATTENDANT.permissions
            }
    }
}

/**
 * Check if a role can perform an action
 */
export function hasPermission(roleName: string | null | undefined, permissionId: string): boolean {
    const permissions = getPermissionsForRole(roleName)
    return permissions.has(permissionId)
}

/**
 * Check if a role is a superuser/superadmin (owner/developer only)
 */
export function isSuperUser(roleName: string | null | undefined): boolean {
    const normalizedName = roleName?.toLowerCase()?.trim()
    return normalizedName === 'super admin' || normalizedName === 'superadmin' || normalizedName === 'superuser'
}

/**
 * Check if the current user can edit another user based on roles
 */
export function canEditUser(currentUserRole: string, targetUserRole: string): boolean {
    const currentIsSuperUser = isSuperUser(currentUserRole)
    const targetIsSuperUser = isSuperUser(targetUserRole)

    // Only super users can edit other super users
    if (targetIsSuperUser && !currentIsSuperUser) {
        return false
    }

    // Super users can edit anyone
    if (currentIsSuperUser) {
        return true
    }

    // Check if current user has edit_user permission
    return hasPermission(currentUserRole, 'edit_user')
}

/**
 * Check if the current user can delete another user based on roles
 */
export function canDeleteUser(currentUserRole: string, targetUserRole: string): boolean {
    const currentIsSuperUser = isSuperUser(currentUserRole)
    const targetIsSuperUser = isSuperUser(targetUserRole)

    // Cannot delete super users unless you are one
    if (targetIsSuperUser && !currentIsSuperUser) {
        return false
    }

    // Even super users shouldn't delete themselves
    // (this check would need more context in real usage)

    // Super users can delete anyone except themselves
    if (currentIsSuperUser) {
        return true
    }

    // Check if current user has delete_user permission
    return hasPermission(currentUserRole, 'delete_user')
}

/**
 * Can manage licensing (ONLY SUPERUSER/SUPERADMIN)
 */
export function canManageLicenses(roleName: string | null | undefined): boolean {
    return isSuperUser(roleName)
}

// Permission Checker singleton for runtime permission checks
export class PermissionChecker {
    private static currentUserRole: string = ''
    private static currentUserPermissions: Set<string> = new Set()

    static setCurrentUser(roleName: string, permissions?: Set<string>) {
        this.currentUserRole = roleName
        this.currentUserPermissions = permissions || getPermissionsForRole(roleName)
    }

    static hasPermission(permissionId: string): boolean {
        return this.currentUserPermissions.has(permissionId)
    }

    static canViewDashboard(): boolean {
        return this.hasPermission('view_dashboard')
    }

    static canMakeSale(): boolean {
        return this.hasPermission('make_sale')
    }

    static canViewReports(): boolean {
        return this.hasPermission('view_reports')
    }

    static canManageUsers(): boolean {
        return this.hasPermission('create_user') || this.hasPermission('edit_user')
    }

    static canManagePumps(): boolean {
        return this.hasPermission('create_pump') || this.hasPermission('edit_pump')
    }

    static canManageShifts(): boolean {
        return this.hasPermission('open_shift') || this.hasPermission('close_shift')
    }

    static canManageSettings(): boolean {
        return this.hasPermission('manage_roles') || this.hasPermission('system_config')
    }

    static canManageLicenses(): boolean {
        return isSuperUser(this.currentUserRole)
    }

    static getCurrentRole(): string {
        return this.currentUserRole
    }

    static isSuperUser(): boolean {
        return isSuperUser(this.currentUserRole)
    }
}
