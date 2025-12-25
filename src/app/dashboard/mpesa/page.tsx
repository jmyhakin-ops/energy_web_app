"use client"

import { useState } from "react"
import { Smartphone, Send, CheckCircle, Clock, RefreshCw, Search, TrendingUp, Receipt, Loader2, ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"

const recentTransactions = [
    { id: 1, phone: "254712****78", amount: 7280, receipt: "RGK7H84KLM", status: "completed", time: "2 min ago" },
    { id: 2, phone: "254723****89", amount: 5100, receipt: "RGK7H85MNO", status: "completed", time: "5 min ago" },
    { id: 3, phone: "254734****90", amount: 3200, receipt: "RGK7H86PQR", status: "completed", time: "8 min ago" },
    { id: 4, phone: "254745****01", amount: 4000, receipt: null, status: "pending", time: "10 min ago" },
    { id: 5, phone: "254756****12", amount: 12000, receipt: "RGK7H87STU", status: "completed", time: "15 min ago" },
]

function StkPushForm() {
    const [phone, setPhone] = useState("")
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || !amount) { toast.warning("Missing Fields", "Enter phone and amount"); return }
        setLoading(true)
        toast.mpesaPending()
        await new Promise(resolve => setTimeout(resolve, 3000))
        toast.dismiss()
        toast.mpesaSuccess(parseInt(amount), "RGK7H88XYZ")
        setLoading(false)
        setPhone("")
        setAmount("")
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">📱 Send M-Pesa Request</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+254</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                                placeholder="7XXXXXXXX"
                                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (KES)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="1"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                        />
                    </div>
                    {/* Quick amounts - scrollable on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setAmount(amt.toString())}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${amount === amt.toString() ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                            >
                                {formatCurrency(amt)}
                            </button>
                        ))}
                    </div>
                    <Button type="submit" variant="success" className="w-full" loading={loading}>
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Request</>}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function TransactionList() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" /> Recent
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.status === "completed" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                                {tx.status === "completed" ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{tx.phone}</p>
                                <p className="text-xs text-gray-500">{tx.time}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-green-600 text-sm">{formatCurrency(tx.amount)}</p>
                                {tx.receipt && <p className="text-xs text-gray-400 font-mono">{tx.receipt}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                    View All <ArrowRight className="w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

export default function MpesaPage() {
    const stats = { todayTotal: 1847500, todayCount: 234, successRate: 98.5, avgAmount: 7893 }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📱 M-Pesa Payments</h1>
                        <p className="text-sm text-gray-500">Send STK Push and track payments</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed!")}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                {/* Stats - 2 cols on mobile */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard title="Today's M-Pesa" value={formatCurrency(stats.todayTotal)} change={22} icon={<span className="text-lg">📱</span>} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Transactions" value={stats.todayCount} change={15} icon={<Receipt className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Success Rate" value={`${stats.successRate}%`} change={2} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Avg. Amount" value={formatCurrency(stats.avgAmount)} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-orange-100 text-orange-600" />
                </div>

                {/* Form and List - stack on mobile */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    <StkPushForm />
                    <TransactionList />
                </div>

                {/* Status Check */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-600" /> Check Transaction
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Enter Checkout ID or Receipt"
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                            />
                            <Button onClick={() => toast.info("Checking...")}>
                                <Search className="w-4 h-4" /> Check
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
