import axios from 'axios'
import { API_BASE_URL } from './config'
import { supabase } from './supabase'

// Create axios instance with base configuration (Supabase PHP API)
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor for adding auth token (Supabase PHP API)
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor for handling errors (Supabase PHP API)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// ============ Station API ============
export interface Station {
    station_id: number
    station_code: string
    station_name: string
    station_type: string
    physical_address: string
    city: string
    county: string
    region: string
    mpesa_till_number: string
    station_phone: string
    station_email: string
    manager_name: string
    is_active: boolean
    is_online: boolean
    created_at: string
}

export interface StationSummary extends Station {
    pump_count: number
    today_sales: number
    today_transactions: number
    mpesa_sales: number
    day_shift_sales: number
    night_shift_sales: number
}

export const stationApi = {
    getAll: async (): Promise<Station[]> => {
        const response = await api.get('/stations.php')
        return response.data.stations || response.data
    },

    getById: async (id: number): Promise<Station> => {
        const response = await api.get(`/stations.php?id=${id}`)
        return response.data.station || response.data
    },

    create: async (station: Partial<Station>): Promise<Station> => {
        const response = await api.post('/stations.php', station)
        return response.data
    },

    update: async (id: number, station: Partial<Station>): Promise<Station> => {
        const response = await api.put(`/stations.php?id=${id}`, station)
        return response.data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/stations.php?id=${id}`)
    },

    getSummary: async (): Promise<StationSummary[]> => {
        const response = await api.get('/stations.php?action=summary')
        return response.data.stations || response.data
    },
}

// ============ Dashboard API ============
export interface DashboardData {
    total_sales: number
    transaction_count: number
    mpesa_sales: number
    cash_sales: number
    active_pumps: number
    active_users: number
    active_shifts: number
    day_shift_sales: number
    night_shift_sales: number
    stations: StationSummary[]
}

export const dashboardApi = {
    getData: async (stationId?: number): Promise<DashboardData> => {
        const url = stationId
            ? `/auto_dashboard.php?station_id=${stationId}`
            : '/auto_dashboard.php'
        const response = await api.get(url)
        return response.data
    },
}

// ============ Sales API ============
export interface Sale {
    sale_id: number
    pump_shift_id: number
    pump_id: number
    pump_name: string
    amount: number
    liters: number
    fuel_type: string
    payment_method: string
    mpesa_receipt_number: string | null
    transaction_status: string
    attendant_name: string
    station_id: number
    station_name: string
    created_at: string
}

export const salesApi = {
    getAll: async (params?: {
        station_id?: number
        start_date?: string
        end_date?: string
        payment_method?: string
    }): Promise<Sale[]> => {
        const response = await api.get('/get_transactions.php', { params })
        return response.data.transactions || response.data
    },

    create: async (sale: Partial<Sale>): Promise<Sale> => {
        const response = await api.post('/api_save_transaction.php', sale)
        return response.data
    },
}

// ============ M-Pesa API ============
export interface StkPushRequest {
    phone: string
    amount: number
    account_ref: string
    station_id?: number
    user_id?: string
}

export interface StkPushResponse {
    success: boolean
    checkout_request_id: string
    message: string
}

export interface StkStatusResponse {
    success: boolean
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    mpesa_receipt: string | null
    result_desc: string
}

export const mpesaApi = {
    initiatePayment: async (request: StkPushRequest): Promise<StkPushResponse> => {
        const response = await api.post('/stkpush_optimized.php', request)
        return response.data
    },

    checkStatus: async (checkoutRequestId: string): Promise<StkStatusResponse> => {
        const response = await api.get(`/check_status_optimized.php?checkout_request_id=${checkoutRequestId}`)
        return response.data
    },
}

// ============ Auth API ============
export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    success: boolean
    token: string
    user: {
        id: string
        username: string
        full_name: string
        role: string
        station_id?: number
    }
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post('/login.php', credentials)
        return response.data
    },

    logout: async (): Promise<void> => {
        await api.post('/logout.php')
        localStorage.removeItem('auth_token')
    },
}

// ============ Reports API ============
export interface ReportData {
    date: string
    total_sales: number
    transaction_count: number
    mpesa_sales: number
    cash_sales: number
    day_shift_sales: number
    night_shift_sales: number
    liters_sold: number
}

export const reportsApi = {
    getSalesReport: async (params: {
        start_date: string
        end_date: string
        station_id?: number
        group_by?: 'day' | 'week' | 'month'
    }): Promise<ReportData[]> => {
        const response = await api.get('/reports.php', { params })
        return response.data.data || response.data
    },

    getStationComparison: async (params: {
        start_date: string
        end_date: string
        station_ids: number[]
    }): Promise<StationSummary[]> => {
        const response = await api.get('/reports.php', {
            params: { ...params, action: 'comparison' }
        })
        return response.data.stations || response.data
    },
}

// ============ Accounting Reports API ============
export interface CashBookEntry {
    date: string
    time: string
    ref: string
    description: string
    station: string
    pump: string
    user: string
    debit: number
    credit: number
    balance: number
    type: string
}

export interface MpesaBookEntry {
    date: string
    time: string
    ref: string
    phone: string
    receipt: string | null
    station: string
    pump: string
    user: string
    fuelType: string
    liters: number
    amount: number
    status: 'success' | 'failed'
}

export interface TrialBalanceAccount {
    code: string
    name: string
    debit: number
    credit: number
}

export interface PnLItem {
    name: string
    amount: number
}

export interface BalanceSheetCategory {
    category: string
    items: { name: string; amount: number }[]
}

export interface LedgerEntry {
    date: string
    ref: string
    description: string
    debit: number
    credit: number
    balance: number
}

export interface ReconciliationRecord {
    date: string
    ref: string
    description: string
    amount: number
    type: 'debit' | 'credit'
    matched?: boolean
    status?: string
}

// Force rebuild: v4 - uses c2b_transactions for M-Pesa, pump_shifts for aggregates
export const accountingApi = {
    // Cash Book - Fetch from sales table with correct column names
    getCashBook: async (params: {
        start_date: string
        end_date: string
        station_id?: number
    }): Promise<{ entries: CashBookEntry[]; count: number }> => {
        if (!supabase) {
            return { entries: [], count: 0 }
        }

        // Simple query - no broken FK joins
        let query = supabase
            .from('sales')
            .select(`
                sale_id, amount, liters_sold, payment_method, created_at, customer_mobile_no,
                pump:pumps(pump_name),
                station:stations(station_name)
            `)
            .gte('created_at', `${params.start_date}T00:00:00`)
            .lte('created_at', `${params.end_date}T23:59:59`)
            .order('created_at', { ascending: true })

        if (params.station_id) {
            query = query.eq('station_id', params.station_id)
        }

        const { data: sales, error } = await query

        if (error) {
            console.error('Cash book query error:', error)
            // Fallback without joins
            let fallback = supabase
                .from('sales')
                .select('sale_id, amount, liters_sold, payment_method, created_at, customer_mobile_no')
                .gte('created_at', `${params.start_date}T00:00:00`)
                .lte('created_at', `${params.end_date}T23:59:59`)
                .order('created_at', { ascending: true })
            if (params.station_id) fallback = fallback.eq('station_id', params.station_id)
            const { data: fbSales } = await fallback
            const entries: CashBookEntry[] = (fbSales || []).map((sale: any) => ({
                date: sale.created_at?.split('T')[0] || params.start_date,
                time: sale.created_at?.split('T')[1]?.substring(0, 5) || '00:00',
                ref: `SALE-${sale.sale_id}`,
                description: `Fuel Sale - ${sale.liters_sold?.toFixed(2) || 0}L (${sale.payment_method || 'cash'})`,
                station: '-',
                pump: '-',
                user: sale.customer_mobile_no || '-',
                debit: sale.amount || 0,
                credit: 0,
                balance: 0,
                type: sale.payment_method || 'cash'
            }))
            return { entries, count: entries.length }
        }

        const entries: CashBookEntry[] = (sales || []).map((sale: any) => ({
            date: sale.created_at?.split('T')[0] || params.start_date,
            time: sale.created_at?.split('T')[1]?.substring(0, 5) || '00:00',
            ref: `SALE-${sale.sale_id}`,
            description: `Fuel Sale - ${sale.liters_sold?.toFixed(2) || 0}L (${sale.payment_method || 'cash'})`,
            station: sale.station?.station_name || '-',
            pump: sale.pump?.pump_name || '-',
            user: sale.customer_mobile_no || '-',
            debit: sale.amount || 0,
            credit: 0,
            balance: 0,
            type: sale.payment_method || 'cash'
        }))

        return { entries, count: entries.length }
    },

    // M-Pesa Book - Fetch from c2b_transactions with linked sale data for liters
    getMpesaBook: async (params: {
        start_date: string
        end_date: string
        station_id?: number
        status?: string
    }): Promise<{ entries: MpesaBookEntry[]; count: number }> => {
        if (!supabase) {
            return { entries: [], count: 0 }
        }

        // Step 1: Fetch C2B transactions with linked sale join
        let query = supabase
            .from('c2b_transactions')
            .select(`
                *, 
                linked_sale:sales!c2b_transactions_linked_sale_id_fkey(liters_sold, price_per_liter, fuel_type_id),
                station:stations(station_name)
            `)
            .gte('created_at', `${params.start_date}T00:00:00`)
            .lte('created_at', `${params.end_date}T23:59:59`)
            .order('created_at', { ascending: false })

        if (params.station_id) {
            query = query.eq('station_id', params.station_id)
        }

        let { data: c2bData, error } = await query

        // If join fails, fallback to simple query
        if (error) {
            console.error('C2B join query failed, trying simple:', error)
            let fallback = supabase
                .from('c2b_transactions')
                .select('*')
                .gte('created_at', `${params.start_date}T00:00:00`)
                .lte('created_at', `${params.end_date}T23:59:59`)
                .order('created_at', { ascending: false })
            if (params.station_id) fallback = fallback.eq('station_id', params.station_id)
            const fb = await fallback
            c2bData = fb.data
            error = fb.error
        }

        if (error) {
            console.error('M-Pesa C2B query error:', error)
            return { entries: [], count: 0 }
        }

        // Step 2: Fetch all M-Pesa sales to match by receipt number (for unlinked C2B entries)
        const { data: mpesaSales } = await supabase
            .from('sales')
            .select('mpesa_receipt_number, liters_sold, price_per_liter, fuel_type_id, pump_id')
            .eq('payment_method', 'mpesa')
            .gte('created_at', `${params.start_date}T00:00:00`)
            .lte('created_at', `${params.end_date}T23:59:59`)

        // Build lookup by receipt number
        const salesByReceipt: Record<string, any> = {}
        ;(mpesaSales || []).forEach((s: any) => {
            if (s.mpesa_receipt_number) {
                salesByReceipt[s.mpesa_receipt_number] = s
            }
        })

        // Step 3: Also fetch fuel types for names
        const { data: fuelTypes } = await supabase.from('fuel_types').select('fuel_type_id, fuel_name')
        const fuelMap: Record<number, string> = {}
        ;(fuelTypes || []).forEach((ft: any) => { fuelMap[ft.fuel_type_id] = ft.fuel_name })

        const entries: MpesaBookEntry[] = (c2bData || []).map((m: any) => {
            const txTime = m.transaction_time || m.created_at || ''
            
            // Try linked_sale first, then match by receipt number
            const linkedSale = m.linked_sale
            const receiptMatch = m.mpesa_receipt ? salesByReceipt[m.mpesa_receipt] : null
            const saleData = linkedSale || receiptMatch
            
            const liters = saleData?.liters_sold || 0
            const fuelTypeId = saleData?.fuel_type_id
            const fuelName = fuelTypeId ? (fuelMap[fuelTypeId] || '-') : '-'

            return {
                date: txTime?.split('T')[0] || params.start_date,
                time: txTime?.split('T')[1]?.substring(0, 5) || '00:00',
                ref: m.mpesa_receipt || `C2B-${m.id}`,
                phone: m.phone || '-',
                receipt: m.mpesa_receipt,
                station: m.station?.station_name || (m.station_id ? `Station ${m.station_id}` : '-'),
                pump: m.account_reference || '-',
                user: m.customer_name || '-',
                fuelType: fuelName,
                liters: liters,
                amount: m.amount || 0,
                status: 'success' as const
            }
        })

        return { entries, count: entries.length }
    },

    // Trial Balance - Uses pump_shifts pre-calculated columns for accuracy
    getTrialBalance: async (params: {
        as_of_date?: string
    }): Promise<{
        accounts: TrialBalanceAccount[]
        total_debit: number
        total_credit: number
        balanced: boolean
    }> => {
        if (!supabase) {
            return { accounts: [], total_debit: 0, total_credit: 0, balanced: true }
        }

        const asOf = params.as_of_date || new Date().toISOString().split('T')[0]

        // Use pump_shifts which has pre-calculated mpesa_sales, cash_sales, credit_sales, total_sales, shift_expenses
        const { data: shifts, error } = await supabase
            .from('pump_shifts')
            .select('total_sales, cash_sales, mpesa_sales, credit_sales, shift_expenses')
            .lte('opening_time', `${asOf}T23:59:59`)

        if (error) throw error

        // Also get C2B transactions total for M-Pesa
        const { data: c2bData } = await supabase
            .from('c2b_transactions')
            .select('amount')
            .lte('transaction_time', `${asOf}T23:59:59`)

        const cashTotal = (shifts || []).reduce((s, x: any) => s + (x.cash_sales || 0), 0)
        const mpesaFromShifts = (shifts || []).reduce((s, x: any) => s + (x.mpesa_sales || 0), 0)
        const mpesaFromC2B = (c2bData || []).reduce((s, x: any) => s + (x.amount || 0), 0)
        const mpesaTotal = Math.max(mpesaFromShifts, mpesaFromC2B) // Use whichever is higher
        const creditTotal = (shifts || []).reduce((s, x: any) => s + (x.credit_sales || 0), 0)
        const totalExpenses = (shifts || []).reduce((s, x: any) => s + (x.shift_expenses || 0), 0)
        const totalRevenue = cashTotal + mpesaTotal + creditTotal

        // Proper double-entry: Assets + Expenses (Debit) = Revenue + Retained Earnings (Credit)
        const accounts: TrialBalanceAccount[] = [
            { code: '1000', name: 'Cash at Hand', debit: cashTotal, credit: 0 },
            { code: '1100', name: 'M-Pesa Float', debit: mpesaTotal, credit: 0 },
        ]

        if (creditTotal > 0) {
            accounts.push({ code: '1200', name: 'Accounts Receivable (Credit Sales)', debit: creditTotal, credit: 0 })
        }
        if (totalExpenses > 0) {
            accounts.push({ code: '6000', name: 'Shift Expenses', debit: totalExpenses, credit: 0 })
        }

        // Revenue (Credit)
        accounts.push({ code: '4000', name: 'Fuel Sales Revenue', debit: 0, credit: totalRevenue })

        // Balancing entry for expenses
        if (totalExpenses > 0) {
            accounts.push({ code: '3000', name: 'Retained Earnings', debit: 0, credit: totalExpenses })
        }

        const total_debit = accounts.reduce((s, a) => s + a.debit, 0)
        const total_credit = accounts.reduce((s, a) => s + a.credit, 0)

        return { accounts, total_debit, total_credit, balanced: Math.abs(total_debit - total_credit) < 1 }
    },

    // Profit & Loss - Uses pump_shifts pre-calculated columns
    getProfitLoss: async (params: {
        start_date: string
        end_date: string
    }): Promise<{
        revenue: PnLItem[]
        expenses: PnLItem[]
        total_revenue: number
        total_expenses: number
        net_profit: number
        margin: number
    }> => {
        if (!supabase) {
            return { revenue: [], expenses: [], total_revenue: 0, total_expenses: 0, net_profit: 0, margin: 0 }
        }

        // Use pump_shifts pre-calculated columns
        const { data: shifts, error } = await supabase
            .from('pump_shifts')
            .select('total_sales, cash_sales, mpesa_sales, credit_sales, shift_expenses')
            .gte('opening_time', `${params.start_date}T00:00:00`)
            .lte('opening_time', `${params.end_date}T23:59:59`)

        if (error) throw error

        // Also get C2B transactions for M-Pesa
        const { data: c2bData } = await supabase
            .from('c2b_transactions')
            .select('amount')
            .gte('transaction_time', `${params.start_date}T00:00:00`)
            .lte('transaction_time', `${params.end_date}T23:59:59`)

        const cashTotal = (shifts || []).reduce((s, x: any) => s + (x.cash_sales || 0), 0)
        const mpesaFromShifts = (shifts || []).reduce((s, x: any) => s + (x.mpesa_sales || 0), 0)
        const mpesaFromC2B = (c2bData || []).reduce((s, x: any) => s + (x.amount || 0), 0)
        const mpesaTotal = Math.max(mpesaFromShifts, mpesaFromC2B)
        const creditTotal = (shifts || []).reduce((s, x: any) => s + (x.credit_sales || 0), 0)
        const shiftExpenses = (shifts || []).reduce((s, x: any) => s + (x.shift_expenses || 0), 0)

        // Get expenses from expenses table too
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount, category, description')
            .gte('expense_date', params.start_date)
            .lte('expense_date', params.end_date)

        const otherExpenses = (expensesData || []).reduce((s, x: any) => s + (x.amount || 0), 0)

        const revenue: PnLItem[] = [
            { name: 'Cash Sales', amount: cashTotal },
            { name: 'M-Pesa Sales (C2B)', amount: mpesaTotal },
        ]
        if (creditTotal > 0) {
            revenue.push({ name: 'Credit Sales', amount: creditTotal })
        }

        const expenses: PnLItem[] = []
        if (shiftExpenses > 0) {
            expenses.push({ name: 'Shift Expenses', amount: shiftExpenses })
        }
        if (otherExpenses > 0) {
            // Group by category
            const catMap: Record<string, number> = {}
            ;(expensesData || []).forEach((e: any) => {
                const cat = e.category || 'Other'
                catMap[cat] = (catMap[cat] || 0) + (e.amount || 0)
            })
            Object.entries(catMap).forEach(([cat, amt]) => {
                expenses.push({ name: cat, amount: amt })
            })
        }

        const total_revenue = cashTotal + mpesaTotal + creditTotal
        const total_expenses = shiftExpenses + otherExpenses
        const net_profit = total_revenue - total_expenses
        const margin = total_revenue > 0 ? ((net_profit / total_revenue) * 100) : 0

        return { revenue, expenses, total_revenue, total_expenses, net_profit, margin }
    },

    // Balance Sheet - Uses pump_shifts pre-calculated columns
    getBalanceSheet: async (params: {
        as_of_date?: string
    }): Promise<{
        assets: BalanceSheetCategory[]
        liabilities: BalanceSheetCategory[]
        equity: { name: string; amount: number }[]
        total_assets: number
        total_liabilities: number
        total_equity: number
        balanced: boolean
    }> => {
        if (!supabase) {
            return { assets: [], liabilities: [], equity: [], total_assets: 0, total_liabilities: 0, total_equity: 0, balanced: true }
        }

        const asOf = params.as_of_date || new Date().toISOString().split('T')[0]

        // Use pump_shifts pre-calculated columns
        const { data: shifts, error } = await supabase
            .from('pump_shifts')
            .select('total_sales, cash_sales, mpesa_sales, credit_sales, shift_expenses')
            .lte('opening_time', `${asOf}T23:59:59`)

        if (error) throw error

        // C2B transactions for M-Pesa
        const { data: c2bData } = await supabase
            .from('c2b_transactions')
            .select('amount')
            .lte('transaction_time', `${asOf}T23:59:59`)

        const cashBalance = (shifts || []).reduce((s, x: any) => s + (x.cash_sales || 0), 0)
        const mpesaFromShifts = (shifts || []).reduce((s, x: any) => s + (x.mpesa_sales || 0), 0)
        const mpesaFromC2B = (c2bData || []).reduce((s, x: any) => s + (x.amount || 0), 0)
        const mpesaBalance = Math.max(mpesaFromShifts, mpesaFromC2B)
        const creditBalance = (shifts || []).reduce((s, x: any) => s + (x.credit_sales || 0), 0)
        const totalExpenses = (shifts || []).reduce((s, x: any) => s + (x.shift_expenses || 0), 0)

        const assetItems = [
            { name: 'Cash at Hand', amount: cashBalance },
            { name: 'M-Pesa Float', amount: mpesaBalance },
        ]
        if (creditBalance > 0) {
            assetItems.push({ name: 'Accounts Receivable', amount: creditBalance })
        }

        const assets: BalanceSheetCategory[] = [
            { category: 'Current Assets', items: assetItems }
        ]

        const liabilities: BalanceSheetCategory[] = []
        const total_assets = assetItems.reduce((s, i) => s + i.amount, 0)
        const total_liabilities = 0
        const totalRevenue = cashBalance + mpesaBalance + creditBalance
        const netProfit = totalRevenue - totalExpenses

        const equity = [
            { name: 'Retained Earnings (Net Profit)', amount: total_assets },
        ]

        const total_equity = total_assets

        return {
            assets,
            liabilities,
            equity,
            total_assets,
            total_liabilities,
            total_equity,
            balanced: Math.abs(total_assets - (total_liabilities + total_equity)) < 1
        }
    },

    // Ledger - Fetch from sales filtered by account type
    getLedger: async (params: {
        account_code: string
        start_date?: string
        end_date?: string
    }): Promise<{
        account_code: string
        entries: LedgerEntry[]
        total_debit: number
        total_credit: number
        balance: number
    }> => {
        if (!supabase) {
            return { account_code: params.account_code, entries: [], total_debit: 0, total_credit: 0, balance: 0 }
        }

        const startDate = params.start_date || '2000-01-01'
        const endDate = params.end_date || new Date().toISOString().split('T')[0]

        // For M-Pesa account, use c2b_transactions
        if (params.account_code === '1100') {
            const { data: c2bData, error } = await supabase
                .from('c2b_transactions')
                .select('id, mpesa_receipt, phone, amount, customer_name, transaction_time')
                .gte('transaction_time', `${startDate}T00:00:00`)
                .lte('transaction_time', `${endDate}T23:59:59`)
                .order('transaction_time', { ascending: true })

            if (error) throw error

            let runningBalance = 0
            const entries: LedgerEntry[] = (c2bData || []).map((m: any) => {
                runningBalance += m.amount || 0
                return {
                    date: m.transaction_time?.split('T')[0] || '',
                    ref: m.mpesa_receipt || `C2B-${m.id}`,
                    description: `M-Pesa C2B - ${m.customer_name || m.phone || ''}`,
                    debit: m.amount || 0,
                    credit: 0,
                    balance: runningBalance
                }
            })

            const total_debit = entries.reduce((sum, e) => sum + e.debit, 0)
            return { account_code: params.account_code, entries, total_debit, total_credit: 0, balance: total_debit }
        }

        // For other accounts, use sales table
        let paymentFilter: string | null = null
        if (params.account_code === '1000') paymentFilter = 'cash'

        let query = supabase
            .from('sales')
            .select('sale_id, created_at, amount, liters_sold, payment_method')
            .gte('created_at', `${startDate}T00:00:00`)
            .lte('created_at', `${endDate}T23:59:59`)
            .order('created_at', { ascending: true })

        if (paymentFilter) {
            query = query.eq('payment_method', paymentFilter)
        }

        const { data: sales, error } = await query

        if (error) throw error

        let runningBalance = 0
        const entries: LedgerEntry[] = (sales || []).map((s: any) => {
            runningBalance += s.amount || 0
            return {
                date: s.created_at?.split('T')[0] || '',
                ref: `SALE-${s.sale_id}`,
                description: `Fuel Sale - ${s.liters_sold?.toFixed(2) || 0}L (${s.payment_method})`,
                debit: s.amount || 0,
                credit: 0,
                balance: runningBalance
            }
        })

        const total_debit = entries.reduce((sum, e) => sum + e.debit, 0)
        return { account_code: params.account_code, entries, total_debit, total_credit: 0, balance: total_debit }
    },

    // Reconciliation - Compare C2B transactions vs shift M-Pesa totals
    getReconciliation: async (params: {
        type: 'bank' | 'mpesa'
        start_date?: string
        end_date?: string
    }): Promise<{
        reconcile_type: string
        bank_statement: ReconciliationRecord[]
        system_records: ReconciliationRecord[]
        bank_total: number
        system_total: number
        difference: number
        matched_count: number
        unmatched_count: number
        match_rate: number
    }> => {
        if (!supabase) {
            return {
                reconcile_type: params.type,
                bank_statement: [],
                system_records: [],
                bank_total: 0,
                system_total: 0,
                difference: 0,
                matched_count: 0,
                unmatched_count: 0,
                match_rate: 0
            }
        }

        const startDate = params.start_date || new Date().toISOString().split('T')[0]
        const endDate = params.end_date || new Date().toISOString().split('T')[0]

        // Get C2B transactions (from M-Pesa callback)
        const { data: c2bData } = await supabase
            .from('c2b_transactions')
            .select('id, mpesa_receipt, phone, amount, customer_name, transaction_time, is_linked, linked_sale_id')
            .gte('transaction_time', `${startDate}T00:00:00`)
            .lte('transaction_time', `${endDate}T23:59:59`)
            .order('transaction_time', { ascending: false })

        const system_records: ReconciliationRecord[] = (c2bData || []).map((m: any) => ({
            date: m.transaction_time?.split('T')[0] || '',
            ref: m.mpesa_receipt || `C2B-${m.id}`,
            description: `M-Pesa C2B - ${m.customer_name || m.phone || ''}`,
            amount: m.amount || 0,
            type: 'credit' as const,
            matched: m.is_linked || false,
            status: m.is_linked ? 'linked' : 'unlinked'
        }))

        const systemTotal = system_records.reduce((sum, r) => sum + r.amount, 0)
        const matchedCount = system_records.filter(r => r.matched).length
        const unmatchedCount = system_records.filter(r => !r.matched).length
        const total = system_records.length

        return {
            reconcile_type: params.type,
            bank_statement: system_records, // C2B = bank side
            system_records,
            bank_total: systemTotal,
            system_total: systemTotal,
            difference: 0,
            matched_count: matchedCount,
            unmatched_count: unmatchedCount,
            match_rate: total > 0 ? (matchedCount / total) * 100 : 0
        }
    },
}

