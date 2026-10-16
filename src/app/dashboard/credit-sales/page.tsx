"use client"

import { useState, useEffect, useMemo } from "react"
import {
    HandCoins, Search, RefreshCw, Filter, X, Loader2,
    Droplets, DollarSign, Building2, User, Phone,
    Calendar, TrendingUp, CreditCard, Download
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { toast } from "@/components/ui/toast"

interface CreditSale {
    sale_id: number
    sale_id_no: string
    amount: number
    total_amount: number | null
    customer_mobile_no: string | null
    transaction_status: string
    payment_method: string | null
    liters_sold: number | null
    price_per_liter: number | null
    fuel_type_id: number | null
    created_at: string
    sale_time: string | null
    pump_id: number
    attendant_id: number
    station_id: number
}

interface Station {
    station_id: number
    station_name: string
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    color_code: string
}

interface CreditCustomer {
    credit_customer_id: number
    customer_name: string
    phone: string | null
}

export default function CreditSalesPage() {
    const [loading, setLoading] = useState(true)
    const [creditSales, setCreditSales] = useState<CreditSale[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStation, setFilterStation] = useState<number | "">("")
    const [filterFuel, setFilterFuel] = useState<number | "">("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [showFilters, setShowFilters] = useState(true)

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

            const [salesRes, stationsRes, ftRes, custRes] = await Promise.all([
                supabase
                    .from("sales")
                    .select("*")
                    .or("transaction_status.eq.CREDIT,payment_method.eq.credit")
                    .order("created_at", { ascending: false })
                    .limit(1000),
                supabase.from("stations").select("station_id, station_name").eq("is_active", true),
                supabase.from("fuel_types").select("fuel_type_id, fuel_name, color_code").eq("is_active", true),
                supabase.from("credit_customers").select("credit_customer_id, customer_name, phone"),
            ])

            setCreditSales(salesRes.data || [])
            setStations(stationsRes.data || [])
            setFuelTypes(ftRes.data || [])
            setCreditCustomers(custRes.data || [])
        } catch (error) {
            console.error(error)
            toast.error("Error", "Failed to load credit sales")
        }
        setLoading(false)
    }

    // Match credit customers by mobile number
    const getCustomerByMobile = (mobile: string | null) => {
        if (!mobile) return null
        const cleaned = mobile.replace(/\D/g, "")
        return creditCustomers.find(c => {
            const custPhone = c.phone?.replace(/\D/g, "") || ""
            return custPhone && (custPhone === cleaned || cleaned.endsWith(custPhone) || custPhone.endsWith(cleaned))
        }) || null
    }

    // Also try matching by customer_mobile_no being the customer name directly
    const getCustomerInfo = (sale: CreditSale) => {
        // Try matching by phone
        const byPhone = getCustomerByMobile(sale.customer_mobile_no)
        if (byPhone) return byPhone

        // Try matching by name (some systems store customer name in customer_mobile_no)
        if (sale.customer_mobile_no) {
            const byName = creditCustomers.find(c =>
                c.customer_name.toLowerCase() === sale.customer_mobile_no?.toLowerCase()
            )
            if (byName) return byName
        }

        return null
    }

    // Filtered credit sales
    const filtered = useMemo(() => {
        let result = creditSales

        if (filterStation !== "") {
            result = result.filter(s => s.station_id === Number(filterStation))
        }
        if (filterFuel !== "") {
            result = result.filter(s => s.fuel_type_id === Number(filterFuel))
        }
        if (filterDateFrom) {
            result = result.filter(s => {
                const d = (s.sale_time || s.created_at)?.split("T")[0]
                return d && d >= filterDateFrom
            })
        }
        if (filterDateTo) {
            result = result.filter(s => {
                const d = (s.sale_time || s.created_at)?.split("T")[0]
                return d && d <= filterDateTo
            })
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(s => {
                const customer = getCustomerInfo(s)
                return (
                    s.sale_id_no?.toLowerCase().includes(q) ||
                    s.customer_mobile_no?.toLowerCase().includes(q) ||
                    customer?.customer_name?.toLowerCase().includes(q) ||
                    customer?.phone?.toLowerCase().includes(q)
                )
            })
        }

        return result
    }, [creditSales, filterStation, filterFuel, filterDateFrom, filterDateTo, searchQuery, creditCustomers])

    // Stats
    const totalAmount = filtered.reduce((s, sale) => s + (sale.total_amount || sale.amount || 0), 0)
    const totalLiters = filtered.reduce((s, sale) => s + (sale.liters_sold || 0), 0)
    const hasFilters = searchQuery || filterStation !== "" || filterFuel !== "" || filterDateFrom || filterDateTo

    const clearFilters = () => {
        setSearchQuery("")
        setFilterStation("")
        setFilterFuel("")
        setFilterDateFrom("")
        setFilterDateTo("")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-300/30">
                                <HandCoins className="w-5 h-5 text-white" />
                            </div>
                            Credit Sales Records
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">Track all fuel sold on credit with customer details</p>
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-600">Credit Transactions</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{filtered.length}</p>
                        <p className="text-xs text-purple-500 mt-1">{creditSales.length} total records</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-red-600" />
                            <span className="text-xs font-medium text-red-600">Total Credit Amount</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-red-500 mt-1">Fuel sold on credit</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-5 h-5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Total Liters on Credit</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{totalLiters.toFixed(1)} L</p>
                        <p className="text-xs text-blue-500 mt-1">Fuel dispensed on credit</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                            <span className="text-xs font-medium text-amber-600">Avg. per Sale</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">
                            {filtered.length > 0 ? formatCurrency(totalAmount / filtered.length) : "—"}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">Per credit transaction</p>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            {/* Search */}
                            <div className="relative lg:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search customer, phone, receipt..."
                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                            </div>
                            {/* Station */}
                            <select
                                value={filterStation}
                                onChange={e => setFilterStation(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">All Stations</option>
                                {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                            </select>
                            {/* Fuel */}
                            <select
                                value={filterFuel}
                                onChange={e => setFilterFuel(e.target.value === "" ? "" : Number(e.target.value))}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">All Fuel Types</option>
                                {fuelTypes.map(f => <option key={f.fuel_type_id} value={f.fuel_type_id}>{f.fuel_name}</option>)}
                            </select>
                            {/* Date From */}
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            {/* Date To + Clear */}
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={e => setFilterDateTo(e.target.value)}
                                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                {hasFilters && (
                                    <button onClick={clearFilters}
                                        className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {hasFilters && (
                            <p className="text-xs text-gray-400 mt-2">Showing {filtered.length} of {creditSales.length} credit sales</p>
                        )}
                    </div>
                )}

                {/* Data Grid */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HandCoins className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900">Credit Sale Records</h3>
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length}</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <HandCoins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-semibold text-gray-600">
                                {hasFilters ? "No credit sales match your filters" : "No credit sales found"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                {hasFilters ? "Try clearing some filters" : "Credit sales from the POS will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receipt</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Name</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Station</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuel</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Liters</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((sale, i) => {
                                        const customer = getCustomerInfo(sale)
                                        const station = stations.find(s => s.station_id === sale.station_id)
                                        const fuel = fuelTypes.find(f => f.fuel_type_id === sale.fuel_type_id)
                                        const saleDate = sale.sale_time || sale.created_at

                                        return (
                                            <tr key={sale.sale_id} className="hover:bg-purple-50/30 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {saleDate
                                                        ? new Date(saleDate).toLocaleDateString("en-KE", { dateStyle: "medium" })
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                                                        {sale.sale_id_no || `#${sale.sale_id}`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">
                                                                {customer?.customer_name || sale.customer_mobile_no || "—"}
                                                            </p>
                                                            {customer && sale.customer_mobile_no && customer.customer_name !== sale.customer_mobile_no && (
                                                                <p className="text-xs text-gray-400">{sale.customer_mobile_no}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-sm text-gray-600">
                                                            {customer?.phone || sale.customer_mobile_no || "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-sm text-gray-600">{station?.station_name || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {fuel ? (
                                                        <span
                                                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                                                            style={{
                                                                backgroundColor: (fuel.color_code || "#8B5CF6") + "20",
                                                                color: fuel.color_code || "#8B5CF6"
                                                            }}
                                                        >
                                                            {fuel.fuel_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-semibold text-sm text-blue-700">
                                                        {sale.liters_sold ? `${sale.liters_sold.toFixed(1)} L` : "—"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-sm text-red-600">
                                                        {formatCurrency(sale.total_amount || sale.amount || 0)}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gradient-to-r from-purple-50 to-violet-50 border-t-2 border-purple-200">
                                        <td colSpan={7} className="py-3 px-4 text-sm font-bold text-gray-700">TOTALS</td>
                                        <td className="py-3 px-4 text-right font-bold text-blue-700">
                                            {totalLiters.toFixed(1)} L
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-red-600">
                                            {formatCurrency(totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
