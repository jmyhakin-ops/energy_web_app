"use client"

import { useState, useEffect } from "react"
import {
    FileText, Plus, CheckCircle, Clock, RefreshCw, Download, Loader2, X,
    Save, Calendar, DollarSign, CreditCard, Wallet, Building2, Users, Printer,
    Send, Banknote, Phone
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Voucher {
    voucher_id: number
    voucher_code: string
    voucher_type: string
    payee_name: string
    payee_type: string
    description: string
    amount: number
    payment_method: string
    bank_name: string
    account_number: string
    cheque_number: string
    mpesa_receipt: string
    payment_date: string
    status: string
    created_at: string
}

const VOUCHER_TYPES = [
    { id: "payment", name: "💳 Payment Voucher", color: "bg-blue-100 text-blue-700" },
    { id: "petty_cash", name: "💵 Petty Cash", color: "bg-green-100 text-green-700" },
    { id: "reimbursement", name: "🔄 Reimbursement", color: "bg-purple-100 text-purple-700" },
]

const PAYMENT_METHODS = [
    { id: "cash", name: "💵 Cash", icon: Banknote },
    { id: "bank", name: "🏦 Bank Transfer", icon: Building2 },
    { id: "mpesa", name: "📱 M-Pesa", icon: Phone },
    { id: "cheque", name: "📝 Cheque", icon: FileText },
]

// Generate Voucher Code
function generateVoucherCode(type: string): string {
    const prefixes: Record<string, string> = {
        payment: "PV",
        petty_cash: "PC",
        reimbursement: "RB",
    }
    const date = new Date()
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
    return `${prefixes[type] || "VCH"}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${random}`
}

// Create Voucher Modal
function CreateVoucherModal({
    onSave,
    onClose,
}: {
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        voucher_type: "payment",
        payee_name: "",
        payee_type: "supplier",
        description: "",
        amount: 0,
        payment_method: "cash",
        bank_name: "",
        account_number: "",
        cheque_number: "",
        mpesa_receipt: "",
        notes: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.payee_name || !formData.description || formData.amount <= 0) {
            toast.error("Required", "Fill in all required fields")
            return
        }

        setLoading(true)
        try {
            await onSave({
                voucher_code: generateVoucherCode(formData.voucher_type),
                ...formData,
                status: "pending",
                payment_date: new Date().toISOString(),
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
                <div className="p-5 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            <h2 className="text-lg font-bold">📄 Create Payment Voucher</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Voucher Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📋 Voucher Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {VOUCHER_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, voucher_type: type.id })}
                                    className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${formData.voucher_type === type.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                                >
                                    {type.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payee */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">👤 Payee Name *</label>
                            <input
                                type="text"
                                value={formData.payee_name}
                                onChange={(e) => setFormData({ ...formData, payee_name: e.target.value })}
                                placeholder="Who to pay"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📁 Type</label>
                            <select
                                value={formData.payee_type}
                                onChange={(e) => setFormData({ ...formData, payee_type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                <option value="supplier">🏪 Supplier</option>
                                <option value="employee">👤 Employee</option>
                                <option value="contractor">🔧 Contractor</option>
                                <option value="other">📋 Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Payment description"
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
                            className="w-full px-4 py-3 text-xl font-bold border-2 border-indigo-300 rounded-xl focus:border-indigo-500 outline-none text-center"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">💳 Payment Method</label>
                        <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: method.id })}
                                    className={`p-2 rounded-xl border-2 text-xs font-medium transition-all flex flex-col items-center gap-1 ${formData.payment_method === method.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                                >
                                    <method.icon className="w-4 h-4" />
                                    {method.name.split(" ")[1] || method.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bank Details (Conditional) */}
                    {formData.payment_method === "bank" && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <div>
                                <label className="block text-xs text-blue-700 mb-1">🏦 Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    placeholder="e.g. KCB"
                                    className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-blue-700 mb-1">💳 Account Number</label>
                                <input
                                    type="text"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    placeholder="Account number"
                                    className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Cheque Details (Conditional) */}
                    {formData.payment_method === "cheque" && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <label className="block text-xs text-amber-700 mb-1">📝 Cheque Number</label>
                            <input
                                type="text"
                                value={formData.cheque_number}
                                onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                                placeholder="Cheque number"
                                className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm"
                            />
                        </div>
                    )}

                    {/* M-Pesa Receipt (Conditional) */}
                    {formData.payment_method === "mpesa" && (
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                            <label className="block text-xs text-green-700 mb-1">📱 M-Pesa Receipt</label>
                            <input
                                type="text"
                                value={formData.mpesa_receipt}
                                onChange={(e) => setFormData({ ...formData, mpesa_receipt: e.target.value })}
                                placeholder="e.g. SG12AB34CD"
                                className="w-full px-3 py-2 border border-green-200 rounded-xl text-sm font-mono"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                            <Save className="w-4 h-4" /> Create Voucher
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Vouchers Page
export default function VouchersPage() {
    const [loading, setLoading] = useState(true)
    const [vouchers, setVouchers] = useState<Voucher[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filterType, setFilterType] = useState("all")
    const [filterStatus, setFilterStatus] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const { data, error } = await supabase
                    .from("vouchers")
                    .select("*")
                    .order("created_at", { ascending: false })
                if (!error) setVouchers(data || [])
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleCreateVoucher = async (data: any) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("vouchers").insert([data])
        if (error) throw error
        toast.success("Success", "Voucher created successfully!")
        fetchData()
    }

    const handleApprove = async (voucherId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("vouchers").update({
            status: "approved",
            approved_date: new Date().toISOString(),
        }).eq("voucher_id", voucherId)
        if (error) toast.error("Error", error.message)
        else {
            toast.success("Approved", "Voucher approved!")
            fetchData()
        }
    }

    const handleMarkPaid = async (voucherId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("vouchers").update({
            status: "paid",
        }).eq("voucher_id", voucherId)
        if (error) toast.error("Error", error.message)
        else {
            toast.success("Paid", "Payment completed!")
            fetchData()
        }
    }

    let filteredVouchers = vouchers
    if (filterType !== "all") filteredVouchers = filteredVouchers.filter(v => v.voucher_type === filterType)
    if (filterStatus !== "all") filteredVouchers = filteredVouchers.filter(v => v.status === filterStatus)

    // Stats
    const totalPending = vouchers.filter(v => v.status === "pending").reduce((s, v) => s + v.amount, 0)
    const totalApproved = vouchers.filter(v => v.status === "approved").reduce((s, v) => s + v.amount, 0)
    const totalPaid = vouchers.filter(v => v.status === "paid").reduce((s, v) => s + v.amount, 0)

    const getTypeInfo = (typeId: string) => {
        return VOUCHER_TYPES.find(t => t.id === typeId) || VOUCHER_TYPES[0]
    }

    const getMethodIcon = (methodId: string) => {
        return PAYMENT_METHODS.find(m => m.id === methodId)?.name || methodId
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-indigo-600" />
                            📄 Payment Vouchers
                        </h1>
                        <p className="text-gray-500 text-sm">Manage payment vouchers and disbursements</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button variant="outline"><Download className="w-4 h-4" /> Export</Button>
                        <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4" /> Create Voucher
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">📋 Total Vouchers</p>
                        <p className="text-2xl font-bold text-gray-900">{vouchers.length}</p>
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
                    <div className="flex gap-1">
                        {["all", "pending", "approved", "paid"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === status ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        {["all", ...VOUCHER_TYPES.map(t => t.id)].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterType === type ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}
                            >
                                {type === "all" ? "All Types" : type.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vouchers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">📄 Voucher Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" /></div>
                        ) : filteredVouchers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No vouchers found</p>
                                <Button className="mt-3 bg-indigo-600" onClick={() => setShowCreateModal(true)}>
                                    <Plus className="w-4 h-4" /> Create Voucher
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                                            <th className="text-left py-3 px-3 text-xs font-bold">🔗 Code</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📋 Type</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">👤 Payee</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📝 Description</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">💳 Method</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-indigo-600">💰 Amount</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Status</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVouchers.map((v) => {
                                            const typeInfo = getTypeInfo(v.voucher_type)
                                            return (
                                                <tr key={v.voucher_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-3 font-mono text-xs text-blue-600">{v.voucher_code}</td>
                                                    <td className="py-3 px-3">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}>
                                                            {typeInfo.name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className="font-medium text-sm">{v.payee_name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{v.payee_type}</p>
                                                    </td>
                                                    <td className="py-3 px-3 text-sm max-w-xs truncate">{v.description}</td>
                                                    <td className="py-3 px-3">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                                                            {getMethodIcon(v.payment_method)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold text-indigo-700">{formatCurrency(v.amount)}</td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${v.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                                v.status === "approved" ? "bg-blue-100 text-blue-700" :
                                                                    v.status === "paid" ? "bg-green-100 text-green-700" :
                                                                        "bg-red-100 text-red-700"
                                                            }`}>
                                                            {v.status === "pending" && "⏳ "}
                                                            {v.status === "approved" && "✅ "}
                                                            {v.status === "paid" && "💰 "}
                                                            {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            {v.status === "pending" && (
                                                                <button
                                                                    onClick={() => handleApprove(v.voucher_id)}
                                                                    className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {v.status === "approved" && (
                                                                <button
                                                                    onClick={() => handleMarkPaid(v.voucher_id)}
                                                                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                                    title="Mark Paid"
                                                                >
                                                                    <DollarSign className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" title="Print">
                                                                <Printer className="w-4 h-4" />
                                                            </button>
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

            {/* Create Modal */}
            {showCreateModal && (
                <CreateVoucherModal
                    onSave={handleCreateVoucher}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
