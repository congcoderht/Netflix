import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useNotifications } from './notification-context'
import { notificationBody, notificationRelativeTime, notificationTitle } from '@/lib/notification-content'
import type { AppNotification } from '@/services/notification.service'

const iconColor: Record<AppNotification['type'], string> = {
  NEW_MOVIE: 'bg-red-600/20 text-red-400',
  COMMENT: 'bg-blue-600/20 text-blue-400',
  PAYMENT: 'bg-green-600/20 text-green-400',
  SUBSCRIPTION: 'bg-amber-600/20 text-amber-400',
  SECURITY: 'bg-purple-600/20 text-purple-400',
  SYSTEM: 'bg-gray-600/30 text-gray-300',
}

export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { items, unreadCount, loading, hasMore, loadMore, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const language = i18n.resolvedLanguage || i18n.language

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openNotification = async (notification: AppNotification) => {
    await markRead(notification.id)
    setOpen(false)
    if (notification.actionUrl) navigate(notification.actionUrl)
  }

  return <div ref={ref} className="relative">
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      aria-label={t('notifications.title')}
      aria-expanded={open}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" /></svg>
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-[#141414]">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>

    {open && <div className="absolute right-0 top-11 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-700 bg-[#181818] shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <h2 className="font-bold text-white">{t('notifications.title')}</h2>
        {unreadCount > 0 && <button onClick={() => void markAllRead()} className="text-xs font-medium text-red-400 hover:text-red-300">{t('notifications.markAllRead')}</button>}
      </div>
      <div className={`${expanded ? 'max-h-[70vh]' : 'max-h-[26rem]'} overflow-y-auto`}>
        {(expanded ? items : items.slice(0, 8)).map((notification) => <button
          key={notification.id}
          onClick={() => void openNotification(notification)}
          className={`flex w-full gap-3 border-b border-gray-800 px-4 py-3 text-left transition hover:bg-white/5 ${notification.readAt ? 'opacity-65' : 'bg-white/[0.03]'}`}
        >
          <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconColor[notification.type]}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{notificationTitle(notification, t, language)}</span>
            <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-400">{notificationBody(notification, t, language)}</span>
            <span className="mt-1 block text-[11px] text-gray-500">{notificationRelativeTime(notification.createdAt, language)}</span>
          </span>
          {!notification.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
        </button>)}
        {!items.length && <p className="px-5 py-12 text-center text-sm text-gray-500">{loading ? t('common.loading') : t('notifications.empty')}</p>}
      </div>
      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="block w-full px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/5">
          {t('notifications.viewAll')}
        </button>
      ) : hasMore ? (
        <button type="button" disabled={loading} onClick={() => void loadMore()} className="block w-full border-t border-gray-800 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/5 disabled:opacity-50">
          {loading ? t('common.loading') : t('notifications.loadMore')}
        </button>
      ) : null}
    </div>}
  </div>
}
