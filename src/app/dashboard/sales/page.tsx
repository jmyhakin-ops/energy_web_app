"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Wallet, Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface Sale {
    id: number
    receiptNo: string
    station: string
    attendant: string
    fuelType: string
    liters: number
    amount: number
    paymentMethod: "mpesa" | "cash" | "card"
    mpesaReceipt?: string
    status: "completed" | "pending" | "failed"
    createdAt: string
}

const mockSales: Sale[] = [
    { id: 1, receiptNo: "RCP-00001", station: "Westlands Station", attendant: "John Kamau", fuelType: "Super Petrol", liters: 45.5, amount: 7280, paymentMethod: "mpesa", mpesaReceipt: "RGK7H84KLM", status: "completed", createdAt: "2024-12-25T09:45:00" },
    { id: 2, receiptNo: "RCP-00002", station: "CBD Main", attendant: "Mary Wanjiku", fuelType: "Diesel", liters: 80.0, amount: 12000, paymentMethod: "cash", status: "completed", createdAt: "2024-12-25T09:30:00" },
    { id: 3, receiptNo: "RCP-00003", station: "Mombasa Road", attendant: "Peter Omondi", fuelType: "Premium Petrol", liters: 30.0, amount: 5100, paymentMethod: "mpesa", mpesaReceipt: "RGK7H85MNO", status: "completed", createdAt: "2024-12-25T09:15:00" },
    { id: 4, receiptNo: "RCP-00004", station: "Thika Road", attendant: "Jane Muthoni", fuelType: "Super Petrol", liters: 25.0, amount: 4000, paymentMethod: "mpesa", status: "pending", createdAt: "2024-12-25T09:00:00" },
    { id: 5, receiptNo: "RCP-00005", station: "Kisumu Central", attendant: "David Ochieng", fuelType: "Diesel", liters: 100.0, amount: 15000, paymentMethod: "card", status: "completed", createdAt: "2024-12-25T08:45:00" },
]

const columns: ColumnDef<Sale>[] = [
    {
        accessorKey: "receiptNo",
        header: "Receipt",
        cell: ({ row }) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.getValue("receiptNo")}</span>,
    },
    {
        accessorKey: "createdAt",
        header: "Time",
        cell: ({ row }) => <span className="text-sm text-gray-600">{formatDateTime(row.getValue("createdAt"))}</span>,
    },
    {
        accessorKey: "station",
        header: "Station",
        cell: ({ row }) => <span className="text-sm hidden md:inline">{row.getValue("station")}</span>,
    },
    {
        accessorKey: "fuelType",
        header: "Fuel",
        cell: ({ row }) => {
            const fuel = row.getValue("fuelType") as string
            const colors: Record<string, string> = { "Super Petrol": "bg-green-100 text-green-700", "Diesel": "bg-amber-100 text-amber-700", "Premium Petrol": "bg-blue-100 text-blue-700" }
            return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[fuel] || "bg-gray-100"}`}>⛽ {fuel}</span>
        },
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => <span className="font-bold text-green-600">{formatCurrency(row.getValue("amount"))}</span>,
    },
    {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: ({ row }) => {
            const method = row.getValue("paymentMethod") as string
            const styles: Record<string, { bg: string; icon: string }> = { mpesa: { bg: "bg-green-100 text-green-700", icon: "📱" }, cash: { bg: "bg-amber-100 text-amber-700", icon: "💵" }, card: { bg: "bg-blue-100 text-blue-700", icon: "💳" } }
            const style = styles[method] || styles.cash
            return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${style.bg}`}>{style.icon} {method.toUpperCase()}</span>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
                completed: { bg: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
                pending: { bg: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
                failed: { bg: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
            }
            const style = styles[status]
            return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${style.bg}`}>{style.icon} {status}</span>
        },
    },
]

export default function SalesPage() {
    const stats = {
        total: mockSales.reduce((acc, s) => acc + s.amount, 0),
        count: mockSales.length,
        mpesa: mockSales.filter(s => s.paymentMethod === "mpesa").reduce((acc, s) => acc + s.amount, 0),
        cash: mockSales.filter(s => s.paymentMethod === "cash").reduce((acc, s) => acc + s.amount, 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-4 sm:space-y-6">
                {/* Header - Mobile Responsive */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">💰 Sales & Transactions</h1>
                        <p className="text-sm text-gray-500">View all sales across stations</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Exported!")}>
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>

                {/* Stats Grid - Mobile 2 cols */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard title="Total Sales" value={formatCurrency(stats.total)} change={18} icon={<Wallet className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Transactions" value={stats.count} change={12} icon={<Clock className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="M-Pesa" value={formatCurrency(stats.mpesa)} icon={<span className="text-lg">📱</span>} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Cash" value={formatCurrency(stats.cash)} icon={<span className="text-lg">💵</span>} iconBg="bg-amber-100 text-amber-600" />
                </div>

                {/* Data Grid */}
                <Card>
                    <CardContent className="p-3 sm:p-6">
                        <DataGrid
                            columns={columns}
                            data={mockSales}
                            searchPlaceholder="Search sales..."
                            title="Recent Transactions"
                            subtitle={`${mockSales.length} transactions`}
                            onRefresh={() => toast.success("Refreshed!")}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
