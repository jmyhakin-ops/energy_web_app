import { NextRequest, NextResponse } from 'next/server'

// Africa's Talking SMS Configuration
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY || ''
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox'
const AFRICASTALKING_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID || 'AlphaEnergy'

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>()

// OTP Configuration
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3

export async function POST(request: NextRequest) {
    try {
        const { phone, action, otp } = await request.json()

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone)

        if (action === 'send') {
            // Generate 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

            // Store OTP
            otpStore.set(normalizedPhone, {
                otp: generatedOtp,
                expires: Date.now() + OTP_EXPIRY_MS,
                attempts: 0,
            })

            // Send SMS
            const smsResult = await sendSms(normalizedPhone, generatedOtp)

            if (smsResult.success) {
                return NextResponse.json({
                    success: true,
                    message: 'OTP sent successfully',
                    // Only include OTP in development for testing
                    ...(process.env.NODE_ENV === 'development' && { otp: generatedOtp }),
                })
            } else {
                return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
            }
        }

        if (action === 'verify') {
            if (!otp) {
                return NextResponse.json({ error: 'OTP is required' }, { status: 400 })
            }

            const stored = otpStore.get(normalizedPhone)

            if (!stored) {
                return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 })
            }

            if (Date.now() > stored.expires) {
                otpStore.delete(normalizedPhone)
                return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
            }

            if (stored.attempts >= MAX_ATTEMPTS) {
                otpStore.delete(normalizedPhone)
                return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 })
            }

            if (stored.otp !== otp) {
                stored.attempts++
                return NextResponse.json({
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

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('OTP API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Normalize Kenyan phone numbers
function normalizePhoneNumber(phone: string): string {
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

// Send SMS via Africa's Talking
async function sendSms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your Alpha Energy verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`

    // If no API key configured, simulate success (for development)
    if (!AFRICASTALKING_API_KEY) {
        console.log(`📱 [DEV] OTP ${otp} would be sent to ${phone}`)
        return { success: true }
    }

    try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': AFRICASTALKING_API_KEY,
            },
            body: new URLSearchParams({
                username: AFRICASTALKING_USERNAME,
                to: phone,
                message: message,
                from: AFRICASTALKING_SENDER_ID,
            }),
        })

        const result = await response.json()

        if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
            return { success: true }
        } else {
            console.error('SMS API Error:', result)
            return { success: false, error: result.SMSMessageData?.Message || 'Failed to send SMS' }
        }
    } catch (error) {
        console.error('SMS API Error:', error)
        return { success: false, error: 'Failed to connect to SMS service' }
    }
}
