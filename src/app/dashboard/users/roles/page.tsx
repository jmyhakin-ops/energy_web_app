"use client"

import { useState, useEffect } from "react"
import {
    Shield, Plus, Edit, Trash2, Save, X, RefreshCw, Loader2,
    Users, CheckCircle, Settings, Eye, Lock
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Types
interface UserRole {
    role_id: number
    role_name: string
    description?: string
    permissions?: string[]
    user_count?: number
}

// Mock roles
const mockRoles: UserRole[] = [
    {
        role_id: 1,
        role_name: "Super Admin",
        description: "Full system access with all permissions",
        permissions: ["all"],
        user_count: 1
    },
    {
        role_id: 2,
        role_name: "Admin",
        description: "Administrative access without system settings",
        permissions: ["users", "stations", "reports", "sales"],
        user_count: 2
    },
    {
        role_id: 3,
        role_name: "Manager",
        description: "Station manager with limited admin access",
        permissions: ["stations", "attendants", "shifts", "sales"],
        user_count: 5
    },
    {
        role_id: 4,
        role_name: "Attendant",
        description: "Pump attendant with basic access",
        permissions: ["sales", "shifts"],
        user_count: 25
    },
    {
        role_id: 5,
        role_name: "Viewer",
        description: "Read-only access to reports and data",
        permissions: ["view_reports"],
        user_count: 3
    },
]

// Role Icons & Colors
const roleStyles: Record<number, { bg: string; text: string; icon: string }> = {
    1: { bg: "bg-purple-100", text: "text-purple-700", icon: "👑" },
    2: { bg: "bg-blue-100", text: "text-blue-700", icon: "🔧" },
    3: { bg: "bg-green-100", text: "text-green-700", icon: "🏢" },
    4: { bg: "bg-orange-100", text: "text-orange-700", icon: "⛽" },
    5: { bg: "bg-gray-100", text: "text-gray-700", icon: "👀" },
}

// Permission options
const allPermissions = [
    { id: "all", label: "🔓 Full Access", description: "All permissions" },
    { id: "users", label: "👥 User Management", description: "Create, edit, delete users" },
    { id: "stations", label: "🏢 Station Management", description: "Manage fuel stations" },
    { id: "pumps", label: "⛽ Pump Management", description: "Manage fuel pumps" },
    { id: "attendants", label: "👷 Attendant Management", description: "Manage staff" },
    { id: "shifts", label: "⏰ Shift Management", description: "Manage work shifts" },
    { id: "sales", label: "💰 Sales & Transactions", description: "View and manage sales" },
    { id: "mpesa", label: "📱 M-Pesa", description: "Process M-Pesa payments" },
    { id: "reports", label: "📊 Reports", description: "Generate and view reports" },
    { id: "settings", label: "⚙️ System Settings", description: "Configure system" },
    { id: "view_reports", label: "👁️ View Reports Only", description: "Read-only reports access" },
]

// Role Form Modal
function RoleFormModal({
    role,
    onSave,
    onClose
}: {
    role: UserRole | null;
    onSave: (role: Partial<UserRole>) => Promise<void>;
    onClose: () => void
}) {
    const isEditing = !!role
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        role_name: role?.role_name || "",
        description: role?.description || "",
        permissions: role?.permissions || [],
    })

    const togglePermission = (permId: string) => {
        if (permId === "all") {
            setFormData({ ...formData, permissions: ["all"] })
            return
        }

        const current = formData.permissions.filter(p => p !== "all")
        if (current.includes(permId)) {
            setFormData({ ...formData, permissions: current.filter(p => p !== permId) })
        } else {
            setFormData({ ...formData, permissions: [...current, permId] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error: any) {
            toast.error("Error", error.message)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-green-600" />}
                            {isEditing ? "✏️ Edit Role" : "➕ Create New Role"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Role Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🎭 Role Name *
                        </label>
                        <input
                            type="text"
                            value={formData.role_name}
                            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                            placeholder="e.g., Station Manager"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📝 Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors resize-none"
                            placeholder="Describe this role's responsibilities..."
                            rows={2}
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            🔐 Permissions
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {allPermissions.map((perm) => (
                                <label
                                    key={perm.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${formData.permissions.includes(perm.id)
                                        ? "bg-blue-50 border-2 border-blue-300"
                                        : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(perm.id) || formData.permissions.includes("all")}
                                        onChange={() => togglePermission(perm.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        disabled={perm.id !== "all" && formData.permissions.includes("all")}
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{perm.label}</p>
                                        <p className="text-xs text-gray-500">{perm.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> {isEditing ? "Update Role" : "Create Role"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Roles Page
export default function RolesPage() {
    const [roles, setRoles] = useState<UserRole[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data } = await supabase
                    .from("user_roles")
                    .select("*")
                    .order("role_id")

                // Get user counts
                const { data: userCounts } = await supabase
                    .from("users_new")
                    .select("role_id")

                const countMap = userCounts?.reduce((acc, u) => {
                    acc[u.role_id] = (acc[u.role_id] || 0) + 1
                    return acc
                }, {} as Record<number, number>) || {}

                setRoles((data || mockRoles).map(r => ({
                    ...r,
                    user_count: countMap[r.role_id] || 0
                })))
            } else {
                setRoles(mockRoles)
            }
        } catch (error) {
            console.error(error)
            setRoles(mockRoles)
        }
        setLoading(false)
    }

    const handleSaveRole = async (roleData: Partial<UserRole>) => {
        if (selectedRole) {
            // Update
            if (isSupabaseConfigured() && supabase) {
                const { error } = await supabase
                    .from("user_roles")
                    .update({ role_name: roleData.role_name })
                    .eq("role_id", selectedRole.role_id)
                if (error) throw error
            }
            toast.success("✅ Role Updated!", roleData.role_name)
        } else {
            // Create
            if (isSupabaseConfigured() && supabase) {
                const { error } = await supabase
                    .from("user_roles")
                    .insert({ role_name: roleData.role_name })
                if (error) throw error
            }
            toast.success("✅ Role Created!", roleData.role_name)
        }
        fetchRoles()
    }

    const handleDeleteRole = async (role: UserRole) => {
        if (role.user_count && role.user_count > 0) {
            toast.error("Cannot Delete", `${role.user_count} users are using this role`)
            return
        }
        if (!confirm(`Are you sure you want to delete the "${role.role_name}" role?`)) return

        if (isSupabaseConfigured() && supabase) {
            await supabase
                .from("user_roles")
                .delete()
                .eq("role_id", role.role_id)
        }
        toast.success("🗑️ Role Deleted", role.role_name)
        fetchRoles()
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            🎭 User Roles & Permissions
                        </h1>
                        <p className="text-gray-500">Define access levels and permissions</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchRoles}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => { setSelectedRole(null); setShowModal(true) }}>
                            <Plus className="w-4 h-4" /> Add Role
                        </Button>
                    </div>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map((role) => {
                            const style = roleStyles[role.role_id] || roleStyles[5]
                            return (
                                <Card key={role.role_id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center text-2xl`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => { setSelectedRole(role); setShowModal(true) }}
                                                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role)}
                                                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                    disabled={(role.user_count || 0) > 0}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{role.role_name}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{role.description || "No description"}</p>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span className="font-semibold">{role.user_count || 0}</span> users
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Lock className="w-4 h-4" />
                                                <span className="font-semibold">{role.permissions?.length || 0}</span> permissions
                                            </div>
                                        </div>

                                        {/* Permissions Preview */}
                                        {role.permissions && role.permissions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 3).map(p => (
                                                    <span key={p} className={`text-xs px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
                                                        {p === "all" ? "Full Access" : p}
                                                    </span>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                                                        +{role.permissions.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Quick Reference */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            📋 Permission Reference
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allPermissions.map(perm => (
                                <div key={perm.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{perm.label}</p>
                                        <p className="text-xs text-gray-500">{perm.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            {showModal && (
                <RoleFormModal
                    role={selectedRole}
                    onSave={handleSaveRole}
                    onClose={() => { setShowModal(false); setSelectedRole(null) }}
                />
            )}
        </DashboardLayout>
    )
}
