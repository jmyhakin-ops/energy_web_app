"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'

// ==================== BACKGROUND WORKER HOOK ====================
interface BackgroundWorkerConfig {
    // Auto-refresh intervals (in milliseconds)
    dashboardRefreshInterval?: number  // Default: 30 seconds
    stationsRefreshInterval?: number   // Default: 60 seconds
    salesRefreshInterval?: number      // Default: 15 seconds
    mpesaPollingInterval?: number      // Default: 2 seconds (for pending payments)

    // Enable/disable features
    enableAutoRefresh?: boolean
    enableNotifications?: boolean
    enableMpesaPolling?: boolean

    // Callbacks
    onDataRefresh?: () => void
    onNewSale?: (sale: any) => void
    onMpesaUpdate?: (status: string, data: any) => void
}

export function useBackgroundWorker(config: BackgroundWorkerConfig = {}) {
    const queryClient = useQueryClient()
    const workersRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
    const lastSalesCountRef = useRef<number>(0)

    const {
        dashboardRefreshInterval = 30000,
        stationsRefreshInterval = 60000,
        salesRefreshInterval = 15000,
        mpesaPollingInterval = 2000,
        enableAutoRefresh = true,
        enableNotifications = true,
        enableMpesaPolling = false,
        onDataRefresh,
        onNewSale,
        onMpesaUpdate,
    } = config

    // ============ AUTO-REFRESH WORKERS ============
    const startDashboardWorker = useCallback(() => {
        if (!enableAutoRefresh) return

        workersRef.current.dashboard = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            onDataRefresh?.()
        }, dashboardRefreshInterval)

        console.log('📊 Dashboard worker started')
    }, [dashboardRefreshInterval, enableAutoRefresh, onDataRefresh, queryClient])

    const startStationsWorker = useCallback(() => {
        if (!enableAutoRefresh) return

        workersRef.current.stations = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['stations'] })
        }, stationsRefreshInterval)

        console.log('🏢 Stations worker started')
    }, [stationsRefreshInterval, enableAutoRefresh, queryClient])

    const startSalesWorker = useCallback(() => {
        if (!enableAutoRefresh) return

        workersRef.current.sales = setInterval(async () => {
            // Check for new sales
            queryClient.invalidateQueries({ queryKey: ['sales'] })

            // Optionally check for new sales count and notify
            if (enableNotifications) {
                try {
                    const salesData = queryClient.getQueryData<any[]>(['sales'])
                    if (salesData && salesData.length > lastSalesCountRef.current) {
                        const newSalesCount = salesData.length - lastSalesCountRef.current
                        if (lastSalesCountRef.current > 0 && newSalesCount > 0) {
                            toast.success(
                                `🎉 ${newSalesCount} New Sale${newSalesCount > 1 ? 's' : ''}!`,
                                'Transactions updated'
                            )
                            onNewSale?.(salesData[0])
                        }
                        lastSalesCountRef.current = salesData.length
                    }
                } catch (error) {
                    console.error('Error checking for new sales:', error)
                }
            }
        }, salesRefreshInterval)

        console.log('💰 Sales worker started')
    }, [salesRefreshInterval, enableAutoRefresh, enableNotifications, onNewSale, queryClient])

    // ============ M-PESA POLLING WORKER ============
    const pendingPaymentsRef = useRef<Map<string, { attempts: number; amount: number }>>(new Map())

    const addMpesaPayment = useCallback((checkoutRequestId: string, amount: number) => {
        pendingPaymentsRef.current.set(checkoutRequestId, { attempts: 0, amount })

        // Start polling if not already started
        if (!workersRef.current.mpesa && enableMpesaPolling) {
            startMpesaWorker()
        }

        toast.mpesaPending()
        console.log(`📱 Added M-Pesa payment to poll: ${checkoutRequestId}`)
    }, [enableMpesaPolling])

    const startMpesaWorker = useCallback(() => {
        if (workersRef.current.mpesa) return

        workersRef.current.mpesa = setInterval(async () => {
            const pending = pendingPaymentsRef.current

            if (pending.size === 0) {
                clearInterval(workersRef.current.mpesa)
                delete workersRef.current.mpesa
                return
            }

            for (const [checkoutId, data] of pending) {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'https://online-link.onrender.com'}/check_status_optimized.php?checkout_request_id=${checkoutId}`
                    )
                    const result = await response.json()

                    if (result.status === 'completed') {
                        toast.dismiss()
                        toast.mpesaSuccess(data.amount, result.mpesa_receipt || 'N/A')
                        onMpesaUpdate?.('completed', result)
                        pending.delete(checkoutId)
                        queryClient.invalidateQueries({ queryKey: ['sales'] })
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                    } else if (result.status === 'failed' || result.status === 'cancelled') {
                        toast.dismiss()
                        toast.mpesaFailed(result.result_desc)
                        onMpesaUpdate?.(result.status, result)
                        pending.delete(checkoutId)
                    } else {
                        // Still pending, increment attempts
                        data.attempts++
                        if (data.attempts > 60) { // Max 2 minutes
                            toast.dismiss()
                            toast.mpesaFailed('Payment timed out')
                            onMpesaUpdate?.('timeout', result)
                            pending.delete(checkoutId)
                        }
                    }
                } catch (error) {
                    console.error(`Error polling M-Pesa status for ${checkoutId}:`, error)
                    data.attempts++
                }
            }
        }, mpesaPollingInterval)

        console.log('📱 M-Pesa polling worker started')
    }, [mpesaPollingInterval, onMpesaUpdate, queryClient])

    // ============ START ALL WORKERS ============
    const startAllWorkers = useCallback(() => {
        startDashboardWorker()
        startStationsWorker()
        startSalesWorker()
        console.log('🚀 All background workers started')
    }, [startDashboardWorker, startStationsWorker, startSalesWorker])

    // ============ STOP ALL WORKERS ============
    const stopAllWorkers = useCallback(() => {
        Object.values(workersRef.current).forEach(clearInterval)
        workersRef.current = {}
        console.log('⏹️ All background workers stopped')
    }, [])

    // ============ LIFECYCLE ============
    useEffect(() => {
        startAllWorkers()
        return () => stopAllWorkers()
    }, [startAllWorkers, stopAllWorkers])

    // ============ VISIBILITY CHANGE ============
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopAllWorkers()
                console.log('📴 App hidden, workers paused')
            } else {
                startAllWorkers()
                // Force refresh on return
                queryClient.invalidateQueries()
                console.log('📲 App visible, workers resumed')
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [startAllWorkers, stopAllWorkers, queryClient])

    return {
        startAllWorkers,
        stopAllWorkers,
        addMpesaPayment,
        refreshDashboard: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        refreshStations: () => queryClient.invalidateQueries({ queryKey: ['stations'] }),
        refreshSales: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
        refreshAll: () => queryClient.invalidateQueries(),
    }
}

// ==================== ONLINE STATUS HOOK ====================
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = React.useState(true)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            toast.success('🌐 Back Online!', 'Connection restored')
        }

        const handleOffline = () => {
            setIsOnline(false)
            toast.warning('📴 You are offline', 'Some features may not work')
        }

        setIsOnline(navigator.onLine)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return isOnline
}

// Import React for useOnlineStatus
import * as React from 'react'
