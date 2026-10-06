import { api } from '@/lib/axios'

export type NotificationType = 'NEW_MOVIE' | 'COMMENT' | 'PAYMENT' | 'SUBSCRIPTION' | 'SECURITY' | 'SYSTEM'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  eventKey: string
  data: Record<string, string | number | boolean | null> | null
  actionUrl: string | null
  readAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface NotificationPage {
  items: AppNotification[]
  nextCursor: string | null
  unreadCount: number
}

export const getNotifications = async (cursor?: string) => (await api.get<NotificationPage>('/notifications', {
  params: { limit: 20, cursor },
})).data

export const markNotificationRead = async (id: string) => (await api.patch<AppNotification>(`/notifications/${id}/read`)).data
export const markAllNotificationsRead = async () => (await api.patch<{ updated: number }>('/notifications/read-all')).data
export const deleteNotification = (id: string) => api.delete(`/notifications/${id}`)

export interface SystemNotificationInput {
  titleVi: string
  titleEn: string
  bodyVi: string
  bodyEn: string
  actionUrl?: string | null
  expiresAt?: string | null
}

export const broadcastSystemNotification = async (input: SystemNotificationInput) => (
  await api.post<{ recipients: number }>('/admin/notifications/broadcast', input)
).data
