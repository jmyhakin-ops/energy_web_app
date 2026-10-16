"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Fuel,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Shield,
    KeyRound,
    ArrowLeft,
    CheckCircle,
    Send,
    RefreshCw,
    User,
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

    // Superadmin hidden toggle
    const [clickCount, setClickCount] = useState(0)
    const [showSuperAdminModal, setShowSuperAdminModal] = useState(false)
    const [superAdminCreds, setSuperAdminCreds] = useState({ username: "", password: "" })

    const handleSecretClick = () => {
        setClickCount(prev => {
            if (prev + 1 >= 5) {
                setShowSuperAdminModal(true)
                return 0
            }
            return prev + 1
        })
    }

    const handleSuperAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (superAdminCreds.username === "superadmin" && superAdminCreds.password === "admin123") {
            const currentStatus = localStorage.getItem('otp_enabled') === 'true'
            localStorage.setItem('otp_enabled', (!currentStatus).toString())
            toast.success(`OTP Requirement is now ${!currentStatus ? 'ON' : 'OFF'}`)
            setShowSuperAdminModal(false)
            setSuperAdminCreds({ username: "", password: "" })
        } else {
            toast.error("Invalid superadmin credentials")
        }
    }

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

    // Handle credentials submission — DB check via /api/login
    // OTP disabled until Africa's Talking is configured — code kept below for future use
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Verify username + password against users_new table (bcrypt)
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username.trim(),
                    password: formData.password,
                })
            })
            const data = await response.json()

            if (!data.success) {
                toast.error("Login Failed", data.error || "Invalid username or password")
                return
            }

            // OTP DISABLED — re-enable when Africa's Talking is configured
            // -------------------------------------------------------------------
            // const userPhoneNumber = data.user.mobile || "+254720316175"
            // setUserPhone(userPhoneNumber)
            // const result = await sendOtp(userPhoneNumber)
            // if (result.success) { setStep("otp"); startResendTimer() }
            // -------------------------------------------------------------------

            // Store session and go to dashboard directly (no OTP for now)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem('user_id', String(data.user.id))
            localStorage.setItem('role_id', String(data.user.roleId))
            localStorage.setItem('full_name', data.user.fullName)
            toast.success("Login Successful!", `Welcome, ${data.user.fullName}`)
            router.push("/dashboard")

        } catch (error) {
            toast.error("Login Failed", "Could not connect to server. Please try again.")
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
                toast.success("Γ£à Login Successful!", "Welcome to Alpha Energy")
                router.push("/dashboard")
            } else {
                toast.error("Γ¥î " + (result.error || "Invalid OTP"), "Please try again")
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
            toast.success("Γ£à New OTP Sent!", result.message)
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
        <div className="min-h-screen flex">
            {/* ===== LEFT PANEL ΓÇö Luxury background image ===== */}
            <div
                className="hidden lg:flex flex-1 relative overflow-hidden"
                style={{
                    backgroundImage: `url('/petrol-station-bg.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                {/* Bottom info */}
                <div className="absolute bottom-8 left-8 right-8 z-10">
                    <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <Fuel className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">Alpha Energy</p>
                                <p className="text-white/60 text-xs">Fuel Station Management System</p>
                            </div>
                        </div>
                        <p className="text-white/50 text-xs">
                            ┬⌐ 2026 Alpha Energy App ┬╖ Developed by Jimhawkins Korir
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== RIGHT PANEL ΓÇö Clean glassmorphic form ===== */}
            <div className="flex-1 relative flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
                {/* Subtle decorative blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-blue-200/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-200/20 to-emerald-200/15 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-2">
                    <div className="w-full max-w-[420px] mx-auto">

                        <AnimatePresence mode="wait">
                            {/* ===== STEP 1: Credentials ===== */}
                            {step === "credentials" && (
                                <motion.div
                                    key="credentials"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                                    exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                                >
                                    {/* Logo + Brand */}
                                    <div className="text-center mb-4">
                                        <div
                                            className="inline-flex items-center gap-2 mb-3 cursor-pointer"
                                            onClick={handleSecretClick}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                                <Fuel className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-bold text-gray-800 text-lg">Alpha Energy</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                            Welcome Back ≡ƒæï
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Sign in to your dashboard
                                        </p>
                                    </div>

                                    {/* Form Card */}
                                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/[0.04] border border-white/60">
                                        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                            {/* Username/Email */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                                    Username or Email
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                                        <User className="w-[18px] h-[18px] text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                        placeholder="Enter your username"
                                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Password */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                                        <Lock className="w-[18px] h-[18px] text-gray-400" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="Enter your password"
                                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-violet-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remember + Forgot */}
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.remember}
                                                        onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                                                    />
                                                    <span className="text-sm text-gray-500">Remember me</span>
                                                </label>
                                                <a href="#" className="text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                                                    Forgot password?
                                                </a>
                                            </div>

                                            {/* Submit Button */}
                                            <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-blue-500 to-violet-500 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-2.5"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    <>
                                                        Sign In ΓåÆ
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>
                                    </div>

                                    {/* Security footer */}
                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5" />
                                            Secured by enterprise encryption
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ===== STEP 2: OTP Verification ===== */}
                            {step === "otp" && (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                                    exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                                >
                                    <button
                                        onClick={() => { setStep("credentials"); setOtp("") }}
                                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to login
                                    </button>

                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/25 mx-auto">
                                            <Shield className="w-8 h-8 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
                                            Verify OTP
                                        </h2>
                                        <p className="text-gray-500 text-sm">
                                            Enter the 6-digit code sent to:
                                        </p>
                                        <p className="font-bold text-gray-900 mt-1">
                                            ≡ƒô▒ {userPhone.slice(0, 7)}****{userPhone.slice(-2)}
                                        </p>
                                    </div>

                                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/[0.04] border border-white/60">
                                        <form onSubmit={handleOtpSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                                    Verification Code
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                                        <KeyRound className="w-[18px] h-[18px] text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={otp}
                                                        onChange={(e) => handleOtpChange(e.target.value)}
                                                        placeholder="000000"
                                                        maxLength={OTP_LENGTH}
                                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-center text-2xl font-bold tracking-[0.4em]"
                                                        required
                                                        autoFocus
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 text-center">
                                                    Code expires in 5 minutes
                                                </p>
                                            </div>

                                            <motion.button
                                                type="submit"
                                                disabled={loading || otp.length !== OTP_LENGTH}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2.5"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Verify & Login
                                                    </>
                                                )}
                                            </motion.button>

                                            <div className="text-center pt-2">
                                                <p className="text-sm text-gray-500 mb-1.5">Didn&apos;t receive the code?</p>
                                                {resendTimer > 0 ? (
                                                    <p className="text-sm text-gray-400">
                                                        Resend in <span className="font-bold text-gray-700">{resendTimer}s</span>
                                                    </p>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleResendOtp}
                                                        disabled={loading}
                                                        className="inline-flex items-center gap-1.5 text-violet-600 font-bold text-sm hover:text-violet-700 transition-colors"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        Resend OTP
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Help Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400">
                                Need help? Contact <span className="text-violet-500 font-medium">+254720316175</span>
                            </p>
                            <p className="text-[11px] text-gray-300 mt-1">
                                Version 3.7 ┬╖ Developed by Jimhawkins Korir
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SuperAdmin Override Modal */}
            <AnimatePresence>
                {showSuperAdminModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4 text-red-600">
                                <Shield className="w-6 h-6" />
                                <h3 className="font-bold text-lg">SuperAdmin Override</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Enter superadmin credentials to toggle OTP requirement. Current status:
                                <span className="font-bold ml-1 text-gray-800">
                                    {typeof window !== 'undefined' && localStorage.getItem('otp_enabled') === 'true' ? 'ON' : 'OFF'}
                                </span>
                            </p>
                            <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Superadmin Username"
                                        value={superAdminCreds.username}
                                        onChange={e => setSuperAdminCreds({ ...superAdminCreds, username: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        placeholder="Superadmin Password"
                                        value={superAdminCreds.password}
                                        onChange={e => setSuperAdminCreds({ ...superAdminCreds, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowSuperAdminModal(false)}
                                        className="flex-1 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                                    >
                                        Toggle OTP
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
