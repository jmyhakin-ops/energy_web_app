"use client"

import { useState, useEffect } from "react"
import {
    Receipt, Plus, Search, CheckCircle, Clock, XCircle, RefreshCw, Download,
    Loader2, X, Save, AlertCircle, Calendar, Building2, DollarSign, FileText,
    Truck, Zap, Wrench, Package, Users, Megaphone, Shield, Landmark, MoreHorizontal
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Station { station_id: number; station_name: string }

interface Expense {
    expense_id: number
    expense_code: string
    category: string
    description: string
    amount: number
    station_id: number
    vendor_name: string
    invoice_number: string
    expense_date: string
    due_date: string
    status: string
    created_at: string
    stations?: { station_name: string }
}

const EXPENSE_CATEGORIES = [
    { id: "fuel_purchase", name: "⛽ Fuel Purchase", icon: Truck, color: "bg-blue-100 text-blue-700" },
    { id: "utilities", name: "💡 Utilities", icon: Zap, color: "bg-yellow-100 text-yellow-700" },
    { id: "maintenance", name: "🔧 Maintenance", icon: Wrench, color: "bg-purple-100 text-purple-700" },
    { id: "salaries", name: "👥 Salaries", icon: Users, color: "bg-green-100 text-green-700" },
    { id: "supplies", name: "📦 Supplies", icon: Package, color: "bg-cyan-100 text-cyan-700" },
    { id: "transport", name: "🚗 Transport", icon: Truck, color: "bg-orange-100 text-orange-700" },
    { id: "marketing", name: "📣 Marketing", icon: Megaphone, color: "bg-pink-100 text-pink-700" },
    { id: "insurance", name: "🛡️ Insurance", icon: Shield, color: "bg-indigo-100 text-indigo-700" },
    { id: "taxes", name: "🏛️ Taxes", icon: Landmark, color: "bg-red-100 text-red-700" },
    { id: "other", name: "📋 Other", icon: MoreHorizontal, color: "bg-gray-100 text-gray-700" },
]

// Generate Expense Code
function generateExpenseCode(): string {
    const date = new Date()
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
    return `EXP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${random}`
}

// Add Expense Modal
function AddExpenseModal({
    stations,
    onSave,
    onClose,
}: {
    stations: Station[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        category: "",
        description: "",
        amount: 0,
        station_id: 0,
        vendor_name: "",
        invoice_number: "",
        expense_date: new Date().toISOString().split("T")[0],
        due_date: "",
        notes: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.category || !formData.description || formData.amount <= 0) {
            toast.error("Required", "Fill in all required fields")
            return
        }

        setLoading(true)
        try {
            await onSave({
                expense_code: generateExpenseCode(),
                ...formData,
                station_id: formData.station_id || null,
                status: "pending",
            })
            onClose()
        } catch (error: any) {
            toast.error("Error", error.message)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-6 h-6" />
                            <h2 className="text-lg font-bold">📝 Add New Expense</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📁 Category *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {EXPENSE_CATEGORIES.slice(0, 6).map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${formData.category === cat.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white mt-2"
                        >
                            <option value="">More Categories...</option>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What is this expense for?"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl resize-none"
                            rows={2}
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💰 Amount (KES) *</label>
                        <input
                            type="number"
                            value={formData.amount || ""}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="w-full px-4 py-3 text-xl font-bold border-2 border-red-300 rounded-xl focus:border-red-500 outline-none text-center"
                            required
                        />
                    </div>

                    {/* Station & Vendor */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Station</label>
                            <select
                                value={formData.station_id}
                                onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                <option value={0}>All / HQ</option>
                                {stations.map((s) => (
                                    <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🏪 Vendor</label>
                            <input
                                type="text"
                                value={formData.vendor_name}
                                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                                placeholder="Vendor name"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Invoice & Dates */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🧾 Invoice #</label>
                            <input
                                type="text"
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                placeholder="INV-001"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date</label>
                            <input
                                type="date"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">⏰ Due</label>
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1 bg-red-600 hover:bg-red-700">
                            <Save className="w-4 h-4" /> Save Expense
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Expenses Page
export default function ExpensesPage() {
    const [loading, setLoading] = useState(true)
    const [stations, setStations] = useState<Station[]>([])
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [filterCategory, setFilterCategory] = useState("all")
    const [filterStatus, setFilterStatus] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [stRes, expRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name"),
                    supabase.from("expenses").select("*, stations(station_name)").order("created_at", { ascending: false }),
                ])
                setStations(stRes.data || [])
                setExpenses(expRes.data || [])
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleSaveExpense = async (data: any) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("expenses").insert([data])
        if (error) throw error
        toast.success("Success", "Expense added successfully!")
        fetchData()
    }

    const handleApprove = async (expenseId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("expenses").update({
            status: "approved",
            approved_date: new Date().toISOString(),
        }).eq("expense_id", expenseId)
        if (error) toast.error("Error", error.message)
        else {
            toast.success("Approved", "Expense approved!")
            fetchData()
        }
    }

    const handleMarkPaid = async (expenseId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("expenses").update({
            status: "paid",
        }).eq("expense_id", expenseId)
        if (error) toast.error("Error", error.message)
        else {
            toast.success("Paid", "Expense marked as paid!")
            fetchData()
        }
    }

    let filteredExpenses = expenses
    if (filterCategory !== "all") filteredExpenses = filteredExpenses.filter(e => e.category === filterCategory)
    if (filterStatus !== "all") filteredExpenses = filteredExpenses.filter(e => e.status === filterStatus)

    // Stats
    const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0)
    const totalApproved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0)
    const totalPaid = expenses.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    const getCategoryInfo = (categoryId: string) => {
        return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || EXPENSE_CATEGORIES[9]
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Receipt className="w-7 h-7 text-red-600" />
                            📝 Expense Management
                        </h1>
                        <p className="text-gray-500 text-sm">Track and manage all business expenses</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button variant="outline"><Download className="w-4 h-4" /> Export</Button>
                        <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
                            <Plus className="w-4 h-4" /> Add Expense
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">📋 Total Expenses</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                        <p className="text-xs text-gray-400">{expenses.length} items</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs text-amber-600">⏳ Pending</p>
                        <p className="text-xl font-bold text-amber-700">{formatCurrency(totalPending)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-600">✅ Approved</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(totalApproved)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <p className="text-xs text-green-600">💰 Paid</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex gap-1 overflow-x-auto">
                        {["all", "pending", "approved", "paid"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === status ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                        <option value="all">All Categories</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Expenses Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">📋 Expense Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12"><Loader2 className="w-8 h-8 text-red-600 animate-spin mx-auto" /></div>
                        ) : filteredExpenses.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No expenses found</p>
                                <Button className="mt-3 bg-red-600" onClick={() => setShowAddModal(true)}>
                                    <Plus className="w-4 h-4" /> Add Expense
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
                                            <th className="text-left py-3 px-3 text-xs font-bold">🔗 Code</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📁 Category</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📝 Description</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">🏢 Station</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">🏪 Vendor</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-red-600">💰 Amount</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Status</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map((e) => {
                                            const cat = getCategoryInfo(e.category)
                                            return (
                                                <tr key={e.expense_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-3 font-mono text-xs text-blue-600">{e.expense_code}</td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cat.color}`}>
                                                            {cat.name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-sm max-w-xs truncate">{e.description}</td>
                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                                                            {e.stations?.station_name || "HQ"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-sm text-gray-600">{e.vendor_name || "-"}</td>
                                                    <td className="py-3 px-3 text-right font-bold text-red-700">{formatCurrency(e.amount)}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${e.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                                e.status === "approved" ? "bg-blue-100 text-blue-700" :
                                                                    "bg-green-100 text-green-700"
                                                            }`}>
                                                            {e.status === "pending" && "⏳ "}
                                                            {e.status === "approved" && "✅ "}
                                                            {e.status === "paid" && "💰 "}
                                                            {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            {e.status === "pending" && (
                                                                <button
                                                                    onClick={() => handleApprove(e.expense_id)}
                                                                    className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {e.status === "approved" && (
                                                                <button
                                                                    onClick={() => handleMarkPaid(e.expense_id)}
                                                                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                                    title="Mark Paid"
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <AddExpenseModal
                    stations={stations}
                    onSave={handleSaveExpense}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
