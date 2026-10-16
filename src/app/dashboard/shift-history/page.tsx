"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Clock, User, Building2, Fuel, Timer, Search,
    TrendingUp, Banknote, Smartphone, Calendar,
    CreditCard, Gauge, ArrowUpRight, ArrowDownRight,
    RefreshCw, Loader2, DollarSign, BarChart3, ChevronDown, ChevronUp, Filter
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ==================== INTERFACES ====================
interface ShiftRecord {
    pump_shift_id: number
    pump_id: number
    shift_id: number
    attendant_id: number
    station_id: number | null
    opening_reading: number
    closing_reading: number | null
    opening_time: string
    closing_time: string | null
    amount_received: number | null
    is_closed: boolean
    total_liters: number | null
    total_sales: number | null
    cash_sales: number | null
    mpesa_sales: number | null
    credit_sales: number | null
    shift_expenses: number | null
    opening_cash_float: number | null
    opening_dipstick_reading: number | null
    closing_dipstick_reading: number | null
    closing_cash_float: number | null
    fuel_price_per_liter: number | null
    opening_sales_amount: number | null
    actual_cash_collected: number | null
    cash_variance: number | null
    handover_notes: string | null
    pump?: { pump_name: string; fuel_type?: { fuel_name: string; color_code: string; price_per_liter: number } }
    shift?: { shift_name: string }
    attendant?: { full_name: string }
    station?: { station_name: string; station_code: string }
}

interface Station { station_id: number; station_name: string; station_code: string }
interface PumpInfo { pump_id: number; pump_name: string; station_id: number }

// ==================== FORMAT HELPERS ====================
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
function fmtTime(d: string) { return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) }
function fmtCur(v: number) { return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }
function getDuration(s: string, e: string | null) {
    if (!e) return "Active"
    const ms = new Date(e).getTime() - new Date(s).getTime()
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

// ==================== EXPANDABLE SHIFT CARD ====================
function ShiftHistoryCard({ shift, isExpanded, onToggle }: { shift: ShiftRecord; isExpanded: boolean; onToggle: () => void }) {
    const totalLiters = shift.total_liters ?? Math.max(0, (shift.closing_reading ?? shift.opening_reading) - shift.opening_reading)
    const totalSales = shift.total_sales ?? 0
    const mpesaSales = shift.mpesa_sales ?? 0
    const cashSales = shift.cash_sales ?? 0
    const creditSales = shift.credit_sales ?? 0
    const expenses = shift.shift_expenses ?? 0
    const amountReceived = shift.amount_received ?? 0
    const netSales = mpesaSales + cashSales

    // Dipstick
    const openDip = shift.opening_dipstick_reading ?? 0
    const closeDip = shift.closing_dipstick_reading ?? 0
    const dipDrop = openDip > 0 && closeDip > 0 ? openDip - closeDip : 0
    const tankVariance = dipDrop > 0 ? dipDrop - totalLiters : 0
    const absVar = Math.abs(tankVariance)

    // Cash accountability
    const openFloat = shift.opening_cash_float ?? 0
    const closeFloat = shift.closing_cash_float ?? 0
    const expectedCash = openFloat + cashSales
    const cashVar = amountReceived > 0 && expectedCash > 0 ? amountReceived - expectedCash : 0

    return (
        <div className={`rounded-2xl border-2 transition-all duration-200 bg-white ${isExpanded ? "border-indigo-200 shadow-lg" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"}`}>
            {/* Card Header — always visible */}
            <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⛽</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{shift.pump?.pump_name || "Pump"}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{shift.pump?.fuel_type?.fuel_name || ""}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        👤 {shift.attendant?.full_name || "N/A"} • {shift.station?.station_name || ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(shift.closing_time || shift.opening_time)} • {fmtTime(shift.opening_time)} → {shift.closing_time ? fmtTime(shift.closing_time) : "Running"}
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-green-700">{fmtCur(totalSales)}</p>
                    <p className="text-xs text-blue-600 font-medium">{totalLiters.toFixed(1)} L</p>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            </button>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="px-4 pb-5 pt-0 space-y-4 border-t border-gray-100">
                    {/* Meter Readings */}
                    <div className="pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">📊 Pump Meter Readings</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Opening Meter</p>
                                <p className="text-sm font-bold text-emerald-800">{shift.opening_reading.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="p-2.5 bg-orange-50 rounded-xl text-center border border-orange-100">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Closing Meter</p>
                                <p className="text-sm font-bold text-orange-800">{shift.closing_reading?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}</p>
                            </div>
                            <div className="p-2.5 bg-blue-50 rounded-xl text-center border border-blue-100">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Liters Sold</p>
                                <p className="text-sm font-bold text-blue-800">{totalLiters.toFixed(2)} L</p>
                            </div>
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-center border border-indigo-100">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Fuel Price/L</p>
                                <p className="text-sm font-bold text-indigo-800">{(shift.fuel_price_per_liter ?? 0) > 0 ? fmtCur(shift.fuel_price_per_liter!) : "—"}</p>
                            </div>
                            <div className="p-2.5 bg-cyan-50 rounded-xl text-center border border-cyan-100">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Sales Value</p>
                                <p className="text-sm font-bold text-cyan-800">{(shift.fuel_price_per_liter ?? 0) > 0 ? fmtCur(totalLiters * (shift.fuel_price_per_liter ?? 0)) : fmtCur(totalSales)}</p>
                            </div>
                        </div>
                        {(shift.opening_sales_amount ?? 0) > 0 && (
                            <p className="text-xs text-gray-500 mt-1">Opening Sales Amount: {fmtCur(shift.opening_sales_amount!)}</p>
                        )}
                    </div>

                    {/* Dipstick Readings */}
                    {(openDip > 0 || closeDip > 0) && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">🪣 Dipstick Readings</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {openDip > 0 && (
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-semibold">Opening Dip</p>
                                        <p className="text-sm font-bold">{openDip.toLocaleString()} L</p>
                                    </div>
                                )}
                                {closeDip > 0 && (
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-semibold">Closing Dip</p>
                                        <p className="text-sm font-bold">{closeDip.toLocaleString()} L</p>
                                    </div>
                                )}
                                {dipDrop > 0 && (
                                    <div className="p-2.5 bg-purple-50 rounded-xl text-center border border-purple-100">
                                        <p className="text-[10px] text-purple-500 font-semibold">Dip Drop</p>
                                        <p className="text-sm font-bold text-purple-700">{dipDrop.toFixed(0)} L</p>
                                    </div>
                                )}
                                {dipDrop > 0 && (
                                    <div className={`p-2.5 rounded-xl text-center border ${absVar < 5 ? "bg-green-50 border-green-100" : absVar < 20 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}>
                                        <p className={`text-[10px] font-semibold ${absVar < 5 ? "text-green-500" : absVar < 20 ? "text-amber-500" : "text-red-500"}`}>Tank Variance</p>
                                        <p className={`text-sm font-bold ${absVar < 5 ? "text-green-700" : absVar < 20 ? "text-amber-700" : "text-red-700"}`}>
                                            {tankVariance >= 0 ? "+" : ""}{tankVariance.toFixed(1)} L
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Cash Accountability */}
                    {(openFloat > 0 || amountReceived > 0) && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">💰 Cash Accountability</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {openFloat > 0 && (
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-semibold">Opening Float</p>
                                        <p className="text-sm font-bold">{fmtCur(openFloat)}</p>
                                    </div>
                                )}
                                {amountReceived > 0 && (
                                    <div className="p-2.5 bg-green-50 rounded-xl text-center border border-green-100">
                                        <p className="text-[10px] text-green-500 font-semibold">Cash Received</p>
                                        <p className="text-sm font-bold text-green-700">{fmtCur(amountReceived)}</p>
                                    </div>
                                )}
                                {closeFloat > 0 && (
                                    <div className="p-2.5 bg-gray-50 rounded-xl text-center border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-semibold">Closing Float</p>
                                        <p className="text-sm font-bold">{fmtCur(closeFloat)}</p>
                                    </div>
                                )}
                                {expectedCash > 0 && amountReceived > 0 && (
                                    <div className={`p-2.5 rounded-xl text-center border ${Math.abs(cashVar) < 10 ? "bg-green-50 border-green-100" : cashVar > 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"}`}>
                                        <p className={`text-[10px] font-semibold ${Math.abs(cashVar) < 10 ? "text-green-500" : cashVar > 0 ? "text-blue-500" : "text-red-500"}`}>Cash Variance</p>
                                        <p className={`text-sm font-bold ${Math.abs(cashVar) < 10 ? "text-green-700" : cashVar > 0 ? "text-blue-700" : "text-red-700"}`}>
                                            {cashVar >= 0 ? "+" : ""}{fmtCur(Math.abs(cashVar))}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Sales Breakdown */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">📱 Sales Breakdown</h4>
                        <div className="space-y-1.5">
                            <div className="flex justify-between p-2.5 bg-green-50 rounded-xl border border-green-100">
                                <span className="text-sm text-green-700 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> M-Pesa</span>
                                <span className="text-sm font-bold text-green-800">{fmtCur(mpesaSales)}</span>
                            </div>
                            <div className="flex justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                                <span className="text-sm text-amber-700 flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" /> Cash</span>
                                <span className="text-sm font-bold text-amber-800">{fmtCur(cashSales)}</span>
                            </div>
                            <div className="flex justify-between p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                                <span className="text-sm text-purple-700 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Credit</span>
                                <span className="text-sm font-bold text-purple-800">{fmtCur(creditSales)}</span>
                            </div>
                            {expenses > 0 && (
                                <div className="flex justify-between p-2.5 bg-red-50 rounded-xl border border-red-100">
                                    <span className="text-sm text-red-700 flex items-center gap-1.5"><ArrowDownRight className="w-3.5 h-3.5" /> Expenses</span>
                                    <span className="text-sm font-bold text-red-800">-{fmtCur(expenses)}</span>
                                </div>
                            )}
                            <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200 mt-2">
                                <div>
                                    <span className="text-sm font-bold text-emerald-800">💰 Net Sales (Cash + M-Pesa)</span>
                                    <p className="text-[10px] text-gray-400">Excl. credit & expenses</p>
                                </div>
                                <span className="text-base font-extrabold text-emerald-800">{fmtCur(netSales)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Handover Notes */}
                    {shift.handover_notes && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 mb-1">📝 Handover Notes</p>
                            <p className="text-sm text-gray-700">{shift.handover_notes}</p>
                        </div>
                    )}

                    {/* Duration Badge */}
                    <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 rounded-full text-xs font-semibold text-indigo-700 border border-indigo-100">
                            <Timer className="w-3.5 h-3.5" /> Duration: {getDuration(shift.opening_time, shift.closing_time)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==================== MAIN PAGE ====================
export default function ShiftHistoryPage() {
    const [allShifts, setAllShifts] = useState<ShiftRecord[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [allPumps, setAllPumps] = useState<PumpInfo[]>([])
    const [allAttendants, setAllAttendants] = useState<{ user_id: number; full_name: string }[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7)
        return d.toISOString().split("T")[0]
    })
    const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0])
    const [filterStation, setFilterStation] = useState<number | null>(null)
    const [filterPump, setFilterPump] = useState<number | null>(null)
    const [filterAttendant, setFilterAttendant] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const fetchData = async () => {
        if (!isSupabaseConfigured() || !supabase) return
        setLoading(true)
        try {
            const [stationsRes, pumpsRes, usersRes, shiftsRes] = await Promise.all([
                supabase.from("stations").select("station_id, station_name, station_code").eq("is_active", true).order("station_name"),
                supabase.from("pumps").select("pump_id, pump_name, station_id").eq("is_active", true),
                supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                supabase.from("pump_shifts")
                    .select("*, pump:pumps(pump_name, fuel_type:fuel_types(fuel_name, color_code, price_per_liter)), shift:shifts(*), attendant:users_new(full_name), station:stations(station_name, station_code)")
                    .eq("is_closed", true)
                    .order("closing_time", { ascending: false })
                    .limit(500),
            ])
            setStations(stationsRes.data || [])
            setAllPumps(pumpsRes.data || [])
            setAllAttendants(usersRes.data || [])
            setAllShifts(shiftsRes.data || [])
        } catch (e: any) {
            console.error("Error:", e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    // Filtered pumps by station
    const stationPumps = useMemo(() => {
        if (!filterStation) return allPumps
        return allPumps.filter(p => p.station_id === filterStation)
    }, [allPumps, filterStation])

    // Apply all filters
    const filteredShifts = useMemo(() => {
        let result = allShifts

        // Date filter
        if (fromDate) {
            const from = new Date(fromDate)
            result = result.filter(s => {
                const d = new Date(s.closing_time || s.opening_time)
                return d >= from
            })
        }
        if (toDate) {
            const to = new Date(toDate)
            to.setDate(to.getDate() + 1)
            result = result.filter(s => {
                const d = new Date(s.closing_time || s.opening_time)
                return d < to
            })
        }

        // Station filter
        if (filterStation) result = result.filter(s => s.station_id === filterStation)

        // Pump filter
        if (filterPump) result = result.filter(s => s.pump_id === filterPump)

        // Attendant filter
        if (filterAttendant) result = result.filter(s => s.attendant_id === filterAttendant)

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(s =>
                s.attendant?.full_name?.toLowerCase().includes(q) ||
                s.pump?.pump_name?.toLowerCase().includes(q) ||
                s.station?.station_name?.toLowerCase().includes(q)
            )
        }

        return result
    }, [allShifts, fromDate, toDate, filterStation, filterPump, filterAttendant, searchQuery])

    // Summary stats
    const stats = useMemo(() => ({
        count: filteredShifts.length,
        totalSales: filteredShifts.reduce((s, r) => s + (r.total_sales || 0), 0),
        totalLiters: filteredShifts.reduce((s, r) => s + (r.total_liters || 0), 0),
        totalMpesa: filteredShifts.reduce((s, r) => s + (r.mpesa_sales || 0), 0),
        totalCash: filteredShifts.reduce((s, r) => s + (r.cash_sales || 0), 0),
    }), [filteredShifts])

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            Shift History
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{stats.count} closed shifts found</p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="rounded-xl">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: "Shifts", value: stats.count.toString(), icon: Clock, color: "indigo" },
                        { label: "Total Sales", value: fmtCur(stats.totalSales), icon: DollarSign, color: "amber" },
                        { label: "Total Liters", value: `${stats.totalLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L`, icon: Gauge, color: "cyan" },
                        { label: "M-Pesa", value: fmtCur(stats.totalMpesa), icon: Smartphone, color: "green" },
                        { label: "Cash", value: fmtCur(stats.totalCash), icon: Banknote, color: "yellow" },
                    ].map((s, i) => (
                        <Card key={i} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-50/50 border-${s.color}-100 rounded-2xl`}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl bg-${s.color}-100 flex items-center justify-center`}>
                                        <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-semibold text-${s.color}-500 uppercase`}>{s.label}</p>
                                        <p className={`text-lg font-extrabold text-${s.color}-800`}>{s.value}</p>
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
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                            {/* Date Range */}
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">From</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">To</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                            </div>
                            {/* Station */}
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Station</label>
                                <select value={filterStation || ""} onChange={e => { setFilterStation(e.target.value ? parseInt(e.target.value) : null); setFilterPump(null) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none bg-white">
                                    <option value="">All Stations</option>
                                    {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                                </select>
                            </div>
                            {/* Pump */}
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Pump</label>
                                <select value={filterPump || ""} onChange={e => setFilterPump(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none bg-white">
                                    <option value="">All Pumps</option>
                                    {stationPumps.map(p => <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>)}
                                </select>
                            </div>
                            {/* Attendant */}
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Attendant</label>
                                <select value={filterAttendant || ""} onChange={e => setFilterAttendant(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none bg-white">
                                    <option value="">All Attendants</option>
                                    {allAttendants.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                                </select>
                            </div>
                            {/* Search */}
                            <div>
                                <label className="block text-[10px] text-gray-400 font-semibold uppercase mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shift List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredShifts.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No closed shifts found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting date range or filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredShifts.map(shift => (
                            <ShiftHistoryCard
                                key={shift.pump_shift_id}
                                shift={shift}
                                isExpanded={expandedId === shift.pump_shift_id}
                                onToggle={() => setExpandedId(expandedId === shift.pump_shift_id ? null : shift.pump_shift_id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
