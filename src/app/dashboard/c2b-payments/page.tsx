"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Smartphone, Search, RefreshCw, Filter, X, Link2Off,
    CheckCircle, Loader2, DollarSign, Clock, Hash,
    ChevronLeft, ChevronRight, User, Phone, Receipt,
    Building2, ChevronsLeft, ChevronsRight
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { toast } from "@/components/ui/toast"

interface C2BTransaction {
    id: number
    mpesa_receipt: string
    phone: string | null
    amount: number
    transaction_time: string | null
    account_reference: string | null
    customer_name: string | null
    is_linked: boolean
    linked_sale_id: number | null
    linked_at: string | null
    station_id: number | null
    created_at: string | null
}

interface Station {
    station_id: number
    station_name: string
    mpesa_till_number: string | null
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function getTimeAgo(dateStr: string | null): string {
    if (!dateStr) return "—"
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return "Just now"
}

export default function C2BPaymentsPage() {
    const [loading, setLoading] = useState(true)
    const [transactions, setTransactions] = useState<C2BTransaction[]>([])
    const [stations, setStations] = useState<Station[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [filterMinAmount, setFilterMinAmount] = useState("")
    const [filterMaxAmount, setFilterMaxAmount] = useState("")
    const [filterReceipt, setFilterReceipt] = useState("")
    const [filterTill, setFilterTill] = useState<number | "">("")
    const [showFilters, setShowFilters] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

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
            const [txnRes, stationsRes] = await Promise.all([
                supabase
                    .from("c2b_transactions")
                    .select("*")
                    .eq("is_linked", false)
                    .order("created_at", { ascending: false })
                    .limit(2000),
                supabase.from("stations").select("station_id, station_name, mpesa_till_number").eq("is_active", true),
            ])

            if (txnRes.error) {
                toast.error("Error", txnRes.error.message)
            } else {
                setTransactions(txnRes.data || [])
            }
            setStations(stationsRes.data || [])
        } catch (e) {
            console.error(e)
            toast.error("Error", "Failed to load C2B transactions")
        }
        setLoading(false)
    }

    // Get station name by ID
    const getStationName = (stationId: number | null) => {
        if (!stationId) return null
        return stations.find(s => s.station_id === stationId)?.station_name || null
    }

    // Filtered transactions
    const filtered = useMemo(() => {
        let result = transactions

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.mpesa_receipt?.toLowerCase().includes(q) ||
                t.phone?.toLowerCase().includes(q) ||
                t.customer_name?.toLowerCase().includes(q) ||
                t.account_reference?.toLowerCase().includes(q)
            )
        }
        if (filterReceipt) {
            result = result.filter(t =>
                t.mpesa_receipt?.toLowerCase().includes(filterReceipt.toLowerCase())
            )
        }
        if (filterTill !== "") {
            result = result.filter(t => t.station_id === Number(filterTill))
        }
        if (filterDateFrom) {
            result = result.filter(t =>
                t.transaction_time && new Date(t.transaction_time) >= new Date(filterDateFrom)
            )
        }
        if (filterDateTo) {
            result = result.filter(t =>
                t.transaction_time && new Date(t.transaction_time) <= new Date(filterDateTo + "T23:59:59")
            )
        }
        if (filterMinAmount) {
            result = result.filter(t => t.amount >= parseFloat(filterMinAmount))
        }
        if (filterMaxAmount) {
            result = result.filter(t => t.amount <= parseFloat(filterMaxAmount))
        }

        return result
    }, [transactions, searchQuery, filterReceipt, filterTill, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount])

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1) }, [searchQuery, filterReceipt, filterTill, filterDateFrom, filterDateTo, filterMinAmount, filterMaxAmount])

    const totalAmount = filtered.reduce((s, t) => s + t.amount, 0)
    const hasFilters = searchQuery || filterReceipt || filterDateFrom || filterDateTo || filterMinAmount || filterMaxAmount || filterTill !== ""

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / pageSize)
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = Math.min(startIdx + pageSize, filtered.length)
    const paginatedData = filtered.slice(startIdx, endIdx)

    const clearFilters = () => {
        setSearchQuery(""); setFilterReceipt(""); setFilterDateFrom("")
        setFilterDateTo(""); setFilterMinAmount(""); setFilterMaxAmount("")
        setFilterTill("")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-300/30">
                                <Link2Off className="w-5 h-5 text-white" />
                            </div>
                            Unlinked C2B Payments
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">M-Pesa callback payments not yet linked to a sale</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                            <Filter className="w-4 h-4" /> Filters
                        </Button>
                        <Button variant="outline" onClick={fetchData} className="gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Summary Cards — Modern gradient cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Unlinked Count */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Link2Off className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Unlinked</span>
                            </div>
                            <p className="text-3xl font-extrabold">{filtered.length}</p>
                            <p className="text-xs text-white/70 mt-1">{transactions.length} total records</p>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <DollarSign className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Total Amount</span>
                            </div>
                            <p className="text-3xl font-extrabold">{formatCurrency(totalAmount)}</p>
                            <p className="text-xs text-white/70 mt-1">Unlinked value</p>
                        </div>
                    </div>

                    {/* Average Amount */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Clock className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Avg. Amount</span>
                            </div>
                            <p className="text-3xl font-extrabold">
                                {filtered.length > 0 ? formatCurrency(totalAmount / filtered.length) : "—"}
                            </p>
                            <p className="text-xs text-white/70 mt-1">Per transaction</p>
                        </div>
                    </div>

                    {/* Stations */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Building2 className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Stations</span>
                            </div>
                            <p className="text-3xl font-extrabold">
                                {new Set(filtered.filter(t => t.station_id).map(t => t.station_id)).size}
                            </p>
                            <p className="text-xs text-white/70 mt-1">With unlinked payments</p>
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                            {/* Search */}
                            <div className="relative xl:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search name, phone, reference..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                />
                            </div>
                            {/* Receipt filter */}
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filterReceipt}
                                    onChange={e => setFilterReceipt(e.target.value)}
                                    placeholder="M-Pesa receipt..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            {/* Till Number / Station Filter */}
                            <select
                                value={filterTill}
                                onChange={e => setFilterTill(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">All Tills / Stations</option>
                                {stations.map(s => (
                                    <option key={s.station_id} value={s.station_id}>
                                        {s.station_name}{s.mpesa_till_number ? ` (${s.mpesa_till_number})` : ""}
                                    </option>
                                ))}
                            </select>
                            {/* Date From */}
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                            {/* Date To */}
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                            {/* Amount Range */}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={filterMinAmount}
                                    onChange={e => setFilterMinAmount(e.target.value)}
                                    placeholder="Min KES"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <input
                                    type="number"
                                    value={filterMaxAmount}
                                    onChange={e => setFilterMaxAmount(e.target.value)}
                                    placeholder="Max KES"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                        </div>
                        {hasFilters && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Showing {filtered.length} of {transactions.length} results</span>
                                <button onClick={clearFilters} className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                    <X className="w-3 h-3" /> Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Grid */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-900">Unlinked M-Pesa Callbacks</h3>
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length}</span>
                        </div>
                        {/* Page size selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Show</span>
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <span className="text-xs text-gray-500">per page</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                            <p className="font-semibold text-gray-600">
                                {hasFilters ? "No transactions match your filters" : "No unlinked payments! 🎉"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                {hasFilters ? "Try clearing your filters" : "All C2B payments are linked to sales"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Station/Till</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Age</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedData.map((txn, i) => {
                                            const stationName = getStationName(txn.station_id)
                                            const isOld = txn.transaction_time && (Date.now() - new Date(txn.transaction_time).getTime()) > 86400000

                                            return (
                                                <tr key={txn.id} className="hover:bg-orange-50/30 transition-colors group">
                                                    <td className="px-4 py-3 text-xs text-gray-400">{startIdx + i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                                            {txn.mpesa_receipt}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0">
                                                                <User className="w-3.5 h-3.5 text-orange-600" />
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-800">{txn.customer_name || "—"}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-gray-400" />
                                                            <p className="text-sm text-gray-600">{txn.phone || "—"}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${txn.amount >= 5000 ? "bg-green-100 text-green-800" :
                                                            txn.amount >= 1000 ? "bg-blue-100 text-blue-700" :
                                                                "bg-gray-100 text-gray-600"
                                                            }`}>
                                                            {formatCurrency(txn.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {stationName ? (
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                                <span className="text-xs text-gray-600">{stationName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs text-gray-500 font-mono">{txn.account_reference || "—"}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs text-gray-500">
                                                            {txn.transaction_time
                                                                ? new Date(txn.transaction_time).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })
                                                                : "—"}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOld ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                                                            {getTimeAgo(txn.transaction_time || txn.created_at)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Bar */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-semibold text-gray-700">{startIdx + 1}</span> to{" "}
                                    <span className="font-semibold text-gray-700">{endIdx}</span> of{" "}
                                    <span className="font-semibold text-gray-700">{filtered.length}</span> records
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm text-gray-600"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Previous
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1 mx-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                                            let page: number
                                            if (totalPages <= 5) {
                                                page = idx + 1
                                            } else if (currentPage <= 3) {
                                                page = idx + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                page = totalPages - 4 + idx
                                            } else {
                                                page = currentPage - 2 + idx
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                                        ? "bg-orange-500 text-white shadow-sm shadow-orange-300/40"
                                                        : "text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm text-gray-600"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
