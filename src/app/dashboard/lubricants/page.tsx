"use client"

import { useState, useEffect } from "react"
import {
    Package, Plus, Edit, Trash2, Save, X, Loader2, RefreshCw, ShoppingCart,
    AlertCircle, DollarSign, Droplet
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Lubricant {
    lubricant_id: number
    lubricant_code: string
    lubricant_name: string
    brand: string | null
    category: string
    size_ml: number
    selling_price: number
    buying_price: number
    stock_quantity: number
    reorder_level: number
    color_code: string
    is_active: boolean
}

interface Station {
    station_id: number
    station_name: string
}

interface User {
    user_id: number
    full_name: string
}

const CATEGORIES = [
    { value: "engine_oil", label: "Engine Oil", icon: "🛢️" },
    { value: "gear_oil", label: "Gear Oil", icon: "⚙️" },
    { value: "brake_fluid", label: "Brake Fluid", icon: "🔴" },
    { value: "coolant", label: "Coolant", icon: "❄️" },
    { value: "grease", label: "Grease", icon: "🟡" },
]

// Generate code like LB01, LB02
function generateCode(count: number): string {
    return `LB${(count + 1).toString().padStart(2, "0")}`
}

// Lubricant Form Modal
function LubricantFormModal({
    lubricant,
    nextNumber,
    onSave,
    onClose,
}: {
    lubricant: Lubricant | null
    nextNumber: number
    onSave: (data: Partial<Lubricant>) => Promise<void>
    onClose: () => void
}) {
    const isEditing = !!lubricant
    const [loading, setLoading] = useState(false)
    const code = isEditing ? lubricant.lubricant_code : generateCode(nextNumber)
    const [formData, setFormData] = useState({
        lubricant_code: code,
        lubricant_name: lubricant?.lubricant_name || "",
        brand: lubricant?.brand || "",
        category: lubricant?.category || "engine_oil",
        size_ml: lubricant?.size_ml || 4000,
        buying_price: lubricant?.buying_price || 0,
        selling_price: lubricant?.selling_price || 0,
        stock_quantity: lubricant?.stock_quantity || 0,
        reorder_level: lubricant?.reorder_level || 5,
        is_active: lubricant?.is_active ?? true,
    })

    const profit = formData.selling_price - formData.buying_price
    const margin = formData.selling_price > 0 ? (profit / formData.selling_price * 100).toFixed(0) : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.lubricant_name) {
            toast.error("Required", "Enter lubricant name")
            return
        }
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed"
            toast.error("Error", msg)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditing ? "✏️ Edit Lubricant" : "➕ Add Lubricant"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code (Auto)</label>
                            <input
                                type="text"
                                value={formData.lubricant_code}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            />
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                        <input
                            type="text"
                            value={formData.lubricant_name}
                            onChange={(e) => setFormData({ ...formData, lubricant_name: e.target.value })}
                            placeholder="e.g., Shell Helix HX7 5W-40"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                placeholder="e.g., Shell, Castrol"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                        {/* Size */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Size (ml)</label>
                            <input
                                type="number"
                                value={formData.size_ml}
                                onChange={(e) => setFormData({ ...formData, size_ml: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Buying Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.buying_price}
                                onChange={(e) => setFormData({ ...formData, buying_price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                        {/* Selling Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.selling_price}
                                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Profit Preview */}
                    {profit !== 0 && (
                        <div className={`p-3 rounded-xl ${profit > 0 ? "bg-green-50" : "bg-red-50"}`}>
                            <div className="flex justify-between">
                                <span className={profit > 0 ? "text-green-700" : "text-red-700"}>Profit/Unit</span>
                                <span className={`font-bold ${profit > 0 ? "text-green-700" : "text-red-700"}`}>
                                    {formatCurrency(profit)} ({margin}%)
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                            <input
                                type="number"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                        {/* Reorder Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                            <input
                                type="number"
                                value={formData.reorder_level}
                                onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> {isEditing ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Sell Lubricant Modal
function SellLubricantModal({
    lubricant,
    stations,
    users,
    onSave,
    onClose,
}: {
    lubricant: Lubricant
    stations: Station[]
    users: User[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        station_id: stations[0]?.station_id || 0,
        attendant_id: 0,
        quantity: 1,
        payment_method: "cash" as "cash" | "mpesa",
        mpesa_receipt: "",
    })

    const totalAmount = lubricant.selling_price * formData.quantity

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.quantity > lubricant.stock_quantity) {
            toast.error("Insufficient Stock")
            return
        }
        setLoading(true)
        try {
            await onSave({
                lubricant_id: lubricant.lubricant_id,
                station_id: formData.station_id,
                attendant_id: formData.attendant_id || null,
                quantity: formData.quantity,
                unit_price: lubricant.selling_price,
                total_amount: totalAmount,
                payment_method: formData.payment_method,
                mpesa_receipt: formData.mpesa_receipt || null,
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
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                        Sell {lubricant.lubricant_name}
                    </h2>
                    <p className="text-sm text-gray-500">Stock: {lubricant.stock_quantity} • Price: {formatCurrency(lubricant.selling_price)}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold">-</button>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-center text-xl font-bold"
                                min={1}
                            />
                            <button type="button" onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-xl font-bold">+</button>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-green-700 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-green-700">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method: "cash" })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.payment_method === "cash" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        >
                            <span className="text-xl">💵</span>
                            <p className="text-sm font-medium">Cash</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method: "mpesa" })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.payment_method === "mpesa" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        >
                            <span className="text-xl">📱</span>
                            <p className="text-sm font-medium">M-Pesa</p>
                        </button>
                    </div>

                    {/* M-Pesa Receipt */}
                    {formData.payment_method === "mpesa" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Receipt</label>
                            <input
                                type="text"
                                value={formData.mpesa_receipt}
                                onChange={(e) => setFormData({ ...formData, mpesa_receipt: e.target.value.toUpperCase() })}
                                placeholder="e.g., SG12AB34CD"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} variant="success" className="flex-1">
                            <ShoppingCart className="w-4 h-4" /> Complete Sale
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Lubricants Page
export default function LubricantsPage() {
    const [lubricants, setLubricants] = useState<Lubricant[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFormModal, setShowFormModal] = useState(false)
    const [showSellModal, setShowSellModal] = useState(false)
    const [selectedLubricant, setSelectedLubricant] = useState<Lubricant | null>(null)

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
            const [lubRes, stRes, usRes] = await Promise.all([
                supabase.from("lubricants").select("*").order("lubricant_name"),
                supabase.from("stations").select("station_id, station_name").eq("is_active", true),
                supabase.from("users_new").select("user_id, full_name").eq("is_active", true),
            ])
            setLubricants(lubRes.data || [])
            setStations(stRes.data || [])
            setUsers(usRes.data || [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to load")
        }
        setLoading(false)
    }

    const handleSaveLubricant = async (data: Partial<Lubricant>) => {
        if (!supabase) throw new Error("No database")
        if (selectedLubricant) {
            const { error } = await supabase.from("lubricants").update(data).eq("lubricant_id", selectedLubricant.lubricant_id)
            if (error) throw error
            toast.success("Updated", data.lubricant_name || "")
        } else {
            const { error } = await supabase.from("lubricants").insert([data])
            if (error) throw error
            toast.success("Created", data.lubricant_name || "")
        }
        fetchData()
    }

    const handleSellLubricant = async (data: any) => {
        if (!supabase || !selectedLubricant) throw new Error("Invalid")
        // Insert sale
        const { error: saleError } = await supabase.from("lubricant_sales").insert([data])
        if (saleError) throw saleError
        // Update stock
        const { error: stockError } = await supabase
            .from("lubricants")
            .update({ stock_quantity: selectedLubricant.stock_quantity - data.quantity })
            .eq("lubricant_id", selectedLubricant.lubricant_id)
        if (stockError) throw stockError
        toast.success("Sale Complete", `${data.quantity}x ${selectedLubricant.lubricant_name}`)
        fetchData()
    }

    const handleDelete = async (lub: Lubricant) => {
        if (!confirm(`Delete ${lub.lubricant_name}?`)) return
        if (!supabase) return
        const { error } = await supabase.from("lubricants").delete().eq("lubricant_id", lub.lubricant_id)
        if (error) { toast.error("Error", error.message); return }
        toast.success("Deleted", lub.lubricant_name)
        fetchData()
    }

    const filteredLubricants = lubricants.filter((l) =>
        l.lubricant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: lubricants.length,
        lowStock: lubricants.filter((l) => l.stock_quantity <= l.reorder_level).length,
        totalValue: lubricants.reduce((acc, l) => acc + (l.selling_price * l.stock_quantity), 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-amber-600" />
                            Lubricants
                        </h1>
                        <p className="text-gray-500 text-sm">Manage lubricant products and sales</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button onClick={() => { setSelectedLubricant(null); setShowFormModal(true) }}>
                            <Plus className="w-4 h-4" /> Add Lubricant
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-blue-600 mb-1">Total Products</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-amber-600 mb-1">Low Stock</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.lowStock}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardContent className="p-4">
                            <p className="text-xs text-green-600 mb-1">Stock Value</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalValue)}</p>
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
                            placeholder="🔍 Search lubricants..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </CardContent>
                </Card>

                {/* Products Grid */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Products ({filteredLubricants.length})</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredLubricants.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No lubricants found</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredLubricants.map((lub) => {
                                    const isLowStock = lub.stock_quantity <= lub.reorder_level
                                    const cat = CATEGORIES.find(c => c.value === lub.category)
                                    return (
                                        <div key={lub.lubricant_id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all bg-white">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-2xl">{cat?.icon || "🛢️"}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-lg ${isLowStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                                    {lub.stock_quantity} in stock
                                                </span>
                                            </div>
                                            <p className="font-semibold text-gray-900 mb-1 truncate">{lub.lubricant_name}</p>
                                            <p className="text-xs text-gray-500 mb-2">{lub.brand} • {lub.size_ml}ml</p>
                                            <p className="text-xl font-bold text-green-600 mb-3">{formatCurrency(lub.selling_price)}</p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setSelectedLubricant(lub); setShowSellModal(true) }}
                                                    className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                                                >
                                                    <ShoppingCart className="w-4 h-4 inline mr-1" /> Sell
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedLubricant(lub); setShowFormModal(true) }}
                                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lub)}
                                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            {showFormModal && (
                <LubricantFormModal
                    lubricant={selectedLubricant}
                    nextNumber={lubricants.length}
                    onSave={handleSaveLubricant}
                    onClose={() => { setShowFormModal(false); setSelectedLubricant(null) }}
                />
            )}
            {showSellModal && selectedLubricant && (
                <SellLubricantModal
                    lubricant={selectedLubricant}
                    stations={stations}
                    users={users}
                    onSave={handleSellLubricant}
                    onClose={() => { setShowSellModal(false); setSelectedLubricant(null) }}
                />
            )}
        </DashboardLayout>
    )
}
