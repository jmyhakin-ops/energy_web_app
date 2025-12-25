"use client"

import * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "outlined"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-white rounded-2xl shadow-sm border border-gray-100",
            outlined: "bg-white rounded-2xl border-2 border-gray-200",
        }

        return (
            <div
                ref={ref}
                className={`${variants[variant]} ${className}`}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
    <div
        ref={ref}
        className={`flex flex-col space-y-1.5 p-6 pb-4 ${className}`}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
    <h3
        ref={ref}
        className={`text-lg font-bold text-gray-900 flex items-center gap-2 ${className}`}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-gray-500 ${className}`}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
    <div
        ref={ref}
        className={`flex items-center p-6 pt-0 ${className}`}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
