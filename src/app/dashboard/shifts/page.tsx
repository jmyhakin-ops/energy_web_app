"use client"

import { useState, useEffect } from "react"
import {
    Clock, Plus, Play, Pause, CheckCircle, AlertCircle, Sun, Moon, Building2,
    Calendar, TrendingUp, Loader2, RefreshCw, X, Save, Fuel, Users
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Pump Shift interface matching database schema
interface PumpShift {
    pump_shift_id: number
    pump_id: number
    shift_id: number
    attendant_id: number
    opening_reading: number
    closing_reading: number | null
    opening_time: string
    closing_time: string | null
    amount_received: number
    is_closed: boolean
    station_id: number
    pump?: { pump_id: number; pump_name: string }
    shift?: { shift_id: number; shift_name: string }
    attendant?: { user_id: number; full_name: string }
    station?: { station_id: number; station_name: string }
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
}

interface Shift {
    shift_id: number
    shift_name: string
}

interface User {
    user_id: number
    full_name: string
}

interface Station {
    station_id: number
    station_name: string
}

// Start Shift Modal
function StartShiftModal({
    pumps,
    shifts,
    users,
    stations,
    onSave,
    onClose,
}: {
    pumps: Pump[]
    shifts: Shift[]
    users: User[]
    stations: Station[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        station_id: stations[0]?.station_id || 0,
        pump_id: 0,
        shift_id: shifts[0]?.shift_id || 0,
        attendant_id: users[0]?.user_id || 0,
        opening_reading: 0,
    })

    // Filter pumps by selected station
    const filteredPumps = pumps.filter(p => p.station_id === formData.station_id)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.pump_id || !formData.attendant_id) {
            toast.error("Error", "Please fill all required fields")
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
                            <Play className="w-5 h-5 text-green-600" />
                            ▶️ Start New Shift
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Station */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 Station *</label>
                        <select
                            value={formData.station_id}
                            onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value), pump_id: 0 })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                            required
                        >
                            <option value="">Select station</option>
                            {stations.map((s) => (
                                <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pump */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">⛽ Pump *</label>
                        <select
                            value={formData.pump_id}
                            onChange={(e) => setFormData({ ...formData, pump_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                            required
                        >
                            <option value="">Select pump</option>
                            {filteredPumps.map((p) => (
                                <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Shift Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 Shift *</label>
                        <select
                            value={formData.shift_id}
                            onChange={(e) => setFormData({ ...formData, shift_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                            required
                        >
                            {shifts.map((s) => (
                                <option key={s.shift_id} value={s.shift_id}>{s.shift_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Attendant */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Attendant *</label>
                        <select
                            value={formData.attendant_id}
                            onChange={(e) => setFormData({ ...formData, attendant_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Opening Reading *</label>
                        <input
                            type="number"
                            value={formData.opening_reading}
                            onChange={(e) => setFormData({ ...formData, opening_reading: parseFloat(e.target.value) })}
                            placeholder="Enter opening meter reading"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
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

// End Shift Modal
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (closingReading < shift.opening_reading) {
            toast.error("Error", "Closing reading cannot be less than opening reading")
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
                            <Pause className="w-5 h-5 text-orange-600" />
                            ⏹️ End Shift
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                        <p className="text-sm text-gray-500">Station: <span className="font-semibold text-gray-900">{shift.station?.station_name}</span></p>
                        <p className="text-sm text-gray-500">Pump: <span className="font-semibold text-gray-900">{shift.pump?.pump_name}</span></p>
                        <p className="text-sm text-gray-500">Opening Reading: <span className="font-semibold text-gray-900">{shift.opening_reading}</span></p>
                    </div>

                    {/* Closing Reading */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Closing Reading *</label>
                        <input
                            type="number"
                            value={closingReading}
                            onChange={(e) => setClosingReading(parseFloat(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Amount Received */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Amount Received *</label>
                        <input
                            type="number"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(parseFloat(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
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

// Main Shifts Page
export default function ShiftsPage() {
    const [pumpShifts, setPumpShifts] = useState<PumpShift[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [loading, setLoading] = useState(true)
    const [showStartModal, setShowStartModal] = useState(false)
    const [showEndModal, setShowEndModal] = useState(false)
    const [selectedShift, setSelectedShift] = useState<PumpShift | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                // Fetch all required data
                const [stationsRes, pumpsRes, shiftsRes, usersRes, pumpShiftsRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name").eq("is_active", true).order("station_name"),
                    supabase.from("pumps").select("pump_id, pump_name, station_id").eq("is_active", true).order("pump_name"),
                    supabase.from("shifts").select("*").order("shift_name"),
                    supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                    supabase.from("pump_shifts")
                        .select("*, pump:pumps(pump_id, pump_name), shift:shifts(*), attendant:users_new(user_id, full_name), station:stations(station_id, station_name)")
                        .order("opening_time", { ascending: false })
                        .limit(100),
                ])

                setStations(stationsRes.data || [])
                setPumps(pumpsRes.data || [])
                setShifts(shiftsRes.data || [])
                setUsers(usersRes.data || [])
                setPumpShifts(pumpShiftsRes.data || [])
            } else {
                toast.error("Database not configured", "Please configure Supabase")
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    const handleStartShift = async (data: any) => {
        if (!supabase) throw new Error("Database not configured")

        const { error } = await supabase
            .from("pump_shifts")
            .insert([data])

        if (error) throw error
        toast.success("✅ Shift Started!", "New shift has been opened")
        fetchData()
    }

    const handleEndShift = async (data: any) => {
        if (!supabase || !selectedShift) throw new Error("Invalid operation")

        const { error } = await supabase
            .from("pump_shifts")
            .update(data)
            .eq("pump_shift_id", selectedShift.pump_shift_id)

        if (error) throw error
        toast.success("✅ Shift Ended!", "Shift has been closed successfully")
        fetchData()
    }

    // Stats
    const activeShifts = pumpShifts.filter(s => !s.is_closed)
    const completedShifts = pumpShifts.filter(s => s.is_closed)
    const stats = {
        active: activeShifts.length,
        completed: completedShifts.length,
        totalAmount: pumpShifts.reduce((acc, s) => acc + (s.amount_received || 0), 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            ⏰ Shift Management
                        </h1>
                        <p className="text-gray-500">Manage day and night shifts across all stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => setShowStartModal(true)}>
                            <Plus className="w-4 h-4" /> Start New Shift
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Play className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                                    <p className="text-sm text-gray-500">Active Shifts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                                    <p className="text-sm text-gray-500">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                                    <p className="text-sm text-gray-500">Total Collected</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shifts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Clock className="w-5 h-5 text-blue-600" />
                            📋 All Shifts ({pumpShifts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : pumpShifts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No shifts found. Start a new shift!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station / Pump</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Attendant</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Readings</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pumpShifts.map((shift) => (
                                            <tr key={shift.pump_shift_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{shift.station?.station_name || "—"}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Fuel className="w-3 h-3" /> {shift.pump?.pump_name || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                                                            {shift.attendant?.full_name?.charAt(0) || "?"}
                                                        </div>
                                                        <span className="text-sm">{shift.attendant?.full_name || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900">{formatDateTime(shift.opening_time)}</p>
                                                        {shift.closing_time && (
                                                            <p className="text-gray-500 text-xs">to {formatDateTime(shift.closing_time)}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm">
                                                        <p>Open: <span className="font-medium">{shift.opening_reading}</span></p>
                                                        {shift.closing_reading && (
                                                            <p className="text-xs text-gray-500">Close: {shift.closing_reading}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-green-600">{formatCurrency(shift.amount_received || 0)}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${shift.is_closed
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-green-100 text-green-700"
                                                        }`}>
                                                        {shift.is_closed ? (
                                                            <><CheckCircle className="w-3 h-3" /> Closed</>
                                                        ) : (
                                                            <><Play className="w-3 h-3" /> Active</>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {!shift.is_closed && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => { setSelectedShift(shift); setShowEndModal(true) }}
                                                        >
                                                            <Pause className="w-4 h-4" /> End
                                                        </Button>
                                                    )}
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
                    pumps={pumps}
                    shifts={shifts}
                    users={users}
                    stations={stations}
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
