"use client"

import { useState, useEffect } from "react"
import {
    Building2, Plus, MapPin, Phone, Users, Fuel, Edit, Trash2, Eye,
    CheckCircle, XCircle, Loader2, RefreshCw, Save, X, Globe, Clock, Mail
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Station interface matching database schema
interface Station {
    station_id: number
    station_code: string
    station_name: string
    station_type: string
    physical_address: string | null
    city: string | null
    county: string | null
    region: string | null
    station_phone: string | null
    station_email: string | null
    manager_name: string | null
    manager_phone: string | null
    is_active: boolean
    is_online: boolean
    is_24_hours: boolean
    created_at: string
    pump_count?: number
    attendant_count?: number
    today_sales?: number
}

// Station Form Modal
function StationFormModal({
    station,
    onSave,
    onClose,
}: {
    station: Station | null
    onSave: (data: Partial<Station>) => Promise<void>
    onClose: () => void
}) {
    const isEditing = !!station
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        station_code: station?.station_code || "",
        station_name: station?.station_name || "",
        station_type: station?.station_type || "petrol_station",
        physical_address: station?.physical_address || "",
        city: station?.city || "",
        county: station?.county || "",
        region: station?.region || "",
        station_phone: station?.station_phone || "",
        station_email: station?.station_email || "",
        manager_name: station?.manager_name || "",
        manager_phone: station?.manager_phone || "",
        is_active: station?.is_active ?? true,
        is_online: station?.is_online ?? true,
        is_24_hours: station?.is_24_hours ?? false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.station_code || !formData.station_name) {
            toast.error("Error", "Station code and name are required")
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-green-600" />}
                            {isEditing ? "✏️ Edit Station" : "➕ Add New Station"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Station Code & Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Station Code *</label>
                            <input
                                type="text"
                                value={formData.station_code}
                                onChange={(e) => setFormData({ ...formData, station_code: e.target.value.toUpperCase() })}
                                placeholder="e.g., WL01"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 Station Name *</label>
                            <input
                                type="text"
                                value={formData.station_name}
                                onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                                placeholder="e.g., Westlands Station"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Physical Address</label>
                        <input
                            type="text"
                            value={formData.physical_address}
                            onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
                            placeholder="Enter street address"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* City, County, Region */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">🏙️ City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="City"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 County</label>
                            <input
                                type="text"
                                value={formData.county}
                                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                                placeholder="County"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">🗺️ Region</label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                placeholder="Region"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Station Phone</label>
                            <input
                                type="tel"
                                value={formData.station_phone}
                                onChange={(e) => setFormData({ ...formData, station_phone: e.target.value })}
                                placeholder="+254712345678"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Station Email</label>
                            <input
                                type="email"
                                value={formData.station_email}
                                onChange={(e) => setFormData({ ...formData, station_email: e.target.value })}
                                placeholder="station@example.com"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Manager */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Manager Name</label>
                            <input
                                type="text"
                                value={formData.manager_name}
                                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                                placeholder="Manager name"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Manager Phone</label>
                            <input
                                type="tel"
                                value={formData.manager_phone}
                                onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                                placeholder="+254712345678"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">🟢 Active</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">🌐 Online</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_online}
                                    onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">🕐 24 Hours</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_24_hours}
                                    onChange={(e) => setFormData({ ...formData, is_24_hours: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> {isEditing ? "Update Station" : "Create Station"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// View Station Modal
function ViewStationModal({ station, onClose }: { station: Station; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-600" />
                            👁️ Station Details
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Building2 className="w-8988 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{station.station_name}</h3>
                            <p className="text-sm text-gray-500">Code: {station.station_code}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">📍 Location</p>
                            <p className="font-medium">{station.city || station.physical_address || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">📞 Phone</p>
                            <p className="font-medium">{station.station_phone || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">👤 Manager</p>
                            <p className="font-medium">{station.manager_name || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">📧 Email</p>
                            <p className="font-medium text-sm">{station.station_email || "N/A"}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${station.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {station.is_active ? "✅ Active" : "❌ Inactive"}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${station.is_online ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {station.is_online ? "🌐 Online" : "⚫ Offline"}
                        </span>
                        {station.is_24_hours && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">🕐 24 Hours</span>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100">
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Main Stations Page
export default function StationsPage() {
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFormModal, setShowFormModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedStation, setSelectedStation] = useState<Station | null>(null)

    useEffect(() => {
        fetchStations()
    }, [])

    const fetchStations = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase
                    .from("stations")
                    .select("*")
                    .order("station_name")

                if (error) throw error
                setStations(data || [])
            } else {
                toast.error("Database not configured", "Please configure Supabase")
                setStations([])
            }
        } catch (error) {
            console.error("Error fetching stations:", error)
            toast.error("Error", "Failed to load stations")
            setStations([])
        }
        setLoading(false)
    }

    const handleSaveStation = async (data: Partial<Station>) => {
        if (!supabase) throw new Error("Database not configured")

        if (selectedStation) {
            // Update existing
            const { error } = await supabase
                .from("stations")
                .update(data)
                .eq("station_id", selectedStation.station_id)

            if (error) throw error
            toast.success("✅ Station Updated!", `${data.station_name} has been updated`)
        } else {
            // Create new
            const { error } = await supabase
                .from("stations")
                .insert([data])

            if (error) throw error
            toast.success("✅ Station Created!", `${data.station_name} has been added`)
        }

        fetchStations()
    }

    const handleDeleteStation = async (station: Station) => {
        if (!confirm(`Are you sure you want to delete "${station.station_name}"?`)) return

        try {
            if (!supabase) throw new Error("Database not configured")

            const { error } = await supabase
                .from("stations")
                .delete()
                .eq("station_id", station.station_id)

            if (error) throw error
            toast.success("🗑️ Station Deleted", station.station_name)
            fetchStations()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to delete"
            toast.error("Error", errorMessage)
        }
    }

    const handleToggleOnline = async (station: Station) => {
        try {
            if (!supabase) throw new Error("Database not configured")

            const newStatus = !station.is_online
            const { error } = await supabase
                .from("stations")
                .update({ is_online: newStatus })
                .eq("station_id", station.station_id)

            if (error) throw error
            toast.success(newStatus ? "🌐 Station Online" : "⚫ Station Offline", station.station_name)
            fetchStations()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update"
            toast.error("Error", errorMessage)
        }
    }

    // Filter stations
    const filteredStations = stations.filter((station) =>
        station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.station_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const stats = {
        total: stations.length,
        online: stations.filter((s) => s.is_online).length,
        active: stations.filter((s) => s.is_active).length,
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            🏢 Station Management
                        </h1>
                        <p className="text-gray-500">Manage all your fuel stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchStations}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => { setSelectedStation(null); setShowFormModal(true) }}>
                            <Plus className="w-4 h-4" /> Add Station
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-sm text-gray-500">Total Stations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
                                    <p className="text-sm text-gray-500">Online</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                                    <p className="text-sm text-gray-500">Active</p>
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
                            placeholder="🔍 Search stations by name, code, or city..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </CardContent>
                </Card>

                {/* Stations List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Building2 className="w-5 h-5 text-blue-600" />
                            📋 All Stations ({filteredStations.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredStations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>{stations.length === 0 ? "No stations found. Add your first station!" : "No stations match your search"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Manager</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStations.map((station) => (
                                            <tr key={station.station_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{station.station_name}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {station.city || station.physical_address || "No location"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm text-gray-600">
                                                        {station.station_phone && (
                                                            <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {station.station_phone}</p>
                                                        )}
                                                        {station.station_email && (
                                                            <p className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" /> {station.station_email}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-gray-900">{station.manager_name || "—"}</p>
                                                    <p className="text-xs text-gray-500">{station.manager_phone || ""}</p>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleOnline(station)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${station.is_online
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                            }`}
                                                    >
                                                        {station.is_online ? (
                                                            <><CheckCircle className="w-3 h-3" /> Online</>
                                                        ) : (
                                                            <><XCircle className="w-3 h-3" /> Offline</>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedStation(station); setShowViewModal(true) }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedStation(station); setShowFormModal(true) }}
                                                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStation(station)}
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

            {/* Modals */}
            {showFormModal && (
                <StationFormModal
                    station={selectedStation}
                    onSave={handleSaveStation}
                    onClose={() => { setShowFormModal(false); setSelectedStation(null) }}
                />
            )}
            {showViewModal && selectedStation && (
                <ViewStationModal
                    station={selectedStation}
                    onClose={() => { setShowViewModal(false); setSelectedStation(null) }}
                />
            )}
        </DashboardLayout>
    )
}
