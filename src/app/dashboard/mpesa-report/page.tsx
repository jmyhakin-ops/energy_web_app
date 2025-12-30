"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Smartphone, CheckCircle, Clock, XCircle, RefreshCw, Search, TrendingUp,
    Receipt, Download, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Calendar, Building2, Users, Fuel, AlertCircle, ArrowUpRight, ArrowDownRight,
    FileSpreadsheet, Eye, Copy, MoreHorizontal, Zap, Activity, DollarSign,
    Phone, Hash, CircleDot
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// ==================== INTERFACES ====================
interface MpesaTransaction {
    id: string
    checkout_request_id: string
    merchant_request_id: string
    phone: string | null
    amount: number
    account_ref: string | null
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    mpesa_receipt: string | null
    mpesa_receipt_number: string | null
    result_desc: string | null
    station_id: number | null
    created_at: string
    completed_at: string | null
    station?: {
        station_id: number
        station_name: string
        station_code: string
    }
}

interface Station {
    station_id: number
    station_name: string
    station_code: string
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
}

interface User {
    user_id: number
    full_name: string
    username: string
}

interface Shift {
    shift_id: number
    shift_name: string
}

// ==================== GRADIENT STAT CARD ====================
function GradientStatCard({
    title,
    value,
    subValue,
    icon: Icon,
    gradient,
    trend,
    trendValue
}: {
    title: string
    value: string
    subValue?: string
    icon: any
    gradient: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend === 'up' ? 'bg-green-500/20 text-green-100' : trend === 'down' ? 'bg-red-500/20 text-red-100' : 'bg-white/20 text-white/80'}`}>
                            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {trendValue}
                        </div>
                    )}
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
                {subValue && <p className="text-white/70 text-xs mt-1">{subValue}</p>}
            </div>
        </div>
    )
}

// ==================== STATUS BADGE ====================
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string, icon: any, label: string }> = {
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Completed' },
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
        failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Failed' },
        cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle, label: 'Cancelled' },
    }

    const { bg, text, icon: Icon, label } = config[status] || config.pending

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    )
}

// ==================== FILTER SELECT ====================
function FilterSelect({
    label,
    icon: Icon,
    value,
    onChange,
    options,
    placeholder
}: {
    label: string
    icon: any
    value: string
    onChange: (v: string) => void
    options: { value: string, label: string }[]
    placeholder?: string
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300 cursor-pointer"
            >
                <option value="">{placeholder || `All ${label}`}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}

// ==================== DATE INPUT ====================
function DateInput({
    label,
    value,
    onChange
}: {
    label: string
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {label}
            </label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
            />
        </div>
    )
}

// ==================== MAIN COMPONENT ====================
export default function MpesaReportPage() {
    // Data states
    const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedStation, setSelectedStation] = useState("")
    const [selectedPump, setSelectedPump] = useState("")
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedShift, setSelectedShift] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    // Set default dates (last 30 days)
    useEffect(() => {
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateTo(today.toISOString().split('T')[0])
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    }, [])

    // Fetch data
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                // Use mock data if Supabase is not configured
                setTransactions(getMockTransactions())
                setStations(getMockStations())
                setPumps(getMockPumps())
                setUsers(getMockUsers())
                setShifts(getMockShifts())
                setLoading(false)
                return
            }

            // Fetch all data in parallel
            const [transactionsRes, stationsRes, pumpsRes, usersRes, shiftsRes] = await Promise.all([
                supabase.from("mpesa_transactions").select("*, station:stations(station_id, station_name, station_code)").order("created_at", { ascending: false }),
                supabase.from("stations").select("station_id, station_name, station_code").eq("is_active", true),
                supabase.from("pumps").select("pump_id, pump_name, station_id").eq("is_active", true),
                supabase.from("users_new").select("user_id, full_name, username").eq("is_active", true),
                supabase.from("shifts").select("shift_id, shift_name"),
            ])

            setTransactions(transactionsRes.data || [])
            setStations(stationsRes.data || [])
            setPumps(pumpsRes.data || [])
            setUsers(usersRes.data || [])
            setShifts(shiftsRes.data || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load M-Pesa transactions")
        }
        setLoading(false)
    }

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // Date filter
            if (dateFrom && new Date(tx.created_at) < new Date(dateFrom + 'T00:00:00')) return false
            if (dateTo && new Date(tx.created_at) > new Date(dateTo + 'T23:59:59')) return false

            // Station filter
            if (selectedStation && tx.station_id?.toString() !== selectedStation) return false

            // Status filter
            if (selectedStatus && tx.status !== selectedStatus) return false

            // Search filter (phone, receipt, checkout ID)
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesPhone = tx.phone?.toLowerCase().includes(query)
                const matchesReceipt = tx.mpesa_receipt_number?.toLowerCase().includes(query)
                const matchesCheckout = tx.checkout_request_id?.toLowerCase().includes(query)
                const matchesAmount = tx.amount.toString().includes(query)
                if (!matchesPhone && !matchesReceipt && !matchesCheckout && !matchesAmount) return false
            }

            return true
        })
    }, [transactions, dateFrom, dateTo, selectedStation, selectedStatus, searchQuery])

    // Calculate stats
    const stats = useMemo(() => {
        const completed = filteredTransactions.filter(t => t.status === 'completed')
        const pending = filteredTransactions.filter(t => t.status === 'pending')
        const failed = filteredTransactions.filter(t => t.status === 'failed')

        const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0)
        const avgAmount = completed.length > 0 ? totalAmount / completed.length : 0
        const successRate = filteredTransactions.length > 0 ? (completed.length / filteredTransactions.length) * 100 : 0

        return {
            totalAmount,
            totalTransactions: filteredTransactions.length,
            completedCount: completed.length,
            pendingCount: pending.length,
            failedCount: failed.length,
            avgAmount,
            successRate
        }
    }, [filteredTransactions])

    // Paginated data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredTransactions, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

    // Handle filter reset
    const handleResetFilters = () => {
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateTo(today.toISOString().split('T')[0])
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
        setSelectedStation("")
        setSelectedPump("")
        setSelectedUser("")
        setSelectedShift("")
        setSelectedStatus("")
        setSearchQuery("")
        setCurrentPage(1)
    }

    // Export to Excel
    const handleExport = () => {
        const headers = [
            "📅 Date & Time",
            "📱 Phone Number",
            "💰 Amount (KES)",
            "✅ Status",
            "🧾 M-Pesa Receipt",
            "🏢 Station",
            "🔗 Checkout Request ID"
        ]

        const rows = filteredTransactions.map(tx => [
            new Date(tx.created_at).toLocaleString(),
            tx.phone || '-',
            tx.amount,
            tx.status.toUpperCase(),
            tx.mpesa_receipt_number || '-',
            tx.station?.station_name || '-',
            tx.checkout_request_id
        ])

        const csvContent = [
            "🚀 M-Pesa Transactions Report - Alpha Energy",
            `📅 Generated: ${new Date().toLocaleString()}`,
            `📊 Total Records: ${filteredTransactions.length}`,
            `💰 Total Amount: KES ${stats.totalAmount.toLocaleString()}`,
            "",
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `MPesa_Report_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        toast.success("📊 Export Complete!", "M-Pesa report downloaded successfully")
    }

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied!", `${label} copied to clipboard`)
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            📱 M-Pesa Transactions Report
                        </h1>
                        <p className="text-sm text-gray-500">Comprehensive M-Pesa payment tracking & analytics</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                        <Button size="sm" onClick={handleExport}>
                            <FileSpreadsheet className="w-4 h-4" /> Export Excel
                        </Button>
                    </div>
                </div>

                {/* Gradient Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <GradientStatCard
                        title="Total M-Pesa Revenue"
                        value={formatCurrency(stats.totalAmount)}
                        subValue={`${stats.completedCount} successful payments`}
                        icon={DollarSign}
                        gradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
                        trend="up"
                        trendValue="+12.5%"
                    />
                    <GradientStatCard
                        title="Total Transactions"
                        value={stats.totalTransactions.toLocaleString()}
                        subValue={`${stats.pendingCount} pending`}
                        icon={Receipt}
                        gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"
                        trend="up"
                        trendValue="+8.2%"
                    />
                    <GradientStatCard
                        title="Success Rate"
                        value={`${stats.successRate.toFixed(1)}%`}
                        subValue={`${stats.failedCount} failed transactions`}
                        icon={CheckCircle}
                        gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
                        trend={stats.successRate >= 90 ? 'up' : stats.successRate >= 70 ? 'neutral' : 'down'}
                        trendValue={stats.successRate >= 90 ? 'Excellent' : stats.successRate >= 70 ? 'Good' : 'Needs Attention'}
                    />
                    <GradientStatCard
                        title="Average Transaction"
                        value={formatCurrency(stats.avgAmount)}
                        subValue="Per successful payment"
                        icon={Activity}
                        gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
                        trend="up"
                        trendValue="+5.4%"
                    />
                </div>

                {/* Filters Section */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Filter className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">🎯 Advanced Filters</h3>
                                    <p className="text-xs text-gray-500">Filter transactions by date, station, status and more</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                                <RefreshCw className="w-4 h-4" /> Reset
                            </Button>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                            <DateInput
                                label="📅 Date From"
                                value={dateFrom}
                                onChange={setDateFrom}
                            />
                            <DateInput
                                label="📅 Date To"
                                value={dateTo}
                                onChange={setDateTo}
                            />
                            <FilterSelect
                                label="Station"
                                icon={Building2}
                                value={selectedStation}
                                onChange={setSelectedStation}
                                options={stations.map(s => ({ value: s.station_id.toString(), label: s.station_name }))}
                                placeholder="All Stations"
                            />
                            <FilterSelect
                                label="Pump"
                                icon={Fuel}
                                value={selectedPump}
                                onChange={setSelectedPump}
                                options={pumps.map(p => ({ value: p.pump_id.toString(), label: p.pump_name }))}
                                placeholder="All Pumps"
                            />
                            <FilterSelect
                                label="User"
                                icon={Users}
                                value={selectedUser}
                                onChange={setSelectedUser}
                                options={users.map(u => ({ value: u.user_id.toString(), label: u.full_name }))}
                                placeholder="All Users"
                            />
                            <FilterSelect
                                label="Shift"
                                icon={Clock}
                                value={selectedShift}
                                onChange={setSelectedShift}
                                options={shifts.map(s => ({ value: s.shift_id.toString(), label: s.shift_name }))}
                                placeholder="All Shifts"
                            />
                            <FilterSelect
                                label="Status"
                                icon={CircleDot}
                                value={selectedStatus}
                                onChange={setSelectedStatus}
                                options={[
                                    { value: 'completed', label: '✅ Completed' },
                                    { value: 'pending', label: '⏳ Pending' },
                                    { value: 'failed', label: '❌ Failed' },
                                    { value: 'cancelled', label: '🚫 Cancelled' },
                                ]}
                                placeholder="All Status"
                            />
                        </div>
                        {/* Search Bar */}
                        <div className="mt-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="🔍 Search by phone number, M-Pesa receipt, checkout ID or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4 text-white" />
                                </div>
                                📊 M-Pesa Transactions
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    {filteredTransactions.length} records
                                </span>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Show:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-gray-500">Loading transactions...</p>
                                </div>
                            </div>
                        ) : paginatedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <Receipt className="w-10 h-10 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">No transactions found</p>
                                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">📅 Date & Time</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">📱 Phone</th>
                                            <th className="text-right py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">💰 Amount</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">✅ Status</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">🧾 Receipt</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">🏢 Station</th>
                                            <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">🔗 Checkout ID</th>
                                            <th className="text-center py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">⚡ Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedData.map((tx, index) => (
                                            <tr key={tx.id} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="py-4 px-4">
                                                    <span className="text-xs font-medium text-gray-400">
                                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {new Date(tx.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(tx.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Phone className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <span className="font-mono font-medium text-gray-900 text-sm">{tx.phone || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-bold text-gray-900">{formatCurrency(tx.amount)}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <StatusBadge status={tx.status} />
                                                </td>
                                                <td className="py-4 px-4">
                                                    {tx.mpesa_receipt_number ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                                                {tx.mpesa_receipt_number}
                                                            </span>
                                                            <button
                                                                onClick={() => copyToClipboard(tx.mpesa_receipt_number!, 'Receipt')}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                                            >
                                                                <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {tx.station ? (
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{tx.station.station_name}</p>
                                                            <p className="text-xs text-gray-500">{tx.station.station_code}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-gray-500 max-w-[120px] truncate">
                                                            {tx.checkout_request_id}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(tx.checkout_request_id, 'Checkout ID')}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                                        >
                                                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors group/btn">
                                                            <Eye className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-600" />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Premium Pagination Footer */}
                        {!loading && filteredTransactions.length > 0 && (
                            <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t border-gray-200 px-4 py-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Left: Record Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                                {filteredTransactions.length}
                                            </span>
                                            <span>Total Records</span>
                                        </div>
                                        <div className="h-6 w-px bg-gray-300" />
                                        <span className="text-sm text-gray-500">
                                            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                            <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of{' '}
                                            <span className="font-semibold text-gray-700">{filteredTransactions.length}</span> entries
                                        </span>
                                    </div>

                                    {/* Center: Page Info */}
                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </div>

                                    {/* Right: Navigation */}
                                    <div className="flex items-center gap-1">
                                        {/* First Page */}
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none"
                                        >
                                            <ChevronsLeft className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {/* Previous Page */}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none text-sm font-medium text-gray-600"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="hidden md:flex items-center gap-1 mx-2">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i
                                                } else {
                                                    pageNum = currentPage - 2 + i
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-all ${currentPage === pageNum
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:shadow-md'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Next Page */}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none text-sm font-medium text-gray-600"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>

                                        {/* Last Page */}
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:hover:shadow-none"
                                        >
                                            <ChevronsRight className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Stats Row */}
                <div className="grid lg:grid-cols-3 gap-4">
                    {/* Status Breakdown */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-600" />
                                📊 Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {[
                                    { label: 'Completed', count: stats.completedCount, color: 'bg-emerald-500', icon: '✅' },
                                    { label: 'Pending', count: stats.pendingCount, color: 'bg-amber-500', icon: '⏳' },
                                    { label: 'Failed', count: stats.failedCount, color: 'bg-red-500', icon: '❌' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-medium text-gray-700">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                            <span className="font-bold text-gray-900">{item.count.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amount Distribution */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                💰 Amount Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                    <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                                    <span className="font-bold text-green-600 text-lg">{formatCurrency(stats.totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm font-medium text-gray-600">Average Transaction</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(stats.avgAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm font-medium text-gray-600">Success Rate</span>
                                    <span className={`font-bold ${stats.successRate >= 90 ? 'text-green-600' : stats.successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {stats.successRate.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-600" />
                                ⚡ Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    📊 Export All Transactions
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2" onClick={fetchData}>
                                    <RefreshCw className="w-4 h-4 text-blue-600" />
                                    🔄 Refresh Data
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleResetFilters}>
                                    <Filter className="w-4 h-4 text-purple-600" />
                                    🎯 Reset All Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

// ==================== MOCK DATA FUNCTIONS ====================
function getMockTransactions(): MpesaTransaction[] {
    const statuses: Array<'completed' | 'pending' | 'failed' | 'cancelled'> = ['completed', 'completed', 'completed', 'pending', 'failed']
    const phones = ['254712345678', '254723456789', '254734567890', '254745678901', '254756789012']

    return Array.from({ length: 50 }, (_, i) => ({
        id: `txn-${i + 1}`,
        checkout_request_id: `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        merchant_request_id: `${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        phone: phones[Math.floor(Math.random() * phones.length)],
        amount: Math.floor(Math.random() * 10000) + 500,
        account_ref: `SALE-${1000 + i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        mpesa_receipt: null,
        mpesa_receipt_number: statuses[0] === 'completed' ? `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.random().toString().substr(2, 10)}` : null,
        result_desc: null,
        station_id: Math.floor(Math.random() * 3) + 1,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: null,
        station: {
            station_id: Math.floor(Math.random() * 3) + 1,
            station_name: ['Westlands Station', 'CBD Main', 'Mombasa Road'][Math.floor(Math.random() * 3)],
            station_code: ['WL-001', 'CBD-001', 'MBR-001'][Math.floor(Math.random() * 3)]
        }
    }))
}

function getMockStations(): Station[] {
    return [
        { station_id: 1, station_name: 'Westlands Station', station_code: 'WL-001' },
        { station_id: 2, station_name: 'CBD Main', station_code: 'CBD-001' },
        { station_id: 3, station_name: 'Mombasa Road', station_code: 'MBR-001' },
    ]
}

function getMockPumps(): Pump[] {
    return [
        { pump_id: 1, pump_name: 'Pump 1', station_id: 1 },
        { pump_id: 2, pump_name: 'Pump 2', station_id: 1 },
        { pump_id: 3, pump_name: 'Pump 3', station_id: 2 },
    ]
}

function getMockUsers(): User[] {
    return [
        { user_id: 1, full_name: 'John Kamau', username: 'john.kamau' },
        { user_id: 2, full_name: 'Mary Wanjiku', username: 'mary.wanjiku' },
        { user_id: 3, full_name: 'Peter Ochieng', username: 'peter.ochieng' },
    ]
}

function getMockShifts(): Shift[] {
    return [
        { shift_id: 1, shift_name: 'Day Shift' },
        { shift_id: 2, shift_name: 'Night Shift' },
    ]
}
