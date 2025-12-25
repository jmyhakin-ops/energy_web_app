import { NextRequest, NextResponse } from 'next/server'

// Africa's Talking Configuration - Get from environment variables
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || ''
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox'
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID || 'AlphaEnergy'

// In-memory OTP store (use Redis in production for scaling)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>()

// OTP Configuration
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3

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

            // Send SMS via Africa's Talking
            const smsResult = await sendAfricasTalkingSms(normalizedPhone, generatedOtp)

            if (smsResult.success) {
                return NextResponse.json({
                    success: true,
                    message: `OTP sent to ${normalizedPhone.slice(0, 7)}****${normalizedPhone.slice(-2)}`,
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

// Send SMS via Africa's Talking API
async function sendAfricasTalkingSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your Alpha Energy verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`

    // If no API key configured, log and simulate success (for development)
    if (!AT_API_KEY) {
        console.log(`📱 [DEV MODE] OTP ${otp} would be sent to ${phone}`)
        console.log(`⚠️ Set AFRICASTALKING_API_KEY in Vercel Environment Variables to enable real SMS`)
        return { success: true }
    }

    try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': AT_API_KEY,
            },
            body: new URLSearchParams({
                username: AT_USERNAME,
                to: phone,
                message: message,
                from: AT_SENDER_ID,
            }),
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
