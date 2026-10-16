"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Gauge, Plus, Save, X, Loader2, RefreshCw, Droplet, Building2,
    TrendingUp, Fuel, AlertCircle, Activity, Truck, BarChart3, ArrowUp, ArrowDown
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface DipReading {
    dip_reading_id: number
    station_id: number
    fuel_type_id: number
    reading_liters: number
    reading_type: string
    recorded_by: number | null
    notes: string | null
    created_at: string
    station?: { station_name: string }
    fuel_type?: { fuel_name: string; color_code: string; price_per_liter: number }
}

interface Station {
    station_id: number
    station_name: string
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    color_code: string
    price_per_liter: number
}

interface FuelStock {
    stationId: number
    stationName: string
    fuelTypeId: number
    fuelName: string
    colorCode: string
    pricePerLiter: number
    lastDipReading: number
    lastDipDate: string
    refillsSinceDip: number
    salesSinceDip: number
    currentStock: number
    stockValue: number
}

// ==================== ADD DIP READING MODAL ====================
function AddDipReadingModal({
    stations, fuelTypes, onSave, onClose
}: {
    stations: Station[]; fuelTypes: FuelType[]
    onSave: (data: any) => Promise<void>; onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        station_id: stations[0]?.station_id || 0,
        fuel_type_id: fuelTypes[0]?.fuel_type_id || 0,
        reading_liters: 0,
        reading_type: "manual",
        notes: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.reading_liters || formData.reading_liters <= 0) {
            toast.error("Required", "Enter a valid dip reading in liters")
            return
        }
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error: unknown) {
            toast.error("Error", error instanceof Error ? error.message : "Failed to save")
        }
        setLoading(false)
    }

    const selectedFuel = fuelTypes.find(f => f.fuel_type_id === formData.fuel_type_id)

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Gauge className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Record Dip Reading</h2>
                            <p className="text-sm text-gray-500">Measure current fuel tank level</p>
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
                                onChange={e => setFormData({ ...formData, station_id: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                            </select>
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
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dip Reading (Liters) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.reading_liters || ""}
                            onChange={e => setFormData({ ...formData, reading_liters: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g. 5000"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-lg font-bold"
                            required
                        />
                    </div>
                    {selectedFuel && formData.reading_liters > 0 && (
                        <div className="p-4 bg-emerald-50 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-700 font-medium">Stock Value</span>
                                <span className="text-2xl font-bold text-emerald-700">
                                    {formatCurrency(formData.reading_liters * selectedFuel.price_per_liter)}
                                </span>
                            </div>
                            <p className="text-emerald-600 text-xs mt-1">
                                {formData.reading_liters.toLocaleString()} L × KES {selectedFuel.price_per_liter}/L
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="e.g., Morning dip check"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> Record Reading
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==================== MAIN PAGE ====================
export default function DipReadingsPage() {
    const [dipReadings, setDipReadings] = useState<DipReading[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filterStation, setFilterStation] = useState<number | "">("")

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error")
                setLoading(false)
                return
            }
            const [dipRes, stRes, ftRes, refillRes, salesRes] = await Promise.all([
                supabase.from("dip_readings")
                    .select("*, station:stations(station_name), fuel_type:fuel_types(fuel_name, color_code, price_per_liter)")
                    .order("created_at", { ascending: false })
                    .limit(500),
                supabase.from("stations").select("station_id, station_name").eq("is_active", true),
                supabase.from("fuel_types").select("fuel_type_id, fuel_name, color_code, price_per_liter").eq("is_active", true),
                supabase.from("fuel_refills").select("refill_id, station_id, fuel_type_id, quantity_liters, delivery_date"),
                supabase.from("sales")
                    .select("sale_id, station_id, fuel_type_id, liters_sold, created_at")
                    .neq("transaction_status", "PENDING")
                    .neq("transaction_status", "CANCELLED"),
            ])

            setDipReadings(dipRes.data || [])
            setStations(stRes.data || [])
            setFuelTypes(ftRes.data || [])

            // Store for stock calculation
            _refillsCache = refillRes.data || []
            _salesCache = salesRes.data || []
        } catch (error) {
            console.error(error)
            toast.error("Failed to load")
        }
        setLoading(false)
    }

    // Temp storage for refills and sales for stock computation
    let _refillsCache: any[] = []
    let _salesCache: any[] = []

    // Calculate current fuel stock per station per fuel type
    const fuelStockData = useMemo(() => {
        const stockMap: FuelStock[] = []
        const stationsList = filterStation !== "" ? stations.filter(s => s.station_id === Number(filterStation)) : stations

        for (const station of stationsList) {
            for (const fuel of fuelTypes) {
                // Find latest dip reading for this station+fuel
                const latestDip = dipReadings.find(
                    d => d.station_id === station.station_id && d.fuel_type_id === fuel.fuel_type_id
                )
                const lastDipReading = latestDip?.reading_liters || 0
                const lastDipDate = latestDip?.created_at || ""

                // Sum refills AFTER the last dip reading
                const refillsSinceDip = _refillsCache
                    .filter(r =>
                        r.station_id === station.station_id &&
                        r.fuel_type_id === fuel.fuel_type_id &&
                        (!lastDipDate || new Date(r.delivery_date) > new Date(lastDipDate))
                    )
                    .reduce((sum: number, r: any) => sum + (r.quantity_liters || 0), 0)

                // Sum sales AFTER the last dip reading
                const salesSinceDip = _salesCache
                    .filter((s: any) =>
                        s.station_id === station.station_id &&
                        s.fuel_type_id === fuel.fuel_type_id &&
                        (!lastDipDate || new Date(s.created_at) > new Date(lastDipDate))
                    )
                    .reduce((sum: number, s: any) => sum + (s.liters_sold || 0), 0)

                const currentStock = lastDipReading + refillsSinceDip - salesSinceDip
                const stockValue = currentStock * fuel.price_per_liter

                // Only add if there's a dip reading or any activity
                if (lastDipReading > 0 || refillsSinceDip > 0 || salesSinceDip > 0) {
                    stockMap.push({
                        stationId: station.station_id,
                        stationName: station.station_name,
                        fuelTypeId: fuel.fuel_type_id,
                        fuelName: fuel.fuel_name,
                        colorCode: fuel.color_code,
                        pricePerLiter: fuel.price_per_liter,
                        lastDipReading,
                        lastDipDate,
                        refillsSinceDip,
                        salesSinceDip,
                        currentStock: Math.max(0, currentStock),
                        stockValue: Math.max(0, stockValue),
                    })
                }
            }
        }
        return stockMap
    }, [dipReadings, stations, fuelTypes, filterStation, _refillsCache, _salesCache])

    const handleSaveDipReading = async (data: any) => {
        if (!supabase) throw new Error("No database")
        const { error } = await supabase.from("dip_readings").insert([{
            station_id: data.station_id,
            fuel_type_id: data.fuel_type_id,
            reading_liters: data.reading_liters,
            reading_type: data.reading_type,
            notes: data.notes || null,
        }])
        if (error) throw error
        toast.success("Recorded", `Dip reading: ${data.reading_liters.toLocaleString()} L`)
        fetchData()
    }

    // Stats
    const totalStockLiters = fuelStockData.reduce((s, f) => s + f.currentStock, 0)
    const totalStockValue = fuelStockData.reduce((s, f) => s + f.stockValue, 0)
    const totalRefills = fuelStockData.reduce((s, f) => s + f.refillsSinceDip, 0)
    const totalSold = fuelStockData.reduce((s, f) => s + f.salesSinceDip, 0)

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md shadow-emerald-300/30">
                                <Gauge className="w-5 h-5 text-white" />
                            </div>
                            Dip Readings & Fuel Stock
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Track tank levels, manage fuel stock with live calculations</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStation}
                            onChange={e => setFilterStation(e.target.value === "" ? "" : Number(e.target.value))}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                        >
                            <option value="">All Stations</option>
                            {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                        </select>
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4" /> New Dip Reading
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg shadow-green-300/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Droplet className="w-5 h-5 text-green-100" />
                            <span className="text-sm font-medium text-green-100">Total Stock</span>
                        </div>
                        <p className="text-3xl font-bold">{totalStockLiters.toLocaleString()} L</p>
                        <p className="text-green-100 text-xs mt-1">Across all stations</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-300/30">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-blue-100" />
                            <span className="text-sm font-medium text-blue-100">Stock Value</span>
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(totalStockValue)}</p>
                        <p className="text-blue-100 text-xs mt-1">At selling price</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-1 mb-1"><ArrowUp className="w-3 h-3 text-cyan-600" />
                            <p className="text-xs text-cyan-600 font-medium">Refills Since Dip</p></div>
                        <p className="text-xl font-bold text-cyan-700">{totalRefills.toLocaleString()} L</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-1 mb-1"><ArrowDown className="w-3 h-3 text-orange-600" />
                            <p className="text-xs text-orange-600 font-medium">Sales Since Dip</p></div>
                        <p className="text-xl font-bold text-orange-700">{totalSold.toLocaleString()} L</p>
                    </div>
                </div>

                {/* Fuel Stock Level Cards */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                ) : fuelStockData.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Gauge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">No dip readings recorded yet</p>
                            <p className="text-sm text-gray-400 mt-1">Click &quot;New Dip Reading&quot; to start tracking fuel levels</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                    Current Fuel Stock Levels
                                    <span className="ml-auto text-sm font-normal text-gray-400">{fuelStockData.length} items</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {fuelStockData.map((stock, idx) => {
                                        // Calculate stock % (assume 10000L tank capacity for visual
                                        const tankCapacity = Math.max(stock.lastDipReading + stock.refillsSinceDip, 10000)
                                        const stockPct = (stock.currentStock / tankCapacity) * 100
                                        const isLow = stockPct < 20
                                        const isCritical = stockPct < 10

                                        return (
                                            <div
                                                key={idx}
                                                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                            style={{ backgroundColor: stock.colorCode + "20" }}
                                                        >
                                                            <Droplet className="w-5 h-5" style={{ color: stock.colorCode }} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900">{stock.fuelName}</p>
                                                            <p className="text-xs text-gray-500">{stock.stationName}</p>
                                                        </div>
                                                    </div>
                                                    {isCritical && (
                                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg animate-pulse">
                                                            ⚠️ CRITICAL
                                                        </span>
                                                    )}
                                                    {isLow && !isCritical && (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-lg">
                                                            LOW
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Stock level bar */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-lg" style={{ color: stock.colorCode }}>
                                                            {stock.currentStock.toLocaleString()} L
                                                        </span>
                                                        <span className="text-gray-400">{stockPct.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isCritical ? "bg-red-500" : isLow ? "bg-amber-400" : ""}`}
                                                            style={{
                                                                width: `${Math.min(100, stockPct)}%`,
                                                                backgroundColor: !isCritical && !isLow ? stock.colorCode : undefined
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Breakdown */}
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="bg-blue-50 rounded-lg p-2">
                                                        <p className="text-xs text-blue-600">Last Dip</p>
                                                        <p className="text-sm font-bold text-blue-700">{stock.lastDipReading.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded-lg p-2">
                                                        <p className="text-xs text-green-600">+ Refills</p>
                                                        <p className="text-sm font-bold text-green-700">{stock.refillsSinceDip.toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-orange-50 rounded-lg p-2">
                                                        <p className="text-xs text-orange-600">− Sales</p>
                                                        <p className="text-sm font-bold text-orange-700">{stock.salesSinceDip.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                {/* Value & last updated */}
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(stock.stockValue)}</span>
                                                    {stock.lastDipDate && (
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(stock.lastDipDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dip Reading History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Gauge className="w-5 h-5 text-green-500" />
                                    Dip Reading History
                                    <span className="ml-auto text-sm font-normal text-gray-400">{dipReadings.length} records</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fuel Type</th>
                                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Reading (L)</th>
                                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Value</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dipReadings.slice(0, 50).map(dip => (
                                                <tr key={dip.dip_reading_id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {new Date(dip.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                                                        <span className="text-gray-400 text-xs ml-1">
                                                            {new Date(dip.created_at).toLocaleTimeString("en-KE", { timeStyle: "short" })}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{dip.station?.station_name}</td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                                                            style={{
                                                                backgroundColor: (dip.fuel_type?.color_code || "#3B82F6") + "20",
                                                                color: dip.fuel_type?.color_code || "#3B82F6"
                                                            }}
                                                        >
                                                            {dip.fuel_type?.fuel_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                                        {dip.reading_liters.toLocaleString()} L
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                                                        {formatCurrency(dip.reading_liters * (dip.fuel_type?.price_per_liter || 0))}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${dip.reading_type === "delivery" ? "bg-blue-100 text-blue-600" :
                                                                dip.reading_type === "adjustment" ? "bg-amber-100 text-amber-600" :
                                                                    "bg-gray-100 text-gray-600"
                                                            }`}>
                                                            {dip.reading_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">{dip.notes || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {showModal && (
                <AddDipReadingModal
                    stations={stations}
                    fuelTypes={fuelTypes}
                    onSave={handleSaveDipReading}
                    onClose={() => setShowModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
