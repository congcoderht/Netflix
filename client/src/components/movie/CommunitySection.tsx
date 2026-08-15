import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/api-error'
import { useAuthStore } from '@/store/auth.store'
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

const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

interface CommentItemProps {
  comment: MovieComment
  movieId: string
  isReply?: boolean
  onChanged: () => Promise<void>
}

function CommentItem({ comment, movieId, isReply = false, onChanged }: CommentItemProps) {
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
      setError(getApiErrorMessage(err, 'Không thể lưu bình luận'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return
    setSaving(true)
    setError('')
    try {
      await deleteComment(movieId, comment.id)
      await onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xóa bình luận'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={isReply ? 'ml-8 border-l border-gray-700 pl-4' : ''}>
      <div className="flex gap-3 py-4">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-700">
          {comment.user.avatar
            ? <img src={comment.user.avatar} alt="" className="h-full w-full object-cover" />
            : <span className="flex h-full items-center justify-center font-bold text-white">{comment.user.name?.[0]?.toUpperCase() || '?'}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-white">{comment.user.name || 'Người dùng'}</span>
            <span className="text-xs text-gray-500">{dateLabel(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt && !comment.isDeleted && <span className="text-xs text-gray-500">đã sửa</span>}
          </div>
          <p className={`mt-1 whitespace-pre-wrap break-words text-sm ${comment.isDeleted ? 'italic text-gray-500' : 'text-gray-300'}`}>
            {comment.isDeleted ? 'Bình luận đã bị xóa' : comment.content}
          </p>

          {!comment.isDeleted && mode === 'idle' && (
            <div className="mt-2 flex gap-3 text-xs">
              {!isReply && <button onClick={() => { setMode('reply'); setContent('') }} className="text-gray-400 hover:text-white">Trả lời</button>}
              {canEdit && <button onClick={() => { setMode('edit'); setContent(comment.content) }} className="text-gray-400 hover:text-white">Sửa</button>}
              {canManage && <button disabled={saving} onClick={() => void remove()} className="text-red-400 hover:text-red-300 disabled:opacity-50">Xóa</button>}
            </div>
          )}

          {mode !== 'idle' && (
            <div className="mt-3">
              <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3}
                placeholder={mode === 'reply' ? `Trả lời ${comment.user.name || 'người dùng'}...` : 'Chỉnh sửa bình luận...'}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white outline-none focus:border-gray-500" />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => { setMode('idle'); setError('') }} className="rounded px-3 py-2 text-xs text-gray-400 hover:text-white">Hủy</button>
                <button disabled={!content.trim() || saving} onClick={() => void submit()}
                  className="rounded bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button>
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
      .catch((err) => setError(getApiErrorMessage(err, 'Không thể tải đánh giá và bình luận')))
      .finally(() => setLoading(false))
  }, [loadComments, movieId])

  const rate = async (score: number) => {
    setError('')
    try {
      setRatingState(await setRating(movieId, score))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi đánh giá'))
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
      setError(getApiErrorMessage(err, 'Không thể gửi bình luận'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-t border-gray-800 py-8">
      <h2 className="text-xl font-bold text-white">Đánh giá & bình luận</h2>

      <div className="mt-5 rounded-xl bg-gray-800/40 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-3xl font-black text-white">{rating?.average.toFixed(1) || '0.0'}<span className="text-base text-gray-500">/5</span></p>
            <p className="text-xs text-gray-400">{rating?.count || 0} lượt đánh giá</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-400">Đánh giá của bạn</p>
            <div className="flex gap-1" aria-label="Chọn số sao">
              {[1, 2, 3, 4, 5].map((score) => (
                <button key={score} onClick={() => void rate(score)} aria-label={`${score} sao`}
                  className={`text-3xl transition hover:scale-110 ${score <= (rating?.myRating || 0) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}>★</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={4}
          placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
          className="w-full resize-none rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm text-white outline-none focus:border-gray-500" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">{content.length}/2000</span>
          <button disabled={!content.trim() || saving} onClick={() => void submitComment()}
            className="rounded bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Đang gửi...' : 'Bình luận'}</button>
        </div>
      </div>

      {error && <p className="mt-4 rounded bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}
      {loading ? <p className="py-8 text-center text-gray-500">Đang tải...</p> : (
        <div className="mt-6 divide-y divide-gray-800">
          {comments?.items.length
            ? comments.items.map((comment) => <CommentItem key={comment.id} comment={comment} movieId={movieId} onChanged={loadComments} />)
            : <p className="py-8 text-center text-sm text-gray-500">Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
        </div>
      )}

      {(comments?.totalPages || 0) > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-40">Trước</button>
          <span className="text-sm text-gray-400">Trang {page}/{comments?.totalPages}</span>
          <button disabled={page >= (comments?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} className="rounded bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-40">Sau</button>
        </div>
      )}
    </section>
  )
}
