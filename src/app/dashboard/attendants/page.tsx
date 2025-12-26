"use client"

import { useState, useEffect } from "react"
import {
    Users, Plus, Building2, Phone, CheckCircle, XCircle, Loader2, RefreshCw,
    Save, X, Edit, Trash2, Shield
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// User/Attendant interface matching database schema
interface User {
    user_id: number
    full_name: string
    username: string
    mobile_no: string | null
    role_id: number
    is_active: boolean
    created_at: string
    role?: {
        role_id: number
        role_name: string
    }
}

interface UserRole {
    role_id: number
    role_name: string
}

interface Station {
    station_id: number
    station_name: string
}

// Attendant Form Modal
function AttendantFormModal({
    user,
    roles,
    stations,
    onSave,
    onClose,
}: {
    user: User | null
    roles: UserRole[]
    stations: Station[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const isEditing = !!user
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        username: user?.username || "",
        mobile_no: user?.mobile_no || "",
        role_id: user?.role_id || 5, // Default to Pump Attendant
        is_active: user?.is_active ?? true,
        password: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.full_name || !formData.username) {
            toast.error("Error", "Name and username are required")
            return
        }
        if (!isEditing && !formData.password) {
            toast.error("Error", "Password is required for new users")
            return
        }
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save"
            toast.error("Error", errorMessage)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-green-600" />}
                            {isEditing ? "✏️ Edit Attendant" : "➕ Add New Attendant"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Full Name *</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Enter full name"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Username *</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                            placeholder="username"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🔒 Password {isEditing && "(leave blank to keep current)"}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={isEditing ? "••••••••" : "Enter password"}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required={!isEditing}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Mobile Number</label>
                        <input
                            type="tel"
                            value={formData.mobile_no}
                            onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                            placeholder="+254712345678"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🎭 Role *</label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                            required
                        >
                            {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">🟢 Active Status</p>
                            <p className="text-sm text-gray-500">Enable or disable user access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> {isEditing ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Attendants Page
export default function AttendantsPage() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<UserRole[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFormModal, setShowFormModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                // Fetch roles
                const { data: rolesData } = await supabase
                    .from("user_roles")
                    .select("*")
                    .order("role_id")
                setRoles(rolesData || [])

                // Fetch stations
                const { data: stationsData } = await supabase
                    .from("stations")
                    .select("station_id, station_name")
                    .eq("is_active", true)
                    .order("station_name")
                setStations(stationsData || [])

                // Fetch users with roles
                const { data: usersData, error } = await supabase
                    .from("users_new")
                    .select("*, role:user_roles(*)")
                    .order("full_name")

                if (error) throw error
                setUsers(usersData || [])
            } else {
                toast.error("Database not configured", "Please configure Supabase")
                setUsers([])
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
            setUsers([])
        }
        setLoading(false)
    }

    const handleSaveUser = async (data: any) => {
        if (!supabase) throw new Error("Database not configured")

        const saveData: any = {
            full_name: data.full_name,
            username: data.username,
            mobile_no: data.mobile_no,
            role_id: data.role_id,
            is_active: data.is_active,
        }

        // Only include password if provided
        if (data.password) {
            saveData.password_hash = data.password // In production, hash this!
        }

        if (selectedUser) {
            // Update existing
            const { error } = await supabase
                .from("users_new")
                .update(saveData)
                .eq("user_id", selectedUser.user_id)

            if (error) throw error
            toast.success("✅ User Updated!", `${data.full_name} has been updated`)
        } else {
            // Create new
            const { error } = await supabase
                .from("users_new")
                .insert([saveData])

            if (error) throw error
            toast.success("✅ User Created!", `${data.full_name} has been added`)
        }

        fetchData()
    }

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Are you sure you want to delete "${user.full_name}"?`)) return

        try {
            if (!supabase) throw new Error("Database not configured")

            const { error } = await supabase
                .from("users_new")
                .delete()
                .eq("user_id", user.user_id)

            if (error) throw error
            toast.success("🗑️ User Deleted", user.full_name)
            fetchData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete"
            toast.error("Error", errorMessage)
        }
    }

    const handleToggleActive = async (user: User) => {
        try {
            if (!supabase) throw new Error("Database not configured")

            const newStatus = !user.is_active
            const { error } = await supabase
                .from("users_new")
                .update({ is_active: newStatus })
                .eq("user_id", user.user_id)

            if (error) throw error
            toast.success(newStatus ? "✅ User Activated" : "⛔ User Deactivated", user.full_name)
            fetchData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update"
            toast.error("Error", errorMessage)
        }
    }

    // Filter users
    const filteredUsers = users.filter((user) =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.mobile_no?.includes(searchQuery)
    )

    // Stats
    const stats = {
        total: users.length,
        active: users.filter((u) => u.is_active).length,
        inactive: users.filter((u) => !u.is_active).length,
    }

    // Role color mapping
    const getRoleColor = (roleId: number) => {
        switch (roleId) {
            case 1: return "bg-purple-100 text-purple-700"
            case 2: return "bg-pink-100 text-pink-700"
            case 3: return "bg-cyan-100 text-cyan-700"
            case 4: return "bg-orange-100 text-orange-700"
            case 5: return "bg-green-100 text-green-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            👥 Attendant Management
                        </h1>
                        <p className="text-gray-500">Manage all pump attendants and staff</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => { setSelectedUser(null); setShowFormModal(true) }}>
                            <Plus className="w-4 h-4" /> Add Attendant
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-sm text-gray-500">Total Staff</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                                    <p className="text-sm text-gray-500">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                                    <p className="text-sm text-gray-500">Inactive</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 Search by name, username, or phone..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </CardContent>
                </Card>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Users className="w-5 h-5 text-purple-600" />
                            📋 All Staff ({filteredUsers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>{users.length === 0 ? "No staff found. Add your first attendant!" : "No staff match your search"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl ${getRoleColor(user.role_id)} flex items-center justify-center font-bold`}>
                                                            {user.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{user.full_name}</p>
                                                            <p className="text-xs text-gray-500">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        {user.mobile_no || "—"}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${getRoleColor(user.role_id)}`}>
                                                        <Shield className="w-3 h-3" />
                                                        {user.role?.role_name || "Unknown"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${user.is_active
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                            }`}
                                                    >
                                                        {user.is_active ? (
                                                            <><CheckCircle className="w-3 h-3" /> Active</>
                                                        ) : (
                                                            <><XCircle className="w-3 h-3" /> Inactive</>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowFormModal(true) }}
                                                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            {showFormModal && (
                <AttendantFormModal
                    user={selectedUser}
                    roles={roles}
                    stations={stations}
                    onSave={handleSaveUser}
                    onClose={() => { setShowFormModal(false); setSelectedUser(null) }}
                />
            )}
        </DashboardLayout>
    )
}
