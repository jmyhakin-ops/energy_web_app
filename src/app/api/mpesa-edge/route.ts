import { NextRequest, NextResponse } from "next/server"

// Enable Edge Runtime for ultra-fast cold starts
export const runtime = "edge"

// M-Pesa Backend URL - Supabase Edge Functions
const MPESA_BASE_URL = "https://pxcdaivlvltmdifxietb.supabase.co/functions/v1"
const STK_PUSH_ENDPOINT = `${MPESA_BASE_URL}/stkpush`
const CHECK_STATUS_ENDPOINT = `${MPESA_BASE_URL}/check-status`

/**
 * Format phone number to 254XXXXXXXXX format
 * Supports all Kenyan formats:
 * - 07XX XXX XXX (original Safaricom, Airtel, Telkom)
 * - 011X XXX XXX (new Safaricom: 0110-0115)
 * - 010X XXX XXX (new Airtel: 0100-0109)
 * - 254XXXXXXXXX (international format)
 */
function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "")

    if (cleaned.startsWith("0")) {
        // Local format: 07x, 010x, 011x -> 2547x, 25410x, 25411x
        cleaned = "254" + cleaned.substring(1)
    } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
        // Without leading 0: 7x, 10x, 11x
        cleaned = "254" + cleaned
    } else if (cleaned.startsWith("+254")) {
        cleaned = cleaned.substring(1)
    }
    return cleaned
}

/**
 * Validate Kenyan phone number
 * Supports: 07xxxxxxxx, 0110xxxxxx, 0100xxxxxx, 254xxxxxxxxx
 */
function isValidKenyanPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "")
    // Matches:
    // - 07xxxxxxxx (traditional)
    // - 011[0-5]xxxxxx (Safaricom new)
    // - 010[0-9]xxxxxx (Airtel new)
    // - 2547xxxxxxxx (international traditional)
    // - 2541[01]xxxxxxx (international new)
    return /^(07\d{8}|011[0-5]\d{6}|010[0-9]\d{6}|2547\d{8}|2541[01]\d{7})$/.test(cleaned)
}

// STK Push Request - Edge Optimized
export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const body = await request.json()
        const { phone, amount, account, description, station_id, user_id, pump_id, shift_id, fcm_token } = body

        // Validate inputs
        if (!phone || !amount) {
            return NextResponse.json({
                success: false,
                message: "Phone and amount are required"
            }, { status: 400 })
        }

        if (!isValidKenyanPhone(phone)) {
            return NextResponse.json({
                success: false,
                message: "Invalid phone number. Use 07XXXXXXXX or 254XXXXXXXXX"
            }, { status: 400 })
        }

        if (amount < 1) {
            return NextResponse.json({
                success: false,
                message: "Amount must be at least KES 1"
            }, { status: 400 })
        }

        const formattedPhone = formatPhoneNumber(phone)

        console.log(`⚡ [EDGE] M-Pesa STK Push - Phone: ${formattedPhone}, Amount: ${amount}`)

        // Call the optimized PHP backend with AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

        try {
            const response = await fetch(STK_PUSH_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    phone: formattedPhone,
                    amount: Number(amount),
                    account: account || `EDGE-${Date.now()}`,
                    description: description || "Fuel Purchase",
                    station_id: station_id || 1,
                    user_id: user_id,
                    pump_id: pump_id,
                    shift_id: shift_id,
                    fcm_token: fcm_token,
                }),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            const data = await response.json()
            const duration = Date.now() - startTime

            console.log(`⚡ [EDGE] Response in ${duration}ms:`, data.success ? "SUCCESS" : "FAILED")

            if (data.success) {
                return NextResponse.json({
                    success: true,
                    message: data.message || "STK Push sent! Check your phone.",
                    checkoutRequestId: data.checkout_request_id || data.CheckoutRequestID,
                    merchantRequestId: data.merchant_request_id || data.MerchantRequestID,
                    saleId: data.sale_id || data.transaction_id,
                    processingTimeMs: duration,
                    serverProcessingMs: data.processing_time_ms,
                })
            } else {
                return NextResponse.json({
                    success: false,
                    message: data.message || "Failed to initiate M-Pesa payment",
                    processingTimeMs: duration,
                }, { status: 400 })
            }
        } catch (fetchError) {
            clearTimeout(timeoutId)
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                return NextResponse.json({
                    success: false,
                    message: "Request timed out. Please try again."
                }, { status: 408 })
            }
            throw fetchError
        }
    } catch (error) {
        const duration = Date.now() - startTime
        console.error(`❌ [EDGE] Error after ${duration}ms:`, error)
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Server error"
        }, { status: 500 })
    }
}

// Check Status - Edge Optimized
export async function GET(request: NextRequest) {
    const startTime = Date.now()

    try {
        const { searchParams } = new URL(request.url)
        const checkoutRequestId = searchParams.get("checkoutRequestId")

        if (!checkoutRequestId) {
            return NextResponse.json({
                success: false,
                message: "checkoutRequestId is required"
            }, { status: 400 })
        }

        const response = await fetch(
            `${CHECK_STATUS_ENDPOINT}?checkout_request_id=${encodeURIComponent(checkoutRequestId)}`,
            {
                method: "GET",
                headers: { "Accept": "application/json" }
            }
        )

        const data = await response.json()
        const duration = Date.now() - startTime

        return NextResponse.json({
            success: data.success,
            resultCode: data.resultCode,
            resultDesc: data.resultDesc,
            checkoutRequestId: data.checkoutRequestID,
            amount: data.amount,
            mpesaReceiptNumber: data.mpesaReceiptNumber,
            transactionDate: data.transactionDate,
            status: data.resultCode === 0 ? "completed" :
                data.resultCode === null ? "pending" : "failed",
            processingTimeMs: duration,
        })
    } catch (error) {
        console.error("❌ [EDGE] Status Check Error:", error)
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Server error"
        }, { status: 500 })
    }
}
