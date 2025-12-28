"use client"

import { useState, useEffect } from "react"
import {
    Users, Plus, Building2, Phone, CheckCircle, XCircle, Loader2, RefreshCw,
    Save, X, Edit, Trash2, Shield, Fuel, MapPin, Link2, Eye, Settings
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Interfaces matching database schema
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

interface Station {
    station_id: number
    station_name: string
    station_code: string
    is_active: boolean
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
    fuel_type_id: number | null
    is_active: boolean
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    price_per_liter: number
}

// Matches existing attendant_stations table
interface AttendantStation {
    id: number
    attendant_id: number
    station_id: number
    station_role: string
    can_view_own_sales: boolean
    can_process_sales: boolean
    can_manage_shift: boolean
    is_primary_station: boolean
    assigned_at: string
    is_active: boolean
    // Joined fields
    user?: User
    station?: Station
}

// Assignment Form Modal
function AssignmentFormModal({
    users,
    stations,
    pumps,
    fuelTypes,
    assignment,
    onSave,
    onClose,
}: {
    users: User[]
    stations: Station[]
    pumps: Pump[]
    fuelTypes: FuelType[]
    assignment: AttendantStation | null
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const isEditing = !!assignment
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        attendant_id: assignment?.attendant_id || 0,
        station_id: assignment?.station_id || 0,
        station_role: assignment?.station_role || "attendant",
        can_view_own_sales: assignment?.can_view_own_sales ?? true,
        can_process_sales: assignment?.can_process_sales ?? true,
        can_manage_shift: assignment?.can_manage_shift ?? false,
        is_primary_station: assignment?.is_primary_station ?? false,
        is_active: assignment?.is_active ?? true,
    })

    // Get pumps for selected station (for info display)
    const stationPumps = pumps.filter(p => p.station_id === formData.station_id && p.is_active)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.attendant_id) {
            toast.error("Error", "Please select a user")
            return
        }
        if (!formData.station_id) {
            toast.error("Error", "Please select a station")
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Link2 className="w-5 h-5 text-green-600" />}
                            {isEditing ? "✏️ Edit Assignment" : "🔗 Assign User to Station"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Assign a user to a station for mobile app access and sales
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* User Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Select User *</label>
                        <select
                            value={formData.attendant_id}
                            onChange={(e) => setFormData({ ...formData, attendant_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white text-gray-900"
                            required
                        >
                            <option value="">-- Choose a user --</option>
                            {users.filter(u => u.is_active).map((user) => (
                                <option key={user.user_id} value={user.user_id}>
                                    {user.full_name} (@{user.username}) - {user.role?.role_name || "Unknown Role"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Station Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🏪 Select Station *</label>
                        <select
                            value={formData.station_id}
                            onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white text-gray-900"
                            required
                        >
                            <option value="">-- Choose a station --</option>
                            {stations.filter(s => s.is_active).map((station) => (
                                <option key={station.station_id} value={station.station_id}>
                                    {station.station_code} - {station.station_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Station Pumps Info */}
                    {formData.station_id > 0 && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm font-semibold text-blue-700 mb-2">⛽ Available Pumps at this Station:</p>
                            {stationPumps.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {stationPumps.map(pump => {
                                        const fuel = fuelTypes.find(f => f.fuel_type_id === pump.fuel_type_id)
                                        return (
                                            <span key={pump.pump_id} className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-blue-600 border border-blue-200">
                                                {pump.pump_name} {fuel ? `(${fuel.fuel_name})` : ""}
                                            </span>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-orange-600">⚠️ No active pumps at this station</p>
                            )}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🎭 Station Role</label>
                        <select
                            value={formData.station_role}
                            onChange={(e) => setFormData({ ...formData, station_role: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none appearance-none bg-white text-gray-900"
                        >
                            <option value="attendant">Pump Attendant</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="manager">Station Manager</option>
                        </select>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">🔒 Permissions</label>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.can_view_own_sales}
                                    onChange={(e) => setFormData({ ...formData, can_view_own_sales: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">View Own Sales</span>
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.can_process_sales}
                                    onChange={(e) => setFormData({ ...formData, can_process_sales: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Process Sales</span>
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.can_manage_shift}
                                    onChange={(e) => setFormData({ ...formData, can_manage_shift: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Manage Shifts</span>
                            </label>

                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.is_primary_station}
                                    onChange={(e) => setFormData({ ...formData, is_primary_station: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Primary Station</span>
                            </label>
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div>
                            <p className="font-semibold text-gray-900">🟢 Active Assignment</p>
                            <p className="text-sm text-gray-500">Enable user to access this station on mobile app</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-gray-300 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                        </label>
                    </div>

                    {/* Summary Preview */}
                    {formData.attendant_id > 0 && formData.station_id > 0 && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm font-semibold text-blue-700 mb-2">📋 Assignment Summary:</p>
                            <div className="text-sm text-blue-600 space-y-1">
                                <p>👤 User: <span className="font-medium">{users.find(u => u.user_id === formData.attendant_id)?.full_name}</span></p>
                                <p>🏪 Station: <span className="font-medium">{stations.find(s => s.station_id === formData.station_id)?.station_name}</span></p>
                                <p>🎭 Role: <span className="font-medium capitalize">{formData.station_role}</span></p>
                                <p>⛽ Pumps: <span className="font-medium">{stationPumps.length} available</span></p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Save className="w-4 h-4" /> {isEditing ? "Update" : "Assign"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main User Assignment Page
export default function AttendantStationsPage() {
    const [users, setUsers] = useState<User[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [assignments, setAssignments] = useState<AttendantStation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFormModal, setShowFormModal] = useState(false)
    const [selectedAssignment, setSelectedAssignment] = useState<AttendantStation | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                // Fetch all reference data using existing attendant_stations table
                const [usersRes, stationsRes, pumpsRes, fuelTypesRes, assignmentsRes] = await Promise.all([
                    supabase.from("users_new").select("*, role:user_roles(*)").order("full_name"),
                    supabase.from("stations").select("*").order("station_name"),
                    supabase.from("pumps").select("*").order("pump_name"),
                    supabase.from("fuel_types").select("*").eq("is_active", true).order("fuel_name"),
                    supabase.from("attendant_stations").select(`
                        *,
                        user:users_new(user_id, full_name, username, role_id, is_active, mobile_no, role:user_roles(*)),
                        station:stations(station_id, station_name, station_code, is_active)
                    `).order("assigned_at", { ascending: false })
                ])

                setUsers(usersRes.data || [])
                setStations(stationsRes.data || [])
                setPumps(pumpsRes.data || [])
                setFuelTypes(fuelTypesRes.data || [])

                // Map the response to match our interface (handle nested user field naming)
                const mappedAssignments = (assignmentsRes.data || []).map((a: any) => ({
                    ...a,
                    user: a.user ? {
                        user_id: a.user.user_id,
                        full_name: a.user.full_name,
                        username: a.user.username,
                        role_id: a.user.role_id,
                        is_active: a.user.is_active,
                        mobile_no: a.user.mobile_no,
                        role: a.user.role,
                        created_at: ""
                    } : undefined
                }))
                setAssignments(mappedAssignments)

                console.log("[AttendantStations] Loaded:", {
                    users: usersRes.data?.length,
                    stations: stationsRes.data?.length,
                    pumps: pumpsRes.data?.length,
                    fuelTypes: fuelTypesRes.data?.length,
                    assignments: assignmentsRes.data?.length
                })
            } else {
                toast.error("Database not configured", "Please configure Supabase")
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    const handleSaveAssignment = async (data: any) => {
        if (!supabase) throw new Error("Database not configured")

        const saveData = {
            attendant_id: data.attendant_id,
            station_id: data.station_id,
            station_role: data.station_role,
            can_view_own_sales: data.can_view_own_sales,
            can_process_sales: data.can_process_sales,
            can_manage_shift: data.can_manage_shift,
            is_primary_station: data.is_primary_station,
            is_active: data.is_active,
        }

        if (selectedAssignment) {
            // Update existing
            const { error } = await supabase
                .from("attendant_stations")
                .update(saveData)
                .eq("id", selectedAssignment.id)

            if (error) throw error
            toast.success("✅ Assignment Updated!", `Assignment has been updated`)
        } else {
            // Check for existing assignment
            const { data: existing } = await supabase
                .from("attendant_stations")
                .select("id")
                .eq("attendant_id", data.attendant_id)
                .eq("station_id", data.station_id)
                .single()

            if (existing) {
                throw new Error("This user is already assigned to this station")
            }

            // Create new
            const { error } = await supabase
                .from("attendant_stations")
                .insert([saveData])

            if (error) throw error
            toast.success("✅ Assignment Created!", `User has been assigned to station`)
        }

        fetchData()
    }

    const handleDeleteAssignment = async (assignment: AttendantStation) => {
        const userName = assignment.user?.full_name || "Unknown"
        const stationName = assignment.station?.station_name || "Unknown"

        if (!confirm(`Are you sure you want to remove "${userName}" from "${stationName}"?`)) return

        try {
            if (!supabase) throw new Error("Database not configured")

            const { error } = await supabase
                .from("attendant_stations")
                .delete()
                .eq("id", assignment.id)

            if (error) throw error
            toast.success("🗑️ Assignment Removed", `${userName} removed from ${stationName}`)
            fetchData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete"
            toast.error("Error", errorMessage)
        }
    }

    const handleToggleActive = async (assignment: AttendantStation) => {
        try {
            if (!supabase) throw new Error("Database not configured")

            const newStatus = !assignment.is_active
            const { error } = await supabase
                .from("attendant_stations")
                .update({ is_active: newStatus })
                .eq("id", assignment.id)

            if (error) throw error
            toast.success(newStatus ? "✅ Assignment Activated" : "⛔ Assignment Deactivated",
                `${assignment.user?.full_name || "User"} @ ${assignment.station?.station_name || "Station"}`)
            fetchData()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update"
            toast.error("Error", errorMessage)
        }
    }

    // Filter assignments
    const filteredAssignments = assignments.filter((a) =>
        a.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.station?.station_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.station?.station_code?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const stats = {
        total: assignments.length,
        active: assignments.filter((a) => a.is_active).length,
        inactive: assignments.filter((a) => !a.is_active).length,
        stations: new Set(assignments.map(a => a.station_id)).size,
    }

    // Get pumps count for a station
    const getPumpsForStation = (stationId: number) => {
        return pumps.filter(p => p.station_id === stationId && p.is_active).length
    }

    // Role badge color
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "manager": return "bg-purple-100 text-purple-700"
            case "supervisor": return "bg-blue-100 text-blue-700"
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
                            🔗 User Station Assignments
                        </h1>
                        <p className="text-gray-500">Assign users to stations for mobile app access. Users will see their assigned station when making sales.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => { setSelectedAssignment(null); setShowFormModal(true) }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Plus className="w-4 h-4" /> New Assignment
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center">
                                    <Link2 className="w-6 h-6 text-purple-700" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-800">{stats.total}</p>
                                    <p className="text-sm text-purple-600">Total Assignments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-200 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-800">{stats.active}</p>
                                    <p className="text-sm text-green-600">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-200 flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-700" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-800">{stats.inactive}</p>
                                    <p className="text-sm text-red-600">Inactive</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-200 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-800">{stats.stations}</p>
                                    <p className="text-sm text-blue-600">Stations Used</p>
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
                            placeholder="🔍 Search by user name, username, station name, or station code..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </CardContent>
                </Card>

                {/* Assignments List */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-purple-600" />
                            📋 All Assignments ({filteredAssignments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">{assignments.length === 0 ? "No assignments found" : "No assignments match your search"}</p>
                                <p className="text-sm mt-1">Click "New Assignment" to assign a user to a station</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Permissions</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAssignments.map((assignment) => (
                                            <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white">
                                                            {assignment.user?.full_name?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{assignment.user?.full_name || "Unknown"}</p>
                                                            <p className="text-xs text-gray-500">@{assignment.user?.username || "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-blue-500" />
                                                        <div>
                                                            <p className="text-gray-900 font-medium">{assignment.station?.station_name || "—"}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {assignment.station?.station_code} • {getPumpsForStation(assignment.station_id)} pumps
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold capitalize ${getRoleBadgeColor(assignment.station_role)}`}>
                                                        {assignment.station_role}
                                                    </span>
                                                    {assignment.is_primary_station && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                                            ⭐ Primary
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        {assignment.can_process_sales && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Sales</span>
                                                        )}
                                                        {assignment.can_view_own_sales && (
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">View</span>
                                                        )}
                                                        {assignment.can_manage_shift && (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Shifts</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleActive(assignment)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${assignment.is_active
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                            }`}
                                                    >
                                                        {assignment.is_active ? (
                                                            <><CheckCircle className="w-3 h-3" /> Active</>
                                                        ) : (
                                                            <><XCircle className="w-3 h-3" /> Inactive</>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedAssignment(assignment); setShowFormModal(true) }}
                                                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAssignment(assignment)}
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

                {/* Info Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-blue-800 mb-3">💡 How User Assignments Work</h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-700">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">1️⃣</span>
                                <div>
                                    <p className="font-semibold">Create Assignment</p>
                                    <p className="text-blue-600">Link a user to a station with specific role and permissions</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">2️⃣</span>
                                <div>
                                    <p className="font-semibold">Mobile App Login</p>
                                    <p className="text-blue-600">When user logs in on mobile app, their station and pumps are auto-loaded</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">3️⃣</span>
                                <div>
                                    <p className="font-semibold">Make Sales</p>
                                    <p className="text-blue-600">Sales screen shows only pumps from assigned station</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            {showFormModal && (
                <AssignmentFormModal
                    users={users}
                    stations={stations}
                    pumps={pumps}
                    fuelTypes={fuelTypes}
                    assignment={selectedAssignment}
                    onSave={handleSaveAssignment}
                    onClose={() => { setShowFormModal(false); setSelectedAssignment(null) }}
                />
            )}
        </DashboardLayout>
    )
}
