"use client"

import { useState, useEffect } from "react"
import {
    FileText, Calculator, DollarSign, TrendingUp, TrendingDown, ArrowUpRight,
    ArrowDownRight, Calendar, Building2, Fuel, Users, RefreshCw, Download,
    Filter, BarChart3, PieChart, Loader2, CreditCard, Wallet, Receipt,
    BookOpen, Scale, Banknote, FileSpreadsheet, ChevronDown
} from "lucide-react"
import {
    BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Station { station_id: number; station_name: string }
interface Pump { pump_id: number; pump_name: string }

// Tab definitions
const TABS = [
    { id: "overview", label: "📊 Overview", icon: BarChart3 },
    { id: "cashbook", label: "💰 Cash Book", icon: Wallet },
    { id: "mpesa", label: "📱 M-Pesa Book", icon: CreditCard },
    { id: "trial", label: "⚖️ Trial Balance", icon: Scale },
    { id: "pnl", label: "📈 Profit & Loss", icon: TrendingUp },
    { id: "balance", label: "📋 Balance Sheet", icon: FileText },
    { id: "ledger", label: "📖 Ledgers", icon: BookOpen },
    { id: "reconcile", label: "🔄 Reconciliation", icon: RefreshCw },
]

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

// Filter Bar Component
function FilterBar({
    stations, dateFrom, dateTo, selectedStation, onStationChange, onDateFromChange, onDateToChange
}: {
    stations: Station[]
    dateFrom: string
    dateTo: string
    selectedStation: number
    onStationChange: (id: number) => void
    onDateFromChange: (d: string) => void
    onDateToChange: (d: string) => void
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">🎯 Filters</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">📅 From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => onDateFromChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">📅 To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => onDateToChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">🏢 Station</label>
                        <select
                            value={selectedStation}
                            onChange={(e) => onStationChange(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                            <option value={0}>All Stations</option>
                            {stations.map((s) => (
                                <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" className="w-full" onClick={() => toast.success("Filters Applied")}>
                            <RefreshCw className="w-4 h-4" /> Apply
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// KPI Card
function KpiCard({ title, value, change, icon: Icon, color, prefix = "" }: {
    title: string; value: string | number; change?: number; icon: any; color: string; prefix?: string
}) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? formatCurrency(value) : value}</p>
        </div>
    )
}

// Overview Tab
function OverviewTab({ data }: { data: any }) {
    const revenueData = [
        { name: "Mon", fuel: 450000, lubricants: 35000, mpesa: 380000, cash: 105000 },
        { name: "Tue", fuel: 520000, lubricants: 42000, mpesa: 440000, cash: 122000 },
        { name: "Wed", fuel: 480000, lubricants: 38000, mpesa: 400000, cash: 118000 },
        { name: "Thu", fuel: 610000, lubricants: 55000, mpesa: 520000, cash: 145000 },
        { name: "Fri", fuel: 720000, lubricants: 68000, mpesa: 620000, cash: 168000 },
        { name: "Sat", fuel: 850000, lubricants: 75000, mpesa: 720000, cash: 205000 },
        { name: "Sun", fuel: 580000, lubricants: 48000, mpesa: 480000, cash: 148000 },
    ]

    const paymentBreakdown = [
        { name: "M-Pesa", value: data.mpesaTotal || 3560000, color: "#10B981" },
        { name: "Cash", value: data.cashTotal || 1011000, color: "#F59E0B" },
    ]

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="💰 Total Revenue" value={data.totalRevenue || 4571000} change={12.5} icon={TrendingUp} color="bg-green-100 text-green-600" />
                <KpiCard title="⛽ Fuel Sales" value={data.fuelSales || 4210000} change={8.3} icon={Fuel} color="bg-blue-100 text-blue-600" />
                <KpiCard title="🛢️ Lubricant Sales" value={data.lubricantSales || 361000} change={15.2} icon={Banknote} color="bg-purple-100 text-purple-600" />
                <KpiCard title="📦 Expenses" value={data.expenses || 890000} change={-3.1} icon={TrendingDown} color="bg-red-100 text-red-600" />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">📈 Weekly Revenue Trend</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000)}K`} />
                                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                    <Legend />
                                    <Area type="monotone" dataKey="fuel" stroke="#3B82F6" fill="url(#fuelGrad)" name="Fuel" />
                                    <Line type="monotone" dataKey="mpesa" stroke="#10B981" strokeWidth={2} name="M-Pesa" />
                                    <Line type="monotone" dataKey="cash" stroke="#F59E0B" strokeWidth={2} name="Cash" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Breakdown */}
                <Card>
                    <CardHeader><CardTitle className="text-base">💳 Payment Methods</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}>
                                        {paymentBreakdown.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-2">
                            {paymentBreakdown.map((pm) => (
                                <div key={pm.name} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pm.color }} />
                                        {pm.name}
                                    </span>
                                    <span className="font-semibold">{formatCurrency(pm.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Cash Book Tab
function CashBookTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
    const entries = [
        { date: "2024-12-26", description: "Fuel Sales - Pump 1", debit: 125000, credit: 0, balance: 125000 },
        { date: "2024-12-26", description: "Fuel Sales - Pump 2", debit: 98500, credit: 0, balance: 223500 },
        { date: "2024-12-26", description: "Lubricant Sales", debit: 15200, credit: 0, balance: 238700 },
        { date: "2024-12-26", description: "Fuel Purchase - Supplier", debit: 0, credit: 450000, balance: -211300 },
        { date: "2024-12-26", description: "Fuel Sales - Pump 3", debit: 340000, credit: 0, balance: 128700 },
        { date: "2024-12-25", description: "Staff Wages", debit: 0, credit: 45000, balance: 83700 },
        { date: "2024-12-25", description: "Electricity Bill", debit: 0, credit: 12500, balance: 71200 },
    ]

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">💰 Cash Book</CardTitle>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📅 Date</th>
                                <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📝 Description</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-green-600">💵 Debit (In)</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-red-600">💸 Credit (Out)</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-gray-600">💰 Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-3 text-sm">{e.date}</td>
                                    <td className="py-3 px-3 text-sm font-medium">{e.description}</td>
                                    <td className="py-3 px-3 text-right text-sm font-semibold text-green-600">{e.debit > 0 ? formatCurrency(e.debit) : "-"}</td>
                                    <td className="py-3 px-3 text-right text-sm font-semibold text-red-600">{e.credit > 0 ? formatCurrency(e.credit) : "-"}</td>
                                    <td className={`py-3 px-3 text-right text-sm font-bold ${e.balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(e.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={2} className="py-3 px-3 text-sm">📊 TOTALS</td>
                                <td className="py-3 px-3 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                <td className="py-3 px-3 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                                <td className="py-3 px-3 text-right text-blue-700">{formatCurrency(totalDebit - totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

// M-Pesa Book Tab  
function MpesaBookTab() {
    const entries = [
        { date: "2024-12-26", time: "14:32", phone: "254712***89", receipt: "SG12AB34CD", amount: 5200, status: "success" },
        { date: "2024-12-26", time: "14:15", phone: "254723***45", receipt: "SG12AB35EF", amount: 3800, status: "success" },
        { date: "2024-12-26", time: "13:48", phone: "254734***12", receipt: "SG12AB36GH", amount: 12500, status: "success" },
        { date: "2024-12-26", time: "13:22", phone: "254745***78", receipt: null, amount: 2000, status: "failed" },
        { date: "2024-12-26", time: "12:55", phone: "254756***34", receipt: "SG12AB37IJ", amount: 8900, status: "success" },
    ]
    const totalSuccess = entries.filter(e => e.status === "success").reduce((s, e) => s + e.amount, 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">📱 M-Pesa Transaction Book</CardTitle>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">Total: {formatCurrency(totalSuccess)}</span>
                        <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-green-50">
                                <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📅 Date/Time</th>
                                <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📱 Phone</th>
                                <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">🧾 Receipt</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-gray-600">💰 Amount</th>
                                <th className="text-center py-3 px-3 text-xs font-bold text-gray-600">✅ Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-3 text-sm">{e.date} {e.time}</td>
                                    <td className="py-3 px-3 text-sm font-mono">{e.phone}</td>
                                    <td className="py-3 px-3 text-sm font-mono text-blue-600">{e.receipt || "-"}</td>
                                    <td className="py-3 px-3 text-right text-sm font-bold text-green-600">{formatCurrency(e.amount)}</td>
                                    <td className="py-3 px-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${e.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {e.status === "success" ? "✅ Success" : "❌ Failed"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

// Trial Balance Tab
function TrialBalanceTab() {
    const accounts = [
        { code: "1000", name: "Cash at Bank", debit: 2450000, credit: 0 },
        { code: "1100", name: "M-Pesa Float", debit: 850000, credit: 0 },
        { code: "1200", name: "Accounts Receivable", debit: 125000, credit: 0 },
        { code: "1300", name: "Fuel Inventory", debit: 3200000, credit: 0 },
        { code: "1400", name: "Lubricant Inventory", debit: 450000, credit: 0 },
        { code: "2000", name: "Accounts Payable", debit: 0, credit: 1850000 },
        { code: "2100", name: "VAT Payable", debit: 0, credit: 320000 },
        { code: "3000", name: "Share Capital", debit: 0, credit: 3000000 },
        { code: "3100", name: "Retained Earnings", debit: 0, credit: 1200000 },
        { code: "4000", name: "Fuel Sales Revenue", debit: 0, credit: 8500000 },
        { code: "4100", name: "Lubricant Revenue", debit: 0, credit: 650000 },
        { code: "5000", name: "Cost of Fuel Sold", debit: 6800000, credit: 0 },
        { code: "5100", name: "Cost of Lubricants", debit: 420000, credit: 0 },
        { code: "6000", name: "Operating Expenses", debit: 1225000, credit: 0 },
    ]
    const totalDebit = accounts.reduce((s, a) => s + a.debit, 0)
    const totalCredit = accounts.reduce((s, a) => s + a.credit, 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">⚖️ Trial Balance</CardTitle>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${totalDebit === totalCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {totalDebit === totalCredit ? "✅ Balanced" : "⚠️ Unbalanced"}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-blue-50">
                                <th className="text-left py-3 px-3 text-xs font-bold">Code</th>
                                <th className="text-left py-3 px-3 text-xs font-bold">Account Name</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-green-600">Debit (Dr)</th>
                                <th className="text-right py-3 px-3 text-xs font-bold text-red-600">Credit (Cr)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((a) => (
                                <tr key={a.code} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 text-sm font-mono text-gray-500">{a.code}</td>
                                    <td className="py-2 px-3 text-sm font-medium">{a.name}</td>
                                    <td className="py-2 px-3 text-right text-sm">{a.debit > 0 ? formatCurrency(a.debit) : "-"}</td>
                                    <td className="py-2 px-3 text-right text-sm">{a.credit > 0 ? formatCurrency(a.credit) : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold text-lg">
                                <td colSpan={2} className="py-3 px-3">TOTALS</td>
                                <td className="py-3 px-3 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                <td className="py-3 px-3 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

// Profit & Loss Tab
function ProfitLossTab() {
    const revenue = [
        { name: "Fuel Sales", amount: 8500000 },
        { name: "Lubricant Sales", amount: 650000 },
        { name: "Other Income", amount: 45000 },
    ]
    const expenses = [
        { name: "Cost of Fuel Sold", amount: 6800000 },
        { name: "Cost of Lubricants", amount: 420000 },
        { name: "Staff Salaries", amount: 580000 },
        { name: "Rent & Utilities", amount: 185000 },
        { name: "Marketing", amount: 65000 },
        { name: "Other Expenses", amount: 125000 },
    ]
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalRevenue - totalExpenses

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader><CardTitle className="text-base text-green-800">📈 Revenue</CardTitle></CardHeader>
                <CardContent>
                    {revenue.map((r) => (
                        <div key={r.name} className="flex justify-between py-2 border-b border-green-200">
                            <span className="text-gray-700">{r.name}</span>
                            <span className="font-semibold text-green-700">{formatCurrency(r.amount)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 font-bold text-lg">
                        <span>Total Revenue</span>
                        <span className="text-green-700">{formatCurrency(totalRevenue)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader><CardTitle className="text-base text-red-800">📉 Expenses</CardTitle></CardHeader>
                <CardContent>
                    {expenses.map((e) => (
                        <div key={e.name} className="flex justify-between py-2 border-b border-red-200">
                            <span className="text-gray-700">{e.name}</span>
                            <span className="font-semibold text-red-700">{formatCurrency(e.amount)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 font-bold text-lg">
                        <span>Total Expenses</span>
                        <span className="text-red-700">{formatCurrency(totalExpenses)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className={`lg:col-span-2 ${netProfit >= 0 ? "bg-gradient-to-r from-green-100 to-emerald-100" : "bg-gradient-to-r from-red-100 to-orange-100"}`}>
                <CardContent className="p-6 text-center">
                    <p className="text-lg font-medium text-gray-600 mb-2">💼 Net {netProfit >= 0 ? "Profit" : "Loss"}</p>
                    <p className={`text-4xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {netProfit >= 0 ? "🎉 " : "⚠️ "}{formatCurrency(Math.abs(netProfit))}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Margin: {((netProfit / totalRevenue) * 100).toFixed(1)}%</p>
                </CardContent>
            </Card>
        </div>
    )
}

// Balance Sheet Tab
function BalanceSheetTab() {
    const assets = [
        {
            category: "Current Assets", items: [
                { name: "Cash at Bank", amount: 2450000 },
                { name: "M-Pesa Float", amount: 850000 },
                { name: "Fuel Inventory", amount: 3200000 },
                { name: "Lubricant Inventory", amount: 450000 },
            ]
        },
        {
            category: "Fixed Assets", items: [
                { name: "Pumps & Equipment", amount: 8500000 },
                { name: "Vehicles", amount: 2200000 },
            ]
        },
    ]
    const liabilities = [
        {
            category: "Current Liabilities", items: [
                { name: "Accounts Payable", amount: 1850000 },
                { name: "VAT Payable", amount: 320000 },
            ]
        },
    ]
    const equity = [
        { name: "Share Capital", amount: 10000000 },
        { name: "Retained Earnings", amount: 5480000 },
    ]

    const totalAssets = assets.flatMap(a => a.items).reduce((s, i) => s + i.amount, 0)
    const totalLiabilities = liabilities.flatMap(l => l.items).reduce((s, i) => s + i.amount, 0)
    const totalEquity = equity.reduce((s, e) => s + e.amount, 0)

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-base text-blue-800">📊 Assets</CardTitle></CardHeader>
                <CardContent>
                    {assets.map((cat) => (
                        <div key={cat.category} className="mb-4">
                            <p className="text-sm font-bold text-gray-600 mb-2">{cat.category}</p>
                            {cat.items.map((item) => (
                                <div key={item.name} className="flex justify-between py-1.5 pl-4 border-b border-gray-100">
                                    <span className="text-sm">{item.name}</span>
                                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 font-bold border-t-2">
                        <span>Total Assets</span>
                        <span className="text-blue-700">{formatCurrency(totalAssets)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base text-purple-800">📋 Liabilities & Equity</CardTitle></CardHeader>
                <CardContent>
                    {liabilities.map((cat) => (
                        <div key={cat.category} className="mb-4">
                            <p className="text-sm font-bold text-gray-600 mb-2">{cat.category}</p>
                            {cat.items.map((item) => (
                                <div key={item.name} className="flex justify-between py-1.5 pl-4 border-b border-gray-100">
                                    <span className="text-sm">{item.name}</span>
                                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <p className="text-sm font-bold text-gray-600 mt-4 mb-2">Equity</p>
                    {equity.map((e) => (
                        <div key={e.name} className="flex justify-between py-1.5 pl-4 border-b border-gray-100">
                            <span className="text-sm">{e.name}</span>
                            <span className="text-sm font-medium">{formatCurrency(e.amount)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-3 mt-2 font-bold border-t-2">
                        <span>Total L + E</span>
                        <span className="text-purple-700">{formatCurrency(totalLiabilities + totalEquity)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Main Page
export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState("overview")
    const [loading, setLoading] = useState(true)
    const [stations, setStations] = useState<Station[]>([])
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0])
    const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
    const [selectedStation, setSelectedStation] = useState(0)
    const [data, setData] = useState<any>({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [stRes, salesRes, mpesaRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name"),
                    supabase.from("sales").select("total_amount, payment_method"),
                    supabase.from("mpesa_transactions").select("amount, status"),
                ])
                setStations(stRes.data || [])
                const sales = salesRes.data || []
                const mpesa = mpesaRes.data || []
                setData({
                    totalRevenue: sales.reduce((s: number, x: any) => s + (x.total_amount || 0), 0),
                    fuelSales: sales.reduce((s: number, x: any) => s + (x.total_amount || 0), 0),
                    mpesaTotal: mpesa.filter((m: any) => m.status === "success").reduce((s: number, m: any) => s + (m.amount || 0), 0),
                    cashTotal: sales.filter((s: any) => s.payment_method === "cash").reduce((acc: number, s: any) => acc + (s.total_amount || 0), 0),
                })
            }
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Calculator className="w-6 h-6 text-blue-600" />
                            📊 Accounting Reports
                        </h1>
                        <p className="text-gray-500 text-sm">Financial statements, ledgers & reconciliation</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
                        <Button><Download className="w-4 h-4" /> Export All</Button>
                    </div>
                </div>

                {/* Filters */}
                <FilterBar stations={stations} dateFrom={dateFrom} dateTo={dateTo} selectedStation={selectedStation}
                    onStationChange={setSelectedStation} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {TABS.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {activeTab === "overview" && <OverviewTab data={data} />}
                        {activeTab === "cashbook" && <CashBookTab dateFrom={dateFrom} dateTo={dateTo} />}
                        {activeTab === "mpesa" && <MpesaBookTab />}
                        {activeTab === "trial" && <TrialBalanceTab />}
                        {activeTab === "pnl" && <ProfitLossTab />}
                        {activeTab === "balance" && <BalanceSheetTab />}
                        {activeTab === "ledger" && <Card><CardContent className="p-12 text-center text-gray-500"><BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>General Ledger coming soon</p></CardContent></Card>}
                        {activeTab === "reconcile" && <Card><CardContent className="p-12 text-center text-gray-500"><RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Reconciliation coming soon</p></CardContent></Card>}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
