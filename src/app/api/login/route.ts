import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Login API error: Missing Supabase URL or Key in environment variables')
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()
    const username = body.username ? String(body.username).trim() : ''
    const password = body.password ? String(body.password) : ''

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 })
    }

    // Query users_new table for the user
    const { data: users, error } = await supabase
      .from('users_new')
      .select('user_id, full_name, username, password_hash, role_id, is_active, mobile_no')
      .ilike('username', username)
      .limit(1)

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ success: false, error: 'Database error occurred' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 })
    }

    const user = users[0]

    if (user.is_active === false) {
      return NextResponse.json({ success: false, error: 'This account has been disabled. Please contact your administrator.' }, { status: 403 })
    }

    // Verify hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
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
  } catch (err: any) {
    console.error('Unhandled login error:', err)
    return NextResponse.json({ success: false, error: 'An unexpected server error occurred' }, { status: 500 })
  }
}
