"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
    Building2,
    Plus,
    MapPin,
    Phone,
    Users,
    Fuel,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { StatCard, LiveStatus } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"

interface Station {
    id: number
    name: string
    location: string
    phone: string
    pumps: number
    attendants: number
    todaySales: number
    status: "online" | "offline" | "maintenance"
}

const mockStations: Station[] = [
    { id: 1, name: "Westlands Station", location: "Westlands, Nairobi", phone: "+254 712 345 678", pumps: 8, attendants: 12, todaySales: 425000, status: "online" },
    { id: 2, name: "CBD Main", location: "Tom Mboya Street, Nairobi", phone: "+254 723 456 789", pumps: 6, attendants: 10, todaySales: 387500, status: "online" },
    { id: 3, name: "Mombasa Road", location: "Industrial Area, Nairobi", phone: "+254 734 567 890", pumps: 10, attendants: 15, todaySales: 312000, status: "online" },
    { id: 4, name: "Thika Road", location: "Kasarani, Nairobi", phone: "+254 745 678 901", pumps: 6, attendants: 8, todaySales: 298750, status: "offline" },
    { id: 5, name: "Kisumu Central", location: "Kisumu CBD", phone: "+254 756 789 012", pumps: 4, attendants: 6, todaySales: 276400, status: "online" },
    { id: 6, name: "Nakuru Highway", location: "Nakuru Town", phone: "+254 767 890 123", pumps: 5, attendants: 7, todaySales: 245000, status: "maintenance" },
]

const columns: ColumnDef<Station>[] = [
    {
        accessorKey: "name",
        header: "Station",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900">{row.getValue("name")}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {row.original.location}
                    </p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "phone",
        header: "Contact",
        cell: ({ row }) => (
            <span className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {row.getValue("phone")}
            </span>
        ),
    },
    {
        accessorKey: "pumps",
        header: "Pumps",
        cell: ({ row }) => (
            <span className="flex items-center gap-1 text-sm">
                <Fuel className="w-4 h-4 text-green-600" /> {row.getValue("pumps")}
            </span>
        ),
    },
    {
        accessorKey: "attendants",
        header: "Staff",
        cell: ({ row }) => (
            <span className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4 text-purple-600" /> {row.getValue("attendants")}
            </span>
        ),
    },
    {
        accessorKey: "todaySales",
        header: "Today's Sales",
        cell: ({ row }) => (
            <span className="font-bold text-green-600">{formatCurrency(row.getValue("todaySales"))}</span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
                online: { bg: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
                offline: { bg: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
                maintenance: { bg: "bg-amber-100 text-amber-700", icon: <span>🔧</span> },
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
                <Button variant="ghost" size="icon" onClick={() => toast.info("View", row.original.name)}>
                    <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast.info("Edit", row.original.name)}>
                    <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast.warning("Delete?", row.original.name)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
            </div>
        ),
    },
]

export default function StationsPage() {
    const stats = {
        total: mockStations.length,
        online: mockStations.filter(s => s.status === "online").length,
        totalSales: mockStations.reduce((acc, s) => acc + s.todaySales, 0),
        totalPumps: mockStations.reduce((acc, s) => acc + s.pumps, 0),
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">🏢 Station Management</h1>
                        <p className="text-gray-500">Manage all your fuel stations</p>
                    </div>
                    <Button onClick={() => toast.info("Add Station")}>
                        <Plus className="w-4 h-4" /> Add Station
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Stations" value={stats.total} icon={<Building2 className="w-5 h-5" />} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Online" value={stats.online} change={5} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Total Sales" value={formatCurrency(stats.totalSales)} change={12} icon={<span className="text-lg">💰</span>} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Total Pumps" value={stats.totalPumps} icon={<Fuel className="w-5 h-5" />} iconBg="bg-orange-100 text-orange-600" />
                </div>

                <Card>
                    <CardContent className="p-6">
                        <DataGrid columns={columns} data={mockStations} searchPlaceholder="Search stations..." title="All Stations" subtitle={`${mockStations.length} stations`} onRefresh={() => toast.success("Refreshed!")} onExport={() => toast.success("Exported!")} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
