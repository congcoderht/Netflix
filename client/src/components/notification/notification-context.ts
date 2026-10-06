import { createContext, useContext } from 'react'
import type { AppNotification } from '@/services/notification.service'

export interface NotificationContextValue {
  items: AppNotification[]
  unreadCount: number
  loading: boolean
  hasMore: boolean
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}
