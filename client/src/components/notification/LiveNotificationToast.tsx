import { useTranslation } from 'react-i18next'
import { notificationBody, notificationTitle } from '@/lib/notification-content'
import type { AppNotification } from '@/services/notification.service'

interface Props {
  notification: AppNotification
  onOpen: () => void
  onClose: () => void
}

export default function LiveNotificationToast({ notification, onOpen, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language

  return <aside className="fixed right-4 top-20 z-[70] w-[min(23rem,calc(100vw-2rem))] animate-[notification-in_250ms_ease-out] rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl" role="status">
    <div className="flex gap-3">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="font-bold text-white">{notificationTitle(notification, t, language)}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-400">{notificationBody(notification, t, language)}</p>
      </button>
      <button onClick={onClose} className="h-7 w-7 shrink-0 rounded text-gray-500 hover:bg-white/10 hover:text-white" aria-label={t('common.close')}>×</button>
    </div>
    <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl bg-gray-800"><span className="block h-full animate-[notification-timer_6s_linear_forwards] bg-red-600" /></div>
  </aside>
}
