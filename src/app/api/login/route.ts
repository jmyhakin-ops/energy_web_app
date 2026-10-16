import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Force dynamic rendering - do not evaluate at build time
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Create client inside handler so env vars are available at runtime
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 })
    }

    // Look up user in users_new table (case-insensitive)
    const { data: users, error } = await supabase
      .from('users_new')
      .select('user_id, full_name, username, password_hash, role_id, is_active, mobile_no')
      .ilike('username', username.trim())
      .limit(1)

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 })
    }

    const user = users[0]

    if (!user.is_active) {
      return NextResponse.json({ success: false, error: 'Account is disabled. Contact admin.' }, { status: 403 })
    }

    // Verify bcrypt password
    const passwordValid = await bcrypt.compare(password, user.password_hash)
    if (!passwordValid) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        username: user.username,
        roleId: user.role_id,
        mobile: user.mobile_no,
      }
    })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
