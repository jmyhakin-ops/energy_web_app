"use client"

import { useState, useEffect } from "react"
import { Smartphone, Send, CheckCircle, Clock, RefreshCw, Search, TrendingUp, Receipt, Loader2, ArrowRight, XCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface MpesaTransaction {
    id: string
    checkout_request_id: string
    phone: string
    amount: number
    status: string
    mpesa_receipt_number: string | null
    created_at: string
    result_desc: string | null
}

// M-Pesa Payment States
type PaymentState = "idle" | "sending" | "waiting" | "success" | "failed"

function StkPushForm({ onSuccess }: { onSuccess: () => void }) {
    const [phone, setPhone] = useState("")
    const [amount, setAmount] = useState("")
    const [paymentState, setPaymentState] = useState<PaymentState>("idle")
    const [checkoutRequestId, setCheckoutRequestId] = useState("")
    const [mpesaReceipt, setMpesaReceipt] = useState("")
    const [pollingCount, setPollingCount] = useState(0)

    // Send STK Push
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || phone.length < 9) {
            toast.error("Invalid", "Enter valid phone number")
            return
        }
        if (!amount || parseInt(amount) < 1) {
            toast.error("Invalid", "Amount must be at least KES 1")
            return
        }

        setPaymentState("sending")

        try {
            const response = await fetch("/api/mpesa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phone.startsWith("254") ? phone : `254${phone}`,
                    amount: parseInt(amount),
                    account: `WEB-${Date.now()}`,
                    description: "M-Pesa Payment",
                }),
            })

            const data = await response.json()

            if (data.success && data.checkoutRequestId) {
                setCheckoutRequestId(data.checkoutRequestId)
                setPaymentState("waiting")
                toast.success("STK Sent!", "Check phone for M-Pesa prompt")
                startPolling(data.checkoutRequestId)
            } else {
                setPaymentState("failed")
                toast.error("Failed", data.message || "Could not send STK Push")
            }
        } catch {
            setPaymentState("failed")
            toast.error("Network Error", "Please try again")
        }
    }

    // Poll for payment status
    const startPolling = async (checkoutId: string) => {
        let attempts = 0
        const maxAttempts = 24

        const poll = async () => {
            if (attempts >= maxAttempts) {
                setPaymentState("failed")
                toast.error("Timeout", "Payment not confirmed")
                return
            }

            attempts++
            setPollingCount(attempts)

            try {
                const response = await fetch(`/api/mpesa?checkoutRequestId=${encodeURIComponent(checkoutId)}`)
                const data = await response.json()

                if (data.status === "completed" && data.mpesaReceiptNumber) {
                    setMpesaReceipt(data.mpesaReceiptNumber)
                    setPaymentState("success")
                    toast.success("Payment Received!", `Receipt: ${data.mpesaReceiptNumber}`)
                    onSuccess() // Refresh transactions
                    return
                } else if (data.status === "failed") {
                    setPaymentState("failed")
                    toast.error("Payment Failed", data.resultDesc || "Rejected")
                    return
                } else {
                    setTimeout(poll, 5000)
                }
            } catch {
                setTimeout(poll, 5000)
            }
        }

        poll()
    }

    const handleReset = () => {
        setPaymentState("idle")
        setPhone("")
        setAmount("")
        setCheckoutRequestId("")
        setMpesaReceipt("")
        setPollingCount(0)
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    📱 Send M-Pesa Request
                    {paymentState === "success" && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">✓ Paid</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Idle State - Show Form */}
                {paymentState === "idle" && (
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
                        {/* Quick amounts */}
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
                        <Button type="submit" variant="success" className="w-full">
                            <Send className="w-4 h-4" /> Send STK Push
                        </Button>
                    </form>
                )}

                {/* Sending State */}
                {paymentState === "sending" && (
                    <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-3" />
                        <p className="text-green-700 font-semibold">Sending STK Push...</p>
                        <p className="text-sm text-gray-500">Please wait</p>
                    </div>
                )}

                {/* Waiting State */}
                {paymentState === "waiting" && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-green-700 font-semibold text-lg">Waiting for Payment...</p>
                        <p className="text-sm text-gray-500 mb-2">Customer should enter PIN on phone</p>
                        <p className="text-xs text-gray-400">Checking... ({pollingCount}/24)</p>
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600">Phone: <span className="font-mono font-bold">+254{phone}</span></p>
                            <p className="text-sm text-gray-600">Amount: <span className="font-bold text-green-600">{formatCurrency(parseInt(amount))}</span></p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {paymentState === "success" && (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                        <p className="text-green-700 font-bold text-xl mb-1">Payment Received!</p>
                        <p className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(parseInt(amount))}</p>
                        <p className="text-sm text-gray-600">Receipt: <span className="font-mono font-bold">{mpesaReceipt}</span></p>
                        <Button onClick={handleReset} className="mt-4">
                            <Send className="w-4 h-4" /> New Payment
                        </Button>
                    </div>
                )}

                {/* Failed State */}
                {paymentState === "failed" && (
                    <div className="text-center py-8">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 font-semibold text-lg">Payment Failed</p>
                        <p className="text-sm text-gray-500 mb-4">Transaction was cancelled or timed out</p>
                        <Button onClick={handleReset} variant="outline">
                            🔄 Try Again
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function TransactionList({ transactions, loading }: { transactions: MpesaTransaction[], loading: boolean }) {
    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" /> Recent Transactions
                </CardTitle>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 10).map((tx) => (
                            <div key={tx.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.status === "success" ? "bg-green-100 text-green-600" : tx.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                                    {tx.status === "success" ? <CheckCircle className="w-5 h-5" /> : tx.status === "pending" ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">+{tx.phone}</p>
                                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-green-600 text-sm">{formatCurrency(tx.amount)}</p>
                                    {tx.mpesa_receipt_number && <p className="text-xs text-gray-400 font-mono">{tx.mpesa_receipt_number}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function MpesaPage() {
    const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [checkId, setCheckId] = useState("")
    const [checkLoading, setCheckLoading] = useState(false)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            if (!isSupabaseConfigured() || !supabase) {
                setLoading(false)
                return
            }
            const { data } = await supabase
                .from("mpesa_transactions")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50)
            setTransactions(data || [])
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleCheckStatus = async () => {
        if (!checkId) {
            toast.error("Required", "Enter Checkout ID")
            return
        }
        setCheckLoading(true)
        try {
            const response = await fetch(`/api/mpesa?checkoutRequestId=${encodeURIComponent(checkId)}`)
            const data = await response.json()
            if (data.status === "completed") {
                toast.success("Payment Successful", `Receipt: ${data.mpesaReceiptNumber}`)
            } else if (data.status === "pending") {
                toast.info("Still Pending", "Payment not yet confirmed")
            } else {
                toast.error("Failed", data.resultDesc || "Payment was rejected")
            }
        } catch {
            toast.error("Error", "Could not check status")
        }
        setCheckLoading(false)
    }

    // Calculate stats
    const successfulTx = transactions.filter(t => t.status === "success")
    const stats = {
        todayTotal: successfulTx.reduce((acc, t) => acc + t.amount, 0),
        todayCount: transactions.length,
        successRate: transactions.length > 0 ? ((successfulTx.length / transactions.length) * 100).toFixed(1) : "0",
        avgAmount: successfulTx.length > 0 ? successfulTx.reduce((acc, t) => acc + t.amount, 0) / successfulTx.length : 0,
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📱 M-Pesa Payments</h1>
                        <p className="text-sm text-gray-500">Send STK Push and track real payments</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchTransactions}>
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard title="M-Pesa Total" value={formatCurrency(stats.todayTotal)} icon={<span className="text-lg">📱</span>} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Transactions" value={stats.todayCount} icon={<Receipt className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Avg. Amount" value={formatCurrency(stats.avgAmount)} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-orange-100 text-orange-600" />
                </div>

                {/* Form and List */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    <StkPushForm onSuccess={fetchTransactions} />
                    <TransactionList transactions={transactions} loading={loading} />
                </div>

                {/* Status Check */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-600" /> Check Transaction Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={checkId}
                                onChange={(e) => setCheckId(e.target.value)}
                                placeholder="Enter Checkout Request ID"
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                            />
                            <Button onClick={handleCheckStatus} loading={checkLoading}>
                                <Search className="w-4 h-4" /> Check
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
