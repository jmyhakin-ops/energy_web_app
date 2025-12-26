"use client"

import { useState, useEffect } from "react"
import {
    Wallet, Download, CheckCircle, XCircle, Clock, Loader2, RefreshCw,
    Fuel, Building2, Plus, X, Save, CreditCard
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Sale interface matching database schema
interface Sale {
    sale_id: number
    pump_shift_id: number
    fuel_type_id: number
    liters_sold: number
    price_per_liter: number
    total_amount: number
    payment_method: string
    mpesa_transaction_id: string | null
    sale_time: string
    station_id: number
    pump_id: number
    attendant_id: number
    station?: { station_id: number; station_name: string }
    pump?: { pump_id: number; pump_name: string }
    attendant?: { user_id: number; full_name: string }
    fuel_type?: { fuel_type_id: number; fuel_name: string }
}

interface Station {
    station_id: number
    station_name: string
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    price_per_liter: number
}

interface User {
    user_id: number
    full_name: string
}

// Generate receipt code like RCP-00001, RCP-00002, etc.
function generateReceiptCode(count: number): string {
    const nextNum = count + 1
    const paddedNum = nextNum.toString().padStart(5, "0")
    return `RCP-${paddedNum}`
}

// Add Sale Modal
function AddSaleModal({
    stations,
    pumps,
    fuelTypes,
    users,
    nextSaleNumber,
    onSave,
    onClose,
}: {
    stations: Station[]
    pumps: Pump[]
    fuelTypes: FuelType[]
    users: User[]
    nextSaleNumber: number
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const receiptNumber = generateReceiptCode(nextSaleNumber)
    const [formData, setFormData] = useState({
        receipt_no: receiptNumber,
        station_id: stations[0]?.station_id || 0,
        pump_id: 0,
        fuel_type_id: fuelTypes[0]?.fuel_type_id || 0,
        attendant_id: users[0]?.user_id || 0,
        liters_sold: 0,
        payment_method: "cash",
        mpesa_transaction_id: "",
    })

    const filteredPumps = pumps.filter(p => p.station_id === formData.station_id)
    const selectedFuel = fuelTypes.find(f => f.fuel_type_id === formData.fuel_type_id)
    const totalAmount = formData.liters_sold * (selectedFuel?.price_per_liter || 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.pump_id || !formData.liters_sold) {
            toast.error("Error", "Please fill all required fields")
            return
        }
        setLoading(true)
        try {
            await onSave({
                ...formData,
                price_per_liter: selectedFuel?.price_per_liter || 0,
                total_amount: totalAmount,
                sale_time: new Date().toISOString(),
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-green-600" />
                            ➕ Record New Sale
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Receipt Number */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🧾 Receipt No (Auto)</label>
                        <input
                            type="text"
                            value={formData.receipt_no}
                            readOnly
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                    </div>

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

                    {/* Fuel Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🛢️ Fuel Type *</label>
                        <select
                            value={formData.fuel_type_id}
                            onChange={(e) => setFormData({ ...formData, fuel_type_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none appearance-none bg-white"
                            required
                        >
                            {fuelTypes.map((f) => (
                                <option key={f.fuel_type_id} value={f.fuel_type_id}>
                                    {f.fuel_name} - {formatCurrency(f.price_per_liter)}/L
                                </option>
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

                    {/* Liters */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Liters *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.liters_sold}
                            onChange={(e) => setFormData({ ...formData, liters_sold: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter liters sold"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">💳 Payment Method *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {["cash", "mpesa", "card"].map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: method })}
                                    className={`p-3 rounded-xl border-2 text-center font-medium transition-colors ${formData.payment_method === method
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    {method === "cash" && "💵 Cash"}
                                    {method === "mpesa" && "📱 M-Pesa"}
                                    {method === "card" && "💳 Card"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* M-Pesa Transaction ID */}
                    {formData.payment_method === "mpesa" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">📱 M-Pesa Transaction ID</label>
                            <input
                                type="text"
                                value={formData.mpesa_transaction_id}
                                onChange={(e) => setFormData({ ...formData, mpesa_transaction_id: e.target.value.toUpperCase() })}
                                placeholder="e.g., RGK7H84KLM"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            />
                        </div>
                    )}

                    {/* Total Amount Display */}
                    <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                        <p className="text-sm text-green-700">Total Amount</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAmount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            <X className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            <Save className="w-4 h-4" /> Record Sale
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Sales Page
export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [stationsRes, pumpsRes, fuelTypesRes, usersRes, salesRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name").eq("is_active", true).order("station_name"),
                    supabase.from("pumps").select("pump_id, pump_name, station_id").eq("is_active", true).order("pump_name"),
                    supabase.from("fuel_types").select("*").eq("is_active", true).order("fuel_name"),
                    supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                    supabase.from("sales")
                        .select("*, station:stations(station_id, station_name), pump:pumps(pump_id, pump_name), attendant:users_new(user_id, full_name), fuel_type:fuel_types(fuel_type_id, fuel_name)")
                        .order("sale_time", { ascending: false })
                        .limit(200),
                ])

                setStations(stationsRes.data || [])
                setPumps(pumpsRes.data || [])
                setFuelTypes(fuelTypesRes.data || [])
                setUsers(usersRes.data || [])
                setSales(salesRes.data || [])
            } else {
                toast.error("Database not configured", "Please configure Supabase")
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    const handleAddSale = async (data: any) => {
        if (!supabase) throw new Error("Database not configured")

        const { error } = await supabase
            .from("sales")
            .insert([data])

        if (error) throw error
        toast.success("✅ Sale Recorded!", `${formatCurrency(data.total_amount)} - ${data.liters_sold}L`)
        fetchData()
    }

    // Filter sales
    const filteredSales = sales.filter((sale) =>
        sale.station?.station_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.attendant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.mpesa_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const stats = {
        total: sales.reduce((acc, s) => acc + (s.total_amount || 0), 0),
        count: sales.length,
        mpesa: sales.filter(s => s.payment_method === "mpesa").reduce((acc, s) => acc + (s.total_amount || 0), 0),
        cash: sales.filter(s => s.payment_method === "cash").reduce((acc, s) => acc + (s.total_amount || 0), 0),
    }

    const getPaymentColor = (method: string) => {
        switch (method) {
            case "mpesa": return "bg-green-100 text-green-700"
            case "cash": return "bg-amber-100 text-amber-700"
            case "card": return "bg-blue-100 text-blue-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            💰 Sales & Transactions
                        </h1>
                        <p className="text-gray-500">View all sales across stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4" /> Record Sale
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.total)}</p>
                                    <p className="text-xs text-gray-500">Total Sales</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{stats.count}</p>
                                    <p className="text-xs text-gray-500">Transactions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <span className="text-xl">📱</span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.mpesa)}</p>
                                    <p className="text-xs text-gray-500">M-Pesa</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <span className="text-xl">💵</span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.cash)}</p>
                                    <p className="text-xs text-gray-500">Cash</p>
                                </div>
                            </div>
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
                            placeholder="🔍 Search by station, attendant, or M-Pesa code..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                    </CardContent>
                </Card>

                {/* Sales List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Wallet className="w-5 h-5 text-green-600" />
                            📋 Recent Transactions ({filteredSales.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredSales.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>{sales.length === 0 ? "No sales found. Record your first sale!" : "No sales match your search"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Station / Pump</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fuel</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Liters</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Attendant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map((sale) => (
                                            <tr key={sale.sale_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <span className="text-sm text-gray-600">{formatDateTime(sale.sale_time)}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{sale.station?.station_name || "—"}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Fuel className="w-3 h-3" /> {sale.pump?.pump_name || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-cyan-100 text-cyan-700">
                                                        ⛽ {sale.fuel_type?.fuel_name || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-medium">{sale.liters_sold?.toFixed(2) || 0} L</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-bold text-green-600">{formatCurrency(sale.total_amount || 0)}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getPaymentColor(sale.payment_method)}`}>
                                                        {sale.payment_method === "mpesa" && "📱"}
                                                        {sale.payment_method === "cash" && "💵"}
                                                        {sale.payment_method === "card" && "💳"}
                                                        {sale.payment_method?.toUpperCase()}
                                                    </span>
                                                    {sale.mpesa_transaction_id && (
                                                        <p className="text-xs text-gray-500 mt-1 font-mono">{sale.mpesa_transaction_id}</p>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="text-sm">{sale.attendant?.full_name || "—"}</span>
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
            {showAddModal && (
                <AddSaleModal
                    stations={stations}
                    pumps={pumps}
                    fuelTypes={fuelTypes}
                    users={users}
                    nextSaleNumber={sales.length}
                    onSave={handleAddSale}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
