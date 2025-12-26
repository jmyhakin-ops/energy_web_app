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

// Cash Book Tab - Enhanced with Station, User, Pump details
function CashBookTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
    const entries = [
        { date: "2024-12-26", time: "14:45", ref: "RCP-00156", description: "Fuel Sales - Petrol", station: "Westlands", pump: "P-001", user: "John Kamau", debit: 125000, credit: 0, balance: 125000, type: "fuel" },
        { date: "2024-12-26", time: "14:20", ref: "RCP-00155", description: "Fuel Sales - Diesel", station: "CBD Main", pump: "P-003", user: "Mary Wanjiku", debit: 98500, credit: 0, balance: 223500, type: "fuel" },
        { date: "2024-12-26", time: "13:55", ref: "RCP-00154", description: "Lubricant Sales - Engine Oil", station: "Westlands", pump: "-", user: "John Kamau", debit: 15200, credit: 0, balance: 238700, type: "lubricant" },
        { date: "2024-12-26", time: "11:30", ref: "PV-00045", description: "Fuel Purchase - Total Kenya", station: "Depot", pump: "-", user: "Admin", debit: 0, credit: 450000, balance: -211300, type: "expense" },
        { date: "2024-12-26", time: "10:15", ref: "RCP-00153", description: "Fuel Sales - Kerosene", station: "Thika Road", pump: "P-002", user: "Peter Otieno", debit: 340000, credit: 0, balance: 128700, type: "fuel" },
        { date: "2024-12-25", time: "17:00", ref: "PV-00044", description: "Staff Wages - December", station: "HQ", pump: "-", user: "Admin", debit: 0, credit: 45000, balance: 83700, type: "expense" },
        { date: "2024-12-25", time: "09:30", ref: "PV-00043", description: "Electricity Bill - KPLC", station: "Westlands", pump: "-", user: "Admin", debit: 0, credit: 12500, balance: 71200, type: "expense" },
    ]

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">💰 Cash Book (Detailed)</CardTitle>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">In: {formatCurrency(totalDebit)}</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">Out: {formatCurrency(totalCredit)}</span>
                        <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">📅 Date/Time</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">🔗 Ref</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">📝 Description</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-blue-600">🏢 Station</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-purple-600">⛽ Pump</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-orange-600">👤 User</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-green-600">💵 Debit</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-red-600">💸 Credit</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-gray-600">💰 Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e, i) => (
                                <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${e.type === "expense" ? "bg-red-50/30" : ""}`}>
                                    <td className="py-2 px-2 text-sm">
                                        <div>{e.date}</div>
                                        <div className="text-xs text-gray-400">{e.time}</div>
                                    </td>
                                    <td className="py-2 px-2 text-sm font-mono text-blue-600">{e.ref}</td>
                                    <td className="py-2 px-2 text-sm font-medium">{e.description}</td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{e.station}</span>
                                    </td>
                                    <td className="py-2 px-2">
                                        {e.pump !== "-" ? (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">{e.pump}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs">{e.user}</span>
                                    </td>
                                    <td className="py-2 px-2 text-right text-sm font-semibold text-green-600">{e.debit > 0 ? formatCurrency(e.debit) : "-"}</td>
                                    <td className="py-2 px-2 text-right text-sm font-semibold text-red-600">{e.credit > 0 ? formatCurrency(e.credit) : "-"}</td>
                                    <td className={`py-2 px-2 text-right text-sm font-bold ${e.balance >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(e.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={6} className="py-3 px-2 text-sm">📊 TOTALS</td>
                                <td className="py-3 px-2 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                <td className="py-3 px-2 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                                <td className="py-3 px-2 text-right text-blue-700">{formatCurrency(totalDebit - totalCredit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

// M-Pesa Book Tab - Enhanced with Station, User, Pump details
function MpesaBookTab() {
    const entries = [
        { date: "2024-12-26", time: "14:32", ref: "MPESA-00089", phone: "254712***89", receipt: "SG12AB34CD", station: "Westlands", pump: "P-001", user: "John Kamau", fuelType: "Petrol", liters: 28.89, amount: 5200, status: "success" },
        { date: "2024-12-26", time: "14:15", ref: "MPESA-00088", phone: "254723***45", receipt: "SG12AB35EF", station: "CBD Main", pump: "P-002", user: "Mary Wanjiku", fuelType: "Diesel", liters: 22.35, amount: 3800, status: "success" },
        { date: "2024-12-26", time: "13:48", ref: "MPESA-00087", phone: "254734***12", receipt: "SG12AB36GH", station: "Thika Road", pump: "P-003", user: "Peter Otieno", fuelType: "Petrol", liters: 69.44, amount: 12500, status: "success" },
        { date: "2024-12-26", time: "13:22", ref: "MPESA-00086", phone: "254745***78", receipt: null, station: "Westlands", pump: "P-001", user: "John Kamau", fuelType: "Diesel", liters: 11.76, amount: 2000, status: "failed" },
        { date: "2024-12-26", time: "12:55", ref: "MPESA-00085", phone: "254756***34", receipt: "SG12AB37IJ", station: "CBD Main", pump: "P-004", user: "Grace Akinyi", fuelType: "Petrol", liters: 49.44, amount: 8900, status: "success" },
        { date: "2024-12-26", time: "11:30", ref: "MPESA-00084", phone: "254767***56", receipt: "SG12AB38KL", station: "Mombasa Rd", pump: "P-001", user: "James Mwangi", fuelType: "Kerosene", liters: 35.00, amount: 4200, status: "success" },
        { date: "2024-12-26", time: "10:45", ref: "MPESA-00083", phone: "254778***67", receipt: "SG12AB39MN", station: "Kisumu", pump: "P-002", user: "Sarah Njeri", fuelType: "Diesel", liters: 88.24, amount: 15000, status: "success" },
    ]
    const totalSuccess = entries.filter(e => e.status === "success").reduce((s, e) => s + e.amount, 0)
    const totalLiters = entries.filter(e => e.status === "success").reduce((s, e) => s + e.liters, 0)
    const successCount = entries.filter(e => e.status === "success").length
    const failedCount = entries.filter(e => e.status === "failed").length

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2">📱 M-Pesa Transaction Book (Detailed)</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">✅ {successCount} Success</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">❌ {failedCount} Failed</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">⛽ {totalLiters.toFixed(1)}L</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">{formatCurrency(totalSuccess)}</span>
                        <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                        <thead>
                            <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">📅 Date/Time</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">🔗 Ref</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">📱 Phone</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-blue-600">🏢 Station</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-purple-600">⛽ Pump</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-orange-600">👤 Attendant</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-cyan-600">🛢️ Fuel</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-indigo-600">📊 Liters</th>
                                <th className="text-right py-3 px-2 text-xs font-bold text-green-600">💰 Amount</th>
                                <th className="text-left py-3 px-2 text-xs font-bold text-gray-600">🧾 Receipt</th>
                                <th className="text-center py-3 px-2 text-xs font-bold text-gray-600">✅ Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e, i) => (
                                <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${e.status === "failed" ? "bg-red-50/50" : ""}`}>
                                    <td className="py-2 px-2 text-sm">
                                        <div>{e.date}</div>
                                        <div className="text-xs text-gray-400">{e.time}</div>
                                    </td>
                                    <td className="py-2 px-2 text-xs font-mono text-blue-600">{e.ref}</td>
                                    <td className="py-2 px-2 text-sm font-mono">{e.phone}</td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{e.station}</span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono">{e.pump}</span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs">{e.user}</span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs">{e.fuelType}</span>
                                    </td>
                                    <td className="py-2 px-2 text-right text-sm font-medium text-indigo-600">{e.liters.toFixed(2)}L</td>
                                    <td className="py-2 px-2 text-right text-sm font-bold text-green-600">{formatCurrency(e.amount)}</td>
                                    <td className="py-2 px-2 text-xs font-mono text-gray-600">{e.receipt || "-"}</td>
                                    <td className="py-2 px-2 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${e.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {e.status === "success" ? "✅" : "❌"}
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

// General Ledger Tab
function LedgerTab() {
    const [selectedAccount, setSelectedAccount] = useState("1000")

    const accounts = [
        { code: "1000", name: "💰 Cash at Bank", type: "Asset" },
        { code: "1100", name: "📱 M-Pesa Float", type: "Asset" },
        { code: "1200", name: "📋 Accounts Receivable", type: "Asset" },
        { code: "1300", name: "⛽ Fuel Inventory", type: "Asset" },
        { code: "1400", name: "🛢️ Lubricant Inventory", type: "Asset" },
        { code: "2000", name: "📦 Accounts Payable", type: "Liability" },
        { code: "2100", name: "💳 VAT Payable", type: "Liability" },
        { code: "4000", name: "⛽ Fuel Sales Revenue", type: "Revenue" },
        { code: "4100", name: "🛢️ Lubricant Revenue", type: "Revenue" },
        { code: "5000", name: "📊 Cost of Fuel Sold", type: "Expense" },
        { code: "6000", name: "💼 Operating Expenses", type: "Expense" },
    ]

    const ledgerEntries: Record<string, Array<{ date: string; ref: string; description: string; debit: number; credit: number; balance: number }>> = {
        "1000": [
            { date: "2024-12-01", ref: "OB-001", description: "Opening Balance", debit: 2000000, credit: 0, balance: 2000000 },
            { date: "2024-12-05", ref: "RCP-001", description: "Fuel Sales - Station 1", debit: 450000, credit: 0, balance: 2450000 },
            { date: "2024-12-08", ref: "PV-001", description: "Fuel Purchase - Total Kenya", debit: 0, credit: 850000, balance: 1600000 },
            { date: "2024-12-12", ref: "RCP-045", description: "Fuel Sales - Station 2", debit: 380000, credit: 0, balance: 1980000 },
            { date: "2024-12-15", ref: "PV-012", description: "Staff Salaries", debit: 0, credit: 280000, balance: 1700000 },
            { date: "2024-12-18", ref: "RCP-089", description: "Lubricant Sales", debit: 125000, credit: 0, balance: 1825000 },
            { date: "2024-12-22", ref: "PV-018", description: "Electricity Bill", debit: 0, credit: 45000, balance: 1780000 },
            { date: "2024-12-26", ref: "RCP-156", description: "Fuel Sales - Station 3", debit: 670000, credit: 0, balance: 2450000 },
        ],
        "1100": [
            { date: "2024-12-01", ref: "OB-002", description: "Opening Balance", debit: 500000, credit: 0, balance: 500000 },
            { date: "2024-12-03", ref: "MPESA-001", description: "M-Pesa Sales - Pump 1", debit: 125000, credit: 0, balance: 625000 },
            { date: "2024-12-06", ref: "MPESA-045", description: "M-Pesa Sales - Pump 2", debit: 98000, credit: 0, balance: 723000 },
            { date: "2024-12-10", ref: "TRF-001", description: "Transfer to Bank", debit: 0, credit: 200000, balance: 523000 },
            { date: "2024-12-15", ref: "MPESA-089", description: "M-Pesa Sales - Pump 3", debit: 156000, credit: 0, balance: 679000 },
            { date: "2024-12-20", ref: "MPESA-134", description: "M-Pesa Sales - Pump 1", debit: 171000, credit: 0, balance: 850000 },
        ],
        "4000": [
            { date: "2024-12-05", ref: "INV-001", description: "Fuel Sales - Petrol", debit: 0, credit: 450000, balance: 450000 },
            { date: "2024-12-08", ref: "INV-012", description: "Fuel Sales - Diesel", debit: 0, credit: 520000, balance: 970000 },
            { date: "2024-12-12", ref: "INV-034", description: "Fuel Sales - Petrol", debit: 0, credit: 380000, balance: 1350000 },
            { date: "2024-12-18", ref: "INV-056", description: "Fuel Sales - Kerosene", debit: 0, credit: 125000, balance: 1475000 },
            { date: "2024-12-22", ref: "INV-078", description: "Fuel Sales - Diesel", debit: 0, credit: 670000, balance: 2145000 },
        ],
    }

    const currentAccount = accounts.find(a => a.code === selectedAccount)
    const entries = ledgerEntries[selectedAccount] || []
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)

    return (
        <div className="space-y-4">
            {/* Account Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-600 mb-1">📖 Select Account</label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium"
                            >
                                {accounts.map(a => (
                                    <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
                            <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info Card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500">Account Code</p>
                    <p className="text-lg font-bold text-blue-600 font-mono">{selectedAccount}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500">Account Name</p>
                    <p className="text-lg font-bold text-gray-900">{currentAccount?.name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500">Account Type</p>
                    <p className="text-lg font-bold text-purple-600">{currentAccount?.type}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500">Current Balance</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(entries[entries.length - 1]?.balance || 0)}</p>
                </div>
            </div>

            {/* Ledger Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">📖 Ledger Entries - {currentAccount?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📅 Date</th>
                                    <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">🔗 Ref</th>
                                    <th className="text-left py-3 px-3 text-xs font-bold text-gray-600">📝 Description</th>
                                    <th className="text-right py-3 px-3 text-xs font-bold text-green-600">💵 Debit</th>
                                    <th className="text-right py-3 px-3 text-xs font-bold text-red-600">💸 Credit</th>
                                    <th className="text-right py-3 px-3 text-xs font-bold text-blue-600">💰 Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((e, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-3 text-sm">{e.date}</td>
                                        <td className="py-3 px-3 text-sm font-mono text-blue-600">{e.ref}</td>
                                        <td className="py-3 px-3 text-sm font-medium">{e.description}</td>
                                        <td className="py-3 px-3 text-right text-sm font-semibold text-green-600">{e.debit > 0 ? formatCurrency(e.debit) : "-"}</td>
                                        <td className="py-3 px-3 text-right text-sm font-semibold text-red-600">{e.credit > 0 ? formatCurrency(e.credit) : "-"}</td>
                                        <td className="py-3 px-3 text-right text-sm font-bold text-blue-700">{formatCurrency(e.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={3} className="py-3 px-3 text-sm">📊 TOTALS</td>
                                    <td className="py-3 px-3 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                    <td className="py-3 px-3 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                                    <td className="py-3 px-3 text-right text-blue-700">{formatCurrency(entries[entries.length - 1]?.balance || 0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Reconciliation Tab
function ReconciliationTab() {
    const [reconcileType, setReconcileType] = useState<"bank" | "mpesa">("bank")

    const bankStatement = [
        { date: "2024-12-01", ref: "CHQ-001", description: "Deposit", amount: 500000, type: "credit" },
        { date: "2024-12-05", ref: "TRF-IN-01", description: "Transfer from M-Pesa", amount: 200000, type: "credit" },
        { date: "2024-12-08", ref: "CHQ-045", description: "Cheque Payment - Supplier", amount: 350000, type: "debit" },
        { date: "2024-12-12", ref: "TRF-IN-02", description: "Customer Payment", amount: 180000, type: "credit" },
        { date: "2024-12-15", ref: "DD-001", description: "Direct Debit - Salaries", amount: 280000, type: "debit" },
        { date: "2024-12-20", ref: "TRF-IN-03", description: "Transfer from M-Pesa", amount: 150000, type: "credit" },
    ]

    const systemRecords = [
        { date: "2024-12-01", ref: "RCP-001", description: "Cash Deposit", amount: 500000, type: "credit", matched: true },
        { date: "2024-12-05", ref: "TRF-001", description: "M-Pesa Transfer", amount: 200000, type: "credit", matched: true },
        { date: "2024-12-08", ref: "PV-001", description: "Supplier Payment", amount: 350000, type: "debit", matched: true },
        { date: "2024-12-12", ref: "RCP-045", description: "Customer Receipt", amount: 180000, type: "credit", matched: true },
        { date: "2024-12-14", ref: "RCP-052", description: "Cash Sale (Not in Bank)", amount: 45000, type: "credit", matched: false },
        { date: "2024-12-15", ref: "PV-012", description: "Salary Payment", amount: 280000, type: "debit", matched: true },
        { date: "2024-12-20", ref: "TRF-002", description: "M-Pesa Transfer", amount: 150000, type: "credit", matched: true },
    ]

    const bankTotal = bankStatement.reduce((s, e) => s + (e.type === "credit" ? e.amount : -e.amount), 0)
    const systemTotal = systemRecords.reduce((s, e) => s + (e.type === "credit" ? e.amount : -e.amount), 0)
    const difference = systemTotal - bankTotal
    const matchedCount = systemRecords.filter(r => r.matched).length
    const unmatchedCount = systemRecords.filter(r => !r.matched).length

    return (
        <div className="space-y-6">
            {/* Reconciliation Type Selector */}
            <div className="flex gap-3">
                <button
                    onClick={() => setReconcileType("bank")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${reconcileType === "bank" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"}`}
                >
                    🏦 Bank Reconciliation
                </button>
                <button
                    onClick={() => setReconcileType("mpesa")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${reconcileType === "mpesa" ? "bg-green-600 text-white" : "bg-white border border-gray-200"}`}
                >
                    📱 M-Pesa Reconciliation
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">🏦 Bank Balance</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(bankTotal)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium">💻 System Balance</p>
                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(systemTotal)}</p>
                </div>
                <div className={`rounded-xl p-4 border ${difference === 0 ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200" : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"}`}>
                    <p className={`text-xs font-medium ${difference === 0 ? "text-green-600" : "text-red-600"}`}>⚖️ Difference</p>
                    <p className={`text-2xl font-bold ${difference === 0 ? "text-green-700" : "text-red-700"}`}>
                        {difference === 0 ? "✅ Matched" : formatCurrency(Math.abs(difference))}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">📊 Match Rate</p>
                    <p className="text-2xl font-bold text-amber-700">{((matchedCount / systemRecords.length) * 100).toFixed(0)}%</p>
                    <p className="text-xs text-amber-600">{matchedCount} matched, {unmatchedCount} pending</p>
                </div>
            </div>

            {/* Side by Side Comparison */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bank Statement */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="text-base flex items-center gap-2">🏦 Bank Statement</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-2 px-3 text-xs font-bold">Date</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold">Reference</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold">Description</th>
                                        <th className="text-right py-2 px-3 text-xs font-bold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bankStatement.map((e, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-sm">{e.date}</td>
                                            <td className="py-2 px-3 text-sm font-mono text-xs">{e.ref}</td>
                                            <td className="py-2 px-3 text-sm">{e.description}</td>
                                            <td className={`py-2 px-3 text-right text-sm font-semibold ${e.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                {e.type === "credit" ? "+" : "-"}{formatCurrency(e.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-blue-50 font-bold">
                                        <td colSpan={3} className="py-2 px-3 text-sm">Balance</td>
                                        <td className="py-2 px-3 text-right text-blue-700">{formatCurrency(bankTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* System Records */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="text-base flex items-center gap-2">💻 System Records</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-2 px-3 text-xs font-bold">Date</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold">Reference</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold">Description</th>
                                        <th className="text-right py-2 px-3 text-xs font-bold">Amount</th>
                                        <th className="text-center py-2 px-3 text-xs font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {systemRecords.map((e, i) => (
                                        <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${!e.matched ? "bg-amber-50" : ""}`}>
                                            <td className="py-2 px-3 text-sm">{e.date}</td>
                                            <td className="py-2 px-3 text-sm font-mono text-xs">{e.ref}</td>
                                            <td className="py-2 px-3 text-sm">{e.description}</td>
                                            <td className={`py-2 px-3 text-right text-sm font-semibold ${e.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                                {e.type === "credit" ? "+" : "-"}{formatCurrency(e.amount)}
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                {e.matched ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">✅ Matched</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs">⏳ Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-purple-50 font-bold">
                                        <td colSpan={3} className="py-2 px-3 text-sm">Balance</td>
                                        <td className="py-2 px-3 text-right text-purple-700">{formatCurrency(systemTotal)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unmatched Items */}
            {unmatchedCount > 0 && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">⚠️ Unmatched Items ({unmatchedCount})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {systemRecords.filter(r => !r.matched).map((e, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <p className="font-medium">{e.description}</p>
                                            <p className="text-xs text-gray-500">{e.date} • Ref: {e.ref}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${e.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                                            {formatCurrency(e.amount)}
                                        </span>
                                        <Button size="sm" variant="outline">🔗 Match</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <Card>
                <CardContent className="p-4 flex flex-wrap gap-3">
                    <Button><Download className="w-4 h-4" /> Export Reconciliation Report</Button>
                    <Button variant="outline">📧 Email Report</Button>
                    <Button variant="outline">🖨️ Print</Button>
                    <Button variant="outline">✅ Mark All as Reconciled</Button>
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
                        {activeTab === "ledger" && <LedgerTab />}
                        {activeTab === "reconcile" && <ReconciliationTab />}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
