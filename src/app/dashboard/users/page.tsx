"use client"

import { useState, useEffect } from "react"
import {
    Users, UserPlus, Search, Edit, Trash2, Shield, Phone, Mail, KeyRound,
    CheckCircle, XCircle, Loader2, Eye, EyeOff, Save, X, RefreshCw,
    MoreVertical, UserCheck, UserX, BadgeCheck, Smartphone, Send
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
}

interface User {
    user_id: number
    full_name: string
    username: string
    mobile_no: string | null
    role_id: number
    is_active: boolean
    created_at: string
    role?: UserRole
}

// Mock data for demo
const mockRoles: UserRole[] = [
    { role_id: 1, role_name: "Super Admin" },
    { role_id: 2, role_name: "Admin" },
    { role_id: 3, role_name: "Manager" },
    { role_id: 4, role_name: "Attendant" },
    { role_id: 5, role_name: "Viewer" },
]

const mockUsers: User[] = [
    { user_id: 1, full_name: "Jimhawkins Korir", username: "superadmin", mobile_no: "+254720316175", role_id: 1, is_active: true, created_at: "2024-01-01" },
    { user_id: 2, full_name: "John Kamau", username: "john.manager", mobile_no: "+254712345678", role_id: 3, is_active: true, created_at: "2024-06-15" },
    { user_id: 3, full_name: "Mary Wanjiku", username: "mary.admin", mobile_no: "+254723456789", role_id: 2, is_active: true, created_at: "2024-03-20" },
    { user_id: 4, full_name: "Peter Ochieng", username: "peter.attendant", mobile_no: "+254734567890", role_id: 4, is_active: false, created_at: "2024-08-10" },
]

// OTP Component
function OtpVerification({ phone, onVerified, onCancel }: { phone: string; onVerified: () => void; onCancel: () => void }) {
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [timer, setTimer] = useState(0)
    const [generatedOtp, setGeneratedOtp] = useState("")

    const sendOtp = async () => {
        setLoading(true)
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
        setGeneratedOtp(newOtp)

        // Simulate SMS send (replace with actual API call)
        await new Promise(r => setTimeout(r, 1000))
        console.log(`📱 OTP ${newOtp} sent to ${phone}`)

        setSent(true)
        setTimer(60)
        toast.success("📱 OTP Sent!", `Verification code sent to ${phone}`)
        setLoading(false)

        // Timer countdown
        const interval = setInterval(() => {
            setTimer(t => {
                if (t <= 1) { clearInterval(interval); return 0 }
                return t - 1
            })
        }, 1000)
    }

    const verifyOtp = async () => {
        setLoading(true)
        await new Promise(r => setTimeout(r, 500))

        if (otp === generatedOtp) {
            toast.success("✅ Phone Verified!", "Phone number is valid")
            onVerified()
        } else {
            toast.error("❌ Invalid OTP", "Please check and try again")
        }
        setLoading(false)
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-blue-700">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">📱 Phone Verification Required</span>
            </div>

            {!sent ? (
                <div className="flex gap-2">
                    <Button onClick={sendOtp} loading={loading} className="flex-1">
                        <Send className="w-4 h-4" /> Send OTP to {phone}
                    </Button>
                    <Button variant="outline" onClick={onCancel}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl text-center text-xl font-bold tracking-widest focus:border-blue-500 outline-none"
                            maxLength={6}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={verifyOtp} disabled={otp.length !== 6} loading={loading} className="flex-1">
                            <CheckCircle className="w-4 h-4" /> Verify OTP
                        </Button>
                        {timer > 0 ? (
                            <span className="flex items-center text-sm text-gray-500 px-4">
                                Resend in {timer}s
                            </span>
                        ) : (
                            <Button variant="outline" onClick={sendOtp} loading={loading}>
                                <RefreshCw className="w-4 h-4" /> Resend
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// User Form Modal
function UserFormModal({
    user,
    roles,
    onSave,
    onClose
}: {
    user: User | null;
    roles: UserRole[];
    onSave: (user: Partial<User>) => Promise<void>;
    onClose: () => void
}) {
    const isEditing = !!user
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [phoneVerified, setPhoneVerified] = useState(isEditing)
    const [showOtpVerification, setShowOtpVerification] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || "",
        username: user?.username || "",
        password: "",
        mobile_no: user?.mobile_no || "",
        role_id: user?.role_id || roles[0]?.role_id || 1,
        is_active: user?.is_active ?? true,
    })

    const handlePhoneChange = (value: string) => {
        // Format phone number
        let formatted = value.replace(/[^0-9+]/g, "")
        if (formatted.startsWith("0")) {
            formatted = "+254" + formatted.substring(1)
        } else if (formatted.startsWith("254")) {
            formatted = "+" + formatted
        } else if (!formatted.startsWith("+")) {
            formatted = "+254" + formatted
        }
        setFormData({ ...formData, mobile_no: formatted })
        setPhoneVerified(false)
        setShowOtpVerification(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!phoneVerified && formData.mobile_no) {
            setShowOtpVerification(true)
            return
        }

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-green-600" />}
                            {isEditing ? "✏️ Edit User" : "➕ Create New User"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            👤 Full Name *
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📧 Username *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                placeholder="username"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🔒 Password {isEditing ? "(leave blank to keep current)" : "*"}
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                placeholder={isEditing ? "••••••••" : "Create password"}
                                required={!isEditing}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📱 Mobile Number * {phoneVerified && <span className="text-green-600">✅ Verified</span>}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={formData.mobile_no}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl outline-none transition-colors ${phoneVerified ? "border-green-500 bg-green-50" : "border-gray-200 focus:border-blue-500"
                                    }`}
                                placeholder="+254712345678"
                                required
                            />
                        </div>
                    </div>

                    {/* OTP Verification */}
                    {showOtpVerification && !phoneVerified && formData.mobile_no && (
                        <OtpVerification
                            phone={formData.mobile_no}
                            onVerified={() => {
                                setPhoneVerified(true)
                                setShowOtpVerification(false)
                            }}
                            onCancel={() => setShowOtpVerification(false)}
                        />
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🎭 User Role *
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors appearance-none bg-white"
                                required
                            >
                                {roles.map((role) => (
                                    <option key={role.role_id} value={role.role_id}>
                                        {role.role_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900">🔓 Account Status</p>
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
                            <Save className="w-4 h-4" /> {isEditing ? "Update User" : "Create User"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Users Page
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<UserRole[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showModal, setShowModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")

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
                setRoles(rolesData || mockRoles)

                // Fetch users with roles
                const { data: usersData } = await supabase
                    .from("users_new")
                    .select("*, role:user_roles(*)")
                    .order("full_name")
                setUsers(usersData || mockUsers)
            } else {
                setRoles(mockRoles)
                setUsers(mockUsers)
            }
        } catch (error) {
            console.error(error)
            setRoles(mockRoles)
            setUsers(mockUsers)
        }
        setLoading(false)
    }

    const handleSaveUser = async (userData: Partial<User>) => {
        if (selectedUser) {
            // Update
            if (isSupabaseConfigured() && supabase) {
                const { error } = await supabase
                    .from("users_new")
                    .update({
                        full_name: userData.full_name,
                        username: userData.username,
                        mobile_no: userData.mobile_no,
                        role_id: userData.role_id,
                        is_active: userData.is_active,
                    })
                    .eq("user_id", selectedUser.user_id)
                if (error) throw error
            }
            toast.success("✅ User Updated!", `${userData.full_name} has been updated`)
        } else {
            // Create
            if (isSupabaseConfigured() && supabase) {
                const { error } = await supabase
                    .from("users_new")
                    .insert({
                        full_name: userData.full_name,
                        username: userData.username,
                        password_hash: userData.password, // Should be hashed in production
                        mobile_no: userData.mobile_no,
                        role_id: userData.role_id,
                        is_active: userData.is_active,
                    })
                if (error) throw error
            }
            toast.success("✅ User Created!", `${userData.full_name} has been added`)
        }
        fetchData()
    }

    const handleToggleStatus = async (user: User) => {
        const newStatus = !user.is_active
        if (isSupabaseConfigured() && supabase) {
            await supabase
                .from("users_new")
                .update({ is_active: newStatus })
                .eq("user_id", user.user_id)
        }
        toast.success(newStatus ? "✅ User Activated" : "⛔ User Deactivated", user.full_name)
        fetchData()
    }

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return

        if (isSupabaseConfigured() && supabase) {
            await supabase
                .from("users_new")
                .delete()
                .eq("user_id", user.user_id)
        }
        toast.success("🗑️ User Deleted", user.full_name)
        fetchData()
    }

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.mobile_no?.includes(searchQuery)

        const matchesFilter =
            filter === "all" ||
            (filter === "active" && user.is_active) ||
            (filter === "inactive" && !user.is_active)

        return matchesSearch && matchesFilter
    })

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        inactive: users.filter(u => !u.is_active).length,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            👥 User Management
                        </h1>
                        <p className="text-gray-500">Manage users, roles, and permissions</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => { setSelectedUser(null); setShowModal(true) }}>
                            <UserPlus className="w-4 h-4" /> Add User
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("all")}>
                        <CardContent className={`p-4 ${filter === "all" ? "ring-2 ring-blue-500" : ""}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-sm text-gray-500">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("active")}>
                        <CardContent className={`p-4 ${filter === "active" ? "ring-2 ring-green-500" : ""}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                                    <p className="text-sm text-gray-500">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("inactive")}>
                        <CardContent className={`p-4 ${filter === "inactive" ? "ring-2 ring-red-500" : ""}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <UserX className="w-6 h-6 text-red-600" />
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
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 Search by name, username, or phone..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            📋 All Users ({filteredUsers.length})
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
                                <p>No users found</p>
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
                                        {filteredUsers.map((user) => {
                                            const role = roles.find(r => r.role_id === user.role_id)
                                            return (
                                                <tr key={user.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${user.role_id === 1 ? "bg-purple-500" :
                                                                    user.role_id === 2 ? "bg-blue-500" :
                                                                        user.role_id === 3 ? "bg-green-500" : "bg-gray-400"
                                                                }`}>
                                                                {user.full_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{user.full_name}</p>
                                                                <p className="text-sm text-gray-500">@{user.username}</p>
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
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${user.role_id === 1 ? "bg-purple-100 text-purple-700" :
                                                                user.role_id === 2 ? "bg-blue-100 text-blue-700" :
                                                                    user.role_id === 3 ? "bg-green-100 text-green-700" :
                                                                        "bg-gray-100 text-gray-700"
                                                            }`}>
                                                            <Shield className="w-3 h-3" />
                                                            {role?.role_name || "Unknown"}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
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
                                                                onClick={() => { setSelectedUser(user); setShowModal(true) }}
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
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            {showModal && (
                <UserFormModal
                    user={selectedUser}
                    roles={roles}
                    onSave={handleSaveUser}
                    onClose={() => { setShowModal(false); setSelectedUser(null) }}
                />
            )}
        </DashboardLayout>
    )
}
