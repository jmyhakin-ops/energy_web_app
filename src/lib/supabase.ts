import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables - set these in .env.local or Vercel Dashboard
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if credentials are provided
let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase

// ==================== DATABASE TYPES ====================
export interface Station {
    station_id: number
    station_code: string
    station_name: string
    station_type: string
    physical_address: string | null
    city: string | null
    county: string | null
    region: string | null
    station_phone: string | null
    station_email: string | null
    manager_name: string | null
    manager_phone: string | null
    is_active: boolean
    is_online: boolean
    is_24_hours: boolean
    last_sync_at: string | null
    created_at: string
}

export interface Pump {
    pump_id: number
    pump_name: string
    is_active: boolean
    station_id: number
    created_at: string
    station?: Station
}

export interface User {
    user_id: number
    full_name: string
    username: string
    mobile_no: string | null
    role_id: number
    is_active: boolean
    created_at: string
    role?: UserRole
}

export interface UserRole {
    role_id: number
    role_name: string
}

export interface Shift {
    shift_id: number
    shift_name: string
    start_time: string | null
    end_time: string | null
    created_at: string
}

export interface PumpShift {
    pump_shift_id: number
    pump_id: number
    shift_id: number
    attendant_id: number
    opening_reading: number
    closing_reading: number | null
    opening_time: string
    closing_time: string | null
    amount_received: number
    is_closed: boolean
    station_id: number
    pump?: Pump
    shift?: Shift
    attendant?: User
    station?: Station
}

export interface Sale {
    sale_id: number
    sale_id_no: string
    pump_shift_id: number
    pump_id: number
    attendant_id: number
    amount: number
    customer_mobile_no: string | null
    transaction_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    checkout_request_id: string | null
    mpesa_receipt_number: string | null
    station_id: number
    created_at: string
    updated_at: string
    pump?: Pump
    station?: Station
}

export interface MpesaTransaction {
    id: string
    checkout_request_id: string
    merchant_request_id: string
    phone: string | null
    amount: number
    account_ref: string | null
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    mpesa_receipt: string | null
    mpesa_receipt_number: string | null
    result_desc: string | null
    station_id: number
    created_at: string
    completed_at: string | null
    station?: Station
}

export interface DailySummary {
    id: number
    station_id: number
    summary_date: string
    total_sales: number
    total_transactions: number
    mpesa_sales: number
    mpesa_transactions: number
    cash_sales: number
    cash_transactions: number
    petrol_volume: number
    diesel_volume: number
    premium_volume: number
    active_pumps: number
    active_attendants: number
    shifts_opened: number
    shifts_closed: number
    station?: Station
}

// ==================== API FUNCTIONS ====================

// Stations
export async function getStations(): Promise<Station[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .order('station_name')

    if (error) throw error
    return data as Station[]
}

export async function getStationById(stationId: number): Promise<Station | null> {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('station_id', stationId)
        .single()

    if (error) throw error
    return data as Station
}

// Pumps
export async function getPumps(stationId?: number): Promise<Pump[]> {
    if (!supabase) return []

    let query = supabase
        .from('pumps')
        .select('*, station:stations(*)')
        .eq('is_active', true)
        .order('pump_name')

    if (stationId) query = query.eq('station_id', stationId)

    const { data, error } = await query
    if (error) throw error
    return data as Pump[]
}

// Users/Attendants
export async function getUsers(roleId?: number): Promise<User[]> {
    if (!supabase) return []

    let query = supabase
        .from('users_new')
        .select('*, role:user_roles(*)')
        .eq('is_active', true)
        .order('full_name')

    if (roleId) query = query.eq('role_id', roleId)

    const { data, error } = await query
    if (error) throw error
    return data as User[]
}

// Shifts
export async function getShifts(): Promise<Shift[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('shift_name')

    if (error) throw error
    return data as Shift[]
}

// Pump Shifts (Active/Recent)
export async function getPumpShifts(stationId?: number, isActive?: boolean): Promise<PumpShift[]> {
    if (!supabase) return []

    let query = supabase
        .from('pump_shifts')
        .select('*, pump:pumps(*), shift:shifts(*), attendant:users_new(*), station:stations(*)')
        .order('opening_time', { ascending: false })
        .limit(50)

    if (stationId) query = query.eq('station_id', stationId)
    if (isActive !== undefined) query = query.eq('is_closed', !isActive)

    const { data, error } = await query
    if (error) throw error
    return data as PumpShift[]
}

// Sales
export async function getSales(filters?: {
    stationId?: number
    pumpId?: number
    attendantId?: number
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
}): Promise<Sale[]> {
    if (!supabase) return []

    let query = supabase
        .from('sales')
        .select('*, pump:pumps(*), station:stations(*)')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100)

    if (filters?.stationId) query = query.eq('station_id', filters.stationId)
    if (filters?.pumpId) query = query.eq('pump_id', filters.pumpId)
    if (filters?.attendantId) query = query.eq('attendant_id', filters.attendantId)
    if (filters?.status) query = query.eq('transaction_status', filters.status)
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

    const { data, error } = await query
    if (error) throw error
    return data as Sale[]
}

// M-Pesa Transactions
export async function getMpesaTransactions(filters?: {
    stationId?: number
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
}): Promise<MpesaTransaction[]> {
    if (!supabase) return []

    let query = supabase
        .from('mpesa_transactions')
        .select('*, station:stations(*)')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100)

    if (filters?.stationId) query = query.eq('station_id', filters.stationId)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

    const { data, error } = await query
    if (error) throw error
    return data as MpesaTransaction[]
}

// Daily Summaries
export async function getDailySummaries(filters?: {
    stationId?: number
    dateFrom?: string
    dateTo?: string
}): Promise<DailySummary[]> {
    if (!supabase) return []

    let query = supabase
        .from('station_daily_summaries')
        .select('*, station:stations(*)')
        .order('summary_date', { ascending: false })
        .limit(365)

    if (filters?.stationId) query = query.eq('station_id', filters.stationId)
    if (filters?.dateFrom) query = query.gte('summary_date', filters.dateFrom)
    if (filters?.dateTo) query = query.lte('summary_date', filters.dateTo)

    const { data, error } = await query
    if (error) throw error
    return data as DailySummary[]
}

// Dashboard Stats (Aggregated)
export async function getDashboardStats(stationId?: number) {
    if (!supabase) {
        // Return mock data when Supabase is not configured
        return {
            totalSales: 2547850,
            mpesaSales: 1823450,
            cashSales: 724400,
            transactionCount: 1247,
            activeShifts: 52,
            stationsOnline: 48,
            stationsTotal: 53,
        }
    }

    const today = new Date().toISOString().split('T')[0]

    try {
        // Get today's sales
        let salesQuery = supabase
            .from('sales')
            .select('amount, transaction_status, station_id')
            .gte('created_at', `${today}T00:00:00`)

        if (stationId) salesQuery = salesQuery.eq('station_id', stationId)

        const { data: sales, error: salesError } = await salesQuery
        if (salesError) throw salesError

        // Get M-Pesa transactions
        let mpesaQuery = supabase
            .from('mpesa_transactions')
            .select('amount, status, station_id')
            .gte('created_at', `${today}T00:00:00`)

        if (stationId) mpesaQuery = mpesaQuery.eq('station_id', stationId)

        const { data: mpesa, error: mpesaError } = await mpesaQuery
        if (mpesaError) throw mpesaError

        // Get active pump shifts
        let shiftsQuery = supabase
            .from('pump_shifts')
            .select('pump_shift_id, is_closed, station_id')
            .eq('is_closed', false)

        if (stationId) shiftsQuery = shiftsQuery.eq('station_id', stationId)

        const { data: shifts, error: shiftsError } = await shiftsQuery
        if (shiftsError) throw shiftsError

        // Get stations online
        const { data: stations, error: stationsError } = await supabase
            .from('stations')
            .select('station_id, is_online, is_active')
            .eq('is_active', true)

        if (stationsError) throw stationsError

        // Calculate stats
        const totalSales = sales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0
        const mpesaSales = mpesa?.filter(m => m.status === 'completed').reduce((sum, m) => sum + Number(m.amount), 0) || 0
        const cashSales = totalSales - mpesaSales
        const transactionCount = sales?.length || 0
        const activeShifts = shifts?.length || 0
        const stationsOnline = stations?.filter(s => s.is_online).length || 0
        const stationsTotal = stations?.length || 0

        return {
            totalSales,
            mpesaSales,
            cashSales,
            transactionCount,
            activeShifts,
            stationsOnline,
            stationsTotal,
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Return mock data on error
        return {
            totalSales: 2547850,
            mpesaSales: 1823450,
            cashSales: 724400,
            transactionCount: 1247,
            activeShifts: 52,
            stationsOnline: 48,
            stationsTotal: 53,
        }
    }
}

// Authentication
export async function loginUser(username: string, password: string): Promise<User | null> {
    if (!supabase) {
        throw new Error('Database not configured')
    }

    const { data, error } = await supabase
        .from('users_new')
        .select('*, role:user_roles(*)')
        .eq('username', username)
        .eq('is_active', true)
        .single()

    if (error || !data) {
        throw new Error('Invalid credentials')
    }

    return data as User
}

export { supabase }
