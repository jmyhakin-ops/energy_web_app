import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// SMS PROVIDER CONFIGURATION
// Choose your provider by setting the appropriate env vars
// ============================================================

// TWILIO Configuration (RECOMMENDED - $15.50 FREE credits!)
// Sign up at: https://www.twilio.com/try-twilio (no credit card needed)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '' // Your Twilio phone number

// Africa's Talking Configuration (Fallback)
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || ''
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox'
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID || 'AlphaEnergy'

// In-memory OTP store (use Redis in production for scaling)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>()

// OTP Configuration
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3

// Determine which provider to use (Twilio has priority)
function getActiveProvider(): 'twilio' | 'africastalking' | 'none' {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
        return 'twilio'
    }
    if (AT_API_KEY) {
        return 'africastalking'
    }
    return 'none'
}

export async function POST(request: NextRequest) {
    try {
        const { phone, action, otp } = await request.json()

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 })
        }

        // Normalize phone number to Kenyan format
        const normalizedPhone = normalizeKenyanPhone(phone)

        if (action === 'send') {
            // Generate 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

            // Store OTP with expiry
            otpStore.set(normalizedPhone, {
                otp: generatedOtp,
                expires: Date.now() + OTP_EXPIRY_MS,
                attempts: 0,
            })

            // Send SMS via configured provider
            const provider = getActiveProvider()
            let smsResult: { success: boolean; error?: string }

            if (provider === 'twilio') {
                smsResult = await sendTwilioSms(normalizedPhone, generatedOtp)
            } else if (provider === 'africastalking') {
                smsResult = await sendAfricasTalkingSms(normalizedPhone, generatedOtp)
            } else {
                // Development mode - just log the OTP
                console.log(`📱 [DEV MODE] OTP ${generatedOtp} would be sent to ${normalizedPhone}`)
                console.log(`⚠️ Configure SMS provider in Vercel Environment Variables:`)
                console.log(`   - TWILIO: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER`)
                console.log(`   - Africa's Talking: AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME`)
                smsResult = { success: true }
            }

            if (smsResult.success) {
                return NextResponse.json({
                    success: true,
                    message: `OTP sent to ${normalizedPhone.slice(0, 7)}****${normalizedPhone.slice(-2)}`,
                    provider: provider !== 'none' ? provider : 'dev-mode',
                })
            } else {
                return NextResponse.json({
                    success: false,
                    error: smsResult.error || 'Failed to send SMS'
                }, { status: 500 })
            }
        }

        if (action === 'verify') {
            if (!otp) {
                return NextResponse.json({ success: false, error: 'OTP is required' }, { status: 400 })
            }

            const stored = otpStore.get(normalizedPhone)

            if (!stored) {
                return NextResponse.json({ success: false, error: 'No OTP found. Please request a new one.' }, { status: 400 })
            }

            if (Date.now() > stored.expires) {
                otpStore.delete(normalizedPhone)
                return NextResponse.json({ success: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 })
            }

            if (stored.attempts >= MAX_ATTEMPTS) {
                otpStore.delete(normalizedPhone)
                return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 })
            }

            if (stored.otp !== otp) {
                stored.attempts++
                return NextResponse.json({
                    success: false,
                    error: 'Invalid OTP',
                    attemptsRemaining: MAX_ATTEMPTS - stored.attempts
                }, { status: 400 })
            }

            // OTP is valid - delete it
            otpStore.delete(normalizedPhone)

            return NextResponse.json({
                success: true,
                message: 'OTP verified successfully',
            })
        }

        return NextResponse.json({ success: false, error: 'Invalid action. Use: send or verify' }, { status: 400 })

    } catch (error) {
        console.error('OTP API Error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// Normalize Kenyan phone numbers
function normalizeKenyanPhone(phone: string): string {
    let normalized = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '')

    if (normalized.startsWith('0')) {
        normalized = '+254' + normalized.substring(1)
    } else if (normalized.startsWith('254')) {
        normalized = '+' + normalized
    } else if (!normalized.startsWith('+254')) {
        normalized = '+254' + normalized
    }

    return normalized
}

// ============================================================
// TWILIO SMS PROVIDER (RECOMMENDED - FREE $15.50 TRIAL)
// Sign up: https://www.twilio.com/try-twilio
// ============================================================
async function sendTwilioSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your Alpha Energy verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`

    console.log(`📱 Sending SMS via Twilio`)
    console.log(`📞 To: ${phone}`)

    try {
        // Twilio uses Basic Auth with Account SID and Auth Token
        const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    To: phone,
                    From: TWILIO_PHONE_NUMBER,
                    Body: message,
                }),
            }
        )

        const result = await response.json()
        console.log('Twilio Response:', JSON.stringify(result, null, 2))

        if (response.ok && result.sid) {
            console.log(`✅ SMS sent successfully via Twilio to ${phone}`)
            return { success: true }
        } else {
            console.error('Twilio API Error:', result)
            return {
                success: false,
                error: result.message || 'Failed to send SMS via Twilio'
            }
        }
    } catch (error) {
        console.error('Twilio API Connection Error:', error)
        return { success: false, error: 'Failed to connect to Twilio SMS service' }
    }
}

// ============================================================
// AFRICA'S TALKING SMS PROVIDER (FALLBACK)
// ============================================================
async function sendAfricasTalkingSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your Alpha Energy verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`

    // Use sandbox API for sandbox mode
    const isSandbox = AT_USERNAME.toLowerCase() === 'sandbox'
    const apiUrl = isSandbox
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging'

    console.log(`📱 Sending SMS via Africa's Talking (${isSandbox ? 'SANDBOX' : 'LIVE'} mode)`)
    console.log(`📞 To: ${phone}`)

    try {
        // Build request body - only include 'from' for live mode with approved sender ID
        const bodyParams: Record<string, string> = {
            username: AT_USERNAME,
            to: phone,
            message: message,
        }

        // Only add sender ID for live mode (sandbox ignores it)
        if (!isSandbox && AT_SENDER_ID) {
            bodyParams.from = AT_SENDER_ID
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': AT_API_KEY,
            },
            body: new URLSearchParams(bodyParams),
        })

        const result = await response.json()
        console.log('Africa\'s Talking Response:', JSON.stringify(result, null, 2))

        // Check if SMS was sent successfully
        const recipient = result.SMSMessageData?.Recipients?.[0]
        if (recipient?.status === 'Success' || recipient?.statusCode === 101) {
            console.log(`✅ SMS sent successfully to ${phone}`)
            return { success: true }
        } else {
            console.error('SMS API Error:', result)
            return {
                success: false,
                error: result.SMSMessageData?.Message || recipient?.status || 'Failed to send SMS'
            }
        }
    } catch (error) {
        console.error('SMS API Connection Error:', error)
        return { success: false, error: 'Failed to connect to SMS service' }
    }
}
