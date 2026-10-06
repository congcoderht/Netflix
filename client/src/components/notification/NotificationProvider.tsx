import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, bootstrapSession } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/services/notification.service'
import { NotificationContext } from './notification-context'
import LiveNotificationToast from './LiveNotificationToast'

const socketOrigin = () => apiBaseUrl.startsWith('http')
  ? new URL(apiBaseUrl).origin
  : window.location.origin

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [liveNotification, setLiveNotification] = useState<AppNotification | null>(null)
  const knownIds = useRef(new Set<string>())

  const refresh = useCallback(async () => {
    if (!useAuthStore.getState().accessToken) return
    setLoading(true)
    try {
      const result = await getNotifications()
      knownIds.current = new Set(result.items.map((item) => item.id))
      setItems(result.items)
      setUnreadCount(result.unreadCount)
      setNextCursor(result.nextCursor)
    } catch {
      // A transient API or cold-start failure is recovered on socket reconnect
      // or when the browser window receives focus again.
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return
    setLoading(true)
    try {
      const result = await getNotifications(nextCursor)
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id))
        result.items.forEach((item) => knownIds.current.add(item.id))
        return [...current, ...result.items.filter((item) => !ids.has(item.id))]
      })
      setUnreadCount(result.unreadCount)
      setNextCursor(result.nextCursor)
    } catch {
      // Keep the already loaded page and allow the user to retry.
    } finally {
      setLoading(false)
    }
  }, [loading, nextCursor])

  useEffect(() => {
    if (!user || !accessToken) {
      setItems([])
      setUnreadCount(0)
      setNextCursor(null)
      setLiveNotification(null)
      knownIds.current.clear()
      return
    }

    void refresh()
    const socket = io(socketOrigin(), {
      auth: { token: accessToken },
      withCredentials: true,
    })

    socket.on('notification:new', (notification: AppNotification) => {
      if (knownIds.current.has(notification.id)) return
      knownIds.current.add(notification.id)
      setItems((current) => [notification, ...current])
      if (!notification.readAt) setUnreadCount((count) => count + 1)
      setLiveNotification(notification)
      const movieId = notification.data?.movieId
      if (notification.type === 'COMMENT' && typeof movieId === 'string') {
        window.dispatchEvent(new CustomEvent('comments:changed', { detail: { movieId } }))
      }
    })
    socket.on('notification:refresh', () => { void refresh() })
    socket.on('connect_error', (error) => {
      if (error.message === 'TOKEN_EXPIRED') void bootstrapSession().catch(() => undefined)
    })

    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      socket.disconnect()
    }
  }, [accessToken, refresh, user])

  useEffect(() => {
    if (!liveNotification) return
    const timer = window.setTimeout(() => setLiveNotification(null), 6_000)
    return () => window.clearTimeout(timer)
  }, [liveNotification])

  const markRead = useCallback(async (id: string) => {
    const target = items.find((item) => item.id === id)
    if (!target || target.readAt) return
    const readAt = new Date().toISOString()
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt } : item))
    setUnreadCount((count) => Math.max(0, count - 1))
    try {
      await markNotificationRead(id)
    } catch {
      await refresh()
    }
  }, [items, refresh])

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    setItems((current) => current.map((item) => item.readAt ? item : { ...item, readAt }))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      await refresh()
    }
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const target = items.find((item) => item.id === id)
    setItems((current) => current.filter((item) => item.id !== id))
    if (target && !target.readAt) setUnreadCount((count) => Math.max(0, count - 1))
    try {
      await deleteNotification(id)
    } catch {
      await refresh()
    }
  }, [items, refresh])

  const value = useMemo(() => ({
    items,
    unreadCount,
    loading,
    hasMore: Boolean(nextCursor),
    refresh,
    loadMore,
    markRead,
    markAllRead,
    remove,
  }), [items, unreadCount, loading, nextCursor, refresh, loadMore, markRead, markAllRead, remove])

  const openLiveNotification = async () => {
    if (!liveNotification) return
    await markRead(liveNotification.id)
    const actionUrl = liveNotification.actionUrl
    setLiveNotification(null)
    if (actionUrl) navigate(actionUrl)
  }

  return <NotificationContext.Provider value={value}>
    {children}
    {liveNotification && <LiveNotificationToast notification={liveNotification} onOpen={() => void openLiveNotification()} onClose={() => setLiveNotification(null)} />}
  </NotificationContext.Provider>
}
