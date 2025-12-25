"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Fuel, Plus, Building2, Droplet, Settings, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"

interface Pump {
    id: number
    pumpNumber: string
    station: string
    fuelType: string
    pricePerLiter: number
    todaySales: number
    litersDispensed: number
    status: "active" | "inactive" | "maintenance"
}

const mockPumps: Pump[] = [
    { id: 1, pumpNumber: "P-001", station: "Westlands Station", fuelType: "Super Petrol", pricePerLiter: 160, todaySales: 85000, litersDispensed: 531, status: "active" },
    { id: 2, pumpNumber: "P-002", station: "Westlands Station", fuelType: "Diesel", pricePerLiter: 150, todaySales: 72000, litersDispensed: 480, status: "active" },
    { id: 3, pumpNumber: "P-003", station: "CBD Main", fuelType: "Super Petrol", pricePerLiter: 160, todaySales: 95000, litersDispensed: 594, status: "active" },
    { id: 4, pumpNumber: "P-004", station: "CBD Main", fuelType: "Premium Petrol", pricePerLiter: 170, todaySales: 45000, litersDispensed: 265, status: "maintenance" },
    { id: 5, pumpNumber: "P-005", station: "Mombasa Road", fuelType: "Diesel", pricePerLiter: 150, todaySales: 120000, litersDispensed: 800, status: "active" },
    { id: 6, pumpNumber: "P-006", station: "Thika Road", fuelType: "Super Petrol", pricePerLiter: 160, todaySales: 0, litersDispensed: 0, status: "inactive" },
]

const columns: ColumnDef<Pump>[] = [
    {
        accessorKey: "pumpNumber",
        header: "Pump",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-mono font-bold">{row.getValue("pumpNumber")}</span>
            </div>
        ),
    },
    {
        accessorKey: "station",
        header: "Station",
        cell: ({ row }) => (
            <span className="flex items-center gap-1 text-sm">
                <Building2 className="w-4 h-4 text-blue-600" /> {row.getValue("station")}
            </span>
        ),
    },
    {
        accessorKey: "fuelType",
        header: "Fuel Type",
        cell: ({ row }) => {
            const fuel = row.getValue("fuelType") as string
            const colors: Record<string, string> = {
                "Super Petrol": "bg-green-100 text-green-700",
                "Diesel": "bg-amber-100 text-amber-700",
                "Premium Petrol": "bg-blue-100 text-blue-700",
            }
            return (
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[fuel] || "bg-gray-100"}`}>
                    ⛽ {fuel}
                </span>
            )
        },
    },
    {
        accessorKey: "pricePerLiter",
        header: "Price/L",
        cell: ({ row }) => <span className="font-medium">KES {row.getValue("pricePerLiter")}</span>,
    },
    {
        accessorKey: "litersDispensed",
        header: "Liters Today",
        cell: ({ row }) => (
            <span className="flex items-center gap-1">
                <Droplet className="w-4 h-4 text-cyan-600" />
                {(row.getValue("litersDispensed") as number).toLocaleString()} L
            </span>
        ),
    },
    {
        accessorKey: "todaySales",
        header: "Sales Today",
        cell: ({ row }) => <span className="font-bold text-green-600">{formatCurrency(row.getValue("todaySales"))}</span>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
                active: { bg: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
                inactive: { bg: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
                maintenance: { bg: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-3 h-3" /> },
            }
            const style = styles[status]
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${style.bg}`}>
                    {style.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            )
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toast.info("View", row.original.pumpNumber)}>
                    <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast.info("Configure", row.original.pumpNumber)}>
                    <Settings className="w-4 h-4" />
                </Button>
            </div>
        ),
    },
]

export default function PumpsPage() {
    const stats = {
        total: mockPumps.length,
        active: mockPumps.filter(p => p.status === "active").length,
        totalSales: mockPumps.reduce((acc, p) => acc + p.todaySales, 0),
        totalLiters: mockPumps.reduce((acc, p) => acc + p.litersDispensed, 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">⛽ Pump Management</h1>
                        <p className="text-gray-500">Monitor and configure all fuel pumps</p>
                    </div>
                    <Button onClick={() => toast.info("Add Pump")}>
                        <Plus className="w-4 h-4" /> Add Pump
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Pumps" value={stats.total} icon={<Fuel className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Active" value={stats.active} change={8} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Sales Today" value={formatCurrency(stats.totalSales)} change={15} icon={<span className="text-lg">💰</span>} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Liters Dispensed" value={`${stats.totalLiters.toLocaleString()} L`} icon={<Droplet className="w-5 h-5" />} iconBg="bg-cyan-100 text-cyan-600" />
                </div>

                <Card>
                    <CardContent className="p-6">
                        <DataGrid columns={columns} data={mockPumps} searchPlaceholder="Search pumps..." title="All Pumps" subtitle={`${mockPumps.length} pumps`} onRefresh={() => toast.success("Refreshed!")} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
