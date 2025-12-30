"use client"

import { useState, useEffect, useMemo } from "react"
import {
    FileText, Download, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Calendar, Building2, Users, Fuel, RefreshCw, Printer, FileSpreadsheet,
    CheckCircle, Clock, XCircle, AlertCircle, Phone, Receipt, TrendingUp,
    DollarSign, Activity, Zap, Search, Copy, Eye, Droplet
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
    station?: { station_id: number; station_name: string; station_code: string }
    liters_sold?: number | null
    price_per_liter?: number | null
    attendant_id?: number | null
    attendant?: { user_id: number; full_name: string; username: string } | null
    pump_name?: string | null
}

interface Station { station_id: number; station_name: string; station_code: string }
interface Pump { pump_id: number; pump_name: string; station_id: number }
interface User { user_id: number; full_name: string; username: string }
interface Shift { shift_id: number; shift_name: string }

// ==================== GRADIENT STAT CARD ====================
function StatCard({ title, value, subValue, icon: Icon, gradient, trend }: {
    title: string; value: string; subValue?: string; icon: any; gradient: string; trend?: string
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {trend && <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white">{trend}</span>}
                </div>
                <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
                {subValue && <p className="text-white/70 text-xs mt-1">{subValue}</p>}
            </div>
        </div>
    )
}

// ==================== STATUS BADGE ====================
function StatusBadge({ status, resultDesc }: { status: string; resultDesc?: string | null }) {
    const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Completed' },
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
        failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Failed' },
        cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle, label: 'Cancelled' },
    }
    const { bg, text, icon: Icon, label } = config[status] || config.pending

    // Format result description to be more user-friendly
    const formatResultDesc = (desc: string | null | undefined): string | null => {
        if (!desc) return null
        // Common M-Pesa result descriptions mapped to friendly messages
        const descLower = desc.toLowerCase()
        if (descLower.includes('cancelled') && descLower.includes('user')) return 'Cancelled by customer'
        if (descLower.includes('insufficient')) return 'Insufficient funds'
        if (descLower.includes('timeout') || descLower.includes('timed out')) return 'Request timed out'
        if (descLower.includes('wrong pin')) return 'Wrong M-Pesa PIN'
        if (descLower.includes('limit')) return 'Transaction limit exceeded'
        if (descLower.includes('success')) return 'Payment successful'
        if (descLower.includes('pending')) return 'Awaiting confirmation'
        if (descLower.includes('failed')) return 'Transaction failed'
        // Return original if no match, but truncate if too long
        return desc.length > 30 ? desc.substring(0, 27) + '...' : desc
    }

    const friendlyDesc = formatResultDesc(resultDesc)

    return (
        <div className="flex flex-col items-center gap-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
            </span>
            {friendlyDesc && status !== 'completed' && (
                <span className="text-[10px] text-gray-500 max-w-[120px] text-center leading-tight">
                    {friendlyDesc}
                </span>
            )}
        </div>
    )
}

// ==================== MAIN COMPONENT ====================
export default function MpesaStatementPage() {
    const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [selectedStation, setSelectedStation] = useState("")
    const [selectedPump, setSelectedPump] = useState("")
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedShift, setSelectedShift] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(20)

    useEffect(() => {
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateTo(today.toISOString().split('T')[0])
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    }, [])

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                setTransactions(getMockData())
                setLoading(false)
                return
            }

            const stationsRes = await supabase.from("stations").select("station_id, station_name, station_code").order("station_name")
            const stationsData = stationsRes.data || []
            setStations(stationsData)

            const stationMap = new Map<number, Station>()
            stationsData.forEach(s => stationMap.set(s.station_id, s))

            // Fetch sales data with ALL relevant fields to correlate with M-Pesa transactions
            // Include attendant_id and pump_id to get attendant info
            const salesRes = await supabase.from("sales").select(`
                checkout_request_id, mpesa_receipt_number, liters_sold, price_per_liter, 
                total_amount, amount, attendant_id, pump_id,
                pump:pumps(pump_name)
            `)

            // Fetch all attendants/users for mapping
            const usersRes = await supabase.from("users_new").select("user_id, full_name, username")
            const usersMap = new Map<number, { user_id: number; full_name: string; username: string }>()
                ; (usersRes.data || []).forEach(u => usersMap.set(u.user_id, u))
            setUsers(usersRes.data || [])

            // Create two maps for matching - by checkout_request_id AND by mpesa_receipt_number
            interface SaleInfo {
                liters_sold: number | null
                price_per_liter: number | null
                amount: number
                attendant_id: number | null
                pump_name: string | null
            }
            const salesByCheckoutId = new Map<string, SaleInfo>()
            const salesByReceiptNumber = new Map<string, SaleInfo>()

                ; (salesRes.data || []).forEach((s: any) => {
                    const saleInfo: SaleInfo = {
                        liters_sold: s.liters_sold,
                        price_per_liter: s.price_per_liter,
                        amount: s.total_amount || s.amount || 0,
                        attendant_id: s.attendant_id,
                        pump_name: s.pump?.pump_name || null
                    }
                    if (s.checkout_request_id) {
                        salesByCheckoutId.set(s.checkout_request_id, saleInfo)
                    }
                    if (s.mpesa_receipt_number) {
                        salesByReceiptNumber.set(s.mpesa_receipt_number, saleInfo)
                    }
                })

            // Also fetch current fuel prices for fallback calculation
            const fuelPricesRes = await supabase.from("fuel_types").select("fuel_name, price_per_liter").eq("is_active", true)
            const defaultPricePerLiter = (fuelPricesRes.data || []).find(f => f.fuel_name?.toLowerCase().includes('petrol'))?.price_per_liter ||
                (fuelPricesRes.data || [])[0]?.price_per_liter || 180 // Default fallback

            const transactionsRes = await supabase.from("mpesa_transactions").select("*").order("created_at", { ascending: false })
            const transactionsWithStations = (transactionsRes.data || []).map(tx => {
                // Try to match by checkout_request_id first, then by mpesa_receipt_number
                let saleData = tx.checkout_request_id ? salesByCheckoutId.get(tx.checkout_request_id) : null
                if (!saleData && tx.mpesa_receipt_number) {
                    saleData = salesByReceiptNumber.get(tx.mpesa_receipt_number)
                }
                if (!saleData && tx.mpesa_receipt) {
                    saleData = salesByReceiptNumber.get(tx.mpesa_receipt)
                }

                // Calculate liters: use stored value, or calculate from amount and price
                let liters_sold = saleData?.liters_sold || null
                let price_per_liter = saleData?.price_per_liter || null

                // If no liters_sold stored but we have a completed transaction, calculate from amount
                if (!liters_sold && tx.status === 'completed' && tx.amount > 0) {
                    // Use price from sale if available, otherwise use current fuel price
                    const priceToUse = price_per_liter || defaultPricePerLiter
                    liters_sold = tx.amount / priceToUse
                    price_per_liter = priceToUse
                }

                // Get attendant info
                const attendant_id = saleData?.attendant_id || null
                const attendant = attendant_id ? usersMap.get(attendant_id) || null : null
                const pump_name = saleData?.pump_name || null

                return {
                    ...tx,
                    station: tx.station_id ? stationMap.get(tx.station_id) : undefined,
                    liters_sold,
                    price_per_liter,
                    attendant_id,
                    attendant,
                    pump_name
                }
            })
            setTransactions(transactionsWithStations)

            const [pumpsRes, shiftsRes] = await Promise.all([
                supabase.from("pumps").select("pump_id, pump_name, station_id"),
                supabase.from("shifts").select("shift_id, shift_name"),
            ])

            setPumps(pumpsRes.data || [])
            setShifts(shiftsRes.data || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (dateFrom && new Date(tx.created_at) < new Date(dateFrom + 'T00:00:00')) return false
            if (dateTo && new Date(tx.created_at) > new Date(dateTo + 'T23:59:59')) return false
            if (selectedStation && tx.station_id?.toString() !== selectedStation) return false
            if (selectedStatus && tx.status !== selectedStatus) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!tx.phone?.toLowerCase().includes(query) && !tx.mpesa_receipt_number?.toLowerCase().includes(query) && !tx.checkout_request_id?.toLowerCase().includes(query)) return false
            }
            return true
        })
    }, [transactions, dateFrom, dateTo, selectedStation, selectedStatus, searchQuery])

    const stats = useMemo(() => {
        const completed = filteredTransactions.filter(t => t.status === 'completed')
        const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0)
        const totalLiters = completed.reduce((sum, t) => sum + (t.liters_sold || 0), 0)
        return {
            totalAmount,
            totalLiters,
            totalTransactions: filteredTransactions.length,
            completedCount: completed.length,
            pendingCount: filteredTransactions.filter(t => t.status === 'pending').length,
            failedCount: filteredTransactions.filter(t => t.status === 'failed').length,
            successRate: filteredTransactions.length > 0 ? (completed.length / filteredTransactions.length) * 100 : 0
        }
    }, [filteredTransactions])

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredTransactions, currentPage, itemsPerPage])

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

    const handleResetFilters = () => {
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setDateTo(today.toISOString().split('T')[0])
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
        setSelectedStation(""); setSelectedPump(""); setSelectedUser(""); setSelectedShift(""); setSelectedStatus(""); setSearchQuery("")
        setCurrentPage(1)
    }

    // Export to Excel with styling
    const exportToExcel = () => {
        const headers = ["#", "Date & Time", "Phone Number", "Amount (KES)", "Liters Sold", "Status", "Status Detail", "M-Pesa Receipt", "Station", "Attendant", "Pump"]
        const rows = filteredTransactions.map((tx, i) => [
            i + 1,
            new Date(tx.created_at).toLocaleString(),
            tx.phone || '-',
            tx.amount,
            tx.liters_sold?.toFixed(2) || '-',
            tx.status.toUpperCase(),
            tx.result_desc || '-',
            tx.mpesa_receipt_number || '-',
            tx.station?.station_name || '-',
            tx.attendant?.full_name || '-',
            tx.pump_name || '-'
        ])

        const csvContent = [
            "🏦 ALPHA ENERGY - M-PESA STATEMENT",
            `📅 Period: ${dateFrom} to ${dateTo}`,
            `📊 Total Transactions: ${filteredTransactions.length}`,
            `💰 Total Amount: KES ${stats.totalAmount.toLocaleString()}`,
            `⛽ Total Liters: ${stats.totalLiters.toFixed(2)} L`,
            `✅ Success Rate: ${stats.successRate.toFixed(1)}%`,
            "",
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `MPesa_Statement_${dateFrom}_to_${dateTo}.csv`
        link.click()
        toast.success("📊 Export Complete!", "M-Pesa statement downloaded")
    }

    // Export to PDF
    const exportToPDF = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>M-Pesa Statement - Alpha Energy</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
                body { padding: 40px; background: #f8fafc; }
                .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; }
                .header h1 { font-size: 28px; margin-bottom: 8px; }
                .header p { opacity: 0.9; }
                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .stat-card h3 { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
                .stat-card p { font-size: 24px; font-weight: 700; color: #111827; }
                table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                th { background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 16px; text-align: left; font-size: 12px; text-transform: uppercase; }
                td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                tr:nth-child(even) { background: #f9fafb; }
                .status-completed { color: #059669; font-weight: 600; }
                .status-pending { color: #d97706; font-weight: 600; }
                .status-failed { color: #dc2626; font-weight: 600; }
                .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
                @media print { body { padding: 20px; } .header { break-inside: avoid; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏦 ALPHA ENERGY</h1>
                <p>M-Pesa Transaction Statement</p>
                <p style="margin-top: 15px;">📅 Period: ${dateFrom} to ${dateTo} | Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="stats">
                <div class="stat-card"><h3>💰 Total Revenue</h3><p>KES ${stats.totalAmount.toLocaleString()}</p></div>
                <div class="stat-card"><h3>⛽ Total Liters</h3><p>${stats.totalLiters.toFixed(2)} L</p></div>
                <div class="stat-card"><h3>✅ Successful</h3><p>${stats.completedCount}</p></div>
                <div class="stat-card"><h3>📈 Success Rate</h3><p>${stats.successRate.toFixed(1)}%</p></div>
            </div>
            <table>
                <thead><tr><th>#</th><th>Date & Time</th><th>Phone</th><th>Amount</th><th>Liters</th><th>Status</th><th>Receipt</th><th>Station</th><th>Attendant</th></tr></thead>
                <tbody>
                    ${filteredTransactions.map((tx, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${new Date(tx.created_at).toLocaleString()}</td>
                            <td>${tx.phone || '-'}</td>
                            <td style="font-weight: 600;">KES ${tx.amount.toLocaleString()}</td>
                            <td style="color: #059669; font-weight: 600;">${tx.liters_sold?.toFixed(2) || '-'} L</td>
                            <td class="status-${tx.status}">
                                ${tx.status.toUpperCase()}
                                ${tx.result_desc && tx.status !== 'completed' ? `<br><small style="color:#6b7280;font-size:10px;">${tx.result_desc}</small>` : ''}
                            </td>
                            <td style="font-family: monospace;">${tx.mpesa_receipt_number || '-'}</td>
                            <td>${tx.station?.station_name || '-'}</td>
                            <td>${tx.attendant?.full_name || '-'}${tx.pump_name ? `<br><small style="color:#6b7280;">⛽ ${tx.pump_name}</small>` : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                <p>🏦 Alpha Energy M-Pesa Statement | Confidential Document | Page 1</p>
            </div>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>`

        printWindow.document.write(html)
        printWindow.document.close()
        toast.success("📄 PDF Ready!", "Print dialog opened")
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied!", `${label} copied`)
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            📄 M-Pesa Statement
                        </h1>
                        <p className="text-sm text-gray-500">Generate detailed M-Pesa transaction statements</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToPDF} className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                            <Printer className="w-4 h-4" /> PDF
                        </Button>
                        <Button size="sm" onClick={exportToExcel} className="bg-gradient-to-r from-green-600 to-emerald-600">
                            <FileSpreadsheet className="w-4 h-4" /> Excel
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <StatCard title="Total Revenue" value={formatCurrency(stats.totalAmount)} subValue={`${stats.completedCount} successful`} icon={DollarSign} gradient="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600" trend="+12.5%" />
                    <StatCard title="⛽ Total Liters" value={`${stats.totalLiters.toFixed(2)} L`} subValue="Fuel sold" icon={Droplet} gradient="bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600" />
                    <StatCard title="Total Transactions" value={stats.totalTransactions.toLocaleString()} subValue={`${stats.pendingCount} pending`} icon={Receipt} gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600" />
                    <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} subValue={`${stats.failedCount} failed`} icon={TrendingUp} gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600" />
                    <StatCard title="Average Amount" value={formatCurrency(stats.completedCount > 0 ? stats.totalAmount / stats.completedCount : 0)} subValue="Per transaction" icon={Activity} gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500" />
                </div>

                {/* Filters */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Filter className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">🎯 Statement Filters</h3>
                                    <p className="text-xs text-gray-500">Customize your statement period and filters</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleResetFilters}><RefreshCw className="w-4 h-4" /> Reset</Button>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> From</label>
                                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> To</label>
                                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Station</label>
                                <select value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                                    <option value="">All Stations</option>
                                    {stations.map(s => <option key={s.station_id} value={s.station_id.toString()}>{s.station_name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> Pump</label>
                                <select value={selectedPump} onChange={(e) => setSelectedPump(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                                    <option value="">All Pumps</option>
                                    {pumps.map(p => <option key={p.pump_id} value={p.pump_id.toString()}>{p.pump_name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Attendant</label>
                                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                                    <option value="">All Users</option>
                                    {users.map(u => <option key={u.user_id} value={u.user_id.toString()}>{u.full_name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Status</label>
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer">
                                    <option value="">All Status</option>
                                    <option value="completed">✅ Completed</option>
                                    <option value="pending">⏳ Pending</option>
                                    <option value="failed">❌ Failed</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="🔍 Search phone, receipt, or checkout ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                        </div>
                    </CardContent>
                </Card>

                {/* Statement Table */}
                <Card className="overflow-hidden border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                📊 Transaction Details
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{filteredTransactions.length} records</span>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Show:</span>
                                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none">
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
                                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                            </div>
                        ) : paginatedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Receipt className="w-16 h-16 text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No transactions found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">#</th>
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">📅 Date & Time</th>
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">📱 Phone</th>
                                            <th className="text-right py-4 px-3 text-xs font-bold text-gray-600 uppercase">💰 Amount</th>
                                            <th className="text-right py-4 px-3 text-xs font-bold text-gray-600 uppercase">⛽ Liters</th>
                                            <th className="text-center py-4 px-3 text-xs font-bold text-gray-600 uppercase">✅ Status</th>
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">🧾 Receipt</th>
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">🏢 Station</th>
                                            <th className="text-left py-4 px-3 text-xs font-bold text-gray-600 uppercase">👤 Attendant</th>
                                            <th className="text-center py-4 px-3 text-xs font-bold text-gray-600 uppercase">⚡ Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedData.map((tx, index) => (
                                            <tr key={tx.id} className="hover:bg-blue-50/50 transition-colors group">
                                                <td className="py-4 px-4"><span className="text-xs font-medium text-gray-400">{(currentPage - 1) * itemsPerPage + index + 1}</span></td>
                                                <td className="py-4 px-4">
                                                    <p className="font-medium text-gray-900 text-sm">{new Date(tx.created_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><Phone className="w-4 h-4 text-green-600" /></div>
                                                        <span className="font-mono font-medium text-gray-900 text-sm">{tx.phone || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right"><span className="font-bold text-gray-900">{formatCurrency(tx.amount)}</span></td>
                                                <td className="py-4 px-4 text-right">
                                                    {tx.liters_sold ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Droplet className="w-3.5 h-3.5 text-cyan-600" />
                                                            <span className="font-semibold text-cyan-700">{tx.liters_sold.toFixed(2)} L</span>
                                                        </div>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="py-4 px-4 text-center"><StatusBadge status={tx.status} resultDesc={tx.result_desc} /></td>
                                                <td className="py-4 px-4">
                                                    {tx.mpesa_receipt_number ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{tx.mpesa_receipt_number}</span>
                                                            <button onClick={() => copyToClipboard(tx.mpesa_receipt_number!, 'Receipt')} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"><Copy className="w-3.5 h-3.5 text-gray-500" /></button>
                                                        </div>
                                                    ) : <span className="text-gray-400 text-sm">-</span>}
                                                </td>
                                                <td className="py-4 px-3">
                                                    {tx.station ? (
                                                        <div><p className="font-medium text-gray-900 text-sm">{tx.station.station_name}</p><p className="text-xs text-gray-500">{tx.station.station_code}</p></div>
                                                    ) : <span className="text-gray-400 text-sm">-</span>}
                                                </td>
                                                <td className="py-4 px-3">
                                                    {tx.attendant ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {tx.attendant.full_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm">{tx.attendant.full_name}</p>
                                                                {tx.pump_name && <p className="text-xs text-gray-500">⛽ {tx.pump_name}</p>}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-gray-400 text-sm">-</span>}
                                                </td>
                                                <td className="py-4 px-3 text-center">
                                                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors"><Eye className="w-4 h-4 text-gray-400 hover:text-blue-600" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {!loading && filteredTransactions.length > 0 && (
                            <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t border-gray-200 px-4 py-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{filteredTransactions.length}</span>
                                        <span className="text-sm text-gray-600">Total Records</span>
                                        <div className="h-6 w-px bg-gray-300" />
                                        <span className="text-sm text-gray-500">Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span></span>
                                    </div>
                                    <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg">Page {currentPage} of {totalPages}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsLeft className="w-4 h-4 text-gray-600" /></button>
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-600"><ChevronLeft className="w-4 h-4" /> Prev</button>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-600">Next <ChevronRight className="w-4 h-4" /></button>
                                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronsRight className="w-4 h-4 text-gray-600" /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

// Mock data for demo
function getMockData(): MpesaTransaction[] {
    return Array.from({ length: 50 }, (_, i) => ({
        id: `mock-${i}`,
        checkout_request_id: `ws_CO_${Date.now() + i}`,
        merchant_request_id: `mr_${i}`,
        phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
        amount: Math.floor(100 + Math.random() * 5000),
        account_ref: `P${i % 5 + 1}`,
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as any,
        mpesa_receipt: i % 3 === 0 ? `TL${Date.now() + i}` : null,
        mpesa_receipt_number: i % 3 === 0 ? `TL${Date.now() + i}` : null,
        result_desc: null,
        station_id: (i % 3) + 1,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        completed_at: i % 3 === 0 ? new Date(Date.now() - i * 3600000 + 60000).toISOString() : null,
        station: { station_id: (i % 3) + 1, station_name: `Station ${(i % 3) + 1}`, station_code: `STN-00${(i % 3) + 1}` },
        liters_sold: Math.floor(10 + Math.random() * 100) + Math.random(),
        price_per_liter: [220, 180, 150][i % 3]
    }))
}
