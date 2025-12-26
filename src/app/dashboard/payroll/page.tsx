"use client"

import { useState, useEffect } from "react"
import {
    Calculator, Users, DollarSign, Calendar, FileText, Download, RefreshCw,
    Plus, Search, CheckCircle, Clock, XCircle, Wallet, CreditCard, Building2,
    Loader2, ChevronDown, Printer, Send, TrendingUp, TrendingDown, UserCheck,
    X, Save, AlertCircle, Banknote
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
    phone_number: string
    national_id: string
    monthly_salary: number
    bank_name: string
    bank_account: string
    kra_pin: string
}

interface PayrollRecord {
    payroll_id: number
    payroll_code: string
    user_id: string  // UUID
    pay_period: string
    basic_salary: number
    gross_salary: number
    paye: number
    nhif: number
    nssf: number
    housing_levy: number
    salary_advance_deduction: number
    total_deductions: number
    net_salary: number
    payment_status: string
    payment_date: string
    users?: { full_name: string }
}

// ==========================================
// KENYA TAX CALCULATOR 2024
// ==========================================
function calculateKenyaTax(grossSalary: number): {
    paye: number
    nhif: number
    nssf: number
    housingLevy: number
    personalRelief: number
    totalDeductions: number
    netSalary: number
    taxableIncome: number
} {
    // NSSF - Tier I & II (Employee contribution)
    const nssf = Math.min(grossSalary * 0.06, 2160) // Max KES 2,160

    // Housing Levy - 1.5% of gross
    const housingLevy = grossSalary * 0.015

    // Taxable Income = Gross - NSSF
    const taxableIncome = grossSalary - nssf

    // PAYE Calculation (2024 Tax Bands)
    let paye = 0
    if (taxableIncome <= 24000) {
        paye = taxableIncome * 0.10
    } else if (taxableIncome <= 32333) {
        paye = 2400 + (taxableIncome - 24000) * 0.25
    } else if (taxableIncome <= 500000) {
        paye = 2400 + 2083.25 + (taxableIncome - 32333) * 0.30
    } else if (taxableIncome <= 800000) {
        paye = 2400 + 2083.25 + 140300.10 + (taxableIncome - 500000) * 0.325
    } else {
        paye = 2400 + 2083.25 + 140300.10 + 97500 + (taxableIncome - 800000) * 0.35
    }

    // Personal Relief - KES 2,400 per month
    const personalRelief = 2400
    paye = Math.max(0, paye - personalRelief)

    // NHIF Rates (2024)
    let nhif = 0
    if (grossSalary <= 5999) nhif = 150
    else if (grossSalary <= 7999) nhif = 300
    else if (grossSalary <= 11999) nhif = 400
    else if (grossSalary <= 14999) nhif = 500
    else if (grossSalary <= 19999) nhif = 600
    else if (grossSalary <= 24999) nhif = 750
    else if (grossSalary <= 29999) nhif = 850
    else if (grossSalary <= 34999) nhif = 900
    else if (grossSalary <= 39999) nhif = 950
    else if (grossSalary <= 44999) nhif = 1000
    else if (grossSalary <= 49999) nhif = 1100
    else if (grossSalary <= 59999) nhif = 1200
    else if (grossSalary <= 69999) nhif = 1300
    else if (grossSalary <= 79999) nhif = 1400
    else if (grossSalary <= 89999) nhif = 1500
    else if (grossSalary <= 99999) nhif = 1600
    else nhif = 1700

    const totalDeductions = paye + nhif + nssf + housingLevy
    const netSalary = grossSalary - totalDeductions

    return {
        paye: Math.round(paye * 100) / 100,
        nhif,
        nssf: Math.round(nssf * 100) / 100,
        housingLevy: Math.round(housingLevy * 100) / 100,
        personalRelief,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
        taxableIncome: Math.round(taxableIncome * 100) / 100,
    }
}

// Generate Payroll Code
function generatePayrollCode(): string {
    const date = new Date()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
    return `PAY-${date.getFullYear()}${month}-${random}`
}

// Tax Calculator Modal
function TaxCalculatorModal({ onClose }: { onClose: () => void }) {
    const [salary, setSalary] = useState(50000)
    const [allowances, setAllowances] = useState(0)
    const gross = salary + allowances
    const tax = calculateKenyaTax(gross)

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-6 h-6" />
                            <h2 className="text-lg font-bold">🇰🇪 Kenya Tax Calculator 2024</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">💰 Basic Salary</label>
                            <input
                                type="number"
                                value={salary}
                                onChange={(e) => setSalary(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🎁 Allowances</label>
                            <input
                                type="number"
                                value={allowances}
                                onChange={(e) => setAllowances(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold"
                            />
                        </div>
                    </div>

                    {/* Gross Salary */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">💵 Gross Salary</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(gross)}</p>
                    </div>

                    {/* Deductions Breakdown */}
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-600">📊 Statutory Deductions</p>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Taxable Income</span>
                                <span className="font-mono">{formatCurrency(tax.taxableIncome)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">PAYE (Tax)</span>
                                <span className="font-mono text-red-600">-{formatCurrency(tax.paye)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">NHIF</span>
                                <span className="font-mono text-red-600">-{formatCurrency(tax.nhif)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">NSSF</span>
                                <span className="font-mono text-red-600">-{formatCurrency(tax.nssf)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Housing Levy (1.5%)</span>
                                <span className="font-mono text-red-600">-{formatCurrency(tax.housingLevy)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-gray-600">Personal Relief</span>
                                <span className="font-mono text-green-600">+{formatCurrency(tax.personalRelief)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Total Deductions</span>
                                <span className="text-red-700">{formatCurrency(tax.totalDeductions)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary */}
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                        <p className="text-sm text-green-600 font-medium">✅ Net Salary (Take Home)</p>
                        <p className="text-3xl font-bold text-green-700">{formatCurrency(tax.netSalary)}</p>
                        <p className="text-xs text-green-600 mt-1">
                            Deduction Rate: {((tax.totalDeductions / gross) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Generate Payroll Modal
function GeneratePayrollModal({
    employees,
    onGenerate,
    onClose,
}: {
    employees: Employee[]
    onGenerate: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [payPeriod, setPayPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [formData, setFormData] = useState({
        basic_salary: 0,
        overtime_pay: 0,
        allowances: 0,
        bonuses: 0,
        salary_advance: 0,
        other_deductions: 0,
    })

    const gross = formData.basic_salary + formData.overtime_pay + formData.allowances + formData.bonuses
    const tax = calculateKenyaTax(gross)
    const totalDeductions = tax.totalDeductions + formData.salary_advance + formData.other_deductions
    const netSalary = gross - totalDeductions

    const handleEmployeeSelect = (userId: string) => {
        const emp = employees.find(e => e.id === userId)
        if (emp) {
            setSelectedEmployee(emp)
            setFormData(prev => ({ ...prev, basic_salary: emp.monthly_salary || 0 }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEmployee) {
            toast.error("Required", "Select an employee")
            return
        }
        setLoading(true)
        try {
            await onGenerate({
                payroll_code: generatePayrollCode(),
                user_id: selectedEmployee.id,
                pay_period: payPeriod,
                basic_salary: formData.basic_salary,
                overtime_pay: formData.overtime_pay,
                allowances: formData.allowances,
                bonuses: formData.bonuses,
                gross_salary: gross,
                paye: tax.paye,
                nhif: tax.nhif,
                nssf: tax.nssf,
                housing_levy: tax.housingLevy,
                salary_advance_deduction: formData.salary_advance,
                other_deductions: formData.other_deductions,
                total_deductions: totalDeductions,
                net_salary: netSalary,
                payment_status: "pending",
            })
            onClose()
        } catch (error: any) {
            toast.error("Error", error.message)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-6 h-6" />
                            <h2 className="text-lg font-bold">💰 Generate Payroll</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Employee & Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">👤 Employee</label>
                            <select
                                onChange={(e) => handleEmployeeSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                                required
                            >
                                <option value="">Select Employee</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Pay Period</label>
                            <input
                                type="month"
                                value={payPeriod}
                                onChange={(e) => setPayPeriod(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    {/* Earnings */}
                    <div>
                        <p className="text-sm font-bold text-green-600 mb-2">💵 Earnings</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Basic Salary</label>
                                <input
                                    type="number"
                                    value={formData.basic_salary}
                                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Overtime</label>
                                <input
                                    type="number"
                                    value={formData.overtime_pay}
                                    onChange={(e) => setFormData({ ...formData, overtime_pay: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Allowances</label>
                                <input
                                    type="number"
                                    value={formData.allowances}
                                    onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Bonuses</label>
                                <input
                                    type="number"
                                    value={formData.bonuses}
                                    onChange={(e) => setFormData({ ...formData, bonuses: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="mt-2 p-3 bg-green-50 rounded-xl flex justify-between">
                            <span className="font-medium text-green-700">Gross Salary</span>
                            <span className="font-bold text-green-700">{formatCurrency(gross)}</span>
                        </div>
                    </div>

                    {/* Statutory Deductions (Read-only) */}
                    <div>
                        <p className="text-sm font-bold text-red-600 mb-2">📊 Statutory Deductions (Auto-Calculated)</p>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <p className="text-xs text-gray-500">PAYE</p>
                                <p className="font-bold text-red-700">{formatCurrency(tax.paye)}</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-xl">
                                <p className="text-xs text-gray-500">NHIF</p>
                                <p className="font-bold text-red-700">{formatCurrency(tax.nhif)}</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-xl">
                                <p className="text-xs text-gray-500">NSSF</p>
                                <p className="font-bold text-red-700">{formatCurrency(tax.nssf)}</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-xl">
                                <p className="text-xs text-gray-500">Housing</p>
                                <p className="font-bold text-red-700">{formatCurrency(tax.housingLevy)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Other Deductions */}
                    <div>
                        <p className="text-sm font-bold text-orange-600 mb-2">💸 Other Deductions</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Salary Advance</label>
                                <input
                                    type="number"
                                    value={formData.salary_advance}
                                    onChange={(e) => setFormData({ ...formData, salary_advance: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-xl bg-orange-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Other Deductions</label>
                                <input
                                    type="number"
                                    value={formData.other_deductions}
                                    onChange={(e) => setFormData({ ...formData, other_deductions: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-orange-200 rounded-xl bg-orange-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-red-100 rounded-xl">
                            <p className="text-sm text-red-600">Total Deductions</p>
                            <p className="text-xl font-bold text-red-700">{formatCurrency(totalDeductions)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                            <p className="text-sm text-green-600">Net Salary</p>
                            <p className="text-xl font-bold text-green-700">{formatCurrency(netSalary)}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" loading={loading} variant="success" className="flex-1">
                            <Save className="w-4 h-4" /> Generate Payroll
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Payroll Page
export default function PayrollPage() {
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
    const [showCalculator, setShowCalculator] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [payPeriod, setPayPeriod] = useState(new Date().toISOString().slice(0, 7))

    useEffect(() => {
        fetchData()
    }, [payPeriod])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [empRes, payRes] = await Promise.all([
                    supabase.from("users").select("id, full_name, phone_number, national_id, monthly_salary, bank_name, bank_account, kra_pin"),
                    supabase.from("payroll").select("*, users(full_name)").eq("pay_period", payPeriod).order("created_at", { ascending: false }),
                ])
                setEmployees(empRes.data || [])
                setPayrollRecords(payRes.data || [])
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleGeneratePayroll = async (data: any) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("payroll").insert([data])
        if (error) throw error
        toast.success("Success", "Payroll generated successfully!")
        fetchData()
    }

    const handleMarkPaid = async (payrollId: number) => {
        if (!isSupabaseConfigured() || !supabase) return
        const { error } = await supabase.from("payroll").update({
            payment_status: "paid",
            payment_date: new Date().toISOString(),
        }).eq("payroll_id", payrollId)
        if (error) {
            toast.error("Error", error.message)
        } else {
            toast.success("Success", "Marked as paid!")
            fetchData()
        }
    }

    // Stats
    const totalGross = payrollRecords.reduce((s, p) => s + (p.gross_salary || 0), 0)
    const totalNet = payrollRecords.reduce((s, p) => s + (p.net_salary || 0), 0)
    const totalPAYE = payrollRecords.reduce((s, p) => s + (p.paye || 0), 0)
    const paidCount = payrollRecords.filter(p => p.payment_status === "paid").length
    const pendingCount = payrollRecords.filter(p => p.payment_status === "pending").length

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="w-7 h-7 text-green-600" />
                            💰 Payroll Management
                        </h1>
                        <p className="text-gray-500 text-sm">Kenya PAYE/NHIF/NSSF compliant payroll system</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setShowCalculator(true)}>
                            <Calculator className="w-4 h-4" /> Tax Calculator
                        </Button>
                        <Button onClick={() => setShowGenerateModal(true)}>
                            <Plus className="w-4 h-4" /> Generate Payroll
                        </Button>
                    </div>
                </div>

                {/* Period Selector */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                                <label className="block text-xs text-gray-500">Pay Period</label>
                                <input
                                    type="month"
                                    value={payPeriod}
                                    onChange={(e) => setPayPeriod(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-xl font-bold"
                                />
                            </div>
                            <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">👥 Employees</p>
                        <p className="text-2xl font-bold text-gray-900">{payrollRecords.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <p className="text-xs text-blue-600">💵 Gross Total</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(totalGross)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                        <p className="text-xs text-red-600">📊 PAYE Total</p>
                        <p className="text-xl font-bold text-red-700">{formatCurrency(totalPAYE)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <p className="text-xs text-green-600">✅ Net Total</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(totalNet)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <p className="text-xs text-purple-600">📋 Status</p>
                        <p className="text-sm font-bold text-purple-700">✅ {paidCount} Paid | ⏳ {pendingCount} Pending</p>
                    </div>
                </div>

                {/* Payroll Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">📋 Payroll Records - {payPeriod}</CardTitle>
                            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12"><Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" /></div>
                        ) : payrollRecords.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No payroll records for this period</p>
                                <Button className="mt-3" onClick={() => setShowGenerateModal(true)}>
                                    <Plus className="w-4 h-4" /> Generate Payroll
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                            <th className="text-left py-3 px-3 text-xs font-bold">Code</th>
                                            <th className="text-left py-3 px-3 text-xs font-bold">👤 Employee</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-blue-600">Gross</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-red-600">PAYE</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-red-600">NHIF</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-red-600">NSSF</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-orange-600">Advances</th>
                                            <th className="text-right py-3 px-3 text-xs font-bold text-green-600">Net</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Status</th>
                                            <th className="text-center py-3 px-3 text-xs font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payrollRecords.map((p) => (
                                            <tr key={p.payroll_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-3 font-mono text-xs text-blue-600">{p.payroll_code}</td>
                                                <td className="py-3 px-3 font-medium">{p.users?.full_name || "-"}</td>
                                                <td className="py-3 px-3 text-right font-semibold">{formatCurrency(p.gross_salary)}</td>
                                                <td className="py-3 px-3 text-right text-red-600">{formatCurrency(p.paye)}</td>
                                                <td className="py-3 px-3 text-right text-red-600">{formatCurrency(p.nhif)}</td>
                                                <td className="py-3 px-3 text-right text-red-600">{formatCurrency(p.nssf)}</td>
                                                <td className="py-3 px-3 text-right text-orange-600">{formatCurrency(p.salary_advance_deduction)}</td>
                                                <td className="py-3 px-3 text-right font-bold text-green-700">{formatCurrency(p.net_salary)}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${p.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {p.payment_status === "paid" ? "✅ Paid" : "⏳ Pending"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {p.payment_status !== "paid" && (
                                                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(p.payroll_id)}>
                                                            💳 Pay
                                                        </Button>
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

            {/* Modals */}
            {showCalculator && <TaxCalculatorModal onClose={() => setShowCalculator(false)} />}
            {showGenerateModal && (
                <GeneratePayrollModal
                    employees={employees}
                    onGenerate={handleGeneratePayroll}
                    onClose={() => setShowGenerateModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
