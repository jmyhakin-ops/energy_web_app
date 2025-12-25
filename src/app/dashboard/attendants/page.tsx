"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Users, Plus, Building2, Phone, Mail, Star, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from "@/components/ui/data-grid"
import { StatCard } from "@/components/dashboard/stat-cards"
import { toast } from "@/components/ui/toast"
import { formatCurrency } from "@/lib/utils"

interface Attendant {
    id: number
    name: string
    email: string
    phone: string
    station: string
    role: string
    todaySales: number
    rating: number
    status: "online" | "offline"
}

const mockAttendants: Attendant[] = [
    { id: 1, name: "John Kamau", email: "john@energy.co.ke", phone: "+254 712 345 678", station: "Westlands Station", role: "Senior Attendant", todaySales: 125000, rating: 4.9, status: "online" },
    { id: 2, name: "Mary Wanjiku", email: "mary@energy.co.ke", phone: "+254 723 456 789", station: "CBD Main", role: "Attendant", todaySales: 98000, rating: 4.7, status: "online" },
    { id: 3, name: "Peter Omondi", email: "peter@energy.co.ke", phone: "+254 734 567 890", station: "Mombasa Road", role: "Supervisor", todaySales: 156000, rating: 4.8, status: "online" },
    { id: 4, name: "Jane Muthoni", email: "jane@energy.co.ke", phone: "+254 745 678 901", station: "Thika Road", role: "Attendant", todaySales: 87000, rating: 4.5, status: "offline" },
    { id: 5, name: "David Ochieng", email: "david@energy.co.ke", phone: "+254 756 789 012", station: "Kisumu Central", role: "Senior Attendant", todaySales: 112000, rating: 4.6, status: "online" },
    { id: 6, name: "Grace Akinyi", email: "grace@energy.co.ke", phone: "+254 767 890 123", station: "Nakuru Highway", role: "Attendant", todaySales: 0, rating: 4.4, status: "offline" },
]

const columns: ColumnDef<Attendant>[] = [
    {
        accessorKey: "name",
        header: "Attendant",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {(row.getValue("name") as string).charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-gray-900">{row.getValue("name")}</p>
                    <p className="text-xs text-gray-500">{row.original.email}</p>
                </div>
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
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string
            const colors: Record<string, string> = {
                "Supervisor": "bg-purple-100 text-purple-700",
                "Senior Attendant": "bg-blue-100 text-blue-700",
                "Attendant": "bg-gray-100 text-gray-700",
            }
            return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[role] || "bg-gray-100"}`}>{role}</span>
        },
    },
    {
        accessorKey: "todaySales",
        header: "Today's Sales",
        cell: ({ row }) => <span className="font-bold text-green-600">{formatCurrency(row.getValue("todaySales"))}</span>,
    },
    {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => (
            <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{row.getValue("rating")}</span>
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${status === "online" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {status === "online" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            )
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toast.info("View", row.original.name)}><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toast.info("Edit", row.original.name)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toast.warning("Delete?", row.original.name)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
        ),
    },
]

export default function AttendantsPage() {
    const stats = {
        total: mockAttendants.length,
        online: mockAttendants.filter(a => a.status === "online").length,
        totalSales: mockAttendants.reduce((acc, a) => acc + a.todaySales, 0),
        avgRating: (mockAttendants.reduce((acc, a) => acc + a.rating, 0) / mockAttendants.length).toFixed(1),
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">👥 Attendant Management</h1>
                        <p className="text-gray-500">Manage all pump attendants and staff</p>
                    </div>
                    <Button onClick={() => toast.info("Add Attendant")}>
                        <Plus className="w-4 h-4" /> Add Attendant
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Staff" value={stats.total} icon={<Users className="w-5 h-5" />} iconBg="bg-purple-100 text-purple-600" />
                    <StatCard title="Online Now" value={stats.online} change={5} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-green-100 text-green-600" />
                    <StatCard title="Total Sales" value={formatCurrency(stats.totalSales)} change={18} icon={<span className="text-lg">💰</span>} iconBg="bg-blue-100 text-blue-600" />
                    <StatCard title="Avg. Rating" value={stats.avgRating} icon={<Star className="w-5 h-5" />} iconBg="bg-amber-100 text-amber-600" />
                </div>

                <Card>
                    <CardContent className="p-6">
                        <DataGrid columns={columns} data={mockAttendants} searchPlaceholder="Search attendants..." title="All Attendants" subtitle={`${mockAttendants.length} staff members`} onRefresh={() => toast.success("Refreshed!")} />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
