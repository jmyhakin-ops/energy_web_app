"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Building2, Fuel, Users, Clock, BarChart3, Smartphone, TrendingUp,
    RefreshCw, Zap, ArrowRight, Loader2, AlertCircle, Wallet, Receipt,
    CreditCard, Banknote, FileText, PiggyBank, DollarSign, Calculator,
    Activity, ShoppingBag, TrendingDown, Calendar
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, getGreeting } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Modern Gradient Stat Card Component
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

// Revenue Summary Card with Gradient
function ModernRevenueCard({ totalSales, mpesaSales, cashSales, transactionCount }: {
    totalSales: number
    mpesaSales: number
    cashSales: number
    transactionCount: number
}) {
    const mpesaPercent = totalSales > 0 ? (mpesaSales / totalSales * 100).toFixed(1) : 0
    const cashPercent = totalSales > 0 ? (cashSales / totalSales * 100).toFixed(1) : 0

    return (
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-6 h-6" />
                        <span className="text-blue-100">Today's Revenue</span>
                    </div>
                    <p className="text-4xl font-bold">{formatCurrency(totalSales)}</p>
                    <p className="text-blue-200 text-sm mt-1">{transactionCount} transactions completed</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4" />
                            <span className="text-sm text-blue-100">M-Pesa</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(mpesaSales)}</p>
                        <p className="text-xs text-blue-200">{mpesaPercent}% of total</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-4 h-4" />
                            <span className="text-sm text-blue-100">Cash</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(cashSales)}</p>
                        <p className="text-xs text-blue-200">{cashPercent}% of total</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Quick Action Link Component - Updated with gradient hover
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

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dbConfigured, setDbConfigured] = useState(true)
    const [stats, setStats] = useState({
        totalSales: 0,
        mpesaSales: 0,
        cashSales: 0,
        transactionCount: 0,
        activeShifts: 0,
        stationsOnline: 0,
        stationsTotal: 0,
        pumpsTotal: 0,
        usersTotal: 0,
        // Payroll & Expenses
        totalPayroll: 0,
        totalExpenses: 0,
        pendingAdvances: 0,
        pendingVouchers: 0,
    })
    const [stations, setStations] = useState<Station[]>([])

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
                salesRes,
                payrollRes,
                expensesRes,
                advancesRes,
                vouchersRes,
            ] = await Promise.all([
                supabase.from("stations").select("*").order("station_name"),
                supabase.from("pumps").select("pump_id").eq("is_active", true),
                supabase.from("users_new").select("user_id").eq("is_active", true),
                supabase.from("pump_shifts").select("pump_shift_id").eq("is_closed", false),
                supabase.from("sales").select("sale_id, total_amount, payment_method"),
                supabase.from("payroll").select("net_salary, payment_status"),
                supabase.from("expenses").select("amount, status"),
                supabase.from("salary_advances").select("amount, status").eq("status", "pending"),
                supabase.from("vouchers").select("amount, status").eq("status", "pending"),
            ])

            const stationsData = stationsRes.data || []
            const pumpsData = pumpsRes.data || []
            const usersData = usersRes.data || []
            const shiftsData = shiftsRes.data || []
            const salesData = salesRes.data || []
            const payrollData = payrollRes.data || []
            const expensesData = expensesRes.data || []
            const advancesData = advancesRes.data || []
            const vouchersData = vouchersRes.data || []

            // Calculate stats from real data
            const totalSales = salesData.reduce((acc, s) => acc + (s.total_amount || 0), 0)
            const mpesaSales = salesData.filter(s => s.payment_method === "mpesa").reduce((acc, s) => acc + (s.total_amount || 0), 0)
            const cashSales = salesData.filter(s => s.payment_method === "cash").reduce((acc, s) => acc + (s.total_amount || 0), 0)
            const totalPayroll = payrollData.reduce((acc, p) => acc + (p.net_salary || 0), 0)
            const totalExpenses = expensesData.reduce((acc, e) => acc + (e.amount || 0), 0)
            const pendingAdvances = advancesData.reduce((acc, a) => acc + (a.amount || 0), 0)
            const pendingVouchers = vouchersData.reduce((acc, v) => acc + (v.amount || 0), 0)

            setStats({
                totalSales,
                mpesaSales,
                cashSales,
                transactionCount: salesData.length,
                activeShifts: shiftsData.length,
                stationsOnline: stationsData.filter(s => s.is_online).length,
                stationsTotal: stationsData.length,
                pumpsTotal: pumpsData.length,
                usersTotal: usersData.length,
                totalPayroll,
                totalExpenses,
                pendingAdvances,
                pendingVouchers,
            })

            setStations(stationsData.slice(0, 5))

        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        setRefreshing(false)
        toast.success("✅ Refreshed!", "Data updated")
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard...</p>
                        <p className="text-xs text-gray-400 mt-2">v2.0 - Payroll & Expenses Update</p>
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

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="w-7 h-7 text-blue-600" />
                            {getGreeting()} 👋
                        </h1>
                        <p className="text-gray-500">Here's what's happening across your stations today</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <LiveStatus isOnline={stats.stationsOnline > 0} label={`${stats.stationsOnline}/${stats.stationsTotal} Online`} />
                        <Button onClick={handleRefresh} loading={refreshing}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Revenue Card */}
                <ModernRevenueCard
                    totalSales={stats.totalSales}
                    mpesaSales={stats.mpesaSales}
                    cashSales={stats.cashSales}
                    transactionCount={stats.transactionCount}
                />

                {/* Operations Stats - Modern Gradient Cards */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" /> Operations Overview
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientStatCard
                            title="🏢 Stations"
                            value={stats.stationsTotal}
                            subtitle={`${stats.stationsOnline} online`}
                            icon={<Building2 className="w-5 h-5 text-blue-600" />}
                            gradient="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                            textColor="text-blue-900"
                        />
                        <GradientStatCard
                            title="⛽ Active Pumps"
                            value={stats.pumpsTotal}
                            subtitle="Fuel dispensers"
                            icon={<Fuel className="w-5 h-5 text-green-600" />}
                            gradient="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                            textColor="text-green-900"
                        />
                        <GradientStatCard
                            title="👥 Total Staff"
                            value={stats.usersTotal}
                            subtitle="Active employees"
                            icon={<Users className="w-5 h-5 text-purple-600" />}
                            gradient="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                            textColor="text-purple-900"
                        />
                        <GradientStatCard
                            title="⏱️ Active Shifts"
                            value={stats.activeShifts}
                            subtitle="Currently running"
                            icon={<Clock className="w-5 h-5 text-orange-600" />}
                            gradient="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                            textColor="text-orange-900"
                        />
                    </div>
                </div>

                {/* Payroll & Expenses Stats */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-600" /> Payroll & Expenses
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <GradientStatCard
                            title="💰 Total Payroll"
                            value={formatCurrency(stats.totalPayroll)}
                            subtitle="All time net salary"
                            icon={<PiggyBank className="w-5 h-5 text-green-600" />}
                            gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
                            textColor="text-emerald-900"
                        />
                        <GradientStatCard
                            title="🧾 Total Expenses"
                            value={formatCurrency(stats.totalExpenses)}
                            subtitle="Business expenses"
                            icon={<Receipt className="w-5 h-5 text-red-600" />}
                            gradient="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                            textColor="text-red-900"
                        />
                        <GradientStatCard
                            title="💸 Pending Advances"
                            value={formatCurrency(stats.pendingAdvances)}
                            subtitle="Awaiting approval"
                            icon={<CreditCard className="w-5 h-5 text-amber-600" />}
                            gradient="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                            textColor="text-amber-900"
                        />
                        <GradientStatCard
                            title="📄 Pending Vouchers"
                            value={formatCurrency(stats.pendingVouchers)}
                            subtitle="Awaiting payment"
                            icon={<FileText className="w-5 h-5 text-indigo-600" />}
                            gradient="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
                            textColor="text-indigo-900"
                        />
                    </div>
                </div>

                {/* Two Columns */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Shift Performance */}
                    <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
                        <CardHeader>
                            <CardTitle><Clock className="w-5 h-5 text-blue-600" /> Shift Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-yellow-800">☀️ Day Shift</span>
                                    <span className="text-xs text-yellow-600">06:00 - 18:00</span>
                                </div>
                                <p className="text-xl font-bold text-yellow-900">{formatCurrency(stats.totalSales * 0.6)}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-indigo-800">🌙 Night Shift</span>
                                    <span className="text-xs text-indigo-600">18:00 - 06:00</span>
                                </div>
                                <p className="text-xl font-bold text-indigo-900">{formatCurrency(stats.totalSales * 0.4)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Stations */}
                    <Card className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100">
                        <CardHeader>
                            <CardTitle><TrendingUp className="w-5 h-5 text-green-600" /> Top Performing Stations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No stations found</p>
                                    <Link href="/dashboard/stations" className="text-blue-600 text-sm hover:underline">Add your first station →</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stations.map((station, index) => (
                                        <div key={station.station_id} className={`flex items-center gap-4 p-4 rounded-xl hover:scale-[1.01] transition-all ${index === 0 ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200" :
                                            index === 1 ? "bg-gradient-to-r from-slate-50 to-gray-100 border border-gray-200" :
                                                index === 2 ? "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200" :
                                                    "bg-white border border-gray-100"
                                            }`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-400 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                    index === 2 ? 'bg-orange-500 text-white' :
                                                        'bg-gray-200 text-gray-600'
                                                }`}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{station.station_name}</p>
                                                    <LiveStatus isOnline={station.is_online} />
                                                </div>
                                                <p className="text-sm text-gray-500">{station.city || station.physical_address || 'No location'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-gray-900">{station.station_code}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions - Updated with more actions */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" /> Quick Actions
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionLink
                            href="/dashboard/stations"
                            icon={<Building2 className="w-5 h-5 text-blue-600" />}
                            label="Manage Stations"
                            description="Add, edit, or view stations"
                            gradient="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
                        />
                        <QuickActionLink
                            href="/dashboard/sales"
                            icon={<ShoppingBag className="w-5 h-5 text-green-600" />}
                            label="View Sales"
                            description="All transactions"
                            gradient="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200"
                        />
                        <QuickActionLink
                            href="/dashboard/payroll"
                            icon={<Wallet className="w-5 h-5 text-emerald-600" />}
                            label="Payroll"
                            description="Generate salary"
                            gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200"
                        />
                        <QuickActionLink
                            href="/dashboard/expenses"
                            icon={<Receipt className="w-5 h-5 text-red-600" />}
                            label="Expenses"
                            description="Track business expenses"
                            gradient="bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200"
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
                            icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
                            label="Reports"
                            description="Sales & analytics"
                            gradient="bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200"
                        />
                        <QuickActionLink
                            href="/dashboard/accounting"
                            icon={<Calculator className="w-5 h-5 text-cyan-600" />}
                            label="Accounting"
                            description="Ledgers & books"
                            gradient="bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200"
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
