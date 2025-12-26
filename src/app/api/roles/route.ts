import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: ReturnType<typeof createClient> | null = null
if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Fetch all roles from database
export async function GET() {
    try {
        if (!supabase) {
            // Return default roles if database not configured
            return NextResponse.json({
                success: true,
                data: [
                    { role_id: 1, role_name: 'Super Admin' },
                    { role_id: 2, role_name: 'Admin' },
                    { role_id: 3, role_name: 'Manager' },
                    { role_id: 4, role_name: 'Supervisor' },
                    { role_id: 5, role_name: 'Pump Attendant' },
                ],
                message: 'Using default roles (database not configured)'
            })
        }

        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('role_id')

        if (error) {
            console.error('Error fetching roles:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { role_name } = body

        if (!role_name) {
            return NextResponse.json({ success: false, error: 'Role name is required' }, { status: 400 })
        }

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
        }

        // Check if role already exists
        const { data: existing } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('role_name', role_name)
            .single()

        if (existing) {
            return NextResponse.json({ success: false, error: 'Role already exists' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('user_roles')
            .insert({ role_name })
            .select()
            .single()

        if (error) {
            console.error('Error creating role:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data, message: 'Role created successfully' })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PUT - Update a role
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { role_id, role_name } = body

        if (!role_id || !role_name) {
            return NextResponse.json({ success: false, error: 'Role ID and name are required' }, { status: 400 })
        }

        // Prevent editing Super Admin role
        if (role_id === 1) {
            return NextResponse.json({ success: false, error: 'Cannot modify Super Admin role' }, { status: 403 })
        }

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
        }

        const { data, error } = await supabase
            .from('user_roles')
            .update({ role_name })
            .eq('role_id', role_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating role:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data, message: 'Role updated successfully' })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// DELETE - Delete a role (only non-system roles)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const roleId = searchParams.get('role_id')

        if (!roleId) {
            return NextResponse.json({ success: false, error: 'Role ID is required' }, { status: 400 })
        }

        const roleIdNum = parseInt(roleId)

        // Prevent deleting system roles (1-5)
        if (roleIdNum <= 5) {
            return NextResponse.json({
                success: false,
                error: 'Cannot delete system roles. Only custom roles can be deleted.'
            }, { status: 403 })
        }

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
        }

        // Check if any users have this role
        const { data: usersWithRole } = await supabase
            .from('users_new')
            .select('user_id')
            .eq('role_id', roleIdNum)
            .limit(1)

        if (usersWithRole && usersWithRole.length > 0) {
            return NextResponse.json({
                success: false,
                error: 'Cannot delete role. Users are assigned to this role.'
            }, { status: 400 })
        }

        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('role_id', roleIdNum)

        if (error) {
            console.error('Error deleting role:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Role deleted successfully' })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
