"use client"

import { useState, useEffect } from "react"
import {
    Truck, Plus, Save, X, Loader2, RefreshCw, Droplet, Building2, Calendar,
    FileText, TrendingUp
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
}

function generateRefillCode(count: number): string {
    return `RF-${(count + 1).toString().padStart(5, "0")}`
}

// Add Refill Modal
function AddRefillModal({
    stations,
    fuelTypes,
    nextNumber,
    onSave,
    onClose,
}: {
    stations: Station[]
    fuelTypes: FuelType[]
    nextNumber: number
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const code = generateRefillCode(nextNumber)
    const [formData, setFormData] = useState({
        refill_code: code,
        station_id: stations[0]?.station_id || 0,
        fuel_type_id: fuelTypes[0]?.fuel_type_id || 0,
        supplier_name: "",
        delivery_note_no: "",
        quantity_liters: 0,
        cost_per_liter: 0,
    })

    const totalCost = formData.quantity_liters * formData.cost_per_liter

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.quantity_liters) {
            toast.error("Required", "Enter quantity")
            return
        }
        setLoading(true)
        try {
            await onSave({
                ...formData,
                total_cost: totalCost,
                delivery_date: new Date().toISOString(),
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
                        {/* Station */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                            <select
                                value={formData.station_id}
                                onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {stations.map((s) => (
                                    <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Fuel Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                            <select
                                value={formData.fuel_type_id}
                                onChange={(e) => setFormData({ ...formData, fuel_type_id: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {fuelTypes.map((ft) => (
                                    <option key={ft.fuel_type_id} value={ft.fuel_type_id}>{ft.fuel_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Supplier */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                        <input
                            type="text"
                            value={formData.supplier_name}
                            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                            placeholder="e.g., Total Kenya, Vivo Energy"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>

                    {/* Delivery Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note No.</label>
                        <input
                            type="text"
                            value={formData.delivery_note_no}
                            onChange={(e) => setFormData({ ...formData, delivery_note_no: e.target.value })}
                            placeholder="e.g., DN-12345"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Liters) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.quantity_liters}
                                onChange={(e) => setFormData({ ...formData, quantity_liters: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-lg font-bold"
                                required
                            />
                        </div>
                        {/* Cost per Liter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Liter (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.cost_per_liter}
                                onChange={(e) => setFormData({ ...formData, cost_per_liter: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Total Cost */}
                    {totalCost > 0 && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">Total Cost</span>
                                <span className="text-2xl font-bold text-blue-700">{formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
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

// Main Refills Page
export default function RefillsPage() {
    const [refills, setRefills] = useState<Refill[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error")
                setLoading(false)
                return
            }
            const [refRes, stRes, ftRes] = await Promise.all([
                supabase.from("fuel_refills").select("*, station:stations(station_name), fuel_type:fuel_types(fuel_name, color_code)").order("delivery_date", { ascending: false }).limit(100),
                supabase.from("stations").select("station_id, station_name").eq("is_active", true),
                supabase.from("fuel_types").select("fuel_type_id, fuel_name, color_code").eq("is_active", true),
            ])
            setRefills(refRes.data || [])
            setStations(stRes.data || [])
            setFuelTypes(ftRes.data || [])
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

    // Stats
    const stats = {
        totalDeliveries: refills.length,
        totalLiters: refills.reduce((acc, r) => acc + (r.quantity_liters || 0), 0),
        totalCost: refills.reduce((acc, r) => acc + (r.total_cost || 0), 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Truck className="w-6 h-6 text-blue-600" />
                            Fuel Refills
                        </h1>
                        <p className="text-gray-500 text-sm">Track fuel deliveries to stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4" /> Record Delivery
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-blue-600 mb-1">Total Deliveries</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.totalDeliveries}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-green-600 mb-1">Total Liters</p>
                            <p className="text-2xl font-bold text-green-700">{stats.totalLiters.toLocaleString()} L</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-purple-600 mb-1">Total Investment</p>
                            <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalCost)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Refills Table */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Delivery History</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : refills.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No deliveries recorded yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Code</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Station</th>
                                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Fuel</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Liters</th>
                                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refills.map((ref) => (
                                            <tr key={ref.refill_id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3 px-3 text-sm">
                                                    {new Date(ref.delivery_date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-3 text-sm font-mono">{ref.refill_code}</td>
                                                <td className="py-3 px-3 text-sm">{ref.station?.station_name}</td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className="px-2 py-1 rounded-lg text-xs font-medium"
                                                        style={{
                                                            backgroundColor: (ref.fuel_type?.color_code || "#3B82F6") + "20",
                                                            color: ref.fuel_type?.color_code || "#3B82F6"
                                                        }}
                                                    >
                                                        {ref.fuel_type?.fuel_name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right font-semibold text-green-600">
                                                    {ref.quantity_liters.toLocaleString()} L
                                                </td>
                                                <td className="py-3 px-3 text-right text-sm">
                                                    {ref.total_cost ? formatCurrency(ref.total_cost) : "—"}
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

            {/* Modal */}
            {showModal && (
                <AddRefillModal
                    stations={stations}
                    fuelTypes={fuelTypes}
                    nextNumber={refills.length}
                    onSave={handleSaveRefill}
                    onClose={() => setShowModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
