import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAuthStore } from '@/store/auth.store'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/i18n/format'
import {
  createComment,
  deleteComment,
  getComments,
  getRating,
  setRating,
  updateComment,
  type CommentPage,
  type MovieComment,
  type RatingSummary,
} from '@/services/community.service'

interface CommentItemProps {
  comment: MovieComment
  movieId: string
  isReply?: boolean
  onChanged: () => Promise<void>
}

function CommentItem({ comment, movieId, isReply = false, onChanged }: CommentItemProps) {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<'idle' | 'edit' | 'reply'>('idle')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canManage = user?.id === comment.user.id || user?.role === 'ADMIN'
  const canEdit = user?.id === comment.user.id

  const submit = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      if (mode === 'edit') await updateComment(movieId, comment.id, content.trim())
      if (mode === 'reply') await createComment(movieId, content.trim(), comment.id)
      setMode('idle')
      setContent('')
      await onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, t('community.saveError')))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(t('community.deleteConfirm'))) return
    setSaving(true)
    setError('')
    try {
      await deleteComment(movieId, comment.id)
      await onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, t('community.deleteError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id={`comment-${comment.id}`} className={`scroll-mt-24 ${isReply ? 'ml-8 border-l border-gray-700 pl-4' : ''}`}>
      <div className="flex gap-3 py-4">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-700">
          {comment.user.avatar
            ? <img src={comment.user.avatar} alt="" className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center font-bold text-white">{comment.user.name?.[0]?.toUpperCase() || '?'}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-white">{comment.user.name || t('common.user')}</span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt, i18n.resolvedLanguage || i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            {comment.updatedAt !== comment.createdAt && !comment.isDeleted && <span className="text-xs text-gray-500">{t('community.edited')}</span>}
          </div>
          <p className={`mt-1 whitespace-pre-wrap break-words text-sm ${comment.isDeleted ? 'italic text-gray-500' : 'text-gray-300'}`}>
            {comment.isDeleted ? t('community.deleted') : (
              <>
                {isReply && comment.replyTo?.user && (
                  <span className="mr-1 font-medium text-blue-400">@{comment.replyTo.user.name || t('common.user')}</span>
                )}
                {comment.content}
              </>
            )}
          </p>

          {!comment.isDeleted && mode === 'idle' && (
            <div className="mt-2 flex gap-3 text-xs">
              <button onClick={() => { setMode('reply'); setContent('') }} className="text-gray-400 hover:text-white">{t('community.reply')}</button>
              {canEdit && <button onClick={() => { setMode('edit'); setContent(comment.content) }} className="text-gray-400 hover:text-white">{t('common.edit')}</button>}
              {canManage && <button disabled={saving} onClick={() => void remove()} className="text-red-400 hover:text-red-300 disabled:opacity-50">{t('common.delete')}</button>}
            </div>
          )}

          {mode !== 'idle' && (
            <div className="mt-3">
              <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3}
                placeholder={mode === 'reply' ? t('community.replyPlaceholder', { name: comment.user.name || t('common.user').toLowerCase() }) : t('community.editPlaceholder')}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white outline-none focus:border-gray-500" />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => { setMode('idle'); setError('') }} className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white">{t('common.cancel')}</button>
                <button disabled={!content.trim() || saving} onClick={() => void submit()}
                  className="rounded bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{saving ? t('common.loading') : t('common.save')}</button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} movieId={movieId} isReply onChanged={onChanged} />
      ))}
    </div>
  )
}

export default function CommunitySection({ movieId }: { movieId: string }) {
  const { t } = useTranslation()
  const [comments, setComments] = useState<CommentPage | null>(null)
  const [rating, setRatingState] = useState<RatingSummary | null>(null)
  const [page, setPage] = useState(1)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadComments = useCallback(async () => {
    const data = await getComments(movieId, page)
    setComments(data)
  }, [movieId, page])

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([loadComments(), getRating(movieId).then(setRatingState)])
      .catch((err) => setError(getApiErrorMessage(err, t('community.loadError'))))
      .finally(() => setLoading(false))
  }, [loadComments, movieId, t])

  useEffect(() => {
    const refreshMovieComments = (event: Event) => {
      const movieEvent = event as CustomEvent<{ movieId?: string }>
      if (movieEvent.detail?.movieId === movieId) void loadComments()
    }
    window.addEventListener('comments:changed', refreshMovieComments)
    return () => window.removeEventListener('comments:changed', refreshMovieComments)
  }, [loadComments, movieId])

  const rate = async (score: number) => {
    setError('')
    try {
      setRatingState(await setRating(movieId, score))
    } catch (err) {
      setError(getApiErrorMessage(err, t('community.ratingError')))
    }
  }

  const submitComment = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      await createComment(movieId, content.trim())
      setContent('')
      if (page !== 1) setPage(1)
      else await loadComments()
    } catch (err) {
      setError(getApiErrorMessage(err, t('community.commentError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-t border-gray-800 py-8">
      <h2 className="text-xl font-bold text-white">{t('community.title')}</h2>

      <div className="mt-5 rounded-xl bg-gray-800/40 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-3xl font-black text-white">{rating?.average.toFixed(1) || '0.0'}<span className="text-base text-gray-500">/5</span></p>
            <p className="text-xs text-gray-400">{t('community.ratings', { count: rating?.count || 0 })}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-400">{t('community.yourRating')}</p>
            <div className="flex gap-1" aria-label={t('community.yourRating')}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button key={score} onClick={() => void rate(score)} aria-label={t('community.stars', { count: score })}
                  className={`text-3xl transition hover:scale-110 ${score <= (rating?.myRating || 0) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}>★</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={4}
          placeholder={t('community.placeholder')}
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-white outline-none focus:border-gray-500" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">{content.length}/2000</span>
          <button disabled={!content.trim() || saving} onClick={() => void submitComment()}
            className="rounded bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{saving ? t('community.sending') : t('community.comment')}</button>
        </div>
      </div>

      {error && <p className="mt-4 rounded bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}
      {loading ? <p className="py-8 text-center text-gray-500">{t('common.loading')}</p> : (
        <div className="mt-6 divide-y divide-gray-800">
          {comments?.items.length
            ? comments.items.map((comment) => <CommentItem key={comment.id} comment={comment} movieId={movieId} onChanged={loadComments} />)
            : <p className="py-8 text-center text-sm text-gray-500">{t('community.empty')}</p>}
        </div>
      )}

      {(comments?.totalPages || 0) > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-40">{t('common.previous')}</button>
          <span className="text-sm text-gray-400">{t('common.page', { current: page, total: comments?.totalPages })}</span>
          <button disabled={page >= (comments?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} className="rounded bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-40">{t('common.next')}</button>
        </div>
      )}
    </section>
  )
}
