import { NextRequest, NextResponse } from "next/server"

// M-Pesa Backend URLs (Production - Render)
const MPESA_BASE_URL = "https://online-link.onrender.com"
const STK_PUSH_ENDPOINT = `${MPESA_BASE_URL}/stkpush.php`
const CHECK_STATUS_ENDPOINT = `${MPESA_BASE_URL}/check_status.php`

// Format phone number to 254XXXXXXXXX format
function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "")
    if (cleaned.startsWith("0")) {
        cleaned = "254" + cleaned.substring(1)
    } else if (cleaned.startsWith("7")) {
        cleaned = "254" + cleaned
    } else if (cleaned.startsWith("+254")) {
        cleaned = cleaned.substring(1)
    }
    return cleaned
}

// Validate Kenyan phone number
function isValidKenyanPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "")
    return /^(07\d{8}|254\d{9})$/.test(cleaned)
}

// STK Push Request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, amount, account, description } = body

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

        console.log(`📱 M-Pesa STK Push Request`)
        console.log(`   Phone: ${formattedPhone}`)
        console.log(`   Amount: KES ${amount}`)
        console.log(`   Account: ${account || "WEB-SALE"}`)

        // Call the PHP backend
        const response = await fetch(STK_PUSH_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone: formattedPhone,
                amount: Number(amount),
                account: account || `WEB-${Date.now()}`,
                description: description || "Fuel Purchase",
            }),
        })

        const data = await response.json()

        console.log(`📤 M-Pesa Response:`, data)

        if (data.success) {
            return NextResponse.json({
                success: true,
                message: data.message || "STK Push sent! Check your phone.",
                checkoutRequestId: data.checkout_request_id || data.CheckoutRequestID,
                merchantRequestId: data.merchant_request_id || data.MerchantRequestID,
                saleId: data.sale_id || data.saleId,
            })
        } else {
            return NextResponse.json({
                success: false,
                message: data.message || "Failed to initiate M-Pesa payment",
            }, { status: 400 })
        }
    } catch (error) {
        console.error("❌ M-Pesa STK Push Error:", error)
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Server error"
        }, { status: 500 })
    }
}

// Check Status Request
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const checkoutRequestId = searchParams.get("checkoutRequestId")

        if (!checkoutRequestId) {
            return NextResponse.json({
                success: false,
                message: "checkoutRequestId is required"
            }, { status: 400 })
        }

        console.log(`🔍 Checking M-Pesa Status: ${checkoutRequestId}`)

        const response = await fetch(
            `${CHECK_STATUS_ENDPOINT}?checkout_request_id=${encodeURIComponent(checkoutRequestId)}`,
            { method: "GET" }
        )

        const data = await response.json()

        console.log(`📤 Status Response:`, data)

        return NextResponse.json({
            success: data.success,
            resultCode: data.resultCode,
            resultDesc: data.resultDesc,
            checkoutRequestId: data.checkoutRequestID,
            amount: data.amount,
            mpesaReceiptNumber: data.mpesaReceiptNumber,
            transactionDate: data.transactionDate,
            // Status interpretation
            status: data.resultCode === 0 ? "completed" :
                data.resultCode === null ? "pending" : "failed",
        })
    } catch (error) {
        console.error("❌ M-Pesa Status Check Error:", error)
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "Server error"
        }, { status: 500 })
    }
}
