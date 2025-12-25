"use client"

import * as React from "react"
import { Toaster as HotToaster, toast as hotToast } from "react-hot-toast"
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    Loader2,
    X
} from "lucide-react"

// ==================== SUPER MODERN TOAST PROVIDER ====================
export function ToastProvider() {
    return (
        <HotToaster
            position="top-right"
            gutter={12}
            containerStyle={{
                top: 20,
                right: 20,
            }}
            toastOptions={{
                duration: 5000,
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    maxWidth: '420px',
                },
            }}
        />
    )
}

// ==================== CUSTOM TOAST STYLES ====================
const toastStyles = {
    base: `
    flex items-center gap-4 w-full max-w-md p-4 rounded-2xl
    shadow-2xl backdrop-blur-xl border
    animate-in slide-in-from-right-full duration-300
  `,
    success: `
    bg-gradient-to-r from-emerald-500/90 to-green-500/90
    border-emerald-400/30 text-white
    shadow-emerald-500/30
  `,
    error: `
    bg-gradient-to-r from-red-500/90 to-rose-500/90
    border-red-400/30 text-white
    shadow-red-500/30
  `,
    warning: `
    bg-gradient-to-r from-amber-500/90 to-orange-500/90
    border-amber-400/30 text-white
    shadow-amber-500/30
  `,
    info: `
    bg-gradient-to-r from-blue-500/90 to-cyan-500/90
    border-blue-400/30 text-white
    shadow-blue-500/30
  `,
    loading: `
    bg-gradient-to-r from-purple-500/90 to-indigo-500/90
    border-purple-400/30 text-white
    shadow-purple-500/30
  `,
}

// ==================== CUSTOM TOAST COMPONENT ====================
interface ToastContentProps {
    icon: React.ReactNode
    title: string
    message?: string
    type: 'success' | 'error' | 'warning' | 'info' | 'loading'
    onDismiss?: () => void
}

function ToastContent({ icon, title, message, type, onDismiss }: ToastContentProps) {
    return (
        <div className={`${toastStyles.base} ${toastStyles[type]}`}>
            <div className="flex-shrink-0 p-2 rounded-xl bg-white/20">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{title}</p>
                {message && (
                    <p className="text-sm opacity-90 mt-0.5 line-clamp-2">{message}</p>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

// ==================== TOAST FUNCTIONS ====================
export const toast = {
    success: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<CheckCircle2 className="w-6 h-6" />}
                title={title}
                message={message}
                type="success"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    error: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<XCircle className="w-6 h-6" />}
                title={title}
                message={message}
                type="error"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    warning: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<AlertTriangle className="w-6 h-6" />}
                title={title}
                message={message}
                type="warning"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    info: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<Info className="w-6 h-6" />}
                title={title}
                message={message}
                type="info"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    loading: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<Loader2 className="w-6 h-6 animate-spin" />}
                title={title}
                message={message}
                type="loading"
            />
        ), { duration: Infinity })
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string
            error: string
        }
    ) => {
        return hotToast.promise(promise, {
            loading: (
                <ToastContent
                    icon={<Loader2 className="w-6 h-6 animate-spin" />}
                    title={messages.loading}
                    type="loading"
                />
            ),
            success: (
                <ToastContent
                    icon={<CheckCircle2 className="w-6 h-6" />}
                    title={messages.success}
                    type="success"
                />
            ),
            error: (
                <ToastContent
                    icon={<XCircle className="w-6 h-6" />}
                    title={messages.error}
                    type="error"
                />
            ),
        })
    },

    // M-Pesa specific toasts
    mpesaSuccess: (amount: number, receipt: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<span className="text-2xl">📱</span>}
                title={`✅ M-Pesa Payment Received!`}
                message={`KES ${amount.toLocaleString()} • Receipt: ${receipt}`}
                type="success"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ), { duration: 8000 })
    },

    mpesaPending: () => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<Loader2 className="w-6 h-6 animate-spin" />}
                title="⏳ Waiting for M-Pesa..."
                message="Please check your phone and enter PIN"
                type="loading"
            />
        ), { duration: Infinity })
    },

    mpesaFailed: (reason?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<XCircle className="w-6 h-6" />}
                title="❌ M-Pesa Payment Failed"
                message={reason || "Transaction was not completed"}
                type="error"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    dismiss: hotToast.dismiss,
    dismissAll: () => hotToast.dismiss(),
}
