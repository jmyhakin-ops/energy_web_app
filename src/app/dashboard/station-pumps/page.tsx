"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Building2, Fuel, Search, RefreshCw, Filter, X,
    Droplet, TrendingUp, TrendingDown, Activity, BarChart3,
    Loader2, Calendar, ChevronDown
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Station {
    station_id: number
    station_name: string
    station_code: string
    city: string | null
    is_online: boolean
    is_active: boolean
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    color_code: string
}

interface PumpWithStats {
    pump_id: number
    pump_name: string
    pump_code: string
    station_id: number
    fuel_type_id: number | null
    is_active: boolean
    fuel_type?: FuelType
    purchased: number   // total liters from refills
    sold: number        // total liters sold
    available: number   // purchased - sold
    revenue: number     // total revenue from sales
}

interface RefillRow {
    pump_id: number | null
    station_id: number
    fuel_type_id: number
    quantity_liters: number
    delivery_date: string
}

interface SaleRow {
    pump_id: number
    liters_sold: number | null
    amount: number
    total_amount: number | null
    transaction_status: string
    created_at: string
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${color} min-w-[80px]`}>
            <span className="text-xs font-medium opacity-70">{label}</span>
            <span className="text-sm font-bold mt-0.5">{value}</span>
        </div>
    )
}

function PumpCard({ pump }: { pump: PumpWithStats }) {
    const availablePct = pump.purchased > 0 ? Math.max(0, Math.min(100, (pump.available / pump.purchased) * 100)) : 0
    const soldPct = pump.purchased > 0 ? Math.max(0, Math.min(100, (pump.sold / pump.purchased) * 100)) : 0
    const fuelColor = pump.fuel_type?.color_code || "#3B82F6"

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-4 group hover:border-blue-200">
            {/* Pump Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: fuelColor + "20" }}
                    >
                        <Fuel className="w-5 h-5" style={{ color: fuelColor }} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{pump.pump_name}</p>
                        <p className="text-xs text-gray-400">{pump.pump_code}</p>
                    </div>
                </div>
                {pump.fuel_type && (
                    <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: fuelColor + "15", color: fuelColor }}
                    >
                        {pump.fuel_type.fuel_name}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Fuel Level</span>
                    <span>{availablePct.toFixed(0)}% available</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${availablePct}%`,
                            background: availablePct > 50
                                ? `linear-gradient(90deg, ${fuelColor}80, ${fuelColor})`
                                : availablePct > 20
                                    ? "linear-gradient(90deg, #F59E0B80, #F59E0B)"
                                    : "linear-gradient(90deg, #EF444480, #EF4444)"
                        }}
                    />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
                <StatBadge
                    label="Purchased"
                    value={pump.purchased > 0 ? `${pump.purchased.toLocaleString()}L` : "—"}
                    color="bg-blue-50 text-blue-700"
                />
                <StatBadge
                    label="Sold"
                    value={pump.sold > 0 ? `${pump.sold.toFixed(0)}L` : "—"}
                    color="bg-orange-50 text-orange-700"
                />
                <StatBadge
                    label="Available"
                    value={pump.available > 0 ? `${pump.available.toFixed(0)}L` : "—"}
                    color={availablePct > 20 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                />
            </div>

            {/* Revenue */}
            {pump.revenue > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Revenue</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(pump.revenue)}</span>
                </div>
            )}
        </div>
    )
}

function StationBlock({ station, pumps }: { station: Station; pumps: PumpWithStats[] }) {
    const totalPurchased = pumps.reduce((s, p) => s + p.purchased, 0)
    const totalSold = pumps.reduce((s, p) => s + p.sold, 0)
    const totalAvailable = pumps.reduce((s, p) => s + p.available, 0)
    const totalRevenue = pumps.reduce((s, p) => s + p.revenue, 0)

    return (
        <div className="mb-8">
            {/* Station Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-300/30 flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900">{station.station_name}</h2>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${station.is_online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${station.is_online ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                            {station.is_online ? "Online" : "Offline"}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">{station.station_code}{station.city ? ` · ${station.city}` : ""}</p>
                </div>
                {/* Station Totals */}
                <div className="hidden sm:flex gap-3 items-center">
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Total Sold</p>
                        <p className="text-sm font-bold text-orange-600">{totalSold.toFixed(0)} L</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Available</p>
                        <p className="text-sm font-bold text-green-600">{totalAvailable.toFixed(0)} L</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Revenue</p>
                        <p className="text-sm font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Pumps Grid */}
            {pumps.length === 0 ? (
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">No pumps assigned to this station</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-16">
                    {pumps.map(pump => <PumpCard key={pump.pump_id} pump={pump} />)}
                </div>
            )}
        </div>
    )
}

export default function StationPumpsPage() {
    const [loading, setLoading] = useState(true)
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<PumpWithStats[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStation, setFilterStation] = useState<number | "">("")
    const [filterFuel, setFilterFuel] = useState<number | "">("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [showFilters, setShowFilters] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const [rawRefills, setRawRefills] = useState<RefillRow[]>([])
    const [rawSales, setRawSales] = useState<SaleRow[]>([])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) return

            const [stRes, ftRes, pmpRes, refRes, saleRes] = await Promise.all([
                supabase.from("stations").select("station_id,station_name,station_code,city,is_online,is_active").eq("is_active", true).order("station_name"),
                supabase.from("fuel_types").select("fuel_type_id,fuel_name,color_code").eq("is_active", true),
                supabase.from("pumps").select("pump_id,pump_name,station_id,fuel_type_id,is_active").eq("is_active", true),
                supabase.from("fuel_refills").select("pump_id,station_id,fuel_type_id,quantity_liters,delivery_date").limit(2000),
                supabase.from("sales").select("pump_id,liters_sold,amount,total_amount,transaction_status,created_at").neq("transaction_status", "PENDING").limit(5000),
            ])

            setStations(stRes.data || [])
            setFuelTypes(ftRes.data || [])
            setRawRefills(refRes.data || [])
            setRawSales(saleRes.data || [])

            // Build pump stats (unfiltered by date for initial load)
            const ftData: FuelType[] = ftRes.data || []
            const pumpsRaw = pmpRes.data || []
            const enrichedPumps: PumpWithStats[] = pumpsRaw.map(p => {
                const ft = ftData.find(f => f.fuel_type_id === p.fuel_type_id)
                const purchased = (refRes.data || [])
                    .filter((r: RefillRow) => r.pump_id === p.pump_id || (!r.pump_id && r.station_id === p.station_id && r.fuel_type_id === p.fuel_type_id))
                    .reduce((s: number, r: RefillRow) => s + (r.quantity_liters || 0), 0)
                const pumpSales = (saleRes.data || []).filter((s: SaleRow) => s.pump_id === p.pump_id)
                const sold = pumpSales.reduce((s: number, sale: SaleRow) => s + (sale.liters_sold || 0), 0)
                const revenue = pumpSales.reduce((s: number, sale: SaleRow) => s + (sale.total_amount || sale.amount || 0), 0)
                return {
                    ...p,
                    pump_code: p.pump_name,
                    fuel_type: ft,
                    purchased,
                    sold,
                    available: Math.max(0, purchased - sold),
                    revenue,
                }
            })
            setPumps(enrichedPumps)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    // Re-compute pump stats when date filters change
    const dateFilteredPumps = useMemo(() => {
        if (!dateFrom && !dateTo) return pumps
        // Re-compute from raw data with date filters
        const filteredRefills = rawRefills.filter(r => {
            const d = r.delivery_date?.split("T")[0]
            if (dateFrom && d && d < dateFrom) return false
            if (dateTo && d && d > dateTo) return false
            return true
        })
        const filteredSales = rawSales.filter(s => {
            const d = s.created_at?.split("T")[0]
            if (dateFrom && d && d < dateFrom) return false
            if (dateTo && d && d > dateTo) return false
            return true
        })
        return pumps.map(p => {
            const purchased = filteredRefills
                .filter(r => r.pump_id === p.pump_id || (!r.pump_id && r.station_id === p.station_id && r.fuel_type_id === p.fuel_type_id))
                .reduce((s, r) => s + (r.quantity_liters || 0), 0)
            const pumpSales = filteredSales.filter(s => s.pump_id === p.pump_id)
            const sold = pumpSales.reduce((s, sale) => s + (sale.liters_sold || 0), 0)
            const revenue = pumpSales.reduce((s, sale) => s + (sale.total_amount || sale.amount || 0), 0)
            return { ...p, purchased, sold, available: Math.max(0, purchased - sold), revenue }
        })
    }, [pumps, rawRefills, rawSales, dateFrom, dateTo])

    // Apply filters
    const filteredData = useMemo(() => {
        let filteredPumps = dateFilteredPumps

        if (filterStation !== "") {
            filteredPumps = filteredPumps.filter(p => p.station_id === Number(filterStation))
        }
        if (filterFuel !== "") {
            filteredPumps = filteredPumps.filter(p => p.fuel_type_id === Number(filterFuel))
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            filteredPumps = filteredPumps.filter(p =>
                p.pump_name.toLowerCase().includes(q) ||
                (p.pump_code || "").toLowerCase().includes(q) ||
                p.fuel_type?.fuel_name?.toLowerCase().includes(q)
            )
        }

        // Group by station
        const activeStations = stations.filter(s =>
            filteredPumps.some(p => p.station_id === s.station_id) ||
            (filterStation === "" && !searchQuery && filterFuel === "" && !dateFrom && !dateTo)
        )

        return { filteredPumps, activeStations }
    }, [dateFilteredPumps, stations, filterStation, filterFuel, searchQuery, dateFrom, dateTo])


    // Overall totals (date-filtered)
    const totals = useMemo(() => ({
        purchased: dateFilteredPumps.reduce((s, p) => s + p.purchased, 0),
        sold: dateFilteredPumps.reduce((s, p) => s + p.sold, 0),
        available: dateFilteredPumps.reduce((s, p) => s + p.available, 0),
        revenue: dateFilteredPumps.reduce((s, p) => s + p.revenue, 0),
    }), [dateFilteredPumps])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-300/30">
                                <Fuel className="w-5 h-5 text-white" />
                            </div>
                            Station & Pump Inventory
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">Live fuel levels across all stations and pumps</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                            <Filter className="w-4 h-4" /> Filters
                        </Button>
                        <Button variant="outline" onClick={fetchData} className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Purchased", value: `${totals.purchased.toLocaleString()} L`, icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: "from-blue-50 to-cyan-50 border-blue-100", val: "text-blue-700" },
                        { label: "Total Sold", value: `${totals.sold.toFixed(0)} L`, icon: <Activity className="w-5 h-5 text-orange-600" />, bg: "from-orange-50 to-amber-50 border-orange-100", val: "text-orange-700" },
                        { label: "Total Available", value: `${totals.available.toFixed(0)} L`, icon: <Droplet className="w-5 h-5 text-green-600" />, bg: "from-green-50 to-emerald-50 border-green-100", val: "text-green-700" },
                        { label: "Total Revenue", value: formatCurrency(totals.revenue), icon: <BarChart3 className="w-5 h-5 text-purple-600" />, bg: "from-purple-50 to-violet-50 border-purple-100", val: "text-purple-700" },
                    ].map(c => (
                        <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all`}>
                            <div className="flex items-center gap-2 mb-2">
                                {c.icon}
                                <span className="text-xs text-gray-500 font-medium">{c.label}</span>
                            </div>
                            <p className={`text-xl font-bold ${c.val}`}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            {/* Search */}
                            <div className="relative lg:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search pumps..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            {/* Station Filter */}
                            <select
                                value={filterStation}
                                onChange={e => setFilterStation(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">All Stations</option>
                                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                            </select>
                            {/* Fuel Filter */}
                            <select
                                value={filterFuel}
                                onChange={e => setFilterFuel(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">All Fuel Types</option>
                                {fuelTypes.map(f => <option key={f.fuel_type_id} value={f.fuel_type_id}>{f.fuel_name}</option>)}
                            </select>
                            {/* Date From */}
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                title="Date From"
                            />
                            {/* Date To + Clear */}
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    title="Date To"
                                />
                                {(filterStation !== "" || filterFuel !== "" || searchQuery || dateFrom || dateTo) && (
                                    <button onClick={() => { setFilterStation(""); setFilterFuel(""); setSearchQuery(""); setDateFrom(""); setDateTo("") }}
                                        className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 text-sm">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {(filterStation !== "" || filterFuel !== "" || searchQuery || dateFrom || dateTo) && (
                            <p className="text-xs text-gray-400 mt-2">Showing {filteredData.filteredPumps.length} pumps across {filteredData.activeStations.length} stations</p>
                        )}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-gray-400 text-sm">Loading fuel inventory...</p>
                        </div>
                    </div>
                ) : filteredData.activeStations.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">No stations found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div>
                        {filteredData.activeStations.map(station => (
                            <StationBlock
                                key={station.station_id}
                                station={station}
                                pumps={filteredData.filteredPumps.filter(p => p.station_id === station.station_id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
