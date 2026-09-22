import { api } from '@/lib/axios'

export interface AdminDashboardData {
  summary: {
    totalUsers: number
    newUsersThisMonth: number
    activeSubscriptions: number
    revenueInPeriod: number
    successfulPayments: number
    failedPayments: number
    movies: number
    series: number
  }
  period: { type: 'month' | 'year'; year: number; month: number | null; timezone: string }
  revenueSeries: { key: string; label: string; amount: number }[]
  topMovies: { id: string; title: string; thumbnail: string | null; type: 'MOVIE' | 'SERIES'; views: number }[]
  recentPayments: {
    id: string
    orderId: string
    planName: string
    provider: string
    amount: number
    currency: string
    status: 'SUCCESS' | 'FAILED'
    createdAt: string
    paidAt: string | null
    revenueAt: string
    user: { email: string; name: string | null }
  }[]
}

export const getAdminDashboard = async (period: 'month' | 'year', year: number, month: number) => (await api.get<AdminDashboardData>('/admin/dashboard', {
  params: { period, year, ...(period === 'month' ? { month } : {}) },
})).data
