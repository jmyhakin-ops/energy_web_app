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
            gutter={8}
            containerStyle={{
                top: 16,
                right: 16,
            }}
            toastOptions={{
                duration: 3000,
                style: {
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: 0,
                    maxWidth: '340px',
                },
            }}
        />
    )
}

// ==================== MODERN LIGHT TOAST STYLES ====================
const toastStyles = {
    base: `
    flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-2xl
    shadow-lg backdrop-blur-sm border
    animate-in slide-in-from-right-full duration-200
  `,
    success: `
    bg-gradient-to-r from-emerald-50 to-green-50
    border-emerald-200 text-emerald-800
    shadow-emerald-100
  `,
    error: `
    bg-gradient-to-r from-red-50 to-rose-50
    border-red-200 text-red-800
    shadow-red-100
  `,
    warning: `
    bg-gradient-to-r from-amber-50 to-orange-50
    border-amber-200 text-amber-800
    shadow-amber-100
  `,
    info: `
    bg-gradient-to-r from-blue-50 to-cyan-50
    border-blue-200 text-blue-800
    shadow-blue-100
  `,
    loading: `
    bg-gradient-to-r from-violet-50 to-purple-50
    border-violet-200 text-violet-800
    shadow-violet-100
  `,
}

const iconStyles = {
    success: "text-emerald-600 bg-emerald-100",
    error: "text-red-600 bg-red-100",
    warning: "text-amber-600 bg-amber-100",
    info: "text-blue-600 bg-blue-100",
    loading: "text-violet-600 bg-violet-100",
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
            <div className={`flex-shrink-0 p-1.5 rounded-lg ${iconStyles[type]}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                {message && (
                    <p className="text-xs opacity-75 mt-0.5 truncate">{message}</p>
                )}
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                >
                    <X className="w-4 h-4 opacity-50" />
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
                icon={<CheckCircle2 className="w-5 h-5" />}
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
                icon={<XCircle className="w-5 h-5" />}
                title={title}
                message={message}
                type="error"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ), { duration: 4000 })
    },

    warning: (title: string, message?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<AlertTriangle className="w-5 h-5" />}
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
                icon={<Info className="w-5 h-5" />}
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
                icon={<Loader2 className="w-5 h-5 animate-spin" />}
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
                    icon={<Loader2 className="w-5 h-5 animate-spin" />}
                    title={messages.loading}
                    type="loading"
                />
            ),
            success: (
                <ToastContent
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    title={messages.success}
                    type="success"
                />
            ),
            error: (
                <ToastContent
                    icon={<XCircle className="w-5 h-5" />}
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
                icon={<span className="text-lg">📱</span>}
                title="M-Pesa Received!"
                message={`KES ${amount.toLocaleString()} • ${receipt}`}
                type="success"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ), { duration: 5000 })
    },

    mpesaPending: () => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<Loader2 className="w-5 h-5 animate-spin" />}
                title="Waiting for M-Pesa..."
                message="Enter PIN on your phone"
                type="loading"
            />
        ), { duration: Infinity })
    },

    mpesaFailed: (reason?: string) => {
        return hotToast.custom((t) => (
            <ToastContent
                icon={<XCircle className="w-5 h-5" />}
                title="M-Pesa Failed"
                message={reason || "Transaction cancelled"}
                type="error"
                onDismiss={() => hotToast.dismiss(t.id)}
            />
        ))
    },

    dismiss: hotToast.dismiss,
    dismissAll: () => hotToast.dismiss(),
}
