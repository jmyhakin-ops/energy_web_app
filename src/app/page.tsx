"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Fuel,
  Building2,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Users,
  Clock,
  Star,
  Play,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* ==================== HEADER ==================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Fuel className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900">EnergyStation</span>
                <span className="hidden sm:inline text-xs bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-2 py-0.5 rounded-full ml-2">PRO</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">FAQ</a>
            </nav>

            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login" className="px-5 py-2.5 text-gray-700 font-semibold hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== HERO ==================== */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Trusted by 500+ Fuel Stations in Kenya</span>
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              <span className="text-gray-900">The Modern Way to</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Manage Fuel Stations
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              All-in-one platform with <span className="font-semibold text-gray-900">M-Pesa integration</span>,
              real-time analytics, and multi-station management.
              Built for Kenya's fuel industry.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/dashboard"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 font-bold text-lg rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 border border-gray-200">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Active Stations", icon: Building2, color: "from-blue-500 to-cyan-400" },
              { value: "2.5M+", label: "Transactions/Month", icon: BarChart3, color: "from-purple-500 to-pink-400" },
              { value: "KES 4B+", label: "Monthly Volume", icon: Wallet, color: "from-green-500 to-emerald-400" },
              { value: "99.99%", label: "Uptime SLA", icon: Zap, color: "from-orange-500 to-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="relative group">
                <div className="relative bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-100 hover:border-gray-200 transition-all group-hover:-translate-y-1 duration-300">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-gray-500 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-6">POWERFUL FEATURES</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Run Your Business
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built for Kenya's fuel station industry with features that matter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Building2, title: "Multi-Station Dashboard", desc: "Manage 50+ stations from one powerful dashboard with real-time insights.", bg: "bg-blue-50", iconColor: "text-blue-600" },
              { icon: Smartphone, title: "M-Pesa Integration", desc: "Lightning-fast STK Push with smart token caching. Get paid instantly.", bg: "bg-green-50", iconColor: "text-green-600" },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Beautiful charts, automated reports, and actionable business insights.", bg: "bg-purple-50", iconColor: "text-purple-600" },
              { icon: Shield, title: "Role-Based Access", desc: "Fine-grained permissions for admins, managers, and pump attendants.", bg: "bg-orange-50", iconColor: "text-orange-600" },
              { icon: Clock, title: "Shift Management", desc: "Seamless day/night transitions with automatic cash reconciliation.", bg: "bg-cyan-50", iconColor: "text-cyan-600" },
              { icon: Globe, title: "Mobile Optimized", desc: "Works perfectly on any device. Desktop, tablet, or smartphone.", bg: "bg-pink-50", iconColor: "text-pink-600" },
            ].map((feature) => (
              <div key={feature.title} className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-100 hover:border-gray-200 hover:-translate-y-2 transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 p-12 lg:p-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                Join 500+ fuel stations already using EnergyStation to streamline operations and increase revenue.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold text-lg rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-10 py-5 bg-blue-800/50 text-white font-bold text-lg rounded-2xl hover:bg-blue-800 transition-all border border-white/20"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-12 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl">EnergyStation</span>
            </div>
            <p className="text-gray-400 text-center lg:text-left max-w-md">
              The complete fuel station management platform. Built for Kenya, trusted by industry leaders.
            </p>
          </div>
          <div className="pt-8 text-center text-gray-500">
            <p>© 2024 Energy Solutions Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Wallet(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}
