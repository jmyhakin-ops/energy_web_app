"use client"

import { useState, useEffect } from "react"
import {
    DollarSign, Edit, Save, X, Loader2, RefreshCw, TrendingUp, TrendingDown,
    AlertCircle, CheckCircle, Droplet, History
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    fuel_code: string
    price_per_liter: number
    color_code: string
    is_active: boolean
    updated_at: string
}

// Edit Price Modal
function EditPriceModal({
    fuelType,
    onSave,
    onClose,
}: {
    fuelType: FuelType
    onSave: (newPrice: number) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [newPrice, setNewPrice] = useState(fuelType.price_per_liter)
    const priceDiff = newPrice - fuelType.price_per_liter
    const percentChange = fuelType.price_per_liter > 0
        ? ((priceDiff / fuelType.price_per_liter) * 100).toFixed(1)
        : "0"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPrice <= 0) {
            toast.error("Invalid", "Price must be greater than 0")
            return
        }
        setLoading(true)
        try {
            await onSave(newPrice)
            onClose()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed"
            toast.error("Error", msg)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: fuelType.color_code + "20" }}
                        >
                            <Droplet className="w-6 h-6" style={{ color: fuelType.color_code }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Update Price</h2>
                            <p className="text-sm text-gray-500">{fuelType.fuel_name}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Current Price */}
                    <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Current Price</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(fuelType.price_per_liter)}/L</p>
                    </div>

                    {/* New Price Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Price (KES/L)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newPrice}
                            onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-center"
                            autoFocus
                        />
                    </div>

                    {/* Price Change Preview */}
                    {priceDiff !== 0 && (
                        <div className={`p-3 rounded-xl flex items-center justify-between ${priceDiff > 0 ? "bg-red-50" : "bg-green-50"}`}>
                            <div className="flex items-center gap-2">
                                {priceDiff > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-red-600" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-green-600" />
                                )}
                                <span className={priceDiff > 0 ? "text-red-700" : "text-green-700"}>
                                    {priceDiff > 0 ? "Increase" : "Decrease"}
                                </span>
                            </div>
                            <span className={`font-bold ${priceDiff > 0 ? "text-red-700" : "text-green-700"}`}>
                                {priceDiff > 0 ? "+" : ""}{formatCurrency(priceDiff)} ({percentChange}%)
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> Update
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Prices Page
export default function FuelPricesPage() {
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [loading, setLoading] = useState(true)
    const [editingFuel, setEditingFuel] = useState<FuelType | null>(null)

    useEffect(() => {
        fetchFuelTypes()
    }, [])

    const fetchFuelTypes = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error")
                setLoading(false)
                return
            }
            const { data, error } = await supabase
                .from("fuel_types")
                .select("*")
                .order("fuel_name")
            if (error) throw error
            setFuelTypes(data || [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to load")
        }
        setLoading(false)
    }

    const handleUpdatePrice = async (newPrice: number) => {
        if (!supabase || !editingFuel) throw new Error("Invalid")
        const { error } = await supabase
            .from("fuel_types")
            .update({
                price_per_liter: newPrice,
                updated_at: new Date().toISOString()
            })
            .eq("fuel_type_id", editingFuel.fuel_type_id)
        if (error) throw error
        toast.success("Price Updated", `${editingFuel.fuel_name}: ${formatCurrency(newPrice)}/L`)
        fetchFuelTypes()
    }

    // Stats
    const avgPrice = fuelTypes.length > 0
        ? fuelTypes.reduce((acc, ft) => acc + ft.price_per_liter, 0) / fuelTypes.length
        : 0
    const maxPrice = fuelTypes.length > 0 ? Math.max(...fuelTypes.map(ft => ft.price_per_liter)) : 0
    const minPrice = fuelTypes.length > 0 ? Math.min(...fuelTypes.map(ft => ft.price_per_liter)) : 0

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-green-600" />
                            Fuel Prices
                        </h1>
                        <p className="text-gray-500 text-sm">Manage fuel prices across all types</p>
                    </div>
                    <Button variant="outline" onClick={fetchFuelTypes}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-green-600 mb-1">Average Price</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(avgPrice)}/L</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-blue-600 mb-1">Highest</p>
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(maxPrice)}/L</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-purple-600 mb-1">Lowest</p>
                            <p className="text-2xl font-bold text-purple-700">{formatCurrency(minPrice)}/L</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Fuel Prices Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Current Prices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : fuelTypes.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Droplet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No fuel types found. Add fuel types first.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {fuelTypes.map((fuel) => (
                                    <div
                                        key={fuel.fuel_type_id}
                                        className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: fuel.color_code + "20" }}
                                                >
                                                    <Droplet className="w-6 h-6" style={{ color: fuel.color_code }} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{fuel.fuel_name}</p>
                                                    <p className="text-xs text-gray-500">{fuel.fuel_code}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-xs ${fuel.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {fuel.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-3xl font-bold text-gray-900">
                                                {formatCurrency(fuel.price_per_liter)}
                                                <span className="text-sm font-normal text-gray-500">/L</span>
                                            </p>
                                            {fuel.updated_at && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <History className="w-3 h-3" />
                                                    Updated {new Date(fuel.updated_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setEditingFuel(fuel)}
                                            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Update Price
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            {editingFuel && (
                <EditPriceModal
                    fuelType={editingFuel}
                    onSave={handleUpdatePrice}
                    onClose={() => setEditingFuel(null)}
                />
            )}
        </DashboardLayout>
    )
}
