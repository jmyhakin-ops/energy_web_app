"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    Building2, Fuel, Users, Clock, BarChart3, Smartphone, TrendingUp,
    RefreshCw, Zap, ArrowRight, Loader2, AlertCircle,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatCard, RevenueCard, ShiftIndicator, LiveStatus } from "@/components/dashboard/stat-cards"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, getGreeting } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Quick Action Link Component
function QuickActionLink({ href, icon, label, description, iconBg }: { href: string; icon: React.ReactNode; label: string; description: string; iconBg: string }) {
    return (
        <Link href={href} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${iconBg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">{label}</h3>
                    <p className="text-xs text-gray-500 hidden sm:block">{description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
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
            ] = await Promise.all([
                supabase.from("stations").select("*").order("station_name"),
                supabase.from("pumps").select("pump_id").eq("is_active", true),
                supabase.from("users_new").select("user_id").eq("is_active", true),
                supabase.from("pump_shifts").select("pump_shift_id").eq("is_closed", false),
                supabase.from("sales").select("sale_id, total_amount, payment_method"),
            ])

            const stationsData = stationsRes.data || []
            const pumpsData = pumpsRes.data || []
            const usersData = usersRes.data || []
            const shiftsData = shiftsRes.data || []
            const salesData = salesRes.data || []

            // Calculate stats from real data
            const totalSales = salesData.reduce((acc, s) => acc + (s.total_amount || 0), 0)
            const mpesaSales = salesData.filter(s => s.payment_method === "mpesa").reduce((acc, s) => acc + (s.total_amount || 0), 0)
            const cashSales = salesData.filter(s => s.payment_method === "cash").reduce((acc, s) => acc + (s.total_amount || 0), 0)

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
            })

            setStations(stationsData.slice(0, 5))

        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Error", "Failed to load dashboard data")
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

    const dayShiftSales = stats.totalSales * 0.6
    const nightShiftSales = stats.totalSales * 0.4

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading dashboard...</p>
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
                        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()} 👋</h1>
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
                <RevenueCard
                    totalSales={stats.totalSales}
                    mpesaSales={stats.mpesaSales}
                    cashSales={stats.cashSales}
                    transactionCount={stats.transactionCount}
                />

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Stations" value={stats.stationsTotal} icon={<Building2 className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Active Pumps" value={stats.pumpsTotal} icon={<Fuel className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Total Staff" value={stats.usersTotal} icon={<Users className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Active Shifts" value={stats.activeShifts} icon={<Clock className="w-5 h-5" />} iconBg="bg-orange-100 text-orange-600" />
                </div>

                {/* Two Columns */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Shift Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle><Clock className="w-5 h-5 text-blue-600" /> Shift Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ShiftIndicator shiftName="Day Shift" startTime="06:00" endTime="18:00" sales={dayShiftSales} />
                            <ShiftIndicator shiftName="Night Shift" startTime="18:00" endTime="06:00" sales={nightShiftSales} />
                        </CardContent>
                    </Card>

                    {/* Top Stations */}
                    <Card className="lg:col-span-2">
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
                                        <div key={station.station_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300 text-gray-600'}`}>
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

                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" /> Quick Actions
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionLink href="/dashboard/stations" icon={<Building2 className="w-5 h-5" />} label="Manage Stations" description="Add, edit, or view stations" iconBg="bg-blue-100 text-blue-600" />
                        <QuickActionLink href="/dashboard/pumps" icon={<Fuel className="w-5 h-5" />} label="Pump Management" description="Configure pump settings" iconBg="bg-green-100 text-green-600" />
                        <QuickActionLink href="/dashboard/sales" icon={<Smartphone className="w-5 h-5" />} label="View Sales" description="View all transactions" iconBg="bg-purple-100 text-purple-600" />
                        <QuickActionLink href="/dashboard/reports" icon={<BarChart3 className="w-5 h-5" />} label="Generate Reports" description="Sales, shifts & analytics" iconBg="bg-orange-100 text-orange-600" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
