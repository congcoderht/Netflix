import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/i18n/format'
import {
  clearWatchHistory,
  getWatchHistory,
  removeWatchHistory,
  type HistoryItem,
} from '@/services/watch-history.service'

export default function WatchHistory() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getWatchHistory(page)
      .then((result) => {
        if (!active) return
        setItems(result.items)
        setTotalPages(result.totalPages)
      })
      .catch(() => { if (active) setError(t('history.loadError')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, t])

  const removeItem = async (id: string) => {
    await removeWatchHistory(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  const clearAll = async () => {
    if (!window.confirm(t('history.clearConfirm'))) return
    await clearWatchHistory()
    setItems([])
    setTotalPages(1)
  }

  return (
    <Layout>
      <main className="min-h-screen px-4 pb-16 pt-24 sm:px-8 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-white">{t('nav.history')}</h1>
            {items.length > 0 && <button onClick={() => void clearAll()} className="text-sm text-red-400 hover:text-red-300">{t('history.clearAll')}</button>}
          </div>

          {loading ? <div className="py-20 text-center text-gray-400">{t('common.loading')}</div>
            : error ? <div className="py-20 text-center text-red-400">{error}</div>
            : items.length === 0 ? <div className="py-20 text-center text-gray-400">{t('history.empty')}</div>
            : <div className="space-y-3">
              {items.map((item) => {
                const query = new URLSearchParams({ play: '1' })
                return (
                  <article key={item.id} className="flex gap-4 rounded-lg bg-gray-900 p-3">
                    <button onClick={() => navigate(`/movies/${item.movie.id}?${query}`)} className="h-24 w-40 shrink-0 overflow-hidden rounded bg-gray-800">
                      {item.movie.thumbnail && <img src={item.movie.thumbnail} alt={item.movie.title} className="h-full w-full object-cover" />}
                    </button>
                    <button onClick={() => navigate(`/movies/${item.movie.id}?${query}`)} className="min-w-0 flex-1 text-left">
                      <h2 className="truncate font-semibold text-white">{item.movie.title}</h2>
                      <p className="mt-2 text-xs text-gray-500">{formatDate(item.watchedAt, i18n.resolvedLanguage || i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </button>
                    <button onClick={() => void removeItem(item.id)} className="self-center px-3 text-sm text-gray-400 hover:text-red-400">{t('common.remove')}</button>
                  </article>
                )
              })}
            </div>}

          {totalPages > 1 && <div className="mt-8 flex justify-center gap-3">
            <button disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1) }} className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-40">{t('common.previous')}</button>
            <span className="px-3 py-2 text-gray-400">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1) }} className="rounded bg-gray-800 px-4 py-2 text-white disabled:opacity-40">{t('common.next')}</button>
          </div>}
        </div>
      </main>
    </Layout>
  )
}
