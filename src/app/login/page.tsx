"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Fuel,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Building2,
    BarChart3,
    Smartphone,
} from "lucide-react"
import { toast } from "@/components/ui/toast"

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        toast.success("Welcome back!", "Login successful")
        setLoading(false)
        router.push("/dashboard")
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12 bg-white">
                <div className="w-full max-w-md mx-auto">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-3 mb-12">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/30">
                            <Fuel className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-2xl text-gray-900">Alpha Energy</h1>
                            <p className="text-sm text-gray-500">Fuel Station Management</p>
                        </div>
                    </Link>

                    {/* Welcome Text */}
                    <div className="mb-10">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                            Welcome back! 👋
                        </h2>
                        <p className="text-lg text-gray-500">
                            Sign in to continue managing your stations
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Email or Username
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Enter your email or username"
                                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter your password"
                                    className="w-full pl-14 pr-14 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 bottom-0 w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.remember}
                                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-600 font-medium">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Contact Info */}
                    <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 text-center">
                        <p className="text-sm font-medium text-gray-600">
                            Need help? Contact support
                        </p>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                            📞 +254720316175
                        </p>
                    </div>

                    {/* Copyright */}
                    <p className="mt-8 text-center text-sm text-gray-500">
                        © 2025 Alpha Energy App. All rights reserved.
                        <br />
                        <span className="text-xs text-gray-400">Version 3.5 | Developed by Jimhawkins Korir</span>
                    </p>
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center p-16 text-white w-full">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mb-10 shadow-2xl">
                        <Fuel className="w-12 h-12" />
                    </div>

                    <h2 className="text-4xl font-extrabold text-center mb-6">
                        Alpha Energy App
                        <br />
                        <span className="text-cyan-300">Fuel Station Management</span>
                    </h2>

                    <p className="text-xl text-blue-100 text-center max-w-md mb-12">
                        The most powerful platform for multi-station management with M-Pesa integration.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {[
                            { icon: Building2, label: "Multi-Station" },
                            { icon: BarChart3, label: "Real-time Analytics" },
                            { icon: Smartphone, label: "M-Pesa Ready" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full">
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Developer Info */}
                    <div className="text-center text-blue-200 text-sm">
                        <p>Developed by <span className="font-bold text-white">Jimhawkins Korir</span></p>
                        <p className="mt-1">📞 +254720316175</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
