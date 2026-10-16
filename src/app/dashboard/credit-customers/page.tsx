"use client"

// Credit Customers Management Page - v1.0
// Features: Customer CRUD, Credit Transactions View, Statements & Payments

import { useState, useEffect, useMemo } from "react"
import {
    Building2, Plus, X, Save, Search, RefreshCw, Filter,
    CreditCard, FileText, Users, Wallet, ChevronDown,
    DollarSign, TrendingDown, TrendingUp, Edit, Trash2,
    Eye, CheckCircle, AlertCircle, Download, Loader2
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ==================== INTERFACES ====================

interface CreditCustomer {
    credit_customer_id: number
    customer_name: string
    phone: string | null
    email: string | null
    address: string | null
    credit_limit: number
    outstanding_balance: number
    is_active: boolean
    created_at: string
    updated_at: string
}

interface CreditPayment {
    credit_payment_id: number
    credit_customer_id: number
    amount: number
    payment_method: string
    reference_number: string | null
    notes: string | null
    received_by: string | null
    created_at: string
}

interface CreditSale {
    sale_id: number
    sale_id_no: string
    amount: number
    total_amount: number | null
    customer_mobile_no: string | null
    transaction_status: string
    payment_method: string | null
    liters_sold: number | null
    created_at: string
    sale_time: string | null
    pump_id: number
    attendant_id: number
    station_id: number
}

type TabType = "customers" | "transactions" | "statements"

// ==================== CUSTOMER FORM MODAL ====================

function CustomerFormModal({
    customer,
    onSave,
    onClose,
}: {
    customer?: CreditCustomer | null
    onSave: (data: Partial<CreditCustomer>) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        customer_name: customer?.customer_name || "",
        phone: customer?.phone || "",
        email: customer?.email || "",
        address: customer?.address || "",
        credit_limit: customer?.credit_limit || 0,
        opening_balance: customer?.outstanding_balance || 0,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.customer_name.trim()) {
            toast.error("Required", "Customer name is required")
            return
        }
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to save"
            toast.error("Error", msg)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {customer ? "Edit Customer" : "Add Credit Customer"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {customer ? "Update customer details" : "Register a new credit customer"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Customer / Company Name *</label>
                        <input
                            type="text"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                            placeholder="e.g. ABC Transport Ltd"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📱 Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="07XXXXXXXX"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📧 Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="info@company.com"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📍 Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Physical address"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💰 Credit Limit (KES)</label>
                        <input
                            type="number"
                            value={formData.credit_limit || ""}
                            onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                            placeholder="0 = No limit"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Set to 0 for unlimited credit</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📊 Opening Balance (KES)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.opening_balance || ""}
                            onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">{customer ? "Current outstanding balance" : "Pre-existing debt amount (sets outstanding balance)"}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1 !bg-purple-600 hover:!bg-purple-700">
                            <Save className="w-4 h-4" /> {customer ? "Update" : "Add Customer"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==================== PAYMENT MODAL ====================

function RecordPaymentModal({
    customer,
    onSave,
    onClose,
}: {
    customer: CreditCustomer
    onSave: (data: Partial<CreditPayment>) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: 0,
        payment_method: "cash",
        reference_number: "",
        notes: "",
        received_by: "Admin",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.amount <= 0) {
            toast.error("Invalid", "Amount must be greater than 0")
            return
        }
        setLoading(true)
        try {
            await onSave({
                credit_customer_id: customer.credit_customer_id,
                ...formData,
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
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
                        <p className="text-sm text-gray-500">{customer.customer_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Outstanding Balance Summary */}
                <div className="mx-5 mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                    <p className="text-sm text-red-600 font-medium">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(customer.outstanding_balance)}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💰 Payment Amount (KES) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount || ""}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter payment amount"
                            className="w-full px-4 py-3 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 outline-none text-center bg-white"
                            autoFocus
                            required
                        />
                        {formData.amount > 0 && (
                            <p className="text-xs text-green-600 mt-1 text-center">
                                New balance: {formatCurrency(Math.max(0, customer.outstanding_balance - formData.amount))}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { val: "cash", label: "💵 Cash" },
                                { val: "mpesa", label: "📱 M-Pesa" },
                                { val: "bank", label: "🏦 Bank" },
                            ].map((m) => (
                                <button
                                    key={m.val}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: m.val })}
                                    className={`p-2.5 rounded-xl border-2 text-center text-sm font-medium transition-all ${formData.payment_method === m.val
                                        ? "border-purple-500 bg-purple-50 text-purple-700"
                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📋 Reference / Receipt No.</label>
                        <input
                            type="text"
                            value={formData.reference_number}
                            onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                            placeholder="e.g. M-Pesa receipt or bank ref"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Notes (Optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes..."
                            rows={2}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} variant="success" className="flex-1">
                            <CheckCircle className="w-4 h-4" /> Record Payment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ==================== MAIN PAGE ====================

export default function CreditCustomersPage() {
    const [activeTab, setActiveTab] = useState<TabType>("customers")
    const [customers, setCustomers] = useState<CreditCustomer[]>([])
    const [creditSales, setCreditSales] = useState<CreditSale[]>([])
    const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modals
    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<CreditCustomer | null>(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentCustomer, setPaymentCustomer] = useState<CreditCustomer | null>(null)

    // Statement filters
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                toast.error("Database Error", "Supabase not configured")
                setLoading(false)
                return
            }

            const [customersRes, salesRes, paymentsRes] = await Promise.all([
                supabase.from("credit_customers").select("*").order("customer_name"),
                supabase.from("sales").select("*").eq("transaction_status", "CREDIT").order("created_at", { ascending: false }).limit(500),
                supabase.from("credit_payments").select("*").order("created_at", { ascending: false }).limit(500),
            ])

            if (customersRes.error) {
                // Table might not exist yet
                console.warn("credit_customers table error:", customersRes.error.message)
                toast.error("Setup Required", "Please run the credit_customers SQL migration in Supabase first. Check the supabase_migration_credit_customers.sql file.")
                setLoading(false)
                return
            }

            setCustomers(customersRes.data || [])
            setCreditSales(salesRes.data || [])
            setCreditPayments(paymentsRes.data || [])
        } catch (error) {
            console.error("Error:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    // ==================== HANDLERS ====================

    const handleSaveCustomer = async (data: Partial<CreditCustomer> & { opening_balance?: number }) => {
        if (!supabase) throw new Error("Database not configured")

        // Extract opening_balance from data, don't send it to DB as a column
        const { opening_balance, ...customerData } = data as any

        if (editingCustomer) {
            const updatePayload: any = { ...customerData, updated_at: new Date().toISOString() }
            // When editing, opening_balance updates the outstanding_balance
            if (opening_balance !== undefined) {
                updatePayload.outstanding_balance = opening_balance
            }
            const { error } = await supabase
                .from("credit_customers")
                .update(updatePayload)
                .eq("credit_customer_id", editingCustomer.credit_customer_id)
            if (error) throw error
            toast.success("Updated", `${data.customer_name} updated`)
        } else {
            // For new customers, set outstanding_balance = opening_balance
            const insertPayload: any = { ...customerData }
            if (opening_balance && opening_balance > 0) {
                insertPayload.outstanding_balance = opening_balance
            }
            const { error } = await supabase.from("credit_customers").insert([insertPayload])
            if (error) throw error
            toast.success("Added", `${data.customer_name} registered as credit customer`)
        }
        setEditingCustomer(null)
        fetchData()
    }

    const handleDeleteCustomer = async (customer: CreditCustomer) => {
        if (!supabase) return
        if (!confirm(`Delete ${customer.customer_name}? This cannot be undone.`)) return

        const { error } = await supabase
            .from("credit_customers")
            .delete()
            .eq("credit_customer_id", customer.credit_customer_id)

        if (error) {
            toast.error("Error", error.message)
        } else {
            toast.success("Deleted", `${customer.customer_name} removed`)
            fetchData()
        }
    }

    const handleToggleActive = async (customer: CreditCustomer) => {
        if (!supabase) return
        const { error } = await supabase
            .from("credit_customers")
            .update({ is_active: !customer.is_active, updated_at: new Date().toISOString() })
            .eq("credit_customer_id", customer.credit_customer_id)

        if (error) {
            toast.error("Error", error.message)
        } else {
            fetchData()
        }
    }

    const handleRecordPayment = async (data: Partial<CreditPayment>) => {
        if (!supabase || !data.credit_customer_id) throw new Error("Invalid data")

        // Insert payment
        const { error: payError } = await supabase.from("credit_payments").insert([data])
        if (payError) throw payError

        // Update outstanding balance
        const customer = customers.find(c => c.credit_customer_id === data.credit_customer_id)
        if (customer) {
            const newBalance = Math.max(0, customer.outstanding_balance - (data.amount || 0))
            const { error: updateError } = await supabase
                .from("credit_customers")
                .update({ outstanding_balance: newBalance, updated_at: new Date().toISOString() })
                .eq("credit_customer_id", data.credit_customer_id)
            if (updateError) throw updateError
        }

        toast.success("Payment Recorded", `${formatCurrency(data.amount || 0)} received from ${customer?.customer_name}`)
        fetchData()
    }

    // ==================== COMPUTED DATA ====================

    const filteredCustomers = customers.filter(c =>
        c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredCreditSales = creditSales.filter(s => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return (
                s.customer_mobile_no?.toLowerCase().includes(q) ||
                s.sale_id_no?.toLowerCase().includes(q)
            )
        }
        return true
    })

    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0)
    const totalCreditSalesAmount = creditSales.reduce((sum, s) => sum + (s.total_amount || s.amount || 0), 0)
    const totalPaymentsReceived = creditPayments.reduce((sum, p) => sum + p.amount, 0)

    // Statement for selected customer
    const selectedCustomer = customers.find(c => c.credit_customer_id === selectedCustomerId)

    const customerStatement = useMemo(() => {
        if (!selectedCustomerId) return []

        // Get credit sales for this customer (matched by name)
        const customerName = selectedCustomer?.customer_name?.toLowerCase()
        const sales = creditSales
            .filter(s => s.customer_mobile_no?.toLowerCase() === customerName)
            .map(s => ({
                date: s.sale_time || s.created_at,
                type: "debit" as const,
                description: `Credit Sale - ${s.sale_id_no}`,
                amount: s.total_amount || s.amount,
                reference: s.sale_id_no,
            }))

        // Get payments for this customer
        const payments = creditPayments
            .filter(p => p.credit_customer_id === selectedCustomerId)
            .map(p => ({
                date: p.created_at,
                type: "credit" as const,
                description: `Payment (${p.payment_method})${p.reference_number ? ` - ${p.reference_number}` : ""}`,
                amount: p.amount,
                reference: p.reference_number || "-",
            }))

        // Combine and sort chronologically
        const combined = [...sales, ...payments].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Calculate running balance
        let balance = 0
        return combined.map(entry => {
            if (entry.type === "debit") {
                balance += entry.amount
            } else {
                balance -= entry.amount
            }
            return { ...entry, balance: Math.max(0, balance) }
        })
    }, [selectedCustomerId, creditSales, creditPayments, selectedCustomer])

    // ==================== TABS ====================

    const tabs = [
        { id: "customers" as TabType, label: "Customers", icon: Users, count: customers.length },
        { id: "transactions" as TabType, label: "Credit Sales", icon: CreditCard, count: creditSales.length },
        { id: "statements" as TabType, label: "Statements & Payments", icon: FileText, count: null },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            Credit Customers
                        </h1>
                        <p className="text-gray-500 mt-1">Manage credit accounts, track balances & receive payments</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData} className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        {activeTab === "customers" && (
                            <Button onClick={() => { setEditingCustomer(null); setShowCustomerModal(true) }} className="gap-2 !bg-purple-600 hover:!bg-purple-700">
                                <Plus className="w-4 h-4" /> Add Customer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Customers</p>
                                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Outstanding</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Credit Sales</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCreditSalesAmount)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Payments Received</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaymentsReceived)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-white text-purple-700 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                {activeTab !== "statements" && (
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={activeTab === "customers" ? "Search customers..." : "Search credit sales..."}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* =============== CUSTOMERS TAB =============== */}
                        {activeTab === "customers" && (
                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credit Limit</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCustomers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                                            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                            <p className="font-medium">No credit customers yet</p>
                                                            <p className="text-sm">Click &quot;Add Customer&quot; to register one</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCustomers.map((customer, i) => (
                                                        <tr key={customer.credit_customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{customer.customer_name}</p>
                                                                    {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || "-"}</td>
                                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                                                                {customer.credit_limit > 0 ? formatCurrency(customer.credit_limit) : "Unlimited"}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`font-bold ${customer.outstanding_balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                                                    {formatCurrency(customer.outstanding_balance)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleToggleActive(customer)}
                                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${customer.is_active
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-gray-100 text-gray-500"
                                                                        }`}
                                                                >
                                                                    {customer.is_active ? "Active" : "Inactive"}
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={() => { setPaymentCustomer(customer); setShowPaymentModal(true) }}
                                                                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                                                                        title="Record Payment"
                                                                    >
                                                                        <DollarSign className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setSelectedCustomerId(customer.credit_customer_id); setActiveTab("statements") }}
                                                                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                                                                        title="View Statement"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingCustomer(customer); setShowCustomerModal(true) }}
                                                                        className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteCustomer(customer)}
                                                                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* =============== TRANSACTIONS TAB =============== */}
                        {activeTab === "transactions" && (
                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Receipt</th>
                                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Liters</th>
                                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCreditSales.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                            <p className="font-medium">No credit sales yet</p>
                                                            <p className="text-sm">Credit sales from the POS will appear here</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCreditSales.map((sale) => (
                                                        <tr key={sale.sale_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {formatDateTime(sale.sale_time || sale.created_at)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-mono font-semibold text-purple-600">
                                                                {sale.sale_id_no}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {sale.customer_mobile_no || "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                                {formatCurrency(sale.total_amount || sale.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                                {sale.liters_sold ? `${sale.liters_sold.toFixed(2)} L` : "-"}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                                    CREDIT
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* =============== STATEMENTS TAB =============== */}
                        {activeTab === "statements" && (
                            <div className="space-y-4">
                                {/* Customer Selector */}
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="flex-1 w-full">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                                                <select
                                                    value={selectedCustomerId || ""}
                                                    onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value="">-- Select a credit customer --</option>
                                                    {customers.map((c) => (
                                                        <option key={c.credit_customer_id} value={c.credit_customer_id}>
                                                            {c.customer_name} — Outstanding: {formatCurrency(c.outstanding_balance)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedCustomer && (
                                                <Button
                                                    onClick={() => { setPaymentCustomer(selectedCustomer); setShowPaymentModal(true) }}
                                                    variant="success"
                                                    className="gap-2 whitespace-nowrap"
                                                >
                                                    <DollarSign className="w-4 h-4" /> Record Payment
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {selectedCustomer && (
                                    <>
                                        {/* Customer Summary */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                                                <CardContent className="p-4 text-center">
                                                    <p className="text-sm text-purple-600 font-medium">Customer</p>
                                                    <p className="text-lg font-bold text-purple-900">{selectedCustomer.customer_name}</p>
                                                    {selectedCustomer.phone && <p className="text-sm text-purple-500">{selectedCustomer.phone}</p>}
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                                <CardContent className="p-4 text-center">
                                                    <p className="text-sm text-red-600 font-medium">Outstanding Balance</p>
                                                    <p className="text-2xl font-bold text-red-700">{formatCurrency(selectedCustomer.outstanding_balance)}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                                <CardContent className="p-4 text-center">
                                                    <p className="text-sm text-blue-600 font-medium">Credit Limit</p>
                                                    <p className="text-2xl font-bold text-blue-700">
                                                        {selectedCustomer.credit_limit > 0 ? formatCurrency(selectedCustomer.credit_limit) : "Unlimited"}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Statement Table */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-purple-500" />
                                                    Account Statement
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Debit</th>
                                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credit</th>
                                                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {customerStatement.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                                                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                                        <p className="font-medium">No transactions found</p>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                customerStatement.map((entry, idx) => (
                                                                    <tr key={idx} className={`border-b border-gray-100 ${entry.type === "credit" ? "bg-green-50/50" : ""}`}>
                                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                                            {formatDateTime(entry.date)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                                            {entry.description}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                                                            {entry.type === "debit" ? formatCurrency(entry.amount) : ""}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                                            {entry.type === "credit" ? formatCurrency(entry.amount) : ""}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                                            {formatCurrency(entry.balance)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showCustomerModal && (
                <CustomerFormModal
                    customer={editingCustomer}
                    onSave={handleSaveCustomer}
                    onClose={() => { setShowCustomerModal(false); setEditingCustomer(null) }}
                />
            )}
            {showPaymentModal && paymentCustomer && (
                <RecordPaymentModal
                    customer={paymentCustomer}
                    onSave={handleRecordPayment}
                    onClose={() => { setShowPaymentModal(false); setPaymentCustomer(null) }}
                />
            )}
        </DashboardLayout>
    )
}
