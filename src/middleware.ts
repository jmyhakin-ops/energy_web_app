import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/dashboard/stations',
    '/dashboard/pumps',
    '/dashboard/attendants',
    '/dashboard/shifts',
    '/dashboard/sales',
    '/dashboard/mpesa',
    '/dashboard/reports',
    '/dashboard/settings',
]

// Rate limiting store (simple in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // Max requests per window

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Rate limiting
    const now = Date.now()
    const rateKey = `${ip}:${pathname}`
    const rateData = rateLimitStore.get(rateKey)

    if (rateData) {
        if (now - rateData.timestamp > RATE_LIMIT_WINDOW) {
            // Reset window
            rateLimitStore.set(rateKey, { count: 1, timestamp: now })
        } else if (rateData.count >= RATE_LIMIT_MAX) {
            // Too many requests
            return new NextResponse('Too Many Requests', { status: 429 })
        } else {
            // Increment counter
            rateLimitStore.set(rateKey, { count: rateData.count + 1, timestamp: rateData.timestamp })
        }
    } else {
        rateLimitStore.set(rateKey, { count: 1, timestamp: now })
    }

    // Add security headers to response
    const response = NextResponse.next()

    // Add request ID for tracking
    response.headers.set('X-Request-ID', crypto.randomUUID())

    // Prevent caching of sensitive pages
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
