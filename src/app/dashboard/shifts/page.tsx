"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Clock, Plus, Play, Pause, CheckCircle, AlertCircle, Sun, Moon, Building2, Calendar, TrendingUp } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface Shift {
    id: number
    station: string
    shiftType: "day" | "night"
    attendant: string
    startTime: string
    endTime: string | null
    openingReading: number
    closingReading: number | null
    sales: number
    transactions: number
    status: "active" | "completed" | "pending"
}

const mockShifts: Shift[] = [
    { id: 1, station: "Westlands Station", shiftType: "day", attendant: "John Kamau", startTime: "2024-12-25T06:00:00", endTime: null, openingReading: 45678, closingReading: null, sales: 125000, transactions: 45, status: "active" },
    { id: 2, station: "CBD Main", shiftType: "day", attendant: "Mary Wanjiku", startTime: "2024-12-25T06:00:00", endTime: null, openingReading: 34567, closingReading: null, sales: 98000, transactions: 38, status: "active" },
    { id: 3, station: "Mombasa Road", shiftType: "night", attendant: "Peter Omondi", startTime: "2024-12-24T18:00:00", endTime: "2024-12-25T06:00:00", openingReading: 23456, closingReading: 24567, sales: 156000, transactions: 62, status: "completed" },
    { id: 4, station: "Thika Road", shiftType: "day", attendant: "Jane Muthoni", startTime: "2024-12-25T06:00:00", endTime: null, openingReading: 12345, closingReading: null, sales: 112000, transactions: 41, status: "active" },
    { id: 5, station: "Kisumu Central", shiftType: "night", attendant: "David Ochieng", startTime: "2024-12-24T18:00:00", endTime: "2024-12-25T06:00:00", openingReading: 56789, closingReading: 58012, sales: 87000, transactions: 34, status: "completed" },
]

const columns: ColumnDef<Shift>[] = [
    {
        accessorKey: "station",
        header: "Station",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">{row.getValue("station")}</span>
            </div>
        ),
    },
    {
        accessorKey: "shiftType",
        header: "Shift",
        cell: ({ row }) => {
            const type = row.getValue("shiftType") as string
            return (
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${type === "day" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                    {type === "day" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {type === "day" ? "Day" : "Night"}
                </span>
            )
        },
    },
    {
        accessorKey: "attendant",
        header: "Attendant",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {(row.getValue("attendant") as string).charAt(0)}
                </div>
                <span>{row.getValue("attendant")}</span>
            </div>
        ),
    },
    {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ row }) => <span className="text-sm text-gray-600">{formatDateTime(row.getValue("startTime"))}</span>,
    },
    {
        accessorKey: "sales",
        header: "Sales",
        cell: ({ row }) => <span className="font-bold text-green-600">{formatCurrency(row.getValue("sales"))}</span>,
    },
    {
        accessorKey: "transactions",
        header: "Transactions",
        cell: ({ row }) => <span className="font-medium">{row.getValue("transactions")}</span>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
                active: { bg: "bg-green-100 text-green-700", icon: <Play className="w-3 h-3" /> },
                completed: { bg: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3 h-3" /> },
                pending: { bg: "bg-amber-100 text-amber-700", icon: <AlertCircle className="w-3 h-3" /> },
            }
            const style = styles[status]
            return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${style.bg}`}>{style.icon} {status.charAt(0).toUpperCase() + status.slice(1)}</span>
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <Button variant="outline" size="sm" onClick={() => row.original.status === "active" ? toast.warning("End Shift?") : toast.info("View Details")}>
                {row.original.status === "active" ? <><Pause className="w-4 h-4" /> End</> : "View"}
            </Button>
        ),
    },
]

export default function ShiftsPage() {
    const stats = {
        active: mockShifts.filter(s => s.status === "active").length,
        completed: mockShifts.filter(s => s.status === "completed").length,
        totalSales: mockShifts.reduce((acc, s) => acc + s.sales, 0),
        totalTransactions: mockShifts.reduce((acc, s) => acc + s.transactions, 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">⏰ Shift Management</h1>
                        <p className="text-gray-500">Manage day and night shifts across all stations</p>
                    </div>
                    <Button onClick={() => toast.info("Start Shift")}>
                        <Plus className="w-4 h-4" /> Start New Shift
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Active Shifts" value={stats.active} icon={<Play className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Completed Today" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Total Sales" value={formatCurrency(stats.totalSales)} change={15} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Transactions" value={stats.totalTransactions} change={12} icon={<Calendar className="w-5 h-5" />} iconBg="bg-orange-100 text-orange-600" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                                    <Sun className="w-7 h-7 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Day Shifts (06:00 - 18:00)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(mockShifts.filter(s => s.shiftType === "day").reduce((a, s) => a + s.sales, 0))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-amber-600">{mockShifts.filter(s => s.shiftType === "day").length}</p>
                                    <p className="text-sm text-gray-500">Shifts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                    <Moon className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Night Shifts (18:00 - 06:00)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(mockShifts.filter(s => s.shiftType === "night").reduce((a, s) => a + s.sales, 0))}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-indigo-600">{mockShifts.filter(s => s.shiftType === "night").length}</p>
                                    <p className="text-sm text-gray-500">Shifts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <DataGrid columns={columns} data={mockShifts} searchPlaceholder="Search shifts..." title="All Shifts" subtitle={`${mockShifts.length} shifts today`} onRefresh={() => toast.success("Refreshed!")} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
