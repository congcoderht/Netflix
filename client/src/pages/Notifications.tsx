import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/layout/Layout'
import { useNotifications } from '@/components/notification/notification-context'
import { notificationBody, notificationRelativeTime, notificationTitle } from '@/lib/notification-content'
import type { AppNotification } from '@/services/notification.service'

export default function Notifications() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { items, unreadCount, loading, hasMore, loadMore, markRead, markAllRead, remove } = useNotifications()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const language = i18n.resolvedLanguage || i18n.language
  const visibleItems = unreadOnly ? items.filter((item) => !item.readAt) : items

  const open = async (notification: AppNotification) => {
    await markRead(notification.id)
    if (notification.actionUrl) navigate(notification.actionUrl)
  }

  return <Layout>
    <main className="mx-auto min-h-screen max-w-4xl px-4 pb-16 pt-24 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-black text-white">{t('notifications.title')}</h1><p className="mt-1 text-sm text-gray-400">{t('notifications.unreadCount', { count: unreadCount })}</p></div>
        {unreadCount > 0 && <button onClick={() => void markAllRead()} className="self-start rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-gray-500 hover:bg-white/5">{t('notifications.markAllRead')}</button>}
      </div>

      <div className="mt-7 flex gap-2 border-b border-gray-800 pb-3">
        <button onClick={() => setUnreadOnly(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${!unreadOnly ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{t('notifications.all')}</button>
        <button onClick={() => setUnreadOnly(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${unreadOnly ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{t('notifications.unread')}</button>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70">
        {visibleItems.map((notification) => <article key={notification.id} className={`flex gap-3 border-b border-gray-800 p-4 sm:p-5 ${notification.readAt ? 'opacity-65' : 'bg-white/[0.025]'}`}>
          <button onClick={() => void open(notification)} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2"><h2 className="truncate font-bold text-white">{notificationTitle(notification, t, language)}</h2>{!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}</div>
            <p className="mt-1 text-sm leading-6 text-gray-400">{notificationBody(notification, t, language)}</p>
            <p className="mt-2 text-xs text-gray-500">{notificationRelativeTime(notification.createdAt, language)}</p>
          </button>
          <button onClick={() => void remove(notification.id)} className="h-9 rounded-lg px-3 text-sm text-gray-500 transition hover:bg-red-950/40 hover:text-red-400" aria-label={t('notifications.delete')}>×</button>
        </article>)}
        {!visibleItems.length && <p className="px-5 py-16 text-center text-gray-500">{loading ? t('common.loading') : unreadOnly ? t('notifications.noUnread') : t('notifications.empty')}</p>}
      </section>
      {hasMore && !unreadOnly && <button disabled={loading} onClick={() => void loadMore()} className="mx-auto mt-6 block rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50">{loading ? t('common.loading') : t('notifications.loadMore')}</button>}
    </main>
  </Layout>
}
