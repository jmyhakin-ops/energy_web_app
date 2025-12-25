"use client"

import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "success" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {

        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
            outline: "border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
            ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            success: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
            destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        }

        const sizes = {
            default: "h-11 px-5 py-2.5 text-sm",
            sm: "h-9 px-4 text-xs",
            lg: "h-12 px-6 text-base",
            icon: "h-10 w-10",
        }

        return (
            <button
                ref={ref}
                disabled={loading || disabled}
                className={`
          inline-flex items-center justify-center gap-2 
          font-semibold rounded-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
                {...props}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </>
                ) : (
                    children
                )}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
