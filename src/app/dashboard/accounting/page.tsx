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
import { accountingApi, CashBookEntry, MpesaBookEntry, TrialBalanceAccount, PnLItem, BalanceSheetCategory, LedgerEntry, ReconciliationRecord } from "@/lib/api"

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

// Overview Tab — uses real Supabase data
function OverviewTab({ data }: { data: any }) {
    const revenueData = data.dailySales || []

    const paymentBreakdown = [
        { name: "M-Pesa", value: data.mpesaTotal || 0, color: "#10B981", [Symbol.toPrimitive as any]: undefined } as any,
        { name: "Cash", value: data.cashTotal || 0, color: "#F59E0B" },
        { name: "Credit", value: data.creditTotal || 0, color: "#3B82F6" },
    ].filter((p: any) => p.value > 0).map((p: any) => ({ name: p.name, value: p.value, color: p.color, ['' as string]: undefined }))

    // Clean payment data for Recharts
    const cleanPayment = [
        { name: "M-Pesa", value: data.mpesaTotal || 0, color: "#10B981" },
        { name: "Cash", value: data.cashTotal || 0, color: "#F59E0B" },
        { name: "Credit", value: data.creditTotal || 0, color: "#3B82F6" },
    ].filter(p => p.value > 0)

    const expenseTotal = data.expenses || 0

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="💰 Total Revenue" value={data.totalRevenue || 0} icon={TrendingUp} color="bg-green-100 text-green-600" />
                <KpiCard title="⛽ Fuel Sales" value={data.fuelSales || 0} icon={Fuel} color="bg-blue-100 text-blue-600" />
                <KpiCard title="📱 M-Pesa Sales" value={data.mpesaTotal || 0} icon={CreditCard} color="bg-emerald-100 text-emerald-600" />
                <KpiCard title="📦 Expenses" value={expenseTotal} icon={TrendingDown} color="bg-red-100 text-red-600" />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">📈 Daily Revenue Trend (Real Data)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {revenueData.length > 0 ? (
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
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                    <Legend />
                                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="url(#fuelGrad)" name="Total Sales" />
                                    <Line type="monotone" dataKey="mpesa" stroke="#10B981" strokeWidth={2} name="M-Pesa" />
                                    <Line type="monotone" dataKey="cash" stroke="#F59E0B" strokeWidth={2} name="Cash" />
                                </AreaChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No sales data for this period</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Breakdown */}
                <Card>
                    <CardHeader><CardTitle className="text-base">💳 Payment Methods (Real Data)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-48">
                            {cleanPayment.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie data={cleanPayment as any[]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}>
                                        {cleanPayment.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                                </RechartsPie>
                            </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No payment data</div>
                            )}
                        </div>
                        <div className="space-y-2 mt-2">
                            {cleanPayment.map((pm) => (
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

// Cash Book Tab - Fetches real data from API
function CashBookTab({ dateFrom, dateTo, stationId }: { dateFrom: string; dateTo: string; stationId: number }) {
    const [entries, setEntries] = useState<CashBookEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCashBook()
    }, [dateFrom, dateTo, stationId])

    const fetchCashBook = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getCashBook({
                start_date: dateFrom,
                end_date: dateTo,
                station_id: stationId || undefined
            })
            // Calculate running balance
            let balance = 0
            const entriesWithBalance = data.entries.map(e => {
                balance += e.debit - e.credit
                return { ...e, balance }
            })
            setEntries(entriesWithBalance)
        } catch (e) {
            console.error('Failed to fetch cash book:', e)
            toast.error('Failed to load cash book data')
        }
        setLoading(false)
    }

    const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading cash book...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">💰 Cash Book (Real Data)</CardTitle>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">In: {formatCurrency(totalDebit)}</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">Out: {formatCurrency(totalCredit)}</span>
                        <Button variant="outline" size="sm" onClick={fetchCashBook}><RefreshCw className="w-4 h-4" /></Button>
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
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-gray-500">
                                        No transactions found for the selected period
                                    </td>
                                </tr>
                            ) : (
                                entries.map((e, i) => (
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
                                ))
                            )}
                        </tbody>
                        {entries.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={6} className="py-3 px-2 text-sm">📊 TOTALS</td>
                                    <td className="py-3 px-2 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                    <td className="py-3 px-2 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                                    <td className="py-3 px-2 text-right text-blue-700">{formatCurrency(totalDebit - totalCredit)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

// M-Pesa Book Tab - Fetches real M-Pesa transactions from API
function MpesaBookTab({ dateFrom, dateTo, stationId }: { dateFrom: string; dateTo: string; stationId: number }) {
    const [entries, setEntries] = useState<MpesaBookEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMpesaBook()
    }, [dateFrom, dateTo, stationId])

    const fetchMpesaBook = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getMpesaBook({
                start_date: dateFrom,
                end_date: dateTo,
                station_id: stationId || undefined
            })
            setEntries(data.entries)
        } catch (e) {
            console.error('Failed to fetch M-Pesa book:', e)
            toast.error('Failed to load M-Pesa data')
        }
        setLoading(false)
    }

    const totalSuccess = entries.filter(e => e.status === "success").reduce((s, e) => s + e.amount, 0)
    const totalLiters = entries.filter(e => e.status === "success").reduce((s, e) => s + e.liters, 0)
    const successCount = entries.filter(e => e.status === "success").length
    const failedCount = entries.filter(e => e.status === "failed").length

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading M-Pesa transactions...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2">📱 M-Pesa Transaction Book (Real Data)</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">✅ {successCount} Success</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">❌ {failedCount} Failed</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">⛽ {totalLiters.toFixed(1)}L</span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold">{formatCurrency(totalSuccess)}</span>
                        <Button variant="outline" size="sm" onClick={fetchMpesaBook}><RefreshCw className="w-4 h-4" /></Button>
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
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-8 text-center text-gray-500">
                                        No M-Pesa transactions found for the selected period
                                    </td>
                                </tr>
                            ) : (
                                entries.map((e, i) => (
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}


// Trial Balance Tab - Fetches real account balances from API
function TrialBalanceTab({ dateTo }: { dateTo: string }) {
    const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([])
    const [totalDebit, setTotalDebit] = useState(0)
    const [totalCredit, setTotalCredit] = useState(0)
    const [balanced, setBalanced] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTrialBalance()
    }, [dateTo])

    const fetchTrialBalance = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getTrialBalance({
                as_of_date: dateTo
            })
            setAccounts(data.accounts)
            setTotalDebit(data.total_debit)
            setTotalCredit(data.total_credit)
            setBalanced(data.balanced)
        } catch (e) {
            console.error('Failed to fetch trial balance:', e)
            toast.error('Failed to load trial balance')
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading trial balance...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">⚖️ Trial Balance (Real Data)</CardTitle>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${balanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {balanced ? "✅ Balanced" : "⚠️ Unbalanced"}
                        </span>
                        <Button variant="outline" size="sm" onClick={fetchTrialBalance}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
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
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">
                                        No accounts found
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((a) => (
                                    <tr key={a.code} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-sm font-mono text-gray-500">{a.code}</td>
                                        <td className="py-2 px-3 text-sm font-medium">{a.name}</td>
                                        <td className="py-2 px-3 text-right text-sm">{a.debit > 0 ? formatCurrency(a.debit) : "-"}</td>
                                        <td className="py-2 px-3 text-right text-sm">{a.credit > 0 ? formatCurrency(a.credit) : "-"}</td>
                                    </tr>
                                ))
                            )}
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

// Profit & Loss Tab - Fetches real revenue/expense data from API
function ProfitLossTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
    const [revenue, setRevenue] = useState<PnLItem[]>([])
    const [expenses, setExpenses] = useState<PnLItem[]>([])
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [netProfit, setNetProfit] = useState(0)
    const [margin, setMargin] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProfitLoss()
    }, [dateFrom, dateTo])

    const fetchProfitLoss = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getProfitLoss({
                start_date: dateFrom,
                end_date: dateTo
            })
            setRevenue(data.revenue)
            setExpenses(data.expenses)
            setTotalRevenue(data.total_revenue)
            setTotalExpenses(data.total_expenses)
            setNetProfit(data.net_profit)
            setMargin(data.margin)
        } catch (e) {
            console.error('Failed to fetch P&L:', e)
            toast.error('Failed to load profit & loss data')
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading profit & loss...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-green-800">📈 Revenue</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchProfitLoss}><RefreshCw className="w-4 h-4" /></Button>
                </CardHeader>
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
                    <p className="text-sm text-gray-500 mt-2">Margin: {margin.toFixed(1)}%</p>
                </CardContent>
            </Card>
        </div>
    )
}

// Balance Sheet Tab - Fetches real assets/liabilities from API
function BalanceSheetTab({ dateTo }: { dateTo: string }) {
    const [assets, setAssets] = useState<BalanceSheetCategory[]>([])
    const [liabilities, setLiabilities] = useState<BalanceSheetCategory[]>([])
    const [equity, setEquity] = useState<{ name: string; amount: number }[]>([])
    const [totalAssets, setTotalAssets] = useState(0)
    const [totalLiabilities, setTotalLiabilities] = useState(0)
    const [totalEquity, setTotalEquity] = useState(0)
    const [balanced, setBalanced] = useState(true)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBalanceSheet()
    }, [dateTo])

    const fetchBalanceSheet = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getBalanceSheet({
                as_of_date: dateTo
            })
            setAssets(data.assets)
            setLiabilities(data.liabilities)
            setEquity(data.equity)
            setTotalAssets(data.total_assets)
            setTotalLiabilities(data.total_liabilities)
            setTotalEquity(data.total_equity)
            setBalanced(data.balanced)
        } catch (e) {
            console.error('Failed to fetch balance sheet:', e)
            toast.error('Failed to load balance sheet')
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading balance sheet...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-blue-800">📊 Assets</CardTitle>
                    <Button variant="outline" size="sm" onClick={fetchBalanceSheet}><RefreshCw className="w-4 h-4" /></Button>
                </CardHeader>
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-purple-800">📋 Liabilities & Equity</CardTitle>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${balanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {balanced ? "✅" : "⚠️"}
                    </span>
                </CardHeader>
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

// General Ledger Tab - Fetches real ledger entries from API
function LedgerTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
    const [selectedAccount, setSelectedAccount] = useState("4000")
    const [entries, setEntries] = useState<LedgerEntry[]>([])
    const [totalDebit, setTotalDebit] = useState(0)
    const [totalCredit, setTotalCredit] = useState(0)
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    const accounts = [
        { code: "4000", name: "💰 Fuel Sales Revenue", type: "Revenue" },
        { code: "1100", name: "📱 M-Pesa Float", type: "Asset" },
    ]

    useEffect(() => {
        fetchLedger()
    }, [selectedAccount, dateFrom, dateTo])

    const fetchLedger = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getLedger({
                account_code: selectedAccount,
                start_date: dateFrom,
                end_date: dateTo
            })
            setEntries(data.entries)
            setTotalDebit(data.total_debit)
            setTotalCredit(data.total_credit)
            setBalance(data.balance)
        } catch (e) {
            console.error('Failed to fetch ledger:', e)
            toast.error('Failed to load ledger data')
        }
        setLoading(false)
    }

    const currentAccount = accounts.find(a => a.code === selectedAccount)

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
                            <Button variant="outline" size="sm" onClick={fetchLedger}><RefreshCw className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
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
                    <p className="text-lg font-bold text-green-600">{formatCurrency(balance)}</p>
                </div>
            </div>

            {/* Ledger Entries Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">📖 Ledger Entries - {currentAccount?.name} {loading && <Loader2 className="w-4 h-4 animate-spin" />}</CardTitle>
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
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No ledger entries found for the selected period
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((e, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-3 text-sm">{e.date}</td>
                                            <td className="py-3 px-3 text-sm font-mono text-blue-600">{e.ref}</td>
                                            <td className="py-3 px-3 text-sm font-medium">{e.description}</td>
                                            <td className="py-3 px-3 text-right text-sm font-semibold text-green-600">{e.debit > 0 ? formatCurrency(e.debit) : "-"}</td>
                                            <td className="py-3 px-3 text-right text-sm font-semibold text-red-600">{e.credit > 0 ? formatCurrency(e.credit) : "-"}</td>
                                            <td className="py-3 px-3 text-right text-sm font-bold text-blue-700">{formatCurrency(e.balance)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={3} className="py-3 px-3 text-sm">📊 TOTALS</td>
                                    <td className="py-3 px-3 text-right text-green-700">{formatCurrency(totalDebit)}</td>
                                    <td className="py-3 px-3 text-right text-red-700">{formatCurrency(totalCredit)}</td>
                                    <td className="py-3 px-3 text-right text-blue-700">{formatCurrency(balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Reconciliation Tab - Fetches real reconciliation data from API
function ReconciliationTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
    const [reconcileType, setReconcileType] = useState<"bank" | "mpesa">("mpesa")
    const [bankStatement, setBankStatement] = useState<ReconciliationRecord[]>([])
    const [systemRecords, setSystemRecords] = useState<ReconciliationRecord[]>([])
    const [bankTotal, setBankTotal] = useState(0)
    const [systemTotal, setSystemTotal] = useState(0)
    const [difference, setDifference] = useState(0)
    const [matchedCount, setMatchedCount] = useState(0)
    const [unmatchedCount, setUnmatchedCount] = useState(0)
    const [matchRate, setMatchRate] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReconciliation()
    }, [reconcileType, dateFrom, dateTo])

    const fetchReconciliation = async () => {
        setLoading(true)
        try {
            const data = await accountingApi.getReconciliation({
                type: reconcileType,
                start_date: dateFrom,
                end_date: dateTo
            })
            setBankStatement(data.bank_statement)
            setSystemRecords(data.system_records)
            setBankTotal(data.bank_total)
            setSystemTotal(data.system_total)
            setDifference(data.difference)
            setMatchedCount(data.matched_count)
            setUnmatchedCount(data.unmatched_count)
            setMatchRate(data.match_rate)
        } catch (e) {
            console.error('Failed to fetch reconciliation:', e)
            toast.error('Failed to load reconciliation data')
        }
        setLoading(false)
    }

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
                    <p className="text-xs text-blue-600 font-medium">🏦 {reconcileType === "bank" ? "Bank" : "M-Pesa"} Balance</p>
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
                    <p className="text-2xl font-bold text-amber-700">{matchRate.toFixed(0)}%</p>
                    <p className="text-xs text-amber-600">{matchedCount} matched, {unmatchedCount} pending</p>
                </div>
            </div>

            {/* Side by Side Comparison */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bank Statement */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">🏦 {reconcileType === "bank" ? "Bank" : "M-Pesa"} Statement</CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchReconciliation}><RefreshCw className="w-4 h-4" /></Button>
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
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().split("T")[0]
    })
    const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
    const [selectedStation, setSelectedStation] = useState(0)
    const [data, setData] = useState<any>({})

    useEffect(() => {
        fetchData()
    }, [dateFrom, dateTo, selectedStation])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [stRes, shiftsRes, c2bRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name"),
                    supabase.from("pump_shifts").select("total_sales, cash_sales, mpesa_sales, credit_sales, shift_expenses, opening_time")
                        .gte("opening_time", `${dateFrom}T00:00:00`)
                        .lte("opening_time", `${dateTo}T23:59:59`)
                        .order("opening_time", { ascending: true }),
                    supabase.from("c2b_transactions").select("amount, transaction_time")
                        .gte("transaction_time", `${dateFrom}T00:00:00`)
                        .lte("transaction_time", `${dateTo}T23:59:59`)
                        .order("transaction_time", { ascending: true }),
                ])
                setStations(stRes.data || [])
                const shifts = shiftsRes.data || []
                const c2b = c2bRes.data || []

                const cashTotal = shifts.reduce((s: number, x: any) => s + (x.cash_sales || 0), 0)
                const mpesaFromShifts = shifts.reduce((s: number, x: any) => s + (x.mpesa_sales || 0), 0)
                const mpesaFromC2B = c2b.reduce((s: number, x: any) => s + (x.amount || 0), 0)
                const mpesaTotal = Math.max(mpesaFromShifts, mpesaFromC2B)
                const creditTotal = shifts.reduce((s: number, x: any) => s + (x.credit_sales || 0), 0)
                const totalExpenses = shifts.reduce((s: number, x: any) => s + (x.shift_expenses || 0), 0)
                const totalRevenue = cashTotal + mpesaTotal + creditTotal

                // Group by day for chart (from pump_shifts)
                const dailyMap: Record<string, { total: number; mpesa: number; cash: number }> = {}
                shifts.forEach((sh: any) => {
                    const d = new Date(sh.opening_time)
                    const key = `${d.getMonth() + 1}/${d.getDate()}`
                    if (!dailyMap[key]) dailyMap[key] = { total: 0, mpesa: 0, cash: 0 }
                    dailyMap[key].total += (sh.cash_sales || 0) + (sh.mpesa_sales || 0) + (sh.credit_sales || 0)
                    dailyMap[key].mpesa += sh.mpesa_sales || 0
                    dailyMap[key].cash += sh.cash_sales || 0
                })
                // Also add C2B M-Pesa grouped by day
                c2b.forEach((tx: any) => {
                    const d = new Date(tx.transaction_time)
                    const key = `${d.getMonth() + 1}/${d.getDate()}`
                    if (!dailyMap[key]) dailyMap[key] = { total: 0, mpesa: 0, cash: 0 }
                    // Only add if C2B > shifts for M-Pesa (avoid double counting)
                })
                const dailySales = Object.entries(dailyMap).map(([name, vals]) => ({ name, ...vals }))

                setData({
                    totalRevenue,
                    fuelSales: totalRevenue,
                    mpesaTotal,
                    cashTotal,
                    creditTotal,
                    expenses: totalExpenses,
                    dailySales,
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
                        {activeTab === "cashbook" && <CashBookTab dateFrom={dateFrom} dateTo={dateTo} stationId={selectedStation} />}
                        {activeTab === "mpesa" && <MpesaBookTab dateFrom={dateFrom} dateTo={dateTo} stationId={selectedStation} />}
                        {activeTab === "trial" && <TrialBalanceTab dateTo={dateTo} />}
                        {activeTab === "pnl" && <ProfitLossTab dateFrom={dateFrom} dateTo={dateTo} />}
                        {activeTab === "balance" && <BalanceSheetTab dateTo={dateTo} />}
                        {activeTab === "ledger" && <LedgerTab dateFrom={dateFrom} dateTo={dateTo} />}
                        {activeTab === "reconcile" && <ReconciliationTab dateFrom={dateFrom} dateTo={dateTo} />}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
