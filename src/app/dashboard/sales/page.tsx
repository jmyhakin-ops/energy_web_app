"use client"

import { useState, useEffect } from "react"
import {
    Wallet, Download, CheckCircle, XCircle, Clock, Loader2, RefreshCw,
    Fuel, Building2, Plus, X, Save, CreditCard, FileSpreadsheet, Filter, Droplets
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

// Sale interface matching database schema (after migration)
interface Sale {
    sale_id: number
    sale_id_no: string
    pump_shift_id: number
    pump_id: number
    attendant_id: number
    amount: number
    customer_mobile_no: string | null
    transaction_status: string
    checkout_request_id: string | null
    mpesa_receipt_number: string | null
    created_at: string
    updated_at: string
    station_id: number
    // New detailed fields (after running migration)
    fuel_type_id?: number
    liters_sold?: number
    price_per_liter?: number
    total_amount?: number
    payment_method?: string
    sale_time?: string
    mpesa_transaction_id?: string | null
    // Relations
    station?: { station_id: number; station_name: string }
    pump?: { pump_id: number; pump_name: string }
    attendant?: { user_id: number; full_name: string }
    fuel_type?: { fuel_type_id: number; fuel_name: string }
}

interface Station {
    station_id: number
    station_name: string
}

interface Pump {
    pump_id: number
    pump_name: string
    station_id: number
}

interface FuelType {
    fuel_type_id: number
    fuel_name: string
    price_per_liter: number
}

interface User {
    user_id: number
    full_name: string
}

interface Shift {
    shift_id: number
    shift_name: string
}

interface PumpShift {
    pump_shift_id: number
    pump_id: number
    shift_id: number
    attendant_id: number
    is_closed: boolean
}

// Generate receipt code like RCP-00001, RCP-00002, etc.
function generateReceiptCode(count: number): string {
    const nextNum = count + 1
    const paddedNum = nextNum.toString().padStart(5, "0")
    return `RCP-${paddedNum}`
}

// M-Pesa Payment States
type MpesaState = "idle" | "sending" | "waiting" | "success" | "failed"

// Add Sale Modal - Amount-based calculation with Real M-Pesa STK Push
function AddSaleModal({
    stations,
    pumps,
    fuelTypes,
    users,
    shifts,
    pumpShifts,
    nextSaleNumber,
    onSave,
    onClose,
}: {
    stations: Station[]
    pumps: Pump[]
    fuelTypes: FuelType[]
    users: User[]
    shifts: Shift[]
    pumpShifts: PumpShift[]
    nextSaleNumber: number
    onSave: (data: any) => Promise<void>
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const receiptNumber = generateReceiptCode(nextSaleNumber)
    const [formData, setFormData] = useState({
        receipt_no: receiptNumber,
        station_id: stations[0]?.station_id || 0,
        pump_id: 0,
        shift_id: shifts[0]?.shift_id || 0,
        fuel_type_id: fuelTypes[0]?.fuel_type_id || 0,
        attendant_id: 0,
        total_amount: 0,
        payment_method: "cash",
        mpesa_transaction_id: "",
        phone_number: "",
    })

    // M-Pesa STK Push State
    const [mpesaState, setMpesaState] = useState<MpesaState>("idle")
    const [checkoutRequestId, setCheckoutRequestId] = useState<string>("")
    const [mpesaReceipt, setMpesaReceipt] = useState<string>("")
    const [pollingCount, setPollingCount] = useState(0)

    const filteredPumps = pumps.filter(p => p.station_id === formData.station_id)
    const selectedFuel = fuelTypes.find(f => f.fuel_type_id === formData.fuel_type_id)
    const pricePerLiter = selectedFuel?.price_per_liter || 0
    const litersSold = pricePerLiter > 0 ? formData.total_amount / pricePerLiter : 0

    // Initiate M-Pesa STK Push
    const handleSendStkPush = async () => {
        if (!formData.phone_number || formData.phone_number.length < 9) {
            toast.error("Invalid", "Enter valid phone number")
            return
        }
        if (formData.total_amount < 1) {
            toast.error("Invalid", "Amount must be at least KES 1")
            return
        }

        setMpesaState("sending")
        try {
            const response = await fetch("/api/mpesa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: formData.phone_number,
                    amount: Math.round(formData.total_amount),
                    account: receiptNumber,
                    description: `Fuel Purchase - ${selectedFuel?.fuel_name || "Fuel"}`,
                }),
            })

            const data = await response.json()

            if (data.success && data.checkoutRequestId) {
                setCheckoutRequestId(data.checkoutRequestId)
                setMpesaState("waiting")
                toast.success("STK Sent!", "Check phone for M-Pesa prompt")
                // Start polling for payment status
                startPolling(data.checkoutRequestId)
            } else {
                setMpesaState("failed")
                toast.error("Failed", data.message || "Could not send STK Push")
            }
        } catch (error) {
            setMpesaState("failed")
            toast.error("Error", "Network error. Try again.")
        }
    }

    // Poll for M-Pesa payment status
    const startPolling = async (checkoutId: string) => {
        let attempts = 0
        const maxAttempts = 24 // 2 minutes (5s intervals)

        const poll = async () => {
            if (attempts >= maxAttempts) {
                setMpesaState("failed")
                toast.error("Timeout", "Payment not confirmed. Try again.")
                return
            }

            attempts++
            setPollingCount(attempts)

            try {
                const response = await fetch(`/api/mpesa?checkoutRequestId=${encodeURIComponent(checkoutId)}`)
                const data = await response.json()

                if (data.status === "completed" && data.mpesaReceiptNumber) {
                    setMpesaReceipt(data.mpesaReceiptNumber)
                    setFormData(prev => ({ ...prev, mpesa_transaction_id: data.mpesaReceiptNumber }))
                    setMpesaState("success")
                    toast.success("Payment Received!", `Receipt: ${data.mpesaReceiptNumber}`)
                    return
                } else if (data.status === "failed") {
                    setMpesaState("failed")
                    toast.error("Payment Failed", data.resultDesc || "Transaction was rejected")
                    return
                } else {
                    // Still pending, poll again
                    setTimeout(poll, 5000)
                }
            } catch {
                // Network error, retry
                setTimeout(poll, 5000)
            }
        }

        poll()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.pump_id || !formData.total_amount) {
            toast.error("Required", "Select pump and enter amount")
            return
        }
        if (!formData.shift_id) {
            toast.error("Required", "Select a shift")
            return
        }
        // For M-Pesa, ensure payment is confirmed
        if (formData.payment_method === "mpesa" && mpesaState !== "success") {
            toast.error("Payment Required", "Complete M-Pesa payment first")
            return
        }

        // Find pump_shift_id for the selected pump and shift
        const pumpShift = pumpShifts.find(
            ps => ps.pump_id === formData.pump_id && ps.shift_id === formData.shift_id && !ps.is_closed
        )

        if (!pumpShift) {
            toast.error("No Active Shift", "No active pump shift found. Please start a shift first or select a different pump/shift.")
            return
        }

        setLoading(true)
        try {
            // Generate sale_id_no in same format as mobile app (RCP-XXXXX)
            const saleIdNo = receiptNumber

            // ALL fields including new detailed fields (migration already run)
            const saleData = {
                sale_id_no: saleIdNo,
                pump_shift_id: pumpShift.pump_shift_id,
                pump_id: formData.pump_id,
                attendant_id: formData.attendant_id || pumpShift.attendant_id || 1,
                amount: formData.total_amount,
                customer_mobile_no: formData.phone_number || null,
                transaction_status: formData.payment_method === "mpesa" ? "SUCCESS" : "CASH",
                mpesa_receipt_number: mpesaReceipt || null,
                station_id: formData.station_id,
                // Detailed fields (from migration)
                fuel_type_id: formData.fuel_type_id || null,
                liters_sold: litersSold,
                price_per_liter: pricePerLiter,
                total_amount: formData.total_amount,
                payment_method: formData.payment_method,
                sale_time: new Date().toISOString(),
                mpesa_transaction_id: mpesaReceipt || null,
            }

            console.log("[Sales] Submitting sale:", saleData)
            await onSave(saleData)
            onClose()
        } catch (error: unknown) {
            console.error("[Sales] Error:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed"
            toast.error("Error", errorMessage)
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Record New Sale</h2>
                        <p className="text-sm text-gray-500 font-mono">{receiptNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Station & Pump */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                            <select
                                value={formData.station_id}
                                onChange={(e) => setFormData({ ...formData, station_id: parseInt(e.target.value), pump_id: 0 })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            >
                                {stations.map((s) => (
                                    <option key={s.station_id} value={s.station_id}>{s.station_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pump</label>
                            <select
                                value={formData.pump_id}
                                onChange={(e) => setFormData({ ...formData, pump_id: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                                required
                            >
                                <option value="">Select</option>
                                {filteredPumps.map((p) => (
                                    <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Shift Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">🕐 Shift</label>
                        <select
                            value={formData.shift_id}
                            onChange={(e) => setFormData({ ...formData, shift_id: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                            required
                        >
                            <option value="">Select Shift</option>
                            {shifts.map((s) => (
                                <option key={s.shift_id} value={s.shift_id}>{s.shift_name}</option>
                            ))}
                        </select>
                        {pumpShifts.filter(ps => ps.pump_id === formData.pump_id && ps.shift_id === formData.shift_id).length > 0 && (
                            <p className="text-xs text-green-600 mt-1">✅ Active shift found</p>
                        )}
                    </div>

                    {/* Fuel Type - Visual Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {fuelTypes.slice(0, 6).map((ft) => (
                                <button
                                    key={ft.fuel_type_id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, fuel_type_id: ft.fuel_type_id })}
                                    className={`p-2 rounded-xl border-2 text-center transition-all ${formData.fuel_type_id === ft.fuel_type_id
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <p className="text-xs font-medium truncate">{ft.fuel_name}</p>
                                    <p className="text-xs text-gray-500">{formatCurrency(ft.price_per_liter)}/L</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount & Liters - Side by Side */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-green-700 mb-1">💰 Amount (KES)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.total_amount || ""}
                                    onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="Enter amount"
                                    className="w-full px-3 py-3 text-xl font-bold border-2 border-green-300 rounded-xl focus:border-green-500 outline-none text-center bg-white"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-700 mb-1">⛽ Liters (Auto)</label>
                                <div className="w-full px-3 py-3 text-xl font-bold border-2 border-blue-200 rounded-xl bg-blue-50 text-center text-blue-700">
                                    {litersSold.toFixed(2)} L
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Price: {formatCurrency(pricePerLiter)}/L → {formData.total_amount > 0 ? `${formatCurrency(formData.total_amount)} ÷ ${formatCurrency(pricePerLiter)} = ${litersSold.toFixed(2)}L` : "Enter amount to calculate liters"}
                        </p>
                    </div>

                    {/* Attendant */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attendant</label>
                        <select
                            value={formData.attendant_id}
                            onChange={(e) => setFormData({ ...formData, attendant_id: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                        >
                            <option value="">Select attendant</option>
                            {users.map((u) => (
                                <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => { setFormData({ ...formData, payment_method: "cash" }); setMpesaState("idle") }}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.payment_method === "cash"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                                }`}
                        >
                            <span className="text-xl">💵</span>
                            <p className="text-sm font-medium">Cash</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method: "mpesa" })}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${formData.payment_method === "mpesa"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200"
                                }`}
                        >
                            <span className="text-xl">📱</span>
                            <p className="text-sm font-medium">M-Pesa</p>
                        </button>
                    </div>

                    {/* M-Pesa STK Push Section */}
                    {formData.payment_method === "mpesa" && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-300 space-y-3">
                            {/* Phone Input */}
                            {mpesaState === "idle" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-green-700 mb-1">📱 Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, "") })}
                                            placeholder="07XXXXXXXX"
                                            className="w-full px-4 py-3 text-lg font-bold border-2 border-green-300 rounded-xl focus:border-green-500 outline-none text-center bg-white"
                                            maxLength={12}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendStkPush}
                                        disabled={formData.total_amount < 1}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                    >
                                        📤 Send M-Pesa Prompt
                                    </button>
                                    <p className="text-xs text-center text-gray-500">Customer will receive M-Pesa PIN request on their phone</p>
                                </>
                            )}

                            {/* Sending */}
                            {mpesaState === "sending" && (
                                <div className="text-center py-4">
                                    <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-2" />
                                    <p className="text-green-700 font-medium">Sending STK Push...</p>
                                </div>
                            )}

                            {/* Waiting for Payment */}
                            {mpesaState === "waiting" && (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-green-700 font-semibold mb-1">Waiting for payment...</p>
                                    <p className="text-sm text-gray-500">Customer should enter PIN on phone</p>
                                    <p className="text-xs text-gray-400 mt-2">Checking... ({pollingCount}/24)</p>
                                </div>
                            )}

                            {/* Success */}
                            {mpesaState === "success" && (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                    <p className="text-green-700 font-bold text-lg">Payment Received!</p>
                                    <p className="text-sm text-gray-600 mt-1">Receipt: <span className="font-mono font-bold">{mpesaReceipt}</span></p>
                                </div>
                            )}

                            {/* Failed */}
                            {mpesaState === "failed" && (
                                <div className="text-center py-4">
                                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                    <p className="text-red-600 font-semibold">Payment Failed</p>
                                    <button
                                        type="button"
                                        onClick={() => setMpesaState("idle")}
                                        className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                                    >
                                        🔄 Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button
                            type="submit"
                            loading={loading}
                            variant="success"
                            className="flex-1"
                            disabled={formData.payment_method === "mpesa" && mpesaState !== "success"}
                        >
                            <Save className="w-4 h-4" /> Record Sale
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Sales Page
export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const [totalSalesCount, setTotalSalesCount] = useState(0)  // Actual total count from DB
    const [stations, setStations] = useState<Station[]>([])
    const [pumps, setPumps] = useState<Pump[]>([])
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [pumpShifts, setPumpShifts] = useState<PumpShift[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [showAddModal, setShowAddModal] = useState(false)

    // Pagination - 7 per page for better visibility
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 7

    // Filters
    const [selectedStation, setSelectedStation] = useState<number | null>(null)
    const [selectedPump, setSelectedPump] = useState<number | null>(null)
    const [selectedUser, setSelectedUser] = useState<number | null>(null)
    const [selectedShift, setSelectedShift] = useState<number | null>(null)
    const [dateFrom, setDateFrom] = useState("")  // YYYY-MM-DD format
    const [dateTo, setDateTo] = useState("")  // YYYY-MM-DD format

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (isSupabaseConfigured() && supabase) {
                const [stationsRes, pumpsRes, fuelTypesRes, usersRes, shiftsRes, pumpShiftsRes, salesRes, salesCountRes] = await Promise.all([
                    supabase.from("stations").select("station_id, station_name").eq("is_active", true).order("station_name"),
                    supabase.from("pumps").select("pump_id, pump_name, station_id").eq("is_active", true).order("pump_name"),
                    supabase.from("fuel_types").select("*").eq("is_active", true).order("fuel_name"),
                    supabase.from("users_new").select("user_id, full_name").eq("is_active", true).order("full_name"),
                    supabase.from("shifts").select("shift_id, shift_name").order("shift_name"),
                    supabase.from("pump_shifts").select("pump_shift_id, pump_id, shift_id, attendant_id, is_closed").eq("is_closed", false),
                    // Simplified: Fetch sales without complex joins (joins may fail if FK missing)
                    supabase.from("sales")
                        .select("*")
                        .order("created_at", { ascending: false })
                        .limit(500),
                    // Get TOTAL count of all sales for receipt number
                    supabase.from("sales").select("sale_id", { count: "exact", head: true }),
                ])

                console.log("[Sales] Fetched data:", {
                    stations: stationsRes.data?.length,
                    pumps: pumpsRes.data?.length,
                    fuelTypes: fuelTypesRes.data?.length,
                    users: usersRes.data?.length,
                    shifts: shiftsRes.data?.length,
                    pumpShifts: pumpShiftsRes.data?.length,
                    sales: salesRes.data?.length,
                    salesCount: salesCountRes.count,
                    salesError: salesRes.error,
                })

                setStations(stationsRes.data || [])
                setPumps(pumpsRes.data || [])
                setFuelTypes(fuelTypesRes.data || [])
                setUsers(usersRes.data || [])
                setShifts(shiftsRes.data || [])
                setPumpShifts(pumpShiftsRes.data || [])
                setSales(salesRes.data || [])
                // Set total count from the count query
                setTotalSalesCount(salesCountRes.count || salesRes.data?.length || 0)
            } else {
                toast.error("Database not configured", "Please configure Supabase")
            }
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error", "Failed to load data")
        }
        setLoading(false)
    }

    const handleAddSale = async (data: any) => {
        if (!supabase) throw new Error("Database not configured")

        const { error } = await supabase
            .from("sales")
            .insert([data])

        if (error) throw error
        toast.success("✅ Sale Recorded!", `${formatCurrency(data.total_amount)} - ${data.liters_sold?.toFixed(2) || 0}L`)
        fetchData()
    }

    // Filter sales by dropdown filters and search
    const filteredSales = sales.filter((sale) => {
        // Date range filter
        if (dateFrom || dateTo) {
            const saleDate = sale.created_at?.split('T')[0]
            if (!saleDate) return false
            if (dateFrom && saleDate < dateFrom) return false
            if (dateTo && saleDate > dateTo) return false
        }
        // Dropdown filters
        if (selectedStation && sale.station_id !== selectedStation) return false
        if (selectedPump && sale.pump_id !== selectedPump) return false
        if (selectedUser && sale.attendant_id !== selectedUser) return false
        // Shift filter through pump_shift lookup
        if (selectedShift) {
            const pumpShift = pumpShifts.find(ps => ps.pump_shift_id === sale.pump_shift_id)
            if (pumpShift && pumpShift.shift_id !== selectedShift) return false
        }

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const stationName = stations.find(s => s.station_id === sale.station_id)?.station_name || ''
            const attendantName = users.find(u => u.user_id === sale.attendant_id)?.full_name || ''
            return (
                stationName.toLowerCase().includes(query) ||
                attendantName.toLowerCase().includes(query) ||
                sale.mpesa_receipt_number?.toLowerCase().includes(query) ||
                sale.mpesa_transaction_id?.toLowerCase().includes(query) ||
                sale.sale_id_no?.toLowerCase().includes(query)
            )
        }
        return true
    })

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / pageSize)
    const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    // Reset to page 1 when filters change
    const clearFilters = () => {
        setSelectedStation(null)
        setSelectedPump(null)
        setSelectedUser(null)
        setSelectedShift(null)
        setDateFrom("")
        setDateTo("")
        setSearchQuery("")
        setCurrentPage(1)
    }

    // Stats - MUST use filteredSales to reflect current filters!
    // Also check transaction_status for mobile app compatibility
    const stats = {
        total: filteredSales.reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0),
        count: filteredSales.length,
        mpesa: filteredSales.filter(s => s.payment_method === "mpesa" || s.transaction_status === "SUCCESS").reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0),
        cash: filteredSales.filter(s => s.payment_method === "cash" || s.transaction_status === "CASH").reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0),
        totalLiters: filteredSales.reduce((acc, s) => acc + (s.liters_sold || 0), 0),
    }

    // Export to Excel with professional formatting
    const exportToExcel = () => {
        // Build filter summary
        const filterParts = []
        if (dateFrom) filterParts.push(`From: ${dateFrom}`)
        if (dateTo) filterParts.push(`To: ${dateTo}`)
        if (selectedStation) filterParts.push(`Station: ${stations.find(s => s.station_id === selectedStation)?.station_name}`)
        if (selectedPump) filterParts.push(`Pump: ${pumps.find(p => p.pump_id === selectedPump)?.pump_name}`)
        if (selectedUser) filterParts.push(`Attendant: ${users.find(u => u.user_id === selectedUser)?.full_name}`)
        if (selectedShift) filterParts.push(`Shift: ${shifts.find(s => s.shift_id === selectedShift)?.shift_name}`)
        const filterSummary = filterParts.length > 0 ? filterParts.join(' | ') : 'All Records'

        // Calculate filtered stats
        const filteredTotal = filteredSales.reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0)
        const filteredMpesa = filteredSales.filter(s => s.payment_method === "mpesa" || s.transaction_status === "SUCCESS").reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0)
        const filteredCash = filteredSales.filter(s => s.payment_method === "cash" || s.transaction_status === "CASH").reduce((acc, s) => acc + (s.total_amount || s.amount || 0), 0)
        const filteredLiters = filteredSales.reduce((acc, s) => acc + (s.liters_sold || 0), 0)

        // Create beautiful HTML Excel file
        let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0; opacity: 0.9; }
    .info-row { background: #f8fafc; padding: 10px 20px; border-bottom: 1px solid #e2e8f0; }
    .summary-grid { display: flex; gap: 10px; padding: 15px; background: #f1f5f9; }
    .summary-card { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
    .summary-card.total { background: #dbeafe; border: 2px solid #3b82f6; }
    .summary-card.mpesa { background: #dcfce7; border: 2px solid #22c55e; }
    .summary-card.cash { background: #fef3c7; border: 2px solid #f59e0b; }
    .summary-card.liters { background: #e0f2fe; border: 2px solid #0ea5e9; }
    .summary-card h3 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
    .summary-card p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #1e40af; color: white; padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) { background: #f8fafc; }
    tr:hover { background: #eff6ff; }
    .receipt { color: #1e40af; font-weight: 600; font-family: monospace; }
    .amount { color: #059669; font-weight: bold; text-align: right; }
    .mpesa-badge { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .cash-badge { background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .footer { background: #1e293b; color: white; padding: 15px; text-align: center; margin-top: 20px; }
</style>
</head>
<body>
<div class="header">
    <h1>🏪 ALPHA ENERGY - SALES REPORT</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
</div>
<div class="info-row">
    <strong>📋 Filter:</strong> ${filterSummary}
</div>
<table style="width:100%; border:none; background:#f1f5f9; padding:15px;">
<tr>
    <td style="width:25%; padding:10px;">
        <div style="background:#dbeafe; border:2px solid #3b82f6; border-radius:8px; padding:15px; text-align:center;">
            <div style="font-size:11px; color:#64748b; text-transform:uppercase;">💰 Total Sales</div>
            <div style="font-size:20px; font-weight:bold; color:#1e40af;">KES ${filteredTotal.toLocaleString()}</div>
            <div style="font-size:10px; color:#64748b;">${filteredSales.length} transactions</div>
        </div>
    </td>
    <td style="width:25%; padding:10px;">
        <div style="background:#dcfce7; border:2px solid #22c55e; border-radius:8px; padding:15px; text-align:center;">
            <div style="font-size:11px; color:#64748b; text-transform:uppercase;">📱 M-Pesa</div>
            <div style="font-size:20px; font-weight:bold; color:#166534;">KES ${filteredMpesa.toLocaleString()}</div>
        </div>
    </td>
    <td style="width:25%; padding:10px;">
        <div style="background:#fef3c7; border:2px solid #f59e0b; border-radius:8px; padding:15px; text-align:center;">
            <div style="font-size:11px; color:#64748b; text-transform:uppercase;">💵 Cash</div>
            <div style="font-size:20px; font-weight:bold; color:#92400e;">KES ${filteredCash.toLocaleString()}</div>
        </div>
    </td>
    <td style="width:25%; padding:10px;">
        <div style="background:#e0f2fe; border:2px solid #0ea5e9; border-radius:8px; padding:15px; text-align:center;">
            <div style="font-size:11px; color:#64748b; text-transform:uppercase;">⛽ Total Liters</div>
            <div style="font-size:20px; font-weight:bold; color:#0369a1;">${filteredLiters.toFixed(2)} L</div>
        </div>
    </td>
</tr>
</table>
<table>
<thead>
<tr>
    <th style="width:12%">Receipt No</th>
    <th style="width:12%">Station</th>
    <th style="width:10%">Pump</th>
    <th style="width:8%">Shift</th>
    <th style="width:8%; text-align:right">Liters</th>
    <th style="width:10%; text-align:right">Amount</th>
    <th style="width:10%">Payment</th>
    <th style="width:12%">M-Pesa Receipt</th>
    <th style="width:10%">Attendant</th>
    <th style="width:12%">Date/Time</th>
</tr>
</thead>
<tbody>
`

        filteredSales.forEach((sale, index) => {
            const stationName = stations.find(s => s.station_id === sale.station_id)?.station_name || '—'
            const pumpName = pumps.find(p => p.pump_id === sale.pump_id)?.pump_name || '—'
            const attendantName = users.find(u => u.user_id === sale.attendant_id)?.full_name || '—'
            const pumpShift = pumpShifts.find(ps => ps.pump_shift_id === sale.pump_shift_id)
            const shiftName = pumpShift ? shifts.find(s => s.shift_id === pumpShift.shift_id)?.shift_name || '—' : '—'
            const isMpesa = sale.payment_method === "mpesa" || sale.transaction_status === "SUCCESS"
            const isCash = sale.payment_method === "cash" || sale.transaction_status === "CASH"
            const paymentBadge = isMpesa
                ? '<span class="mpesa-badge">📱 M-PESA</span>'
                : isCash
                    ? '<span class="cash-badge">💵 CASH</span>'
                    : sale.transaction_status || '—'

            html += `<tr>
    <td class="receipt">${sale.sale_id_no || `RCP-${String(sale.sale_id).padStart(5, '0')}`}</td>
    <td>${stationName}</td>
    <td>${pumpName}</td>
    <td>${shiftName}</td>
    <td style="text-align:right">${sale.liters_sold?.toFixed(2) || '0.00'} L</td>
    <td class="amount">KES ${(sale.amount || sale.total_amount || 0).toLocaleString()}</td>
    <td>${paymentBadge}</td>
    <td style="font-family:monospace; font-size:10px; color:#64748b;">${sale.mpesa_receipt_number || '—'}</td>
    <td>${attendantName}</td>
    <td style="font-size:11px; color:#64748b;">${sale.created_at ? new Date(sale.created_at).toLocaleString() : '—'}</td>
</tr>`
        })

        html += `
</tbody>
</table>
<div class="footer">
    <p>© ${new Date().getFullYear()} Alpha Energy | Report Generated by Alpha Energy Web App</p>
</div>
</body>
</html>`

        // Download as .xls (Excel will open HTML files)
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        const dateStr = dateFrom || dateTo || new Date().toISOString().split('T')[0]
        link.setAttribute('href', url)
        link.setAttribute('download', `Alpha_Energy_Sales_Report_${dateStr}.xls`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('📊 Report Exported!', `${filteredSales.length} transactions exported to Excel`)
    }

    const getPaymentColor = (method: string) => {
        switch (method) {
            case "mpesa": return "bg-green-100 text-green-700"
            case "cash": return "bg-amber-100 text-amber-700"
            case "card": return "bg-blue-100 text-blue-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            💰 Sales & Transactions
                        </h1>
                        <p className="text-gray-500">View all sales across stations</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToExcel}>
                            <FileSpreadsheet className="w-4 h-4" /> Export Excel
                        </Button>
                        <Button variant="outline" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="w-4 h-4" /> Record Sale
                        </Button>
                    </div>
                </div>

                {/* Stats - 5 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.total)}</p>
                                    <p className="text-xs text-gray-500">Total Sales</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{stats.count}</p>
                                    <p className="text-xs text-gray-500">Transactions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                                    <Droplets className="w-6 h-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{stats.totalLiters.toFixed(2)} L</p>
                                    <p className="text-xs text-gray-500">Total Liters</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <span className="text-xl">📱</span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.mpesa)}</p>
                                    <p className="text-xs text-gray-500">M-Pesa</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <span className="text-xl">💵</span>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.cash)}</p>
                                    <p className="text-xs text-gray-500">Cash</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Complete Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-blue-600" /> Filters
                            </h3>
                            <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {/* From Date */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">📅 From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            {/* To Date */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">📅 To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                            {/* Station Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">🏢 Station</label>
                                <select
                                    value={selectedStation || ""}
                                    onChange={(e) => { setSelectedStation(e.target.value ? Number(e.target.value) : null); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="">All</option>
                                    {stations.map(s => <option key={s.station_id} value={s.station_id}>{s.station_name}</option>)}
                                </select>
                            </div>
                            {/* Pump Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">⛽ Pump</label>
                                <select
                                    value={selectedPump || ""}
                                    onChange={(e) => { setSelectedPump(e.target.value ? Number(e.target.value) : null); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="">All</option>
                                    {pumps.filter(p => !selectedStation || p.station_id === selectedStation).map(p => <option key={p.pump_id} value={p.pump_id}>{p.pump_name}</option>)}
                                </select>
                            </div>
                            {/* User Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">👤 Attendant</label>
                                <select
                                    value={selectedUser || ""}
                                    onChange={(e) => { setSelectedUser(e.target.value ? Number(e.target.value) : null); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="">All</option>
                                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
                                </select>
                            </div>
                            {/* Shift Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">🕐 Shift</label>
                                <select
                                    value={selectedShift || ""}
                                    onChange={(e) => { setSelectedShift(e.target.value ? Number(e.target.value) : null); setCurrentPage(1) }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="">All</option>
                                    {shifts.map(s => <option key={s.shift_id} value={s.shift_id}>{s.shift_name}</option>)}
                                </select>
                            </div>
                            {/* Search */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">🔍 Search</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                                    placeholder="Receipt, M-Pesa..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                        {/* Filter Actions Row */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 italic">
                                ✅ Filters applied automatically • Showing {filteredSales.length} of {sales.length} records
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" /> Clear Filters
                                </button>
                                <button
                                    onClick={fetchData}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                >
                                    <RefreshCw className="w-4 h-4" /> Apply & Refresh
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Wallet className="w-5 h-5 text-green-600" />
                            📋 Transactions ({filteredSales.length} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : filteredSales.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>{sales.length === 0 ? "No sales found. Record your first sale!" : "No sales match your filter"}</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px]">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Receipt No</th>
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Station</th>
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Pump</th>
                                                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Liters</th>
                                                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Attendant</th>
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Shift</th>
                                                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Date/Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedSales.map((sale) => {
                                                // Lookup names from loaded arrays
                                                const stationName = stations.find(s => s.station_id === sale.station_id)?.station_name || '—'
                                                const pumpName = pumps.find(p => p.pump_id === sale.pump_id)?.pump_name || '—'
                                                const attendantName = users.find(u => u.user_id === sale.attendant_id)?.full_name || '—'
                                                const pumpShift = pumpShifts.find(ps => ps.pump_shift_id === sale.pump_shift_id)
                                                const shiftName = pumpShift ? shifts.find(s => s.shift_id === pumpShift.shift_id)?.shift_name || '—' : '—'
                                                const isMpesa = sale.payment_method === "mpesa" || sale.transaction_status === "SUCCESS"
                                                const isCash = sale.payment_method === "cash" || sale.transaction_status === "CASH"

                                                return (
                                                    <tr key={sale.sale_id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <span className="font-mono text-sm font-medium text-blue-600">{sale.sale_id_no || `RCP-${String(sale.sale_id).padStart(5, '0')}`}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-sm font-medium text-gray-900">{stationName}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-sm text-gray-600">{pumpName}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <span className="text-sm text-gray-600">{sale.liters_sold?.toFixed(2) || '0.00'} L</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <span className="font-bold text-green-600">{formatCurrency(sale.amount || sale.total_amount || 0)}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isMpesa ? "bg-green-100 text-green-700" :
                                                                isCash ? "bg-amber-100 text-amber-700" :
                                                                    "bg-gray-100 text-gray-700"
                                                                }`}>
                                                                {isMpesa ? "📱 M-PESA" : isCash ? "💵 CASH" : sale.transaction_status || "—"}
                                                            </span>
                                                            {sale.mpesa_receipt_number && (
                                                                <p className="text-xs text-gray-400 mt-0.5 font-mono">{sale.mpesa_receipt_number}</p>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="text-sm text-gray-700">{attendantName}</span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">{shiftName}</span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="text-xs text-gray-500">{formatDateTime(sale.created_at)}</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-500">
                                        Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold">{Math.min(currentPage * pageSize, filteredSales.length)}</span> of <span className="font-semibold">{filteredSales.length}</span> transactions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm font-medium text-gray-900 bg-blue-50 border border-blue-200 rounded-lg">
                                            Page {currentPage} of {totalPages || 1}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage >= totalPages}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal */}
            {showAddModal && (
                <AddSaleModal
                    stations={stations}
                    pumps={pumps}
                    fuelTypes={fuelTypes}
                    users={users}
                    shifts={shifts}
                    pumpShifts={pumpShifts}
                    nextSaleNumber={totalSalesCount}
                    onSave={handleAddSale}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </DashboardLayout>
    )
}
