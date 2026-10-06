import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { broadcastSystemNotification } from '@/services/notification.service'
import { getApiErrorMessage } from '@/lib/api-error'

const initialForm = {
  titleVi: '', titleEn: '', bodyVi: '', bodyEn: '', actionUrl: '', expiresAt: '',
}

export default function AdminNotifications() {
  const { t } = useTranslation()
  const [form, setForm] = useState(initialForm)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setMessage(null)
    try {
      const result = await broadcastSystemNotification({
        titleVi: form.titleVi,
        titleEn: form.titleEn,
        bodyVi: form.bodyVi,
        bodyEn: form.bodyEn,
        actionUrl: form.actionUrl || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      setMessage({ ok: true, text: t('notifications.admin.sent', { count: result.recipients }) })
      setForm(initialForm)
    } catch (error) {
      setMessage({ ok: false, text: getApiErrorMessage(error, t('notifications.admin.sendError')) })
    } finally {
      setSending(false)
    }
  }

  const fieldClass = 'mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-red-500'

  return <section>
    <div><h1 className="text-2xl font-black text-white sm:text-3xl">{t('notifications.admin.title')}</h1><p className="mt-2 text-sm text-gray-400">{t('notifications.admin.description')}</p></div>
    <form onSubmit={(event) => void submit(event)} className="mt-7 max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.titleVi')}<input required maxLength={120} value={form.titleVi} onChange={(event) => setForm({ ...form, titleVi: event.target.value })} className={fieldClass} /></label>
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.titleEn')}<input required maxLength={120} value={form.titleEn} onChange={(event) => setForm({ ...form, titleEn: event.target.value })} className={fieldClass} /></label>
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.bodyVi')}<textarea required rows={5} maxLength={500} value={form.bodyVi} onChange={(event) => setForm({ ...form, bodyVi: event.target.value })} className={fieldClass} /></label>
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.bodyEn')}<textarea required rows={5} maxLength={500} value={form.bodyEn} onChange={(event) => setForm({ ...form, bodyEn: event.target.value })} className={fieldClass} /></label>
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.actionUrl')}<input placeholder="/movies/..." maxLength={500} value={form.actionUrl} onChange={(event) => setForm({ ...form, actionUrl: event.target.value })} className={fieldClass} /></label>
        <label className="text-sm font-medium text-gray-300">{t('notifications.admin.expiresAt')}<input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className={fieldClass} /></label>
      </div>
      {message && <p className={`mt-5 rounded-lg border p-3 text-sm ${message.ok ? 'border-green-800 bg-green-950/30 text-green-300' : 'border-red-800 bg-red-950/30 text-red-300'}`}>{message.text}</p>}
      <button disabled={sending} className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50">{sending ? t('notifications.admin.sending') : t('notifications.admin.send')}</button>
    </form>
  </section>
}
