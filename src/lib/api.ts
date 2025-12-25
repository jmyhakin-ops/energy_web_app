import axios from 'axios'
import { API_BASE_URL } from './config'

// Create axios instance with base configuration
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor for adding auth token
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

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - redirect to login
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
