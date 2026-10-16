"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Truck, Plus, Save, X, Loader2, RefreshCw, Droplet, Building2, Calendar,
    TrendingUp, Fuel, Search, Filter, DollarSign, TrendingDown, Activity,
    Package, BarChart3, AlertCircle
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Refill {
    refill_id: number
    refill_code: string
    station_id: number
    fuel_type_id: number
    supplier_name: string | null
    delivery_note_no: string | null
    quantity_liters: number
    cost_per_liter: number | null
    total_cost: number | null
    delivery_date: string
    station?: { station_name: string }
    fuel_type?: { fuel_name: string; color_code: string }
}

interface Station {
    station_id: number
    station_name: string
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    color_code: string
    price_per_liter?: number
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
    fuel_type_id: number | null
}

interface FuelPrice {
    fuel_type_id: number
    selling_price: number
    effective_date: string
}

function generateRefillCode(count: number): string {
    return `RF-${(count + 1).toString().padStart(5, "0")}`
}

function AddRefillModal({
    stations, pumps, fuelTypes, nextNumber, onSave, onClose,
}: {
    stations: Station[]; pumps: Pump[]; fuelTypes: FuelType[]; nextNumber: number
    onSave: (data: any) => Promise<void>; onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const code = generateRefillCode(nextNumber)
    const [formData, setFormData] = useState({
        refill_code: code,
        station_id: stations[0]?.station_id || 0,
        pump_id: null as number | null,
        fuel_type_id: fuelTypes[0]?.fuel_type_id || 0,
        supplier_name: "",
        delivery_note_no: "",
        quantity_liters: 0,
        cost_per_liter: 0,
    })

    const filteredPumps = pumps.filter(p => p.station_id === formData.station_id)
    const totalCost = formData.quantity_liters * formData.cost_per_liter

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.quantity_liters) { toast.error("Required", "Enter quantity"); return }
        setLoading(true)
        try {
            await onSave({ ...formData, total_cost: totalCost, delivery_date: new Date().toISOString() })
            onClose()
        } catch (error: unknown) {
            toast.error("Error", error instanceof Error ? error.message : "Failed")
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Record Fuel Delivery</h2>
                            <p className="text-sm text-gray-500">{code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                            <select
                                value={formData.station_id}
                                onChange={e => setFormData({ ...formData, station_id: parseInt(e.target.value), pump_id: null })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Fuel className="w-3 h-3" /> Pump (optional)
                            </label>
                            <select
                                value={formData.pump_id || ""}
                                onChange={e => {
                                    const pumpId = e.target.value ? parseInt(e.target.value) : null
                                    const selectedPump = pumps.find(p => p.pump_id === pumpId)
                                    setFormData({ ...formData, pump_id: pumpId, fuel_type_id: selectedPump?.fuel_type_id || formData.fuel_type_id })
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                <option value="">— Select Pump —</option>
                                {filteredPumps.map(p => <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                        <select
                            value={formData.fuel_type_id}
                            onChange={e => setFormData({ ...formData, fuel_type_id: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                        >
                            {fuelTypes.map(ft => <option key={ft.fuel_type_id} value={ft.fuel_type_id}>{ft.fuel_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                        <input type="text" value={formData.supplier_name} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                            placeholder="e.g., Total Kenya" className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note No.</label>
                        <input type="text" value={formData.delivery_note_no} onChange={e => setFormData({ ...formData, delivery_note_no: e.target.value })}
                            placeholder="e.g., DN-12345" className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Liters) *</label>
                            <input type="number" step="0.01" value={formData.quantity_liters}
                                onChange={e => setFormData({ ...formData, quantity_liters: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-lg font-bold" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Liter (KES)</label>
                            <input type="number" step="0.01" value={formData.cost_per_liter}
                                onChange={e => setFormData({ ...formData, cost_per_liter: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
                        </div>
                    </div>
                    {totalCost > 0 && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">Total Cost</span>
                                <span className="text-2xl font-bold text-blue-700">{formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> Record Delivery
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function RefillsPage() {
    const [refills, setRefills] = useState<Refill[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showFilters, setShowFilters] = useState(true)

    // Per-fuel type sold liters from sales
    const [salesByFuelStation, setSalesByFuelStation] = useState<Record<string, number>>({})

    // Filters
    const [filterStation, setFilterStation] = useState<number | "">("")
    const [filterFuel, setFilterFuel] = useState<number | "">("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    const today = new Date().toISOString().split("T")[0]

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error")
                setLoading(false)
                return
            }
            const [refRes, stRes, pmpRes, ftRes, priceRes, salesRes] = await Promise.all([
                supabase.from("fuel_refills").select("*, station:stations(station_name), fuel_type:fuel_types(fuel_name, color_code)").order("delivery_date", { ascending: false }).limit(500),
                supabase.from("stations").select("station_id, station_name").eq("is_active", true),
                supabase.from("pumps").select("pump_id, pump_name, station_id, fuel_type_id").eq("is_active", true),
                supabase.from("fuel_types").select("fuel_type_id, fuel_name, color_code, price_per_liter").eq("is_active", true),
                supabase.from("fuel_prices").select("fuel_type_id, selling_price, effective_date").order("effective_date", { ascending: false }),
                supabase.from("sales").select("pump_id, liters_sold, fuel_type_id, station_id, transaction_status, created_at").neq("transaction_status", "PENDING").limit(10000),
            ])

            setRefills(refRes.data || [])
            setStations(stRes.data || [])
            setPumps(pmpRes.data || [])
            setFuelTypes(ftRes.data || [])
            setFuelPrices(priceRes.data || [])

            // Build sold map: key = stationId_fuelTypeId
            const soldMap: Record<string, number> = {}
            for (const s of (salesRes.data || [])) {
                const pump = (pmpRes.data || []).find((p: Pump) => p.pump_id === s.pump_id)
                const fuelId = s.fuel_type_id || pump?.fuel_type_id
                const stId = s.station_id || pump?.station_id
                if (!fuelId || !stId) continue
                const key = `${stId}_${fuelId}`
                soldMap[key] = (soldMap[key] || 0) + (s.liters_sold || 0)
            }
            setSalesByFuelStation(soldMap)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load")
        }
        setLoading(false)
    }

    const handleSaveRefill = async (data: any) => {
        if (!supabase) throw new Error("No database")
        const { error } = await supabase.from("fuel_refills").insert([data])
        if (error) throw error
        toast.success("Recorded", `${data.quantity_liters}L delivered`)
        fetchData()
    }

    // Get latest selling price per fuel type (fallback to fuel_types.price_per_liter)
    const getSellingPrice = (fuelTypeId: number): number => {
        const prices = fuelPrices.filter(p => p.fuel_type_id === fuelTypeId)
        if (prices.length) return prices[0].selling_price
        // Fallback: use price_per_liter from fuel_types table
        const ft = fuelTypes.find(f => f.fuel_type_id === fuelTypeId)
        return ft?.price_per_liter || 0
    }

    // Enriched refills with sold, available, profit
    const enrichedRefills = useMemo(() => {
        return refills.map(r => {
            const key = `${r.station_id}_${r.fuel_type_id}`
            // Proportional sold (if multiple refills for same station/fuel, distribute equally)
            const totalRefillLiters = refills
                .filter(x => x.station_id === r.station_id && x.fuel_type_id === r.fuel_type_id)
                .reduce((s, x) => s + x.quantity_liters, 0)
            const totalSold = salesByFuelStation[key] || 0
            const proportion = totalRefillLiters > 0 ? r.quantity_liters / totalRefillLiters : 0
            const sold = Math.min(r.quantity_liters, totalSold * proportion)
            const available = Math.max(0, r.quantity_liters - sold)
            const sellingPrice = getSellingPrice(r.fuel_type_id)
            const costPrice = r.cost_per_liter || 0
            const profitPerLiter = sellingPrice - costPrice
            const expectedProfit = r.quantity_liters * profitPerLiter
            const actualProfit = sold * profitPerLiter
            return { ...r, sold, available, sellingPrice, profitPerLiter, expectedProfit, actualProfit }
        })
    }, [refills, salesByFuelStation, fuelPrices])

    // Apply filters
    const filteredRefills = useMemo(() => {
        let result = enrichedRefills
        if (filterStation !== "") result = result.filter(r => r.station_id === Number(filterStation))
        if (filterFuel !== "") result = result.filter(r => r.fuel_type_id === Number(filterFuel))
        if (filterDateFrom) result = result.filter(r => new Date(r.delivery_date) >= new Date(filterDateFrom))
        if (filterDateTo) result = result.filter(r => new Date(r.delivery_date) <= new Date(filterDateTo + "T23:59:59"))
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(r =>
                r.refill_code?.toLowerCase().includes(q) ||
                r.supplier_name?.toLowerCase().includes(q) ||
                r.delivery_note_no?.toLowerCase().includes(q) ||
                r.station?.station_name?.toLowerCase().includes(q) ||
                r.fuel_type?.fuel_name?.toLowerCase().includes(q)
            )
        }
        return result
    }, [enrichedRefills, filterStation, filterFuel, filterDateFrom, filterDateTo, searchQuery])

    // Stats
    const stats = useMemo(() => {
        const todayStr = new Date().toDateString()
        const todayRefills = filteredRefills.filter(r => new Date(r.delivery_date).toDateString() === todayStr)
        return {
            totalDeliveries: filteredRefills.length,
            totalLiters: filteredRefills.reduce((acc, r) => acc + r.quantity_liters, 0),
            totalCost: filteredRefills.reduce((acc, r) => acc + (r.total_cost || 0), 0),
            totalExpectedProfit: filteredRefills.reduce((acc, r) => acc + r.expectedProfit, 0),
            todayProfit: todayRefills.reduce((acc, r) => acc + r.actualProfit, 0),
            totalSold: filteredRefills.reduce((acc, r) => acc + r.sold, 0),
        }
    }, [filteredRefills])

    const hasFilters = filterStation !== "" || filterFuel !== "" || filterDateFrom || filterDateTo || searchQuery

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md shadow-blue-300/30">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            Fuel Refills
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Track fuel deliveries, sold, available stock & profit</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                            <Filter className="w-4 h-4" /> Filters
                        </Button>
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4" /> Record Delivery
                        </Button>
                    </div>
                </div>

                {/* Profit Cards — Top row */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg shadow-green-300/30">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-100" />
                            <span className="text-sm font-medium text-green-100">Total Expected Profit</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(stats.totalExpectedProfit)}</p>
                        <p className="text-green-100 text-xs mt-1">Based on {filteredRefills.length} refills</p>
                    </div>
                    <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-300/30">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-blue-100" />
                            <span className="text-sm font-medium text-blue-100">Today's Profit</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(stats.todayProfit)}</p>
                        <p className="text-blue-100 text-xs mt-1">From sold fuel today</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-orange-600 mb-1 font-medium">Total Deliveries</p>
                        <p className="text-xl font-bold text-orange-700">{stats.totalDeliveries}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-cyan-600 mb-1 font-medium">Total Liters In</p>
                        <p className="text-xl font-bold text-cyan-700">{stats.totalLiters.toLocaleString()} L</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-purple-600 mb-1 font-medium">Total Investment</p>
                        <p className="text-xl font-bold text-purple-700">{formatCurrency(stats.totalCost)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-red-600 mb-1 font-medium">Total Sold</p>
                        <p className="text-xl font-bold text-red-700">{stats.totalSold.toFixed(0)} L</p>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search refills..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <select value={filterStation} onChange={e => setFilterStation(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">All Stations</option>
                                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                            </select>
                            <select value={filterFuel} onChange={e => setFilterFuel(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">All Fuel Types</option>
                                {fuelTypes.map(f => <option key={f.fuel_type_id} value={f.fuel_type_id}>{f.fuel_name}</option>)}
                            </select>
                            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Date From" />
                            <div className="flex gap-2">
                                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Date To" />
                                {hasFilters && (
                                    <button onClick={() => { setFilterStation(""); setFilterFuel(""); setFilterDateFrom(""); setFilterDateTo(""); setSearchQuery("") }}
                                        className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {hasFilters && <p className="text-xs text-gray-400 mt-2">Showing {filteredRefills.length} of {refills.length} records</p>}
                    </div>
                )}

                {/* Refills Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            Delivery History
                            <span className="ml-auto text-sm font-normal text-gray-400">{filteredRefills.length} records</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredRefills.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No deliveries found</p>
                                {hasFilters && <p className="text-sm text-gray-400 mt-1">Try clearing filters</p>}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fuel</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Purchased (L)</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Sold (L)</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Available (L)</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cost/L</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Sell/L</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Exp. Profit</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRefills.map(ref => {
                                            const availPct = ref.quantity_liters > 0 ? (ref.available / ref.quantity_liters) * 100 : 0
                                            return (
                                                <tr key={ref.refill_id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {new Date(ref.delivery_date).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-mono text-blue-600">{ref.refill_code}</td>
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{ref.station?.station_name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                                                            style={{
                                                                backgroundColor: (ref.fuel_type?.color_code || "#3B82F6") + "20",
                                                                color: ref.fuel_type?.color_code || "#3B82F6"
                                                            }}>
                                                            {ref.fuel_type?.fuel_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">{ref.supplier_name || "—"}</td>
                                                    <td className="py-3 px-4 text-right font-semibold text-blue-700">
                                                        {ref.quantity_liters.toLocaleString()} L
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-orange-600">
                                                        {ref.sold > 0 ? `${ref.sold.toFixed(1)} L` : "—"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div>
                                                            <span className={`font-semibold text-sm ${availPct > 30 ? "text-green-600" : availPct > 10 ? "text-amber-600" : "text-red-600"}`}>
                                                                {ref.available > 0 ? `${ref.available.toFixed(1)} L` : "—"}
                                                            </span>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${availPct > 30 ? "bg-green-400" : availPct > 10 ? "bg-amber-400" : "bg-red-400"}`}
                                                                    style={{ width: `${availPct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                                                        {ref.cost_per_liter ? `KES ${ref.cost_per_liter.toFixed(2)}` : "—"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-emerald-600 font-medium">
                                                        {ref.sellingPrice ? `KES ${ref.sellingPrice.toFixed(2)}` : "—"}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`font-bold text-sm ${ref.expectedProfit > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                                                            {ref.expectedProfit > 0 ? formatCurrency(ref.expectedProfit) : "—"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                                                        {ref.total_cost ? formatCurrency(ref.total_cost) : "—"}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-emerald-200">
                                            <td colSpan={5} className="py-3 px-4 text-sm font-bold text-gray-700">TOTALS</td>
                                            <td className="py-3 px-4 text-right font-bold text-blue-700">{filteredRefills.reduce((s, r) => s + r.quantity_liters, 0).toLocaleString()} L</td>
                                            <td className="py-3 px-4 text-right font-bold text-orange-600">{filteredRefills.reduce((s, r) => s + r.sold, 0).toFixed(1)} L</td>
                                            <td className="py-3 px-4 text-right font-bold text-green-600">{filteredRefills.reduce((s, r) => s + r.available, 0).toFixed(1)} L</td>
                                            <td colSpan={2} />
                                            <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(stats.totalExpectedProfit)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-700">{formatCurrency(filteredRefills.reduce((s, r) => s + (r.total_cost || 0), 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showModal && (
                <AddRefillModal
                    stations={stations} pumps={pumps} fuelTypes={fuelTypes}
                    nextNumber={refills.length} onSave={handleSaveRefill} onClose={() => setShowModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
