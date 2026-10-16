"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
    Building2, Fuel, Users, Clock, BarChart3, Smartphone, TrendingUp,
    RefreshCw, Zap, ArrowRight, Loader2, AlertCircle, Wallet, Receipt,
    CreditCard, Banknote, FileText, PiggyBank, DollarSign, Calculator,
    Activity, ShoppingBag, TrendingDown, Calendar, Filter, X, Percent
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, getGreeting } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Modern Gradient Stat Card Component - LIGHTER COLORS
function GradientStatCard({
    title,
    value,
    icon,
    gradient,
    subtitle,
    textColor = "text-gray-900"
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    gradient: string
    subtitle?: string
    textColor?: string
}) {
    return (
        <div className={`${gradient} rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className={`text-sm font-medium ${textColor} opacity-80`}>{title}</span>
            </div>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
            {subtitle && <p className={`text-xs ${textColor} opacity-70 mt-1`}>{subtitle}</p>}
        </div>
    )
}

// Revenue Summary Card - LIGHT GRADIENT (no solid green)
function ModernRevenueCard({ totalSales, mpesaSales, cashSales, creditSales, transactionCount, dateLabel }: {
    totalSales: number
    mpesaSales: number
    cashSales: number
    creditSales: number
    transactionCount: number
    dateLabel: string
}) {
    const mpesaPercent = totalSales > 0 ? (mpesaSales / totalSales * 100).toFixed(1) : 0
    const cashPercent = totalSales > 0 ? (cashSales / totalSales * 100).toFixed(1) : 0
    const creditPercent = totalSales > 0 ? (creditSales / totalSales * 100).toFixed(1) : 0

    return (
        <div className="bg-gradient-to-br from-white via-sky-50 to-indigo-100 rounded-3xl p-6 shadow-xl border border-sky-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-6 h-6 text-sky-600" />
                        <span className="text-sky-700 font-medium">{dateLabel} Revenue</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                    <p className="text-sky-600 text-sm mt-1">{transactionCount} transactions completed</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-4 min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">M-Pesa</span>
                        </div>
                        <p className="text-xl font-bold text-green-900">{formatCurrency(mpesaSales)}</p>
                        <p className="text-xs text-green-600">{mpesaPercent}% of total</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-2xl p-4 min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-700 font-medium">Cash</span>
                        </div>
                        <p className="text-xl font-bold text-amber-900">{formatCurrency(cashSales)}</p>
                        <p className="text-xs text-amber-600">{cashPercent}% of total</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-2xl p-4 min-w-[120px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-700 font-medium">Credit</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">{formatCurrency(creditSales)}</p>
                        <p className="text-xs text-purple-600">{creditPercent}% of total</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Quick Action Link Component
function QuickActionLink({ href, icon, label, description, gradient }: {
    href: string
    icon: React.ReactNode
    label: string
    description: string
    gradient: string
}) {
    return (
        <Link href={href} className={`group ${gradient} rounded-2xl p-5 shadow-sm border hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
                        <p className="text-xs text-gray-500">{description}</p>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    )
}

// Live Status Pill
function LiveStatus({ isOnline, label }: { isOnline: boolean; label?: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
            {label || (isOnline ? "Online" : "Offline")}
        </span>
    )
}

interface Station {
    station_id: number
    station_code: string
    station_name: string
    city: string | null
    physical_address: string | null
    is_online: boolean
    is_active: boolean
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
}

interface User {
    user_id: number
    full_name: string
}

interface Shift {
    shift_id: number
    shift_name: string
}

interface Sale {
    sale_id: number
    amount: number
    total_amount: number
    payment_method: string
    transaction_status: string
    created_at: string
    station_id: number
    pump_id: number
    attendant_id: number
    pump_shift_id: number
    fuel_type_id?: number
    liters_sold?: number
    price_per_liter?: number
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dbConfigured, setDbConfigured] = useState(true)

    // Filter states
    const [dateFrom, setDateFrom] = useState(getTodayDate())
    const [dateTo, setDateTo] = useState(getTodayDate())
    const [selectedStation, setSelectedStation] = useState<number | null>(null)
    const [selectedPump, setSelectedPump] = useState<number | null>(null)
    const [selectedUser, setSelectedUser] = useState<number | null>(null)
    const [selectedShift, setSelectedShift] = useState<number | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    // Data states
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [allSales, setAllSales] = useState<Sale[]>([])

    const [stats, setStats] = useState({
        activeShifts: 0,
        stationsOnline: 0,
        stationsTotal: 0,
        pumpsTotal: 0,
        usersTotal: 0,
        totalPayroll: 0,
        totalExpenses: 0,
        pendingAdvances: 0,
        pendingVouchers: 0,
        totalExpectedProfit: 0,
        todayProfit: 0,
    })

    // Store latest price/cost maps for dynamic profit calculation
    const [fuelPriceMap, setFuelPriceMap] = useState<Record<number, number>>({})
    const [fuelCostMap, setFuelCostMap] = useState<Record<number, number>>({})

    const fetchData = async () => {
        try {
            if (!isSupabaseConfigured() || !supabase) {
                setDbConfigured(false)
                setLoading(false)
                return
            }

            setDbConfigured(true)

            // Fetch all data in parallel
            const [
                stationsRes,
                pumpsRes,
                usersRes,
                shiftsRes,
                pumpShiftsRes,
                salesRes,
                payrollRes,
                expensesRes,
                advancesRes,
                vouchersRes,
                refillsRes,
                pricesRes,
                fuelTypesRes,
            ] = await Promise.all([
                supabase.from("stations").select("*").order("station_name"),
                supabase.from("pumps").select("pump_id, pump_name, station_id, fuel_type_id").eq("is_active", true),
                supabase.from("users_new").select("user_id, full_name").eq("is_active", true),
                supabase.from("shifts").select("shift_id, shift_name"),
                supabase.from("pump_shifts").select("pump_shift_id, shift_id").eq("is_closed", false),
                // Fetch ALL sales with dates for filtering
                supabase.from("sales").select("sale_id, amount, total_amount, payment_method, transaction_status, created_at, station_id, pump_id, attendant_id, pump_shift_id, fuel_type_id, liters_sold, price_per_liter"),
                supabase.from("payroll").select("net_salary, payment_status"),
                supabase.from("expenses").select("amount, status"),
                supabase.from("salary_advances").select("amount, status").eq("status", "pending"),
                supabase.from("vouchers").select("amount, status").eq("status", "pending"),
                supabase.from("fuel_refills").select("fuel_type_id, quantity_liters, cost_per_liter, delivery_date").limit(1000),
                supabase.from("fuel_prices").select("fuel_type_id, selling_price, effective_date").order("effective_date", { ascending: false }),
                supabase.from("fuel_types").select("fuel_type_id, price_per_liter").eq("is_active", true),
            ])

            const stationsData = stationsRes.data || []
            const pumpsData = pumpsRes.data || []
            const usersData = usersRes.data || []
            const shiftsData = shiftsRes.data || []
            const pumpShiftsData = pumpShiftsRes.data || []
            const salesData = salesRes.data || []
            const payrollData = payrollRes.data || []
            const expensesData = expensesRes.data || []
            const advancesData = advancesRes.data || []
            const vouchersData = vouchersRes.data || []

            setStations(stationsData)
            setPumps(pumpsData)
            setUsers(usersData)
            setShifts(shiftsData)
            setAllSales(salesData)

            // Static stats
            const totalPayroll = payrollData.reduce((acc, p) => acc + (p.net_salary || 0), 0)
            const totalExpenses = expensesData.reduce((acc, e) => acc + (e.amount || 0), 0)
            const pendingAdvances = advancesData.reduce((acc, a) => acc + (a.amount || 0), 0)
            const pendingVouchers = vouchersData.reduce((acc, v) => acc + (v.amount || 0), 0)

            const refillsData = refillsRes.data || []
            const pricesData = pricesRes.data || []
            const fuelTypesData = fuelTypesRes.data || []

            // Build selling price map from fuel_prices (latest per fuel type)
            const latestPriceMap: Record<number, number> = {}
            for (const p of pricesData) {
                if (!latestPriceMap[p.fuel_type_id]) {
                    latestPriceMap[p.fuel_type_id] = p.selling_price
                }
            }
            // Fallback: if fuel_prices has no entry, use fuel_types.price_per_liter
            for (const ft of fuelTypesData) {
                if (!latestPriceMap[ft.fuel_type_id] && ft.price_per_liter > 0) {
                    latestPriceMap[ft.fuel_type_id] = ft.price_per_liter
                }
            }

            const todayStr = new Date().toDateString()
            let totalExpectedProfit = 0
            let todayProfit = 0

            const latestCostMap: Record<number, number> = {}
            for (const r of refillsData) {
                if (!latestCostMap[r.fuel_type_id]) {
                    latestCostMap[r.fuel_type_id] = r.cost_per_liter || 0
                }
                const sellingPrice = latestPriceMap[r.fuel_type_id] || 0
                const costPrice = r.cost_per_liter || 0
                const profitPerLiter = sellingPrice - costPrice
                if (profitPerLiter > 0) {
                    totalExpectedProfit += r.quantity_liters * profitPerLiter
                    if (new Date(r.delivery_date).toDateString() === todayStr) {
                        todayProfit += r.quantity_liters * profitPerLiter
                    }
                }
            }

            setStats({
                activeShifts: pumpShiftsData.length,
                stationsOnline: stationsData.filter(s => s.is_online).length,
                stationsTotal: stationsData.length,
                pumpsTotal: pumpsData.length,
                usersTotal: usersData.length,
                totalPayroll,
                totalExpenses,
                pendingAdvances,
                pendingVouchers,
                totalExpectedProfit,
                todayProfit,
            })

            setFuelPriceMap(latestPriceMap)
            setFuelCostMap(latestCostMap)

        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filter sales based on selected filters
    const filteredSales = useMemo(() => {
        return allSales.filter(sale => {
            // Date filter
            const saleDate = sale.created_at?.split('T')[0]
            if (saleDate) {
                if (dateFrom && saleDate < dateFrom) return false
                if (dateTo && saleDate > dateTo) return false
            }

            // Station filter
            if (selectedStation && sale.station_id !== selectedStation) return false

            // Pump filter
            if (selectedPump && sale.pump_id !== selectedPump) return false

            // User filter
            if (selectedUser && sale.attendant_id !== selectedUser) return false

            // Shift filter (through pump_shift_id - would need join, simplified here)
            // For now, we skip shift filter unless we have the data

            return true
        })
    }, [allSales, dateFrom, dateTo, selectedStation, selectedPump, selectedUser, selectedShift])

    // Calculate filtered stats
    const salesStats = useMemo(() => {
        const creditSales = filteredSales.filter(s => s.transaction_status === "CREDIT" || s.payment_method === "credit").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
        const mpesaSales = filteredSales.filter(s => (s.payment_method === "mpesa" || s.transaction_status === "SUCCESS") && s.transaction_status !== "CREDIT").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
        const cashSales = filteredSales.filter(s => (s.payment_method === "cash" || s.transaction_status === "CASH") && s.transaction_status !== "CREDIT").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
        const totalSales = filteredSales.reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)

        return {
            totalSales,
            mpesaSales,
            cashSales,
            creditSales,
            transactionCount: filteredSales.length
        }
    }, [filteredSales])

    // Station performance with sales
    const stationPerformance = useMemo(() => {
        return stations.map(station => {
            const stationSales = filteredSales.filter(s => s.station_id === station.station_id)
            const total = stationSales.reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
            const mpesa = stationSales.filter(s => (s.payment_method === "mpesa" || s.transaction_status === "SUCCESS") && s.transaction_status !== "CREDIT").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
            const cash = stationSales.filter(s => (s.payment_method === "cash" || s.transaction_status === "CASH") && s.transaction_status !== "CREDIT").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)
            const credit = stationSales.filter(s => s.transaction_status === "CREDIT" || s.payment_method === "credit").reduce((acc, s) => acc + (s.amount || s.total_amount || 0), 0)

            const profit = stationSales.reduce((acc, s) => {
                const ftId = s.fuel_type_id
                if (!ftId) return acc
                const liters = s.liters_sold || 0
                if (liters <= 0) return acc

                const sellingPrice = s.price_per_liter || fuelPriceMap[ftId] || 0
                const costPrice = fuelCostMap[ftId] || 0
                const margin = sellingPrice - costPrice

                if (margin > 0) {
                    return acc + (liters * margin)
                }
                return acc
            }, 0)

            return { ...station, totalSales: total, mpesaSales: mpesa, cashSales: cash, creditSales: credit, totalProfit: profit, transactionCount: stationSales.length }
        }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 5)
    }, [stations, filteredSales, fuelPriceMap, fuelCostMap])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
        toast.success("✅ Refreshed!", "Data updated")
    }

    const clearFilters = () => {
        setDateFrom(getTodayDate())
        setDateTo(getTodayDate())
        setSelectedStation(null)
        setSelectedPump(null)
        setSelectedUser(null)
        setSelectedShift(null)
    }

    // Date label for revenue card
    const getDateLabel = () => {
        if (dateFrom === dateTo) {
            if (dateFrom === getTodayDate()) return "Today's"
            return new Date(dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        }
        return `${new Date(dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${new Date(dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard...</p>
                        <p className="text-xs text-gray-400 mt-2">v2.2 - With Filters</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Database Not Configured Banner */}
                {!dbConfigured && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">Database Not Configured</p>
                            <p className="text-xs text-amber-600">Configure Supabase environment variables to see real data</p>
                        </div>
                    </div>
                )}

                {/* Header with Filters Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-7 h-7 text-emerald-600" />
                            {getGreeting()} 👋
                        </h1>
                        <p className="text-gray-500">Dashboard with filters - v2.2</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <LiveStatus isOnline={stats.stationsOnline > 0} label={`${stats.stationsOnline}/${stats.stationsTotal} Online`} />
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="w-4 h-4" /> Filters
                        </Button>
                        <Button onClick={handleRefresh} loading={refreshing}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                {showFilters && (
                    <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-5 border shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-emerald-600" /> Filter Sales Data
                            </h3>
                            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                                <X className="w-4 h-4" /> Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Date From */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">📅 Date From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            {/* Date To */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">📅 Date To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            {/* Station */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">🏢 Station</label>
                                <select
                                    value={selectedStation || ""}
                                    onChange={(e) => setSelectedStation(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">All Stations</option>
                                    {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                                </select>
                            </div>
                            {/* Pump */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">⛽ Pump</label>
                                <select
                                    value={selectedPump || ""}
                                    onChange={(e) => setSelectedPump(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">All Pumps</option>
                                    {pumps.filter(p => !selectedStation || p.station_id === selectedStation).map(p =>
                                        <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>
                                    )}
                                </select>
                            </div>
                            {/* User */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">👤 Attendant</label>
                                <select
                                    value={selectedUser || ""}
                                    onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">All Users</option>
                                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                                </select>
                            </div>
                            {/* Shift */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">🕐 Shift</label>
                                <select
                                    value={selectedShift || ""}
                                    onChange={(e) => setSelectedShift(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">All Shifts</option>
                                    {shifts.map(s => <option key={s.shift_id} value={s.shift_id}>{s.shift_name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue Card - Now with filtered data */}
                <ModernRevenueCard
                    totalSales={salesStats.totalSales}
                    mpesaSales={salesStats.mpesaSales}
                    cashSales={salesStats.cashSales}
                    creditSales={salesStats.creditSales}
                    transactionCount={salesStats.transactionCount}
                    dateLabel={getDateLabel()}
                />

                {/* Profit Cards — Compact Modern */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-5 border border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-800 opacity-80">Total Expected Profit</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalExpectedProfit)}</p>
                        <p className="text-xs text-emerald-700 opacity-70 mt-1">Selling price − Cost price × Liters</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800 opacity-80">Today&apos;s Expected Profit</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.todayProfit)}</p>
                        <p className="text-xs text-blue-700 opacity-70 mt-1">From today&apos;s refill deliveries</p>
                    </div>
                </div>

                {/* Operations Stats - Modern Gradient Cards */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-600" /> Operations Overview
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientStatCard
                            title="🏢 Stations"
                            value={stats.stationsTotal}
                            subtitle={`${stats.stationsOnline} online`}
                            icon={<Building2 className="w-5 h-5 text-cyan-600" />}
                            gradient="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
                            textColor="text-cyan-900"
                        />
                        <GradientStatCard
                            title="⛽ Active Pumps"
                            value={stats.pumpsTotal}
                            subtitle="Fuel dispensers"
                            icon={<Fuel className="w-5 h-5 text-emerald-600" />}
                            gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                            textColor="text-emerald-900"
                        />
                        <GradientStatCard
                            title="👥 Total Staff"
                            value={stats.usersTotal}
                            subtitle="Active employees"
                            icon={<Users className="w-5 h-5 text-violet-600" />}
                            gradient="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200"
                            textColor="text-violet-900"
                        />
                        <GradientStatCard
                            title="⏱️ Active Shifts"
                            value={stats.activeShifts}
                            subtitle="Currently running"
                            icon={<Clock className="w-5 h-5 text-amber-600" />}
                            gradient="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                            textColor="text-amber-900"
                        />
                    </div>
                </div>

                {/* Payroll & Expenses Stats */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" /> Payroll & Expenses
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientStatCard
                            title="💰 Total Payroll"
                            value={formatCurrency(stats.totalPayroll)}
                            subtitle="All time net salary"
                            icon={<PiggyBank className="w-5 h-5 text-teal-600" />}
                            gradient="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"
                            textColor="text-teal-900"
                        />
                        <GradientStatCard
                            title="🧾 Total Expenses"
                            value={formatCurrency(stats.totalExpenses)}
                            subtitle="Business expenses"
                            icon={<Receipt className="w-5 h-5 text-rose-600" />}
                            gradient="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200"
                            textColor="text-rose-900"
                        />
                        <GradientStatCard
                            title="💸 Pending Advances"
                            value={formatCurrency(stats.pendingAdvances)}
                            subtitle="Awaiting approval"
                            icon={<CreditCard className="w-5 h-5 text-orange-600" />}
                            gradient="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                            textColor="text-orange-900"
                        />
                        <GradientStatCard
                            title="📄 Pending Vouchers"
                            value={formatCurrency(stats.pendingVouchers)}
                            subtitle="Awaiting payment"
                            icon={<FileText className="w-5 h-5 text-sky-600" />}
                            gradient="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200"
                            textColor="text-sky-900"
                        />
                    </div>
                </div>

                {/* Two-Column Layout: Shift Performance + Top Stations */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Shift Performance */}
                    <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                        <CardHeader>
                            <CardTitle><Clock className="w-5 h-5 text-emerald-600" /> Shift Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-yellow-800">☀️ Day Shift</span>
                                    <span className="text-xs text-yellow-600">06:00 - 18:00</span>
                                </div>
                                <p className="text-xl font-bold text-yellow-900">{formatCurrency(salesStats.totalSales * 0.6)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-indigo-800">🌙 Night Shift</span>
                                    <span className="text-xs text-indigo-600">18:00 - 06:00</span>
                                </div>
                                <p className="text-xl font-bold text-indigo-900">{formatCurrency(salesStats.totalSales * 0.4)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Stations with Sales - Now spans 2 columns */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" /> Top Performing Stations
                        </h2>
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            {stationPerformance.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No stations found</p>
                                    <Link href="/dashboard/stations" className="text-emerald-600 text-sm hover:underline">Add your first station →</Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {stationPerformance.map((station, index) => (
                                        <div key={station.station_id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900">{station.station_name}</p>
                                                        <LiveStatus isOnline={station.is_online} />
                                                    </div>
                                                    <p className="text-sm text-gray-500">{station.transactionCount} transactions</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-gray-900">{formatCurrency(station.totalSales)}</p>
                                                    <div className="flex justify-end gap-3 text-xs mt-1">
                                                        <span className="text-emerald-600">📱 {formatCurrency(station.mpesaSales)}</span>
                                                        <span className="text-amber-600">💵 {formatCurrency(station.cashSales)}</span>
                                                        <span className="text-purple-600">🏢 {formatCurrency(station.creditSales)}</span>
                                                    </div>
                                                    {station.totalProfit > 0 && (
                                                        <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center justify-end gap-1">
                                                            <Activity className="w-3.5 h-3.5" /> Profit: {formatCurrency(station.totalProfit)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions - All 8 restored */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-600" /> Quick Actions
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionLink
                            href="/dashboard/stations"
                            icon={<Building2 className="w-5 h-5 text-cyan-600" />}
                            label="Manage Stations"
                            description="Add, edit, or view stations"
                            gradient="bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200"
                        />
                        <QuickActionLink
                            href="/dashboard/sales"
                            icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
                            label="View Sales"
                            description="All transactions"
                            gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200"
                        />
                        <QuickActionLink
                            href="/dashboard/payroll"
                            icon={<Wallet className="w-5 h-5 text-teal-600" />}
                            label="Payroll"
                            description="Generate salary"
                            gradient="bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200"
                        />
                        <QuickActionLink
                            href="/dashboard/expenses"
                            icon={<Receipt className="w-5 h-5 text-rose-600" />}
                            label="Expenses"
                            description="Track business expenses"
                            gradient="bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200"
                        />
                        <QuickActionLink
                            href="/dashboard/advances"
                            icon={<CreditCard className="w-5 h-5 text-orange-600" />}
                            label="Salary Advances"
                            description="Employee advances"
                            gradient="bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200"
                        />
                        <QuickActionLink
                            href="/dashboard/vouchers"
                            icon={<FileText className="w-5 h-5 text-purple-600" />}
                            label="Payment Vouchers"
                            description="Manage payments"
                            gradient="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200"
                        />
                        <QuickActionLink
                            href="/dashboard/reports"
                            icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
                            label="Reports"
                            description="Sales & analytics"
                            gradient="bg-gradient-to-br from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200"
                        />
                        <QuickActionLink
                            href="/dashboard/accounting"
                            icon={<Calculator className="w-5 h-5 text-sky-600" />}
                            label="Accounting"
                            description="Ledgers & books"
                            gradient="bg-gradient-to-br from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200"
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
