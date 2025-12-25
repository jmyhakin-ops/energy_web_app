"use client"

import { ArrowUpRight, ArrowDownRight, Sun, Moon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// ==================== STAT CARD ====================
interface StatCardProps {
    title: string
    value: string | number
    change?: number
    icon: React.ReactNode
    iconBg?: string
}

export function StatCard({ title, value, change, icon, iconBg = "bg-blue-100 text-blue-600" }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{title}</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{value}</p>
        </div>
    )
}

// ==================== REVENUE CARD ====================
interface RevenueCardProps {
    totalSales: number
    mpesaSales: number
    cashSales: number
    transactionCount: number
}

export function RevenueCard({ totalSales, mpesaSales, cashSales, transactionCount }: RevenueCardProps) {
    return (
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 text-blue-200 text-xs sm:text-sm mb-1">
                <span>💰</span>
                Today's Revenue
            </div>
            <p className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{formatCurrency(totalSales)}</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-blue-200">M-Pesa</p>
                    <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(mpesaSales)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-blue-200">Cash</p>
                    <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(cashSales)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-blue-200">Transactions</p>
                    <p className="text-sm sm:text-lg font-bold">{transactionCount}</p>
                </div>
            </div>
        </div>
    )
}

// ==================== LIVE STATUS ====================
interface LiveStatusProps {
    isOnline: boolean
    label?: string
}

export function LiveStatus({ isOnline, label }: LiveStatusProps) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {label || (isOnline ? 'Online' : 'Offline')}
        </div>
    )
}

// ==================== SHIFT INDICATOR ====================
interface ShiftIndicatorProps {
    shiftName: string
    startTime: string
    endTime: string
    sales: number
}

export function ShiftIndicator({ shiftName, startTime, endTime, sales }: ShiftIndicatorProps) {
    const isDay = shiftName.toLowerCase().includes('day')
    return (
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${isDay ? 'bg-amber-100' : 'bg-indigo-100'} flex items-center justify-center flex-shrink-0`}>
                {isDay ? <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">{shiftName}</p>
                <p className="text-xs text-gray-500">{startTime} - {endTime}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base">{formatCurrency(sales)}</p>
            </div>
        </div>
    )
}

// ==================== QUICK ACTION ====================
interface QuickActionProps {
    icon: React.ReactNode
    label: string
    description: string
    iconBg?: string
    onClick?: () => void
}

export function QuickAction({ icon, label, description, iconBg = "bg-blue-100 text-blue-600", onClick }: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-left"
        >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${iconBg} flex items-center justify-center mb-3 sm:mb-4`}>
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">{label}</h3>
            <p className="text-xs text-gray-500 hidden sm:block">{description}</p>
        </button>
    )
}
