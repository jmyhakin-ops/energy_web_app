"use client"

import { useState, useEffect } from "react"
import {
    Wallet, Plus, Search, CheckCircle, Clock, XCircle, RefreshCw, Download,
    Loader2, X, Save, AlertCircle, Calendar, Users, DollarSign, FileText
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Employee {
    id: string  // UUID from Supabase
    full_name: string
    monthly_salary: number
}

interface SalaryAdvance {
    advance_id: number
    advance_code: string
    user_id: string  // UUID
    amount: number
    request_date: string
    approved_date: string | null
    repayment_month: string
    status: string
    reason: string
    notes: string
    users?: { full_name: string; monthly_salary: number }
}

// Generate Advance Code
function generateAdvanceCode(): string {
    const date = new Date()
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
    return `ADV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${random}`
}

// Add Salary Advance Modal
function AddAdvanceModal({
    employees,
    onSave,
    onClose,
}: {
    employees: Employee[]
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        user_id: "",
        amount: 0,
        reason: "",
        repayment_month: new Date().toISOString().slice(0, 7),
        notes: "",
    })

    const selectedEmployee = employees.find(e => e.id === formData.user_id)
    const maxAdvance = (selectedEmployee?.monthly_salary || 0) * 0.5 // Max 50% of salary

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.user_id) {
            toast.error("Required", "Select an employee")
            return
        }
        if (formData.amount <= 0) {
            toast.error("Required", "Enter a valid amount")
            return
        }
        if (formData.amount > maxAdvance && maxAdvance > 0) {
            toast.warning("Warning", `Amount exceeds 50% of monthly salary (${formatCurrency(maxAdvance)})`)
        }

        setLoading(true)
        try {
            await onSave({
                advance_code: generateAdvanceCode(),
                user_id: formData.user_id,
                amount: formData.amount,
                reason: formData.reason,
                repayment_month: formData.repayment_month,
                notes: formData.notes,
                status: "pending",
                request_date: new Date().toISOString(),
            })
            onClose()
        } catch (error: any) {
            toast.error("Error", error.message)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-6 h-6" />
                            <h2 className="text-lg font-bold">💸 Request Salary Advance</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">👤 Employee</label>
                        <select
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            required
                        >
                            <option value="">Select Employee</option>
                            {employees.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.full_name} - Salary: {formatCurrency(e.monthly_salary || 0)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Employee Info */}
                    {selectedEmployee && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm text-blue-700">
                                Monthly Salary: <span className="font-bold">{formatCurrency(selectedEmployee.monthly_salary || 0)}</span>
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Max Advance (50%): <span className="font-bold">{formatCurrency(maxAdvance)}</span>
                            </p>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💰 Amount (KES)</label>
                        <input
                            type="number"
                            value={formData.amount || ""}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 text-xl font-bold border-2 border-orange-300 rounded-xl focus:border-orange-500 outline-none text-center"
                            required
                        />
                        {formData.amount > maxAdvance && maxAdvance > 0 && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Exceeds recommended limit
                            </p>
                        )}
                    </div>

                    {/* Repayment Month */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📅 Repayment Month</label>
                        <input
                            type="month"
                            value={formData.repayment_month}
                            onChange={(e) => setFormData({ ...formData, repayment_month: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Month when this advance will be deducted from salary</p>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📝 Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Why is this advance needed?"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📋 Notes (Optional)</label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} className="flex-1 bg-orange-600 hover:bg-orange-700">
                            <Save className="w-4 h-4" /> Submit Request
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Salary Advances Page
export default function SalaryAdvancesPage() {
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [advances, setAdvances] = useState<SalaryAdvance[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [empRes, advRes] = await Promise.all([
                    supabase.from("users_new").select("user_id, full_name, monthly_salary").eq("is_active", true).order("full_name"),
                    supabase.from("salary_advances").select("*, users_new(full_name, monthly_salary)").order("created_at", { ascending: false }),
                ])
                // Map user_id to id for compatibility
                const employees = (empRes.data || []).map((u: any) => ({
                    id: u.user_id?.toString() || "",
                    full_name: u.full_name,
                    monthly_salary: u.monthly_salary || 0,
                }))
                setEmployees(employees)
                // Map users_new to users for display
                const advancesData = (advRes.data || []).map((a: any) => ({
                    ...a,
                    users: a.users_new
                }))
                setAdvances(advancesData)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleSaveAdvance = async (data: any) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("salary_advances").insert([data])
        if (error) throw error
        toast.success("Success", "Salary advance request submitted!")
        fetchData()
    }

    const handleApprove = async (advanceId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("salary_advances").update({
            status: "approved",
            approved_date: new Date().toISOString(),
        }).eq("advance_id", advanceId)
        if (error) {
            toast.error("Error", error.message)
        } else {
            toast.success("Approved", "Salary advance approved!")
            fetchData()
        }
    }

    const handleReject = async (advanceId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("salary_advances").update({
            status: "rejected",
        }).eq("advance_id", advanceId)
        if (error) {
            toast.error("Error", error.message)
        } else {
            toast.success("Rejected", "Salary advance rejected")
            fetchData()
        }
    }

    const filteredAdvances = filterStatus === "all"
        ? advances
        : advances.filter(a => a.status === filterStatus)

    // Stats
    const totalPending = advances.filter(a => a.status === "pending").reduce((s, a) => s + a.amount, 0)
    const totalApproved = advances.filter(a => a.status === "approved").reduce((s, a) => s + a.amount, 0)
    const pendingCount = advances.filter(a => a.status === "pending").length
    const approvedCount = advances.filter(a => a.status === "approved").length

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="w-7 h-7 text-orange-600" />
                            💸 Salary Advances
                        </h1>
                        <p className="text-gray-500 text-sm">Manage employee salary advance requests</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button onClick={() => setShowAddModal(true)} className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="w-4 h-4" /> New Advance
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">📋 Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{advances.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs text-amber-600">⏳ Pending ({pendingCount})</p>
                        <p className="text-xl font-bold text-amber-700">{formatCurrency(totalPending)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <p className="text-xs text-green-600">✅ Approved ({approvedCount})</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(totalApproved)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-600">👥 Employees</p>
                        <p className="text-xl font-bold text-blue-700">{employees.length}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {["all", "pending", "approved", "rejected", "repaid"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${filterStatus === status ? "bg-orange-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
                        >
                            {status === "all" && "📋 "}
                            {status === "pending" && "⏳ "}
                            {status === "approved" && "✅ "}
                            {status === "rejected" && "❌ "}
                            {status === "repaid" && "💰 "}
                            {status}
                        </button>
                    ))}
                </div>

                {/* Advances Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">💸 Salary Advance Requests</CardTitle>
                            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12"><Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" /></div>
                        ) : filteredAdvances.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No salary advance requests found</p>
                                <Button className="mt-3 bg-orange-600" onClick={() => setShowAddModal(true)}>
                                    <Plus className="w-4 h-4" /> Create New
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                                            <th className="text-left py-3 px-3 text-xs font-bold">🔗 Code</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">👤 Employee</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-orange-600">💰 Amount</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📅 Repayment</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">📝 Reason</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Status</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAdvances.map((a) => (
                                            <tr key={a.advance_id} className={`border-b border-gray-100 hover:bg-gray-50 ${a.status === "pending" ? "bg-amber-50/50" : ""}`}>
                                                <td className="py-3 px-3 font-mono text-xs text-blue-600">{a.advance_code}</td>
                                                <td className="py-3 px-3">
                                                    <p className="font-medium">{a.users?.full_name || "-"}</p>
                                                    <p className="text-xs text-gray-500">Salary: {formatCurrency(a.users?.monthly_salary || 0)}</p>
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-orange-700">{formatCurrency(a.amount)}</td>
                                                <td className="py-3 px-3">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">{a.repayment_month}</span>
                                                </td>
                                                <td className="py-3 px-3 text-sm text-gray-600 max-w-xs truncate">{a.reason || "-"}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${a.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                        a.status === "approved" ? "bg-green-100 text-green-700" :
                                                            a.status === "rejected" ? "bg-red-100 text-red-700" :
                                                                "bg-blue-100 text-blue-700"
                                                        }`}>
                                                        {a.status === "pending" && "⏳ "}
                                                        {a.status === "approved" && "✅ "}
                                                        {a.status === "rejected" && "❌ "}
                                                        {a.status === "repaid" && "💰 "}
                                                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {a.status === "pending" && (
                                                        <div className="flex gap-1 justify-center">
                                                            <button
                                                                onClick={() => handleApprove(a.advance_id)}
                                                                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(a.advance_id)}
                                                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
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

            {/* Add Modal */}
            {showAddModal && (
                <AddAdvanceModal
                    employees={employees}
                    onSave={handleSaveAdvance}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
