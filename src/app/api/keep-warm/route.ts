import { NextResponse } from "next/server"

export const revalidate = 0
export const dynamic = "force-dynamic"

// Keep Supabase Edge Functions warm - scheduled to run every 10 minutes
export async function GET() {
    const startTime = Date.now()

    try {
        // Ping the Supabase edge function health endpoint
        const response = await fetch("https://pxcdaivlvltmdifxietb.supabase.co/functions/v1/check-status", {
            method: "GET",
            headers: { "Accept": "application/json" },
        })

        const duration = Date.now() - startTime

        if (response.ok) {
            return NextResponse.json({
                success: true,
                message: "Backend warm",
                duration_ms: duration,
                timestamp: new Date().toISOString()
            })
        } else {
            return NextResponse.json({
                success: false,
                message: "Backend returned error",
                status: response.status,
                duration_ms: duration,
                timestamp: new Date().toISOString()
            }, { status: 500 })
        }
    } catch (error) {
        const duration = Date.now() - startTime
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to ping backend",
            duration_ms: duration,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
