"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Clock, Play, Pause, Sun, Moon, Building2, Fuel, Users, CheckCircle,
    XCircle, Loader2, RefreshCw, Save, X, Search, Filter, ChevronDown,
    TrendingUp, AlertCircle, UserCheck, MapPin
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ==================== INTERFACES ====================
interface Station {
    station_id: number
    station_code: string
    station_name: string
    city: string | null
    is_online: boolean
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
    fuel_type?: { fuel_name: string; color_code: string }
}

interface Shift {
    shift_id: number
    shift_name: string
    start_time: string
    end_time: string
}

interface User {
    user_id: number
    full_name: string
}

interface PumpShift {
    pump_shift_id: number
    pump_id: number
    shift_id: number
    attendant_id: number
    station_id: number
    opening_reading: number
    closing_reading: number | null
    opening_time: string
    closing_time: string | null
    amount_received: number
    is_closed: boolean
    pump?: { pump_name: string; fuel_type?: { fuel_name: string; color_code: string } }
    shift?: { shift_name: string }
    attendant?: { full_name: string }
    station?: { station_name: string; station_code: string }
}

// ==================== START SHIFT MODAL ====================
function StartShiftModal({
    stations,
    pumps,
    shifts,
    users,
    selectedStationId,
    onSave,
    onClose,
}: {
    stations: Station[]
    pumps: Pump[]
    shifts: Shift[]
    users: User[]
    selectedStationId: number | null
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        station_id: selectedStationId || stations[0]?.station_id || 0,
        pump_id: 0,
        shift_id: shifts[0]?.shift_id || 0,
        attendant_id: 0,
        opening_reading: 0,
    })

    // Filter pumps by selected station
    const stationPumps = pumps.filter(p => p.station_id === formData.station_id)
    const selectedShift = shifts.find(s => s.shift_id === formData.shift_id)
    const isNightShift = selectedShift?.shift_name?.toLowerCase().includes("night")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.pump_id || !formData.attendant_id) {
            toast.error("Required", "Select pump and attendant")
            return
        }
        setLoading(true)
        try {
            await onSave({
                ...formData,
                opening_time: new Date().toISOString(),
                is_closed: false,
                amount_received: 0,
            })
            onClose()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed"
            toast.error("Error", msg)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isNightShift ? "bg-indigo-100" : "bg-amber-100"}`}>
                            {isNightShift ? <Moon className="w-6 h-6 text-indigo-600" /> : <Sun className="w-6 h-6 text-amber-600" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Start New Shift</h2>
                            <p className="text-sm text-gray-500">{selectedShift?.shift_name || "Select shift type"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Shift Type */}
                    <div className="grid grid-cols-2 gap-3">
                        {shifts.map((shift) => {
                            const isNight = shift.shift_name.toLowerCase().includes("night")
                            const isSelected = formData.shift_id === shift.shift_id
                            return (
                                <button
                                    key={shift.shift_id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, shift_id: shift.shift_id })}
                                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isSelected
                                        ? isNight ? "border-indigo-500 bg-indigo-50" : "border-amber-500 bg-amber-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    {isNight ? <Moon className={`w-5 h-5 ${isSelected ? "text-indigo-600" : "text-gray-400"}`} />
                                        : <Sun className={`w-5 h-5 ${isSelected ? "text-amber-600" : "text-gray-400"}`} />}
                                    <div className="text-left">
                                        <p className={`font-semibold ${isSelected ? (isNight ? "text-indigo-700" : "text-amber-700") : "text-gray-700"}`}>
                                            {shift.shift_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{shift.start_time} - {shift.end_time}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Station */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Station</label>
                        <select
                            value={formData.station_id}
                            onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value), pump_id: 0 })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                        >
                            {stations.map((s) => (
                                <option key={s.station_id} value={s.station_id}>
                                    {s.station_name} ({s.station_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pump */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pump</label>
                        {stationPumps.length === 0 ? (
                            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">No pumps at this station</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {stationPumps.map((pump) => (
                                    <button
                                        key={pump.pump_id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, pump_id: pump.pump_id })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.pump_id === pump.pump_id
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <Fuel className={`w-5 h-5 mx-auto mb-1 ${formData.pump_id === pump.pump_id ? "text-green-600" : "text-gray-400"}`} />
                                        <p className="text-sm font-medium">{pump.pump_name}</p>
                                        {pump.fuel_type && (
                                            <p className="text-xs" style={{ color: pump.fuel_type.color_code }}>{pump.fuel_type.fuel_name}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Attendant */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Attendant</label>
                        <select
                            value={formData.attendant_id}
                            onChange={(e) => setFormData({ ...formData, attendant_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                            required
                        >
                            <option value="">Select attendant</option>
                            {users.map((u) => (
                                <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Opening Reading */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Meter Reading</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.opening_reading}
                            onChange={(e) => setFormData({ ...formData, opening_reading: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading} variant="success" className="flex-1">
                            <Play className="w-4 h-4" /> Start Shift
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==================== END SHIFT MODAL ====================
function EndShiftModal({
    shift,
    onSave,
    onClose,
}: {
    shift: PumpShift
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [closingReading, setClosingReading] = useState(shift.opening_reading)
    const [amountReceived, setAmountReceived] = useState(0)

    const litersSold = closingReading - shift.opening_reading

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (closingReading < shift.opening_reading) {
            toast.error("Invalid", "Closing < Opening reading")
            return
        }
        setLoading(true)
        try {
            await onSave({
                closing_reading: closingReading,
                closing_time: new Date().toISOString(),
                amount_received: amountReceived,
                is_closed: true,
            })
            onClose()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed"
            toast.error("Error", msg)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <Pause className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">End Shift</h2>
                            <p className="text-sm text-gray-500">{shift.pump?.pump_name} • {shift.attendant?.full_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Shift Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Station</p>
                            <p className="font-medium text-gray-900">{shift.station?.station_name}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Opening</p>
                            <p className="font-medium text-gray-900">{shift.opening_reading.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Closing Reading */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Closing Meter Reading</label>
                        <input
                            type="number"
                            step="0.01"
                            value={closingReading}
                            onChange={(e) => setClosingReading(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    {/* Liters Sold Display */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-center">
                            <span className="text-blue-700">Liters Sold</span>
                            <span className="text-xl font-bold text-blue-700">{litersSold.toFixed(2)} L</span>
                        </div>
                    </div>

                    {/* Amount Received */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Received (KES)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading} variant="destructive" className="flex-1">
                            <Pause className="w-4 h-4" /> End Shift
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==================== SHIFT CARD COMPONENT ====================
function ShiftCard({ shift, onEnd }: { shift: PumpShift; onEnd: () => void }) {
    const isNight = shift.shift?.shift_name?.toLowerCase().includes("night")
    const duration = shift.opening_time
        ? Math.floor((Date.now() - new Date(shift.opening_time).getTime()) / (1000 * 60 * 60))
        : 0

    return (
        <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNight ? "bg-indigo-100" : "bg-amber-100"}`}>
                        {isNight ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{shift.pump?.pump_name}</p>
                        <p className="text-xs text-gray-500">{shift.station?.station_name}</p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Active
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Attendant</p>
                    <p className="text-sm font-medium truncate">{shift.attendant?.full_name?.split(" ")[0]}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Opening</p>
                    <p className="text-sm font-medium">{shift.opening_reading}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium">{duration}h</p>
                </div>
            </div>

            <button
                onClick={onEnd}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
                <Pause className="w-4 h-4" /> End Shift
            </button>
        </div>
    )
}

// ==================== MAIN SHIFTS PAGE ====================
export default function ShiftsPage() {
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [pumpShifts, setPumpShifts] = useState<PumpShift[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedStationId, setSelectedStationId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showStartModal, setShowStartModal] = useState(false)
    const [showEndModal, setShowEndModal] = useState(false)
    const [selectedShift, setSelectedShift] = useState<PumpShift | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error", "Supabase not configured")
                setLoading(false)
                return
            }

            const [stationsRes, pumpsRes, shiftsRes, usersRes, pumpShiftsRes] = await Promise.all([
                supabase.from("stations").select("*").eq("is_active", true).order("station_name"),
                supabase.from("pumps").select("*, fuel_type:fuel_types(fuel_name, color_code)").eq("is_active", true),
                supabase.from("shifts").select("*").order("shift_id"),
                supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                supabase.from("pump_shifts")
                    .select("*, pump:pumps(pump_name, fuel_type:fuel_types(fuel_name, color_code)), shift:shifts(*), attendant:users_new(full_name), station:stations(station_name, station_code)")
                    .order("opening_time", { ascending: false })
                    .limit(200),
            ])

            setStations(stationsRes.data || [])
            setPumps(pumpsRes.data || [])
            setShifts(shiftsRes.data || [])
            setUsers(usersRes.data || [])
            setPumpShifts(pumpShiftsRes.data || [])
        } catch (error) {
            console.error(error)
            toast.error("Error", "Failed to load")
        }
        setLoading(false)
    }

    const handleStartShift = async (data: any) => {
        if (!supabase) throw new Error("No database")
        const { error } = await supabase.from("pump_shifts").insert([data])
        if (error) throw error
        toast.success("Shift Started", `${data.pump_id ? "Pump assigned" : ""}`)
        fetchData()
    }

    const handleEndShift = async (data: any) => {
        if (!supabase || !selectedShift) throw new Error("Invalid")
        const { error } = await supabase
            .from("pump_shifts")
            .update(data)
            .eq("pump_shift_id", selectedShift.pump_shift_id)
        if (error) throw error
        toast.success("Shift Ended", `${formatCurrency(data.amount_received)}`)
        fetchData()
    }

    // Filter shifts
    const activeShifts = useMemo(() => {
        return pumpShifts.filter(s => !s.is_closed).filter(s => {
            if (selectedStationId && s.station_id !== selectedStationId) return false
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                return (
                    s.attendant?.full_name?.toLowerCase().includes(q) ||
                    s.pump?.pump_name?.toLowerCase().includes(q) ||
                    s.station?.station_name?.toLowerCase().includes(q)
                )
            }
            return true
        })
    }, [pumpShifts, selectedStationId, searchQuery])

    const completedShifts = useMemo(() => {
        return pumpShifts.filter(s => s.is_closed).slice(0, 20)
    }, [pumpShifts])

    // Stats
    const stats = {
        activeCount: pumpShifts.filter(s => !s.is_closed).length,
        completedToday: pumpShifts.filter(s => s.is_closed && new Date(s.closing_time || "").toDateString() === new Date().toDateString()).length,
        totalCollected: pumpShifts.filter(s => s.is_closed).reduce((acc, s) => acc + (s.amount_received || 0), 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-600" />
                            Shift Management
                        </h1>
                        <p className="text-gray-500 text-sm">Start, monitor & end shifts across all stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => setShowStartModal(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                            <Play className="w-4 h-4" /> Start Shift
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Play className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-700">{stats.activeCount}</p>
                                    <p className="text-xs text-green-600">Active Shifts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-700">{stats.completedToday}</p>
                                    <p className="text-xs text-blue-600">Completed Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalCollected)}</p>
                                    <p className="text-xs text-purple-600">Total Collected</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-3">
                            {/* Station Filter */}
                            <div className="relative flex-1">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={selectedStationId || ""}
                                    onChange={(e) => setSelectedStationId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-white appearance-none"
                                >
                                    <option value="">All Stations ({stations.length})</option>
                                    {stations.map((s) => (
                                        <option key={s.station_id} value={s.station_id}>
                                            {s.station_name} ({s.station_code})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search attendant, pump..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Shifts Grid */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Active Shifts ({activeShifts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : activeShifts.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">No active shifts</p>
                                <Button onClick={() => setShowStartModal(true)} className="mt-4">
                                    <Play className="w-4 h-4" /> Start First Shift
                                </Button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {activeShifts.map((shift) => (
                                    <ShiftCard
                                        key={shift.pump_shift_id}
                                        shift={shift}
                                        onEnd={() => { setSelectedShift(shift); setShowEndModal(true) }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Completed */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recent Completed ({completedShifts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {completedShifts.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No completed shifts yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Station / Pump</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Attendant</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Shift</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Liters</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completedShifts.map((shift) => (
                                            <tr key={shift.pump_shift_id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 px-3">
                                                    <p className="font-medium text-gray-900">{shift.station?.station_name}</p>
                                                    <p className="text-xs text-gray-500">{shift.pump?.pump_name}</p>
                                                </td>
                                                <td className="py-3 px-3 text-sm">{shift.attendant?.full_name}</td>
                                                <td className="py-3 px-3">
                                                    <span className={`text-xs px-2 py-1 rounded-lg ${shift.shift?.shift_name?.toLowerCase().includes("night")
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {shift.shift?.shift_name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-sm">
                                                    {((shift.closing_reading || 0) - shift.opening_reading).toFixed(1)} L
                                                </td>
                                                <td className="py-3 px-3 text-right font-medium text-green-600">
                                                    {formatCurrency(shift.amount_received || 0)}
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
            {showStartModal && (
                <StartShiftModal
                    stations={stations}
                    pumps={pumps}
                    shifts={shifts}
                    users={users}
                    selectedStationId={selectedStationId}
                    onSave={handleStartShift}
                    onClose={() => setShowStartModal(false)}
                />
            )}
            {showEndModal && selectedShift && (
                <EndShiftModal
                    shift={selectedShift}
                    onSave={handleEndShift}
                    onClose={() => { setShowEndModal(false); setSelectedShift(null) }}
                />
            )}
        </DashboardLayout>
    )
}
