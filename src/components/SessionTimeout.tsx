"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

export function SessionTimeout() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Do not apply timeout on login page or root page
        if (pathname === "/login" || pathname === "/") return

        let timeoutId: NodeJS.Timeout

        const resetTimeout = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                // Time's up! Clear session info and redirect to login
                // Remove generic local auth item if any exists (e.g. from previous setups)
                if (typeof window !== "undefined") {
                    localStorage.removeItem("user_session")
                    sessionStorage.clear()
                }

                // Force redirect to login page
                router.push("/login")
            }, TIMEOUT_MS)
        }

        // Set initial timeout
        resetTimeout()

        // List of events to listen for user activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click",
            "wheel"
        ]

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimeout)
        })

        // Cleanup function
        return () => {
            clearTimeout(timeoutId)
            events.forEach(event => {
                window.removeEventListener(event, resetTimeout)
            })
        }
    }, [pathname, router])

    return null // This is a logic-only component that does not render anything
}
