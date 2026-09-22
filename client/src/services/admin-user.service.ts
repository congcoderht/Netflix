import { api } from '@/lib/axios'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  role: 'USER' | 'ADMIN'
  isBlocked: boolean
  createdAt: string
  subscription: { expiresAt: string; plan: { id: string; name: string; code: string } } | null
  _count: { payments: number }
}

export interface AdminUsersResponse { items: AdminUser[]; total: number; page: number; limit: number; totalPages: number }

export const getAdminUsers = async (page: number, search: string) => (await api.get<AdminUsersResponse>('/admin/users', { params: { page, limit: 20, search: search || undefined } })).data
export const updateAdminUser = async (id: string, data: { isBlocked: boolean }) => (await api.patch<{ id: string; isBlocked: boolean }>(`/admin/users/${id}`, data)).data
