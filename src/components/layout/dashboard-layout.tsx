"use client"

import { useState, useEffect } from "react"
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
    Shield,
    Droplet,
    DollarSign,
    Package,
    Truck,
    Calculator,
    Banknote,
    CreditCard,
    Receipt,
    FileText,
    ChevronLeft,
    ChevronRight,
    Link2Off,
    GaugeCircle,
    HandCoins,
    Gauge,
    ShieldAlert,
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// Navigation Items
const navItems = [
    { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { label: "Stations", icon: Building2, href: "/dashboard/stations" },
    { label: "Station & Pumps", icon: GaugeCircle, href: "/dashboard/station-pumps" },
    { label: "Pumps", icon: Fuel, href: "/dashboard/pumps" },
    { label: "Fuel Types", icon: Droplet, href: "/dashboard/fuel-types" },
    { label: "Prices", icon: DollarSign, href: "/dashboard/prices" },
    { label: "Attendants", icon: Users, href: "/dashboard/attendants" },
    { label: "Shifts", icon: Clock, href: "/dashboard/shifts" },
    { label: "Shift History", icon: Clock, href: "/dashboard/shift-history" },
    { label: "Sales", icon: Wallet, href: "/dashboard/sales" },
    { label: "Credit Customers", icon: Building2, href: "/dashboard/credit-customers" },
    { label: "Credit Sales", icon: HandCoins, href: "/dashboard/credit-sales" },
    { label: "Lubricants", icon: Package, href: "/dashboard/lubricants" },
    { label: "Refills", icon: Truck, href: "/dashboard/refills" },
    { label: "Dip Readings", icon: Gauge, href: "/dashboard/dip-readings" },
    { label: "Stock Tracking", icon: ShieldAlert, href: "/dashboard/stock-tracking" },
    { label: "M-Pesa", icon: Smartphone, href: "/dashboard/mpesa" },
    { label: "C2B Payments", icon: Link2Off, href: "/dashboard/c2b-payments" },
    { label: "M-Pesa Report", icon: TrendingUp, href: "/dashboard/mpesa-report" },
    { label: "M-Pesa Statement", icon: FileText, href: "/dashboard/mpesa-statement" },
    { label: "Payroll", icon: Banknote, href: "/dashboard/payroll" },
    { label: "Advances", icon: CreditCard, href: "/dashboard/advances" },
    { label: "Expenses", icon: Receipt, href: "/dashboard/expenses" },
    { label: "Vouchers", icon: FileText, href: "/dashboard/vouchers" },
    { label: "Accounting", icon: Calculator, href: "/dashboard/accounting" },
    { label: "Reports", icon: TrendingUp, href: "/dashboard/reports" },
    { label: "Users", icon: UserCog, href: "/dashboard/users" },
    { label: "Roles", icon: Shield, href: "/dashboard/roles" },
]

// Sidebar Component — supports desktop collapse + mobile overlay
function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: {
    isOpen: boolean
    onClose: () => void
    collapsed: boolean
    onToggleCollapse: () => void
}) {
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
            <aside
                className={`
                    fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-50
                    flex flex-col
                    transition-all duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:z-auto
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
                    w-64
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-3 border-b border-gray-100 flex-shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <Fuel className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <>
                                <span className="font-bold text-gray-900 whitespace-nowrap">Alpha Energy</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded whitespace-nowrap">v3.5</span>
                            </>
                        )}
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                title={collapsed ? item.label : undefined}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                    ${collapsed ? 'justify-center lg:px-0 lg:justify-center' : ''}
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-gray-100 flex-shrink-0">
                    <Link
                        href="/dashboard/settings"
                        onClick={onClose}
                        title={collapsed ? "Settings" : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 ${collapsed ? 'justify-center lg:px-0' : ''}`}
                    >
                        <Settings className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        {!collapsed && "Settings"}
                    </Link>
                    <button
                        onClick={handleLogout}
                        title={collapsed ? "Logout" : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center lg:px-0' : ''}`}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && "Logout"}
                    </button>
                </div>

                {/* Collapse Toggle — Desktop only */}
                <div className="hidden lg:flex p-2 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={onToggleCollapse}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors ${collapsed ? 'justify-center lg:px-0' : ''}`}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                                <span className="whitespace-nowrap">Collapse</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                {!collapsed && (
                    <div className="p-3 border-t border-gray-100 text-center flex-shrink-0">
                        <p className="text-xs text-gray-400">© 2025 Alpha Energy App</p>
                        <p className="text-xs text-gray-400">By Jimhawkins Korir</p>
                    </div>
                )}
            </aside>
        </>
    )
}

// Header Component — now includes desktop collapse toggle
function Header({ onMenuClick, collapsed, onToggleCollapse }: {
    onMenuClick: () => void
    collapsed: boolean
    onToggleCollapse: () => void
}) {
    const router = useRouter()
    const [user, setUser] = useState<{ fullName?: string; username?: string; roleName?: string; roleId?: number } | null>(null)

    useEffect(() => {
        try {
            const raw = localStorage.getItem("currentUser") || localStorage.getItem("user_session")
            if (raw) {
                const parsed = JSON.parse(raw)
                const roleMap: Record<number, string> = {
                    1: "Admin",
                    2: "Pump Attendant",
                    3: "Manager",
                    4: "Supervisor",
                    5: "Super Admin",
                    6: "Director"
                }
                if (!parsed.roleName && parsed.roleId) {
                    parsed.roleName = roleMap[parsed.roleId] || "User"
                }
                setUser(parsed)
            }
        } catch (e) {
            console.error("Failed to load user info:", e)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("currentUser")
        localStorage.removeItem("user_session")
        toast.success("Logged out", "See you next time!")
        router.push("/login")
    }

    const displayName = user?.fullName || user?.username || "Admin User"
    const displayRole = user?.roleName || (user?.roleId === 5 ? "Super Admin" : "Admin")
    const initial = (user?.username || user?.fullName || "A").charAt(0).toUpperCase()

    return (
        <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
            {/* Left Side */}
            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={onMenuClick} className="p-2 rounded-xl hover:bg-gray-100 lg:hidden">
                    <Menu className="w-5 h-5 text-gray-600" />
                </button>
                {/* Desktop collapse toggle in header */}
                <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronLeft className="w-5 h-5 text-gray-500" />}
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
                        <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500">{displayRole}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        {initial}
                    </div>
                </div>
            </div>
        </header>
    )
}

// Main Layout Component
export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

