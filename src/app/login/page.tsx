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
    Shield,
    KeyRound,
    ArrowLeft,
    CheckCircle,
    Send,
    RefreshCw,
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// OTP Configuration
const OTP_LENGTH = 6

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"credentials" | "otp">("credentials")
    const [otp, setOtp] = useState("")
    const [userPhone, setUserPhone] = useState("")
    const [resendTimer, setResendTimer] = useState(0)
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    })

    // Start resend timer
    const startResendTimer = () => {
        setResendTimer(60)
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    // Send OTP via API
    const sendOtp = async (phone: string) => {
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', phone })
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error('Send OTP Error:', error)
            return { success: false, error: 'Failed to connect to SMS service' }
        }
    }

    // Verify OTP via API
    const verifyOtp = async (phone: string, otpCode: string) => {
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', phone, otp: otpCode })
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error('Verify OTP Error:', error)
            return { success: false, error: 'Failed to verify OTP' }
        }
    }

    // Handle credentials submission
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate credentials (replace with real auth)
            await new Promise((resolve) => setTimeout(resolve, 500))

            // ADMIN BYPASS: Allow direct login for initial setup
            // This allows first-time access to register phone numbers
            const isAdminBypass = (
                (formData.username.toLowerCase() === "admin" ||
                    formData.username.toLowerCase() === "superadmin" ||
                    formData.username === "jimhawkins") &&
                (formData.password === "admin123" ||
                    formData.password === "Admin@123" ||
                    formData.password === "1234")
            )

            if (isAdminBypass) {
                toast.success("🔓 Admin Bypass Active", "Logging in without OTP for initial setup...")
                await new Promise((resolve) => setTimeout(resolve, 1000))
                router.push("/dashboard")
                return
            }

            // Get user's phone from database - replace this with real API call
            // For now using a default phone - you should get this from your users_new table
            const userPhoneNumber = "+254720316175" // Replace with actual user phone lookup
            setUserPhone(userPhoneNumber)

            // Send OTP
            toast.success("📱 Sending OTP...", `To ${userPhoneNumber.slice(0, 7)}****`)

            const result = await sendOtp(userPhoneNumber)

            if (result.success) {
                toast.success("✅ OTP Sent!", result.message || "Check your phone")
                setStep("otp")
                startResendTimer()
            } else {
                toast.error("❌ Failed to send OTP", result.error || "Please try again")
            }

        } catch (error) {
            toast.error("Login Failed", "Invalid username or password")
        } finally {
            setLoading(false)
        }
    }

    // Handle OTP verification
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await verifyOtp(userPhone, otp)

            if (result.success) {
                toast.success("✅ Login Successful!", "Welcome to Alpha Energy")
                router.push("/dashboard")
            } else {
                toast.error("❌ " + (result.error || "Invalid OTP"), "Please try again")
                setOtp("")
            }
        } catch (error) {
            toast.error("Verification Failed", "Please try again")
        } finally {
            setLoading(false)
        }
    }

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0) return

        setLoading(true)
        const result = await sendOtp(userPhone)

        if (result.success) {
            toast.success("✅ New OTP Sent!", result.message)
            startResendTimer()
        } else {
            toast.error("Failed to resend", result.error)
        }
        setLoading(false)
    }

    // Handle OTP input
    const handleOtpChange = (value: string) => {
        const numericValue = value.replace(/\D/g, "")
        if (numericValue.length <= OTP_LENGTH) {
            setOtp(numericValue)
        }
    }

    return (
        <div className="min-h-screen flex login-no-scroll no-scrollbar">
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

                    {/* Step 1: Credentials */}
                    {step === "credentials" && (
                        <>
                            <div className="mb-10">
                                <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                                    Welcome back! 👋
                                </h2>
                                <p className="text-lg text-gray-500">
                                    Sign in to continue managing your stations
                                </p>
                            </div>

                            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        📧 Email or Username
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
                                        🔒 Password
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
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Continue with OTP
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Security Info */}
                            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-center gap-2 text-green-700">
                                    <Shield className="w-5 h-5" />
                                    <span className="font-semibold">🔐 Secured with 2FA</span>
                                </div>
                                <p className="text-sm text-green-600 mt-1">
                                    OTP will be sent to your registered phone via Africa's Talking
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === "otp" && (
                        <>
                            <button
                                onClick={() => { setStep("credentials"); setOtp("") }}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to login
                            </button>

                            <div className="mb-8">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                                    🔐 Verify OTP
                                </h2>
                                <p className="text-gray-500">
                                    Enter the 6-digit code sent to:
                                </p>
                                <p className="font-bold text-gray-900 text-lg">
                                    📱 {userPhone.slice(0, 7)}****{userPhone.slice(-2)}
                                </p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                {/* OTP Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Enter Verification Code
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center">
                                            <KeyRound className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={otp}
                                            onChange={(e) => handleOtpChange(e.target.value)}
                                            placeholder="000000"
                                            maxLength={OTP_LENGTH}
                                            className="w-full pl-14 pr-5 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-300 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-center text-3xl font-bold tracking-[0.5em]"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        Code expires in 5 minutes
                                    </p>
                                </div>

                                {/* Verify Button */}
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== OTP_LENGTH}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Verify & Login
                                        </>
                                    )}
                                </button>

                                {/* Resend OTP */}
                                <div className="text-center py-4">
                                    <p className="text-gray-500 mb-2">Didn't receive the code?</p>
                                    {resendTimer > 0 ? (
                                        <p className="text-gray-400">
                                            Resend in <span className="font-bold text-gray-700">{resendTimer}s</span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={loading}
                                            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </form>
                        </>
                    )}

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
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center p-16 text-white w-full">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center mb-10 shadow-2xl">
                        {step === "credentials" ? (
                            <Fuel className="w-12 h-12" />
                        ) : (
                            <Shield className="w-12 h-12" />
                        )}
                    </div>

                    <h2 className="text-4xl font-extrabold text-center mb-6">
                        {step === "credentials" ? (
                            <>
                                Alpha Energy App
                                <br />
                                <span className="text-cyan-300">Fuel Station Management</span>
                            </>
                        ) : (
                            <>
                                Two-Factor
                                <br />
                                <span className="text-cyan-300">Authentication</span>
                            </>
                        )}
                    </h2>

                    <p className="text-xl text-blue-100 text-center max-w-md mb-12">
                        {step === "credentials"
                            ? "Secure login with SMS verification via Africa's Talking."
                            : "Enter the code sent to your phone to complete login."
                        }
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {[
                            { icon: Building2, label: "Multi-Station" },
                            { icon: BarChart3, label: "Analytics" },
                            { icon: Smartphone, label: "M-Pesa" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full">
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="text-center text-blue-200 text-sm">
                        <p>Developed by <span className="font-bold text-white">Jimhawkins Korir</span></p>
                        <p className="mt-1">📞 +254720316175</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
