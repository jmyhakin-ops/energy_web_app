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
} from "lucide-react"
import { toast } from "@/components/ui/toast"

// OTP Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"credentials" | "otp">("credentials")
    const [otp, setOtp] = useState("")
    const [generatedOtp, setGeneratedOtp] = useState("")
    const [userPhone, setUserPhone] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    })

    // Generate 6-digit OTP
    const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString()
    }

    // Send OTP via SMS (Mock - Replace with actual SMS API)
    const sendOtpSms = async (phone: string, otpCode: string) => {
        // In production, call your SMS API here
        // Example: Africa's Talking, Twilio, etc.
        console.log(`📱 OTP ${otpCode} sent to ${phone}`)

        // For demo purposes, we'll show the OTP in a toast
        // REMOVE THIS IN PRODUCTION!
        toast.success("📱 OTP Sent!", `Check your phone: ${phone.slice(0, 6)}****`)

        // Simulated API call
        // await fetch('/api/send-otp', {
        //     method: 'POST',
        //     body: JSON.stringify({ phone, otp: otpCode })
        // })

        return true
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

    // Handle credentials submission
    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate credentials against database
            // In production, call your API to verify username/password
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Mock user data - Replace with actual API call
            const mockUserPhone = "+254720316175" // Get from database

            // Generate and send OTP
            const newOtp = generateOtp()
            setGeneratedOtp(newOtp)
            setUserPhone(mockUserPhone)

            await sendOtpSms(mockUserPhone, newOtp)

            setOtpSent(true)
            setStep("otp")
            startResendTimer()

            // For testing - Remove in production!
            console.log(`🔐 Generated OTP: ${newOtp}`)

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
            await new Promise((resolve) => setTimeout(resolve, 500))

            if (otp === generatedOtp) {
                toast.success("✅ Login Successful!", "Welcome back!")
                router.push("/dashboard")
            } else {
                toast.error("Invalid OTP", "Please check and try again")
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
        const newOtp = generateOtp()
        setGeneratedOtp(newOtp)
        await sendOtpSms(userPhone, newOtp)
        startResendTimer()
        setLoading(false)

        // For testing - Remove in production!
        console.log(`🔐 New OTP: ${newOtp}`)
    }

    // Handle OTP input with auto-focus
    const handleOtpChange = (value: string) => {
        // Only allow numbers
        const numericValue = value.replace(/\D/g, "")
        if (numericValue.length <= OTP_LENGTH) {
            setOtp(numericValue)
        }
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
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === "otp" && (
                        <>
                            <button
                                onClick={() => setStep("credentials")}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to login
                            </button>

                            <div className="mb-10">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                                    Enter OTP Code 🔐
                                </h2>
                                <p className="text-gray-500">
                                    We've sent a {OTP_LENGTH}-digit verification code to
                                    <br />
                                    <span className="font-bold text-gray-900">{userPhone.slice(0, 6)}****{userPhone.slice(-2)}</span>
                                </p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                {/* OTP Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Verification Code
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
                                            placeholder="Enter 6-digit code"
                                            maxLength={OTP_LENGTH}
                                            className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-center text-2xl font-bold tracking-[0.5em]"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center">
                                        Code expires in {OTP_EXPIRY_MINUTES} minutes
                                    </p>
                                </div>

                                {/* Verify Button */}
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== OTP_LENGTH}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-3"
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
                                <div className="text-center">
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
                                            className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                                        >
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
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
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
                            ? "The most powerful platform for multi-station management with M-Pesa integration."
                            : "Your account is protected with SMS verification for enhanced security."
                        }
                    </p>

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

                    <div className="text-center text-blue-200 text-sm">
                        <p>Developed by <span className="font-bold text-white">Jimhawkins Korir</span></p>
                        <p className="mt-1">📞 +254720316175</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
