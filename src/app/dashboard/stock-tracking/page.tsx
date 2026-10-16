"use client"

import { useState, useEffect, useMemo } from "react"
import {
    BarChart3, Building2, Fuel, Search, RefreshCw, Loader2, Calendar,
    Gauge, ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle,
    ShieldAlert, Truck, User, Filter, ChevronDown, Droplet, DollarSign
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ==================== INTERFACES ====================
interface ShiftRow {
    pump_shift_id: number
    pump_id: number
    station_id: number | null
    attendant_id: number
    opening_reading: number
    closing_reading: number | null
    opening_dipstick_reading: number | null
    closing_dipstick_reading: number | null
    opening_time: string
    closing_time: string | null
    total_liters: number | null
    total_sales: number | null
    fuel_price_per_liter: number | null
    is_closed: boolean
    pump?: { pump_name: string; fuel_type?: { fuel_name: string; color_code: string; fuel_type_id: number } }
    attendant?: { full_name: string }
    station?: { station_name: string; station_code: string }
}
interface RefillRow {
    refill_id: number
    station_id: number | null
    fuel_type_id: number | null
    quantity_liters: number
    delivery_date: string
    supplier_name: string | null
    fuel_type?: { fuel_name: string }
    station?: { station_name: string }
}
interface Station { station_id: number; station_name: string; station_code: string }
interface PumpInfo { pump_id: number; pump_name: string; station_id: number; fuel_type_id: number | null }
interface FuelType { fuel_type_id: number; fuel_name: string; color_code: string }

// ==================== HELPERS ====================
function fmtCur(v: number) { return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }

type VarStatus = "ok" | "warning" | "alert"
function getVarianceStatus(v: number): VarStatus {
    const a = Math.abs(v)
    if (a < 5) return "ok"
    if (a < 20) return "warning"
    return "alert"
}
const statusColors = {
    ok: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
    alert: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
}
const statusLabel = { ok: "✅ OK", warning: "⚠️ Warning", alert: "🚨 Alert" }

// ==================== MAIN PAGE ====================
export default function StockTrackingPage() {
    const [shifts, setShifts] = useState<ShiftRow[]>([])
    const [refills, setRefills] = useState<RefillRow[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<PumpInfo[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [attendants, setAttendants] = useState<{ user_id: number; full_name: string }[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7)
        return d.toISOString().split("T")[0]
    })
    const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0])
    const [filterStation, setFilterStation] = useState<number | null>(null)
    const [filterPump, setFilterPump] = useState<number | null>(null)
    const [filterFuelType, setFilterFuelType] = useState<number | null>(null)
    const [filterAttendant, setFilterAttendant] = useState<number | null>(null)
    const [filterStatus, setFilterStatus] = useState<VarStatus | null>(null)

    const fetchData = async () => {
        if (!isSupabaseConfigured() || !supabase) return
        setLoading(true)
        try {
            const [stRes, pRes, ftRes, uRes, shRes, rfRes] = await Promise.all([
                supabase.from("stations").select("station_id, station_name, station_code").eq("is_active", true).order("station_name"),
                supabase.from("pumps").select("pump_id, pump_name, station_id, fuel_type_id").eq("is_active", true),
                supabase.from("fuel_types").select("fuel_type_id, fuel_name, color_code").eq("is_active", true),
                supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                supabase.from("pump_shifts")
                    .select("pump_shift_id, pump_id, station_id, attendant_id, opening_reading, closing_reading, opening_dipstick_reading, closing_dipstick_reading, opening_time, closing_time, total_liters, total_sales, fuel_price_per_liter, is_closed, pump:pumps(pump_name, fuel_type:fuel_types(fuel_name, color_code, fuel_type_id)), attendant:users_new(full_name), station:stations(station_name, station_code)")
                    .eq("is_closed", true)
                    .order("closing_time", { ascending: false })
                    .limit(1000),
                supabase.from("fuel_refills")
                    .select("refill_id, station_id, fuel_type_id, quantity_liters, delivery_date, supplier_name, fuel_type:fuel_types(fuel_name), station:stations(station_name)")
                    .order("delivery_date", { ascending: false })
                    .limit(500),
            ])
            setStations(stRes.data || [])
            setPumps(pRes.data || [])
            setFuelTypes(ftRes.data || [])
            setAttendants(uRes.data || [])
            setShifts((shRes.data || []) as any)
            setRefills((rfRes.data || []) as any)
        } catch (e: any) {
            console.error("Error:", e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Filter pumps by station
    const stationPumps = useMemo(() => {
        if (!filterStation) return pumps
        return pumps.filter(p => p.station_id === filterStation)
    }, [pumps, filterStation])

    // Apply all filters to shifts
    const filteredShifts = useMemo(() => {
        let result = shifts
        if (fromDate) {
            const f = new Date(fromDate)
            result = result.filter(s => new Date(s.closing_time || s.opening_time) >= f)
        }
        if (toDate) {
            const t = new Date(toDate); t.setDate(t.getDate() + 1)
            result = result.filter(s => new Date(s.closing_time || s.opening_time) < t)
        }
        if (filterStation) result = result.filter(s => s.station_id === filterStation)
        if (filterPump) result = result.filter(s => s.pump_id === filterPump)
        if (filterFuelType) result = result.filter(s => s.pump?.fuel_type?.fuel_type_id === filterFuelType)
        if (filterAttendant) result = result.filter(s => s.attendant_id === filterAttendant)
        return result
    }, [shifts, fromDate, toDate, filterStation, filterPump, filterFuelType, filterAttendant])

    // Filter refills by date and station
    const filteredRefills = useMemo(() => {
        let result = refills
        if (fromDate) result = result.filter(r => new Date(r.delivery_date) >= new Date(fromDate))
        if (toDate) { const t = new Date(toDate); t.setDate(t.getDate() + 1); result = result.filter(r => new Date(r.delivery_date) < t) }
        if (filterStation) result = result.filter(r => r.station_id === filterStation)
        if (filterFuelType) result = result.filter(r => r.fuel_type_id === filterFuelType)
        return result
    }, [refills, fromDate, toDate, filterStation, filterFuelType])

    // Build report rows from shifts (where both dipstick readings exist)
    const reportRows = useMemo(() => {
        return filteredShifts.map(s => {
            const meterLiters = s.total_liters ?? Math.max(0, (s.closing_reading ?? s.opening_reading) - s.opening_reading)
            const openDip = s.opening_dipstick_reading ?? 0
            const closeDip = s.closing_dipstick_reading ?? 0
            const dipDrop = openDip > 0 && closeDip > 0 ? openDip - closeDip : 0
            const variance = dipDrop > 0 ? dipDrop - meterLiters : 0
            const status = dipDrop > 0 ? getVarianceStatus(variance) : "ok" as VarStatus
            return { ...s, meterLiters, openDip, closeDip, dipDrop, variance, status }
        })
    }, [filteredShifts])

    // Apply status filter
    const displayRows = useMemo(() => {
        if (!filterStatus) return reportRows
        return reportRows.filter(r => r.status === filterStatus)
    }, [reportRows, filterStatus])

    // Summary stats
    const stats = useMemo(() => {
        const totalMeterLiters = reportRows.reduce((s, r) => s + r.meterLiters, 0)
        const totalDipDrop = reportRows.reduce((s, r) => s + r.dipDrop, 0)
        const totalVariance = reportRows.reduce((s, r) => s + r.variance, 0)
        const totalRefillLiters = filteredRefills.reduce((s, r) => s + r.quantity_liters, 0)
        const totalSales = reportRows.reduce((s, r) => s + (r.total_sales || 0), 0)
        const alertCount = reportRows.filter(r => r.status === "alert").length
        const warningCount = reportRows.filter(r => r.status === "warning").length
        return { totalMeterLiters, totalDipDrop, totalVariance, totalRefillLiters, totalSales, alertCount, warningCount }
    }, [reportRows, filteredRefills])

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-white" />
                            </div>
                            Stock Tracking & Reports
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Monitor refills, sales, meter vs tank readings, and detect variances</p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="rounded-xl">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {[
                        { label: "Meter Liters", value: `${stats.totalMeterLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`, icon: Gauge, color: "blue" },
                        { label: "Dip Drop", value: `${stats.totalDipDrop.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`, icon: Droplet, color: "purple" },
                        { label: "Variance", value: `${stats.totalVariance >= 0 ? "+" : ""}${stats.totalVariance.toFixed(0)} L`, icon: AlertTriangle, color: stats.totalVariance > 20 ? "red" : stats.totalVariance > 5 ? "amber" : "green" },
                        { label: "Refills", value: `${stats.totalRefillLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`, icon: Truck, color: "teal" },
                        { label: "Sales Value", value: fmtCur(stats.totalSales), icon: DollarSign, color: "emerald" },
                        { label: "Alerts", value: stats.alertCount.toString(), icon: ShieldAlert, color: "red" },
                        { label: "Warnings", value: stats.warningCount.toString(), icon: AlertTriangle, color: "amber" },
                    ].map((s, i) => (
                        <Card key={i} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-50/50 border-${s.color}-100 rounded-2xl`}>
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 flex items-center justify-center flex-shrink-0`}>
                                        <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-semibold text-${s.color}-500 uppercase`}>{s.label}</p>
                                        <p className={`text-sm font-extrabold text-${s.color}-800 truncate`}>{s.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">Filters</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">From Date</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">To Date</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Station</label>
                                <select value={filterStation || ""} onChange={e => { setFilterStation(e.target.value ? parseInt(e.target.value) : null); setFilterPump(null) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                                    <option value="">All Stations</option>
                                    {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Pump</label>
                                <select value={filterPump || ""} onChange={e => setFilterPump(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                                    <option value="">All Pumps</option>
                                    {stationPumps.map(p => <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Fuel Type</label>
                                <select value={filterFuelType || ""} onChange={e => setFilterFuelType(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                                    <option value="">All Fuels</option>
                                    {fuelTypes.map(f => <option key={f.fuel_type_id} value={f.fuel_type_id}>{f.fuel_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Attendant</label>
                                <select value={filterAttendant || ""} onChange={e => setFilterAttendant(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                                    <option value="">All</option>
                                    {attendants.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Status</label>
                                <select value={filterStatus || ""} onChange={e => setFilterStatus(e.target.value ? e.target.value as VarStatus : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                                    <option value="">All</option>
                                    <option value="ok">✅ OK</option>
                                    <option value="warning">⚠️ Warning</option>
                                    <option value="alert">🚨 Alert</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Refills Summary */}
                {filteredRefills.length > 0 && (
                    <Card className="rounded-2xl border-teal-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Truck className="w-4 h-4 text-teal-600" />
                                Refills in Period ({filteredRefills.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px] text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Station</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Fuel</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Supplier</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Liters</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRefills.slice(0, 10).map(r => (
                                            <tr key={r.refill_id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-2 px-3 text-gray-700">{fmtDate(r.delivery_date)}</td>
                                                <td className="py-2 px-3 text-gray-700">{r.station?.station_name || "—"}</td>
                                                <td className="py-2 px-3 text-gray-700">{r.fuel_type?.fuel_name || "—"}</td>
                                                <td className="py-2 px-3 text-gray-500">{r.supplier_name || "—"}</td>
                                                <td className="py-2 px-3 text-right font-semibold text-teal-700">{r.quantity_liters.toLocaleString()} L</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Report Table */}
                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Variance Report ({displayRows.length} records)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                        ) : displayRows.length === 0 ? (
                            <div className="text-center py-16">
                                <ShieldAlert className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">No records found</p>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting date range or filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/50">
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Pump</th>
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Fuel</th>
                                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Attendant</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Open Meter</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Close Meter</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Meter L</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Open Dip</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Close Dip</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Dip Drop</th>
                                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Variance</th>
                                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayRows.map(r => {
                                            const sc = statusColors[r.status]
                                            return (
                                                <tr key={r.pump_shift_id} className={`border-b border-gray-50 hover:bg-gray-50 ${r.status === "alert" ? "bg-red-50/30" : r.status === "warning" ? "bg-amber-50/20" : ""}`}>
                                                    <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{fmtDate(r.closing_time || r.opening_time)}</td>
                                                    <td className="py-2 px-3 text-gray-700">{r.station?.station_name || "—"}</td>
                                                    <td className="py-2 px-3 font-medium text-gray-900">{r.pump?.pump_name || "—"}</td>
                                                    <td className="py-2 px-3 text-gray-600">{r.pump?.fuel_type?.fuel_name || "—"}</td>
                                                    <td className="py-2 px-3 text-gray-600">{r.attendant?.full_name || "—"}</td>
                                                    <td className="py-2 px-3 text-right text-gray-700 font-mono">{r.opening_reading.toLocaleString()}</td>
                                                    <td className="py-2 px-3 text-right text-gray-700 font-mono">{r.closing_reading?.toLocaleString() || "—"}</td>
                                                    <td className="py-2 px-3 text-right font-semibold text-blue-700">{r.meterLiters.toFixed(1)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-600">{r.openDip > 0 ? r.openDip.toLocaleString() : "—"}</td>
                                                    <td className="py-2 px-3 text-right text-gray-600">{r.closeDip > 0 ? r.closeDip.toLocaleString() : "—"}</td>
                                                    <td className="py-2 px-3 text-right font-semibold text-purple-700">{r.dipDrop > 0 ? r.dipDrop.toFixed(0) : "—"}</td>
                                                    <td className={`py-2 px-3 text-right font-bold ${sc.text}`}>
                                                        {r.dipDrop > 0 ? `${r.variance >= 0 ? "+" : ""}${r.variance.toFixed(1)}` : "—"}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {r.dipDrop > 0 ? (
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.badge}`}>
                                                                {statusLabel[r.status]}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                                            <td colSpan={7} className="py-2.5 px-3 text-right text-gray-600 uppercase text-xs">Totals</td>
                                            <td className="py-2.5 px-3 text-right text-blue-800">{stats.totalMeterLiters.toFixed(0)} L</td>
                                            <td colSpan={2}></td>
                                            <td className="py-2.5 px-3 text-right text-purple-800">{stats.totalDipDrop.toFixed(0)} L</td>
                                            <td className={`py-2.5 px-3 text-right ${Math.abs(stats.totalVariance) < 5 ? "text-green-700" : stats.totalVariance < 0 ? "text-red-700" : "text-amber-700"}`}>
                                                {stats.totalVariance >= 0 ? "+" : ""}{stats.totalVariance.toFixed(0)} L
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
