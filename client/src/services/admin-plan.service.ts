import { api } from '@/lib/axios'

export interface AdminPlan {
  id: string
  code: string
  name: string
  price: number
  currency: string
  durationDays: number
  description: string | null
  maxScreens: number
  sortOrder: number
  isActive: boolean
  _count: { subscriptions: number; payments: number }
}

export interface AdminPlanInput {
  code: string
  name: string
  price: number
  currency: string
  durationDays: number
  description: string | null
  maxScreens: number
  sortOrder: number
  isActive: boolean
}

export const getAdminPlans = async () => (await api.get<AdminPlan[]>('/admin/plans')).data
export const createAdminPlan = async (input: AdminPlanInput) => (await api.post<AdminPlan>('/admin/plans', input)).data
export const updateAdminPlan = async (id: string, input: Partial<AdminPlanInput>) => (await api.patch<AdminPlan>(`/admin/plans/${id}`, input)).data
