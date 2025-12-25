"use client"

import { useState } from "react"
import {
    BarChart3, LineChart, PieChart, Download, Calendar, TrendingUp, TrendingDown,
    Building2, Fuel, Users, Smartphone, Filter, RefreshCw, FileSpreadsheet,
    CheckCircle, XCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight,
    ChevronDown, Zap, Target, Activity
} from "lucide-react"
import {
    LineChart as RechartsLine, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"

// ==================== MOCK DATA ====================
const salesTrendData = [
    { name: "Mon", sales: 2400000, mpesa: 1800000, cash: 600000 },
    { name: "Tue", sales: 2100000, mpesa: 1600000, cash: 500000 },
    { name: "Wed", sales: 2800000, mpesa: 2100000, cash: 700000 },
    { name: "Thu", sales: 3200000, mpesa: 2500000, cash: 700000 },
    { name: "Fri", sales: 3800000, mpesa: 3000000, cash: 800000 },
    { name: "Sat", sales: 4200000, mpesa: 3400000, cash: 800000 },
    { name: "Sun", sales: 2900000, mpesa: 2200000, cash: 700000 },
]

const monthlyComparisonData = [
    { month: "Jan", thisYear: 85000000, lastYear: 72000000, target: 80000000 },
    { month: "Feb", thisYear: 78000000, lastYear: 68000000, target: 75000000 },
    { month: "Mar", thisYear: 92000000, lastYear: 80000000, target: 85000000 },
    { month: "Apr", thisYear: 88000000, lastYear: 76000000, target: 82000000 },
    { month: "May", thisYear: 95000000, lastYear: 82000000, target: 90000000 },
    { month: "Jun", thisYear: 102000000, lastYear: 88000000, target: 95000000 },
]

const stationPerformance = [
    { name: "Westlands", sales: 45000000, target: 42000000, deviation: 7.1 },
    { name: "CBD Main", sales: 38000000, target: 40000000, deviation: -5.0 },
    { name: "Mombasa Rd", sales: 35000000, target: 32000000, deviation: 9.4 },
    { name: "Thika Rd", sales: 28000000, target: 30000000, deviation: -6.7 },
    { name: "Kisumu", sales: 22000000, target: 20000000, deviation: 10.0 },
]

const paymentMethods = [
    { name: "M-Pesa", value: 62, amount: 78500000, color: "#22c55e" },
    { name: "Cash", value: 28, amount: 35450000, color: "#f59e0b" },
    { name: "Card", value: 10, amount: 12650000, color: "#3b82f6" },
]

const transactionStatus = [
    { status: "completed", label: "Completed", count: 12450, percent: 94.5, icon: CheckCircle, color: "text-green-600 bg-green-100" },
    { status: "pending", label: "Pending", count: 456, percent: 3.5, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { status: "failed", label: "Failed", count: 187, percent: 1.4, icon: XCircle, color: "text-red-600 bg-red-100" },
    { status: "cancelled", label: "Cancelled", count: 78, percent: 0.6, icon: AlertTriangle, color: "text-gray-600 bg-gray-100" },
]

const shiftPerformance = [
    { shift: "Day Shift", sales: 65000000, transactions: 8450, avgTicket: 7692, growth: 12.5 },
    { shift: "Night Shift", sales: 48000000, transactions: 5230, avgTicket: 9177, growth: 8.3 },
]

// ==================== FILTER COMPONENT ====================
function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    )
}

// ==================== KPI CARD ====================
function KpiCard({ title, value, change, target, icon: Icon, color }: { title: string; value: string; change: number; target?: string; icon: any; color: string }) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(change)}%
                </div>
            </div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {target && <p className="text-xs text-gray-400 mt-1">Target: {target}</p>}
        </div>
    )
}

// ==================== EXCEL EXPORT ====================
function exportToExcel(data: any[], filename: string) {
    // Create CSV content with emojis and formatting
    const headers = Object.keys(data[0])
    const csvContent = [
        // Title row
        `🚀 ${filename} - EnergyStation Pro Report`,
        `📅 Generated: ${new Date().toLocaleString()}`,
        "",
        // Headers with emojis
        headers.map(h => {
            const emojis: Record<string, string> = {
                station: "🏢", name: "📍", sales: "💰", mpesa: "📱", cash: "💵",
                transactions: "📊", status: "✅", amount: "💎", growth: "📈"
            }
            return `${emojis[h.toLowerCase()] || "📋"} ${h.toUpperCase()}`
        }).join(","),
        // Data rows
        ...data.map(row => headers.map(h => row[h]).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast.success("📊 Export Complete!", `${filename} downloaded successfully`)
}

// ==================== MAIN COMPONENT ====================
export default function ReportsPage() {
    const [dateRange, setDateRange] = useState("This Week")
    const [station, setStation] = useState("All Stations")
    const [pump, setPump] = useState("All Pumps")
    const [shift, setShift] = useState("All Shifts")
    const [status, setStatus] = useState("All Status")
    const [paymentType, setPaymentType] = useState("All Payments")

    const handleExportAll = () => {
        exportToExcel(stationPerformance.map(s => ({
            Station: s.name,
            Sales: formatCurrency(s.sales),
            Target: formatCurrency(s.target),
            "Deviation %": `${s.deviation > 0 ? '+' : ''}${s.deviation}%`,
            Performance: s.deviation >= 0 ? "✅ Above Target" : "⚠️ Below Target"
        })), "Station_Performance_Report")
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            📊 Advanced Reports & Analytics
                        </h1>
                        <p className="text-sm text-gray-500">Powerful insights with deviation analysis & comparisons</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed!")}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button size="sm" onClick={handleExportAll}>
                            <FileSpreadsheet className="w-4 h-4" /> Export Excel
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-700">🎯 Filters</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <FilterSelect label="📅 Date Range" options={["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom"]} value={dateRange} onChange={setDateRange} />
                            <FilterSelect label="🏢 Station" options={["All Stations", "Westlands", "CBD Main", "Mombasa Road", "Thika Road", "Kisumu"]} value={station} onChange={setStation} />
                            <FilterSelect label="⛽ Pump" options={["All Pumps", "P-001", "P-002", "P-003", "P-004"]} value={pump} onChange={setPump} />
                            <FilterSelect label="⏰ Shift" options={["All Shifts", "Day Shift", "Night Shift"]} value={shift} onChange={setShift} />
                            <FilterSelect label="✅ Status" options={["All Status", "Completed", "Pending", "Failed", "Cancelled"]} value={status} onChange={setStatus} />
                            <FilterSelect label="💳 Payment" options={["All Payments", "M-Pesa", "Cash", "Card"]} value={paymentType} onChange={setPaymentType} />
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <KpiCard title="Total Revenue" value={formatCurrency(126500000)} change={18.5} target={formatCurrency(120000000)} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
                    <KpiCard title="Transactions" value="13,171" change={12.3} target="12,500" icon={Activity} color="bg-green-100 text-green-600" />
                    <KpiCard title="Avg. Ticket Size" value={formatCurrency(9605)} change={5.4} icon={Target} color="bg-purple-100 text-purple-600" />
                    <KpiCard title="M-Pesa Share" value="62%" change={8.2} icon={Smartphone} color="bg-emerald-100 text-emerald-600" />
                </div>

                {/* Charts Row 1: Sales Trend & Monthly Comparison */}
                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Sales Trend Line Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <LineChart className="w-5 h-5 text-blue-600" />
                                📈 Weekly Sales Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrendData}>
                                        <defs>
                                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#salesGradient)" strokeWidth={2} name="Total Sales" />
                                        <Line type="monotone" dataKey="mpesa" stroke="#22c55e" strokeWidth={2} dot={false} name="M-Pesa" />
                                        <Line type="monotone" dataKey="cash" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cash" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Comparison */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                📊 Monthly Comparison (This Year vs Last Year)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                        <Tooltip formatter={(v) => formatCurrency(Number(v) || 0)} />
                                        <Legend />
                                        <Bar dataKey="thisYear" fill="#3b82f6" name="2024" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="lastYear" fill="#94a3b8" name="2023" radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Station Performance with Deviation */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                🏢 Station Performance & Deviation Analysis
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => exportToExcel(stationPerformance, "Station_Deviation")}>
                                <Download className="w-4 h-4" /> Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500">Station</th>
                                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500">Actual Sales</th>
                                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500">Target</th>
                                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500">Deviation</th>
                                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stationPerformance.map((s, i) => (
                                        <tr key={s.name} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i < 3 ? 'bg-blue-500' : 'bg-gray-400'}`}>{i + 1}</span>
                                                    <span className="font-medium text-gray-900">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-right font-semibold text-gray-900">{formatCurrency(s.sales)}</td>
                                            <td className="py-3 px-2 text-right text-gray-500">{formatCurrency(s.target)}</td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${s.deviation >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {s.deviation >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                    {s.deviation > 0 ? '+' : ''}{s.deviation}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                {s.deviation >= 0 ? (
                                                    <span className="text-green-600">✅ Above Target</span>
                                                ) : (
                                                    <span className="text-red-600">⚠️ Below Target</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment & Status Row */}
                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Payment Methods Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-green-600" />
                                💳 Payment Methods
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                                            {paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, name, entry: any) => [formatCurrency(entry?.payload?.amount || 0), String(name)]} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-2">
                                {paymentMethods.map((pm) => (
                                    <div key={pm.name} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pm.color }} />
                                            {pm.name}
                                        </span>
                                        <span className="font-medium">{formatCurrency(pm.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transaction Status */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                📋 Transaction Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {transactionStatus.map((ts) => (
                                    <div key={ts.status} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className={`w-10 h-10 rounded-xl ${ts.color} flex items-center justify-center`}>
                                            <ts.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{ts.label}</p>
                                            <p className="text-xs text-gray-500">{ts.count.toLocaleString()} transactions</p>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">{ts.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shift Performance */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                ⏰ Shift Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {shiftPerformance.map((sp) => (
                                    <div key={sp.shift} className="p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">{sp.shift === "Day Shift" ? "☀️" : "🌙"} {sp.shift}</span>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${sp.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                +{sp.growth}%
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-gray-900 mb-1">{formatCurrency(sp.sales)}</p>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>📊 {sp.transactions.toLocaleString()} txns</span>
                                            <span>💵 Avg: {formatCurrency(sp.avgTicket)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Export Options */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                    📁 Quick Export to Excel
                                </h3>
                                <p className="text-sm text-gray-500">Download detailed reports with colorful formatting</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => exportToExcel(salesTrendData, "Sales_Trend")}>📈 Sales Trend</Button>
                                <Button variant="outline" size="sm" onClick={() => exportToExcel(monthlyComparisonData, "Monthly_Comparison")}>📊 Monthly</Button>
                                <Button variant="outline" size="sm" onClick={() => exportToExcel(stationPerformance, "Station_Report")}>🏢 Stations</Button>
                                <Button variant="outline" size="sm" onClick={() => exportToExcel(paymentMethods, "Payments")}>💳 Payments</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
