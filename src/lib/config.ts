// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://online-link.onrender.com'

// API Endpoints
export const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/login.php',
    LOGOUT: '/logout.php',

    // Stations
    STATIONS: '/stations.php',
    STATION_DETAILS: (id: number) => `/stations.php?id=${id}`,

    // M-Pesa
    STK_PUSH: '/stkpush_optimized.php',
    STK_STATUS: '/check_status_optimized.php',

    // Sales & Transactions
    SALES: '/get_transactions.php',
    SAVE_SALE: '/api_save_transaction.php',

    // Dashboard
    DASHBOARD: '/auto_dashboard.php',

    // Reports
    REPORTS: '/reports.php',
}

// App Configuration
export const APP_CONFIG = {
    name: 'Energy Station Manager',
    version: '1.0.0',
    description: 'Multi-Station Fuel Management System',
    company: 'Energy Solutions Ltd',
}

// Theme Colors
export const THEME_COLORS = {
    primary: '#667EEA',
    secondary: '#764BA2',
    accent: '#FF6B9D',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
}

// Shift Types
export const SHIFT_TYPES = [
    { id: 1, name: 'Day Shift', startTime: '06:00', endTime: '18:00' },
    { id: 2, name: 'Night Shift', startTime: '18:00', endTime: '06:00' },
]

// Payment Methods
export const PAYMENT_METHODS = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'mpesa', name: 'M-Pesa', icon: '📱' },
    { id: 'card', name: 'Card', icon: '💳' },
]

// User Roles
export const USER_ROLES = [
    { id: 'super_admin', name: 'Super Admin', level: 1 },
    { id: 'station_admin', name: 'Station Admin', level: 2 },
    { id: 'manager', name: 'Manager', level: 3 },
    { id: 'supervisor', name: 'Supervisor', level: 4 },
    { id: 'attendant', name: 'Pump Attendant', level: 5 },
]

// Fuel Types
export const FUEL_TYPES = [
    { id: 'petrol', name: 'Petrol', color: '#22C55E', icon: '⛽' },
    { id: 'diesel', name: 'Diesel', color: '#EAB308', icon: '🛢️' },
    { id: 'premium', name: 'Premium', color: '#3B82F6', icon: '💎' },
    { id: 'lpg', name: 'LPG Gas', color: '#F97316', icon: '🔥' },
]
