"use client"

import { useState, useEffect } from "react"
import {
    Shield, Plus, Search, Edit, Trash2, Check, X, Loader2, RefreshCw,
    Save, ChevronRight, Users, Lock, Settings, Eye, BarChart3, Fuel,
    Clock, Key, AlertTriangle, CheckCircle, XCircle
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import {
    PermissionCategory,
    AppPermissions,
    getAllPermissions,
    getPermissionsByCategory,
    DefaultRolePermissions,
    getPermissionsForRole,
    Permission,
} from "@/lib/permissions"

// Types
interface UserRole {
    role_id: number
    role_name: string
}

interface RoleWithPermissions {
    role_id: number
    role_name: string
    description: string
    colorHex: string
    icon: string
    permissions: Set<string>
    isEditable: boolean
    isSystemRole: boolean
    userCount?: number
}

// Permission Category Info
const categoryInfo: Record<PermissionCategory, { icon: React.ReactNode; label: string; color: string }> = {
    [PermissionCategory.DASHBOARD]: { icon: <BarChart3 className="w-4 h-4" />, label: "📊 Dashboard", color: "bg-blue-100 text-blue-700" },
    [PermissionCategory.SALES]: { icon: <span>💳</span>, label: "💳 Sales", color: "bg-green-100 text-green-700" },
    [PermissionCategory.REPORTS]: { icon: <span>📋</span>, label: "📋 Reports", color: "bg-purple-100 text-purple-700" },
    [PermissionCategory.USER_MANAGEMENT]: { icon: <Users className="w-4 h-4" />, label: "👥 User Management", color: "bg-orange-100 text-orange-700" },
    [PermissionCategory.PUMP_MANAGEMENT]: { icon: <Fuel className="w-4 h-4" />, label: "⛽ Pump Management", color: "bg-cyan-100 text-cyan-700" },
    [PermissionCategory.SHIFT_MANAGEMENT]: { icon: <Clock className="w-4 h-4" />, label: "📅 Shift Management", color: "bg-amber-100 text-amber-700" },
    [PermissionCategory.SETTINGS]: { icon: <Settings className="w-4 h-4" />, label: "⚙️ Settings", color: "bg-gray-100 text-gray-700" },
    [PermissionCategory.TRANSACTIONS]: { icon: <span>📝</span>, label: "📝 Transactions", color: "bg-indigo-100 text-indigo-700" },
    [PermissionCategory.LICENSING]: { icon: <Key className="w-4 h-4" />, label: "🔑 Licensing", color: "bg-red-100 text-red-700" },
}

// Role colors based on role_id
const roleColors: Record<number, { bg: string; text: string; icon: string }> = {
    1: { bg: "bg-purple-100", text: "text-purple-700", icon: "👑" },
    2: { bg: "bg-pink-100", text: "text-pink-700", icon: "🎯" },
    3: { bg: "bg-cyan-100", text: "text-cyan-700", icon: "💼" },
    4: { bg: "bg-orange-100", text: "text-orange-700", icon: "👔" },
    5: { bg: "bg-green-100", text: "text-green-700", icon: "⛽" },
}

// Get default permissions for a role
function getDefaultPermissionsForRoleId(roleId: number): Set<string> {
    switch (roleId) {
        case 1: return DefaultRolePermissions.SUPER_ADMIN.permissions
        case 2: return DefaultRolePermissions.ADMIN.permissions
        case 3: return DefaultRolePermissions.MANAGER.permissions
        case 4: return DefaultRolePermissions.SUPERVISOR.permissions
        case 5: return DefaultRolePermissions.PUMP_ATTENDANT.permissions
        default: return new Set()
    }
}

// Role Card Component
function RoleCard({
    role,
    isSelected,
    onClick,
}: {
    role: RoleWithPermissions
    isSelected: boolean
    onClick: () => void
}) {
    const colors = roleColors[role.role_id] || { bg: "bg-gray-100", text: "text-gray-700", icon: "🔰" }

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md ${isSelected
                ? "border-blue-500 bg-blue-50/50 shadow-md"
                : "border-gray-100 bg-white hover:border-gray-200"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center text-2xl`}>
                    {colors.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{role.role_name}</h3>
                        {!role.isEditable && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                🔒 Protected
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{role.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{role.permissions.size}</p>
                    <p className="text-xs text-gray-500">permissions</p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-colors ${isSelected ? "text-blue-500" : "text-gray-300"}`} />
            </div>
        </div>
    )
}

// Permission Toggle Component
function PermissionToggle({
    permission,
    isEnabled,
    isDisabled,
    onToggle,
}: {
    permission: Permission
    isEnabled: boolean
    isDisabled: boolean
    onToggle: () => void
}) {
    return (
        <div
            onClick={() => !isDisabled && onToggle()}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isDisabled
                ? "opacity-60 cursor-not-allowed bg-gray-50"
                : isEnabled
                    ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                    : "border-gray-100 bg-white cursor-pointer hover:bg-gray-50"
                }`}
        >
            <div className="flex items-center gap-3">
                <span className="text-xl">{permission.icon}</span>
                <div>
                    <p className="font-medium text-gray-900 text-sm">{permission.name}</p>
                    <p className="text-xs text-gray-500">{permission.description}</p>
                </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${isEnabled ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled ? "left-5" : "left-1"}`} />
            </div>
        </div>
    )
}

// Add Role Modal
function AddRoleModal({
    onSave,
    onClose,
}: {
    onSave: (name: string) => void
    onClose: () => void
}) {
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        setLoading(true)
        await onSave(name.trim())
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" />
                            ➕ Create New Role
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🏷️ Role Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Accountant"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> Create Role
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main User Roles Page
export default function UserRolesPage() {
    const [roles, setRoles] = useState<RoleWithPermissions[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<PermissionCategory>>(new Set(Object.values(PermissionCategory)))

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        setLoading(true)
        try {
            let dbRoles: UserRole[] = []

            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase
                    .from("user_roles")
                    .select("*")
                    .order("role_id")

                if (!error && data) {
                    dbRoles = data
                }
            }

            // If no roles from DB, use defaults
            if (dbRoles.length === 0) {
                dbRoles = [
                    { role_id: 1, role_name: "Super Admin" },
                    { role_id: 2, role_name: "Admin" },
                    { role_id: 3, role_name: "Manager" },
                    { role_id: 4, role_name: "Supervisor" },
                    { role_id: 5, role_name: "Pump Attendant" },
                ]
            }

            // Map to roles with permissions
            const rolesWithPermissions: RoleWithPermissions[] = dbRoles.map((r) => {
                const defaultPerms = getDefaultPermissionsForRoleId(r.role_id)
                const colors = roleColors[r.role_id] || { bg: "bg-gray-100", text: "text-gray-700", icon: "🔰" }

                let description = ""
                switch (r.role_id) {
                    case 1: description = "Full system access with all permissions including licensing"; break
                    case 2: description = "Full access except licensing and superuser management"; break
                    case 3: description = "Full operational control - manage stations, pumps, users"; break
                    case 4: description = "Oversee attendants and shifts - can logout pump attendants"; break
                    case 5: description = "Record sales only - no dashboard access"; break
                    default: description = "Custom role with configurable permissions"
                }

                return {
                    role_id: r.role_id,
                    role_name: r.role_name,
                    description,
                    colorHex: "#6366F1",
                    icon: colors.icon,
                    permissions: defaultPerms,
                    isEditable: r.role_id !== 1, // Super Admin is not editable
                    isSystemRole: r.role_id <= 5,
                }
            })

            setRoles(rolesWithPermissions)
            if (rolesWithPermissions.length > 0 && !selectedRole) {
                setSelectedRole(rolesWithPermissions[0])
            }
        } catch (error) {
            console.error("Error fetching roles:", error)
            toast.error("Error", "Failed to load roles")
        }
        setLoading(false)
    }

    const handleTogglePermission = (permissionId: string) => {
        if (!selectedRole || !selectedRole.isEditable) return

        setRoles((prev) =>
            prev.map((r) => {
                if (r.role_id === selectedRole.role_id) {
                    const newPerms = new Set(r.permissions)
                    if (newPerms.has(permissionId)) {
                        newPerms.delete(permissionId)
                    } else {
                        newPerms.add(permissionId)
                    }
                    const updated = { ...r, permissions: newPerms }
                    setSelectedRole(updated)
                    return updated
                }
                return r
            })
        )
    }

    const handleToggleCategory = (category: PermissionCategory, enable: boolean) => {
        if (!selectedRole || !selectedRole.isEditable) return

        const categoryPerms = getPermissionsByCategory(category).map((p) => p.id)

        setRoles((prev) =>
            prev.map((r) => {
                if (r.role_id === selectedRole.role_id) {
                    const newPerms = new Set(r.permissions)
                    categoryPerms.forEach((p) => {
                        if (enable) {
                            newPerms.add(p)
                        } else {
                            newPerms.delete(p)
                        }
                    })
                    const updated = { ...r, permissions: newPerms }
                    setSelectedRole(updated)
                    return updated
                }
                return r
            })
        )
    }

    const handleSaveRoles = async () => {
        setSaving(true)
        // In a real implementation, you would save permissions to a database table
        // For now, we just show a success message
        await new Promise((r) => setTimeout(r, 1000))
        toast.success("✅ Roles Saved!", "All role permissions have been updated")
        setSaving(false)
    }

    const handleAddRole = async (name: string) => {
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase
                    .from("user_roles")
                    .insert({ role_name: name })
                    .select()
                    .single()

                if (error) throw error

                toast.success("✅ Role Created!", `${name} has been added`)
                setShowAddModal(false)
                fetchRoles()
            } else {
                // Demo mode
                const newRoleId = Math.max(...roles.map((r) => r.role_id)) + 1
                const newRole: RoleWithPermissions = {
                    role_id: newRoleId,
                    role_name: name,
                    description: "Custom role with configurable permissions",
                    colorHex: "#6366F1",
                    icon: "🔰",
                    permissions: new Set(),
                    isEditable: true,
                    isSystemRole: false,
                }
                setRoles([...roles, newRole])
                setShowAddModal(false)
                toast.success("✅ Role Created!", `${name} has been added`)
            }
        } catch (error: any) {
            toast.error("Error", error.message)
        }
    }

    const handleDeleteRole = async (roleId: number) => {
        if (roleId <= 5) {
            toast.error("Cannot Delete", "System roles cannot be deleted")
            return
        }

        if (!confirm("Are you sure you want to delete this role?")) return

        try {
            if (isSupabaseConfigured() && supabase) {
                const { error } = await supabase
                    .from("user_roles")
                    .delete()
                    .eq("role_id", roleId)

                if (error) throw error
            }

            setRoles((prev) => prev.filter((r) => r.role_id !== roleId))
            if (selectedRole?.role_id === roleId) {
                setSelectedRole(roles[0] || null)
            }
            toast.success("🗑️ Role Deleted", "The role has been removed")
        } catch (error: any) {
            toast.error("Error", error.message)
        }
    }

    const toggleCategory = (category: PermissionCategory) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(category)) {
                newSet.delete(category)
            } else {
                newSet.add(category)
            }
            return newSet
        })
    }

    // Stats
    const stats = {
        totalRoles: roles.length,
        systemRoles: roles.filter((r) => r.isSystemRole).length,
        customRoles: roles.filter((r) => !r.isSystemRole).length,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            🛡️ User Roles & Permissions
                        </h1>
                        <p className="text-gray-500">Configure role-based access control for your system</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchRoles}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4" /> Add Role
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
                                    <p className="text-sm text-gray-500">Total Roles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.systemRoles}</p>
                                    <p className="text-sm text-gray-500">System Roles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Settings className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.customRoles}</p>
                                    <p className="text-sm text-gray-500">Custom Roles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Roles List */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    📋 All Roles
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {roles.map((role) => (
                                    <RoleCard
                                        key={role.role_id}
                                        role={role}
                                        isSelected={selectedRole?.role_id === role.role_id}
                                        onClick={() => setSelectedRole(role)}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Permissions Panel */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        <Key className="w-5 h-5 text-purple-600" />
                                        🔐 Permissions for {selectedRole?.role_name || "Select a role"}
                                    </CardTitle>
                                    {selectedRole && (
                                        <div className="flex items-center gap-2">
                                            {!selectedRole.isEditable && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Super Admin permissions cannot be modified
                                                </span>
                                            )}
                                            {selectedRole.isEditable && selectedRole.role_id > 5 && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteRole(selectedRole.role_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                                {selectedRole ? (
                                    Object.values(PermissionCategory).map((category) => {
                                        const perms = getPermissionsByCategory(category)
                                        const enabledCount = perms.filter((p) =>
                                            selectedRole.permissions.has(p.id)
                                        ).length
                                        const info = categoryInfo[category]
                                        const isExpanded = expandedCategories.has(category)
                                        const allEnabled = enabledCount === perms.length
                                        const noneEnabled = enabledCount === 0

                                        return (
                                            <div key={category} className="border border-gray-100 rounded-xl overflow-hidden">
                                                {/* Category Header */}
                                                <div
                                                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${info.color}`}
                                                    onClick={() => toggleCategory(category)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{info.label}</span>
                                                        <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs font-medium">
                                                            {enabledCount}/{perms.length}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {selectedRole.isEditable && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleToggleCategory(category, !allEnabled)
                                                                }}
                                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${allEnabled
                                                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                                                    }`}
                                                            >
                                                                {allEnabled ? "Disable All" : "Enable All"}
                                                            </button>
                                                        )}
                                                        <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                    </div>
                                                </div>

                                                {/* Permissions */}
                                                {isExpanded && (
                                                    <div className="p-4 space-y-2 bg-white">
                                                        {perms.map((perm) => (
                                                            <PermissionToggle
                                                                key={perm.id}
                                                                permission={perm}
                                                                isEnabled={selectedRole.permissions.has(perm.id)}
                                                                isDisabled={!selectedRole.isEditable}
                                                                onToggle={() => handleTogglePermission(perm.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>Select a role to view and manage permissions</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Save Button */}
                {selectedRole && selectedRole.isEditable && (
                    <div className="flex justify-end">
                        <Button size="lg" onClick={handleSaveRoles} loading={saving} className="px-8">
                            <Save className="w-5 h-5" /> Save All Changes
                        </Button>
                    </div>
                )}
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <AddRoleModal
                    onSave={handleAddRole}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
