import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const stationId = searchParams.get('station_id')

    let query = supabase
      .from('mpesa_transactions')
      .select(`
        *,
        pump:pumps(pump_name, station:stations(station_name)),
        user:users(full_name)
      `)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false })

    if (stationId) {
      query = query.eq('station_id', parseInt(stationId))
    }

    const { data: mpesaData, error } = await query

    if (error) throw error

    const entries = (mpesaData || []).map((m: any) => ({
      date: m.created_at?.split('T')[0] || startDate,
      time: m.created_at?.split('T')[1]?.substring(0, 5) || '00:00',
      ref: m.checkout_request_id || `MPESA-${m.id}`,
      phone: m.phone_number || 'Unknown',
      receipt: m.mpesa_receipt_number,
      station: m.pump?.station?.station_name || 'Unknown',
      pump: m.pump?.pump_name || 'Unknown',
      user: m.user?.full_name || 'Unknown',
      fuelType: m.fuel_type || 'Petrol',
      liters: m.liters || 0,
      amount: m.amount || 0,
      status: m.status || 'success'
    }))

    return NextResponse.json({
      entries,
      count: entries.length
    })
  } catch (error: any) {
    console.error('M-Pesa book error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch M-Pesa book', details: error.message },
      { status: 500 }
    )
  }
}
