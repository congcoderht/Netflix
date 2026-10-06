import type { TFunction } from 'i18next'
import type { AppNotification } from '@/services/notification.service'

const interpolation = (notification: AppNotification) => notification.data || {}

export const notificationTitle = (notification: AppNotification, t: TFunction, language: string) => {
  if (notification.eventKey === 'systemAnnouncement') {
    const key = language.startsWith('vi') ? 'titleVi' : 'titleEn'
    return String(notification.data?.[key] || t('notifications.system'))
  }
  return t(`notifications.events.${notification.eventKey}.title`, interpolation(notification))
}

export const notificationBody = (notification: AppNotification, t: TFunction, language: string) => {
  if (notification.eventKey === 'systemAnnouncement') {
    const key = language.startsWith('vi') ? 'bodyVi' : 'bodyEn'
    return String(notification.data?.[key] || '')
  }
  return t(`notifications.events.${notification.eventKey}.body`, interpolation(notification))
}

export const notificationRelativeTime = (createdAt: string, language: string) => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1_000))
  const formatter = new Intl.RelativeTimeFormat(language.startsWith('vi') ? 'vi-VN' : 'en-US', { numeric: 'auto' })
  if (elapsedSeconds < 60) return formatter.format(-elapsedSeconds, 'second')
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60) return formatter.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return formatter.format(-hours, 'hour')
  return formatter.format(-Math.floor(hours / 24), 'day')
}
