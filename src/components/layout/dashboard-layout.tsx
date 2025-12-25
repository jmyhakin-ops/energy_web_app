"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Fuel,
    Building2,
    Users,
    Clock,
    BarChart3,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Smartphone,
    Bell,
    Search,
    TrendingUp,
    UserCog,
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// Navigation Items
const navItems = [
    { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { label: "Stations", icon: Building2, href: "/dashboard/stations" },
    { label: "Pumps", icon: Fuel, href: "/dashboard/pumps" },
    { label: "Attendants", icon: Users, href: "/dashboard/attendants" },
    { label: "Shifts", icon: Clock, href: "/dashboard/shifts" },
    { label: "Sales", icon: Wallet, href: "/dashboard/sales" },
    { label: "M-Pesa", icon: Smartphone, href: "/dashboard/mpesa" },
    { label: "Reports", icon: TrendingUp, href: "/dashboard/reports" },
    { label: "Users", icon: UserCog, href: "/dashboard/users" },
]

// Sidebar Component
function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = () => {
        toast.success("Logged out", "See you next time!")
        router.push("/login")
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50
        flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Fuel className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">Alpha Energy</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">v3.5</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <Link
                        href="/dashboard/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <Settings className="w-5 h-5 text-gray-400" />
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 text-center flex-shrink-0">
                    <p className="text-xs text-gray-400">© 2025 Alpha Energy App</p>
                    <p className="text-xs text-gray-400">By Jimhawkins Korir</p>
                </div>
            </aside>
        </>
    )
}

// Header Component
function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const router = useRouter()

    const handleLogout = () => {
        toast.success("Logged out", "See you next time!")
        router.push("/login")
    }

    return (
        <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
            {/* Left Side */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={onMenuClick} className="p-2 rounded-xl hover:bg-gray-100 lg:hidden">
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl w-56">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm placeholder-gray-400 w-full" />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button className="sm:hidden p-2 rounded-xl hover:bg-gray-100">
                    <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="relative p-2 rounded-xl hover:bg-gray-100">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">A</div>
                </div>
            </div>
        </header>
    )
}

// Main Layout Component
export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
