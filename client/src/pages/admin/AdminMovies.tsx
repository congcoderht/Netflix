import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/layout/Layout'
import { api } from '@/lib/axios'
import type { Movie, Genre, Actor } from '@/types/movie'
import { getApiErrorMessage } from '@/lib/api-error'

const ROLES = ['Diễn viên', 'Đạo diễn', 'Giám đốc sản xuất', 'Nhà sản xuất', 'Biên kịch']

type CastEntry = { actorId: string; name: string; avatar: string | null; role: string }

type FormData = {
  title: string
  description: string
  type: 'MOVIE' | 'SERIES'
  genreIds: string[]
  trailerFile: File | null
  trailerUrl: string
  trailerMode: 'file' | 'url'
  thumbnailFile: File | null
  thumbnailUrl: string
  thumbnailMode: 'file' | 'url'
  videoFile: File | null
  videoUrl: string
  videoMode: 'file' | 'url'
  duration: string
  cast: CastEntry[]
}

const EMPTY_FORM: FormData = {
  title: '', description: '', type: 'MOVIE', genreIds: [],
  trailerFile: null, trailerUrl: '', trailerMode: 'url',
  thumbnailFile: null, thumbnailUrl: '', thumbnailMode: 'file',
  videoFile: null, videoUrl: '', videoMode: 'file', duration: '',
  cast: [],
}

export default function AdminMovies() {
  const { t } = useTranslation()
  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Movie | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [newGenreName, setNewGenreName] = useState('')
  const [addingGenre, setAddingGenre] = useState(false)
  const [actorSearch, setActorSearch] = useState('')
  const [actorResults, setActorResults] = useState<Actor[]>([])
  const [newActor, setNewActor] = useState({ name: '', role: 'Diễn viên' })
  const [uploadProgress, setUploadProgress] = useState({ thumb: false, trailer: false, video: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const trailerInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const actorSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMovies = async () => {
    const { data } = await api.get('/movies?limit=100')
    setMovies(data.items)
  }

  const fetchGenres = async () => {
    const { data } = await api.get('/genres')
    setGenres(data)
  }

  useEffect(() => { fetchMovies(); fetchGenres() }, [])

  // Actor search debounce
  useEffect(() => {
    if (!actorSearch.trim()) { setActorResults([]); return }
    if (actorSearchTimer.current) clearTimeout(actorSearchTimer.current)
    actorSearchTimer.current = setTimeout(async () => {
      const { data } = await api.get(`/movies/actors/search?q=${encodeURIComponent(actorSearch)}`)
      setActorResults(data)
    }, 300)
  }, [actorSearch])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true)
  }

  const openEdit = (movie: Movie) => {
    setEditing(movie)
    setForm({
      title: movie.title,
      description: movie.description || '',
      type: movie.type,
      genreIds: movie.genres.map((g) => g.genre.id),
      trailerFile: null,
      trailerUrl: movie.trailerUrl || '',
      trailerMode: 'url',
      thumbnailFile: null,
      thumbnailUrl: movie.thumbnail || '',
      thumbnailMode: movie.thumbnail ? 'url' : 'file',
      videoFile: null,
      videoUrl: movie.videoUrl || '',
      videoMode: movie.videoUrl ? 'url' : 'file',
      duration: movie.duration?.toString() || '',
      cast: movie.actors?.map((a) => ({ actorId: a.actor.id, name: a.actor.name, avatar: a.actor.avatar, role: a.role || 'Diễn viên' })) || [],
    })
    setError(''); setShowForm(true)
  }

  const handleAddGenre = async () => {
    if (!newGenreName.trim()) return
    setAddingGenre(true)
    try {
      const { data } = await api.post('/genres/find-or-create', { name: newGenreName.trim() })
      await fetchGenres()
      setForm((f) => ({ ...f, genreIds: [...f.genreIds, data.id] }))
      setNewGenreName('')
    } finally { setAddingGenre(false) }
  }

  const addActorFromSearch = (actor: Actor) => {
    if (form.cast.find((c) => c.actorId === actor.id)) return
    setForm((f) => ({ ...f, cast: [...f.cast, { actorId: actor.id, name: actor.name, avatar: actor.avatar, role: 'Diễn viên' }] }))
    setActorSearch(''); setActorResults([])
  }

  const addNewActor = async () => {
    if (!newActor.name.trim()) return
    const { data } = await api.post('/movies/actors', { name: newActor.name.trim() })
    setForm((f) => ({ ...f, cast: [...f.cast, { actorId: data.id, name: data.name, avatar: data.avatar, role: newActor.role }] }))
    setNewActor({ name: '', role: 'Diễn viên' })
  }

  const removeCast = (actorId: string) => setForm((f) => ({ ...f, cast: f.cast.filter((c) => c.actorId !== actorId) }))

  const updateCastRole = (actorId: string, role: string) =>
    setForm((f) => ({ ...f, cast: f.cast.map((c) => c.actorId === actorId ? { ...c, role } : c) }))

  const uploadFile = async (file: File, type: 'image' | 'video') => {
    const fd = new FormData(); fd.append('file', file)
    const { data } = await api.post(`/upload/${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      let thumbnailUrl = form.thumbnailUrl
      let trailerUrl = form.trailerUrl
      let videoUrl = form.videoUrl
      let duration = form.duration ? parseInt(form.duration) : undefined

      if (form.thumbnailMode === 'file' && form.thumbnailFile) {
        setUploadProgress((p) => ({ ...p, thumb: true }))
        thumbnailUrl = (await uploadFile(form.thumbnailFile, 'image')).url
        setUploadProgress((p) => ({ ...p, thumb: false }))
      }
      if (form.trailerMode === 'file' && form.trailerFile) {
        setUploadProgress((p) => ({ ...p, trailer: true }))
        trailerUrl = (await uploadFile(form.trailerFile, 'video')).url
        setUploadProgress((p) => ({ ...p, trailer: false }))
      }
      if (form.videoMode === 'file' && form.videoFile) {
        setUploadProgress((p) => ({ ...p, video: true }))
        const r = await uploadFile(form.videoFile, 'video')
        videoUrl = r.url; duration = r.duration || duration
        setUploadProgress((p) => ({ ...p, video: false }))
      }

      const payload = { title: form.title, description: form.description, type: form.type, genreIds: form.genreIds, trailerUrl: trailerUrl || undefined, thumbnail: thumbnailUrl || undefined, videoUrl: videoUrl || undefined, duration }
      let movieId = editing?.id

      if (editing) {
        await api.patch(`/movies/${editing.id}`, payload)
      } else {
        const { data } = await api.post('/movies', payload)
        movieId = data.id
      }

      // Lưu cast
      if (movieId) {
        await api.put(`/movies/${movieId}/actors`, { actors: form.cast.map((c) => ({ actorId: c.actorId, role: c.role })) })
      }

      await fetchMovies(); setShowForm(false)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('common.error')))
    } finally { setSaving(false); setUploadProgress({ thumb: false, trailer: false, video: false }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa phim này?')) return
    await api.delete(`/movies/${id}`)
    setMovies((m) => m.filter((x) => x.id !== id))
  }

  const toggleGenre = (id: string) =>
    setForm((f) => ({ ...f, genreIds: f.genreIds.includes(id) ? f.genreIds.filter((g) => g !== id) : [...f.genreIds, id] }))

  const isUploading = uploadProgress.thumb || uploadProgress.trailer || uploadProgress.video

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">{t('admin.movies')}</h1>
            <button onClick={openCreate} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Thêm phim
            </button>
          </div>

          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="px-4 py-3">Phim</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Loại</th>
                  <th className="px-4 py-3 hidden md:table-cell">Thể loại</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded bg-gray-700 overflow-hidden shrink-0">
                          {movie.thumbnail && <img src={movie.thumbnail} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-white font-medium line-clamp-2">{movie.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{movie.type === 'MOVIE' ? 'Phim lẻ' : 'Phim bộ'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.slice(0, 2).map(({ genre }) => (
                          <span key={genre.id} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{genre.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          await api.patch(`/movies/${movie.id}`, { isPublished: !movie.isPublished })
                          setMovies((ms) => ms.map((m) => m.id === movie.id ? { ...m, isPublished: !m.isPublished } : m))
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${movie.isPublished ? 'bg-green-600/20 text-green-400 hover:bg-red-600/20 hover:text-red-400' : 'bg-yellow-600/20 text-yellow-400 hover:bg-green-600/20 hover:text-green-400'}`}
                        title={movie.isPublished ? 'Click để Unpublish' : 'Click để Publish'}
                      >
                        {movie.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(movie)} className="text-gray-400 hover:text-white p-1.5 hover:bg-gray-700 rounded transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(movie.id)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-gray-700 rounded transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movies.length === 0 && <div className="text-center py-16 text-gray-500">Chưa có phim nào</div>}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">{editing ? 'Sửa phim' : 'Thêm phim mới'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <div className="bg-red-600/20 border border-red-600 text-red-400 rounded px-4 py-3 text-sm">{error}</div>}

              {/* Title */}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Tên phim *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 outline-none focus:border-gray-400" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 outline-none focus:border-gray-400 resize-none" />
              </div>

              {/* Type */}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Loại</label>
                <div className="flex gap-3">
                  {(['MOVIE', 'SERIES'] as const).map((tp) => (
                    <button key={tp} type="button" onClick={() => setForm((f) => ({ ...f, type: tp }))}
                      className={`px-5 py-2 rounded text-sm font-medium transition-colors ${form.type === tp ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                      {tp === 'MOVIE' ? 'Phim lẻ' : 'Phim bộ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Thể loại</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {genres.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.genreIds.includes(g.id) ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                      {g.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newGenreName} onChange={(e) => setNewGenreName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGenre())}
                    placeholder="Thêm thể loại mới..."
                    className="flex-1 bg-gray-800 border border-gray-600 text-white rounded px-3 py-1.5 text-sm outline-none focus:border-gray-400 placeholder-gray-500" />
                  <button type="button" onClick={handleAddGenre} disabled={addingGenre || !newGenreName.trim()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded transition-colors">
                    {addingGenre ? '...' : '+ Thêm'}
                  </button>
                </div>
              </div>

              {/* Trailer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-400 text-sm">Trailer</label>
                  <div className="flex gap-1">
                    {(['url', 'file'] as const).map((mode) => (
                      <button key={mode} type="button"
                        onClick={() => setForm((f) => ({ ...f, trailerMode: mode, trailerFile: null, trailerUrl: '' }))}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${form.trailerMode === mode ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {mode === 'url' ? 'URL' : 'Upload file'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.trailerMode === 'url' ? (
                  <input type="url" value={form.trailerUrl} onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... hoặc .mp4"
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 outline-none focus:border-gray-400 text-sm" />
                ) : (
                  <>
                    <input ref={trailerInputRef} type="file" accept="video/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((p) => ({ ...p, trailerFile: f })) }} />
                    <div onClick={() => trailerInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                      <div className="text-gray-500 text-sm py-2">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        {form.trailerFile ? <span className="text-green-400">{form.trailerFile.name}</span> : 'Click để chọn video trailer'}
                      </div>
                    </div>
                    {uploadProgress.trailer && <p className="text-yellow-400 text-xs mt-1">Đang upload trailer...</p>}
                  </>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-gray-400 text-sm">Thumbnail</label>
                  <div className="flex gap-1">
                    {(['file', 'url'] as const).map((mode) => (
                      <button key={mode} type="button" onClick={() => setForm((f) => ({ ...f, thumbnailMode: mode }))}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${form.thumbnailMode === mode ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                        {mode === 'file' ? 'Upload' : 'URL'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.thumbnailMode === 'url' ? (
                  <div className="space-y-2">
                    <input type="url" value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                      placeholder="https://..." className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 outline-none focus:border-gray-400 text-sm" />
                    {form.thumbnailUrl && <img src={form.thumbnailUrl} alt="preview" className="h-24 rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                  </div>
                ) : (
                  <>
                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((p) => ({ ...p, thumbnailFile: f, thumbnailUrl: URL.createObjectURL(f) })) }} />
                    <div onClick={() => thumbInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                      {form.thumbnailUrl
                        ? <img src={form.thumbnailUrl} alt="preview" className="h-28 mx-auto object-cover rounded" />
                        : <div className="text-gray-500 text-sm py-3">
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Click để chọn ảnh
                          </div>
                      }
                    </div>
                    {uploadProgress.thumb && <p className="text-yellow-400 text-xs mt-1">Đang upload thumbnail...</p>}
                  </>
                )}
              </div>

              {/* Video */}
              {form.type === 'MOVIE' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-gray-400 text-sm">Video</label>
                    <div className="flex gap-1">
                      {(['file', 'url'] as const).map((mode) => (
                        <button key={mode} type="button"
                          onClick={() => setForm((f) => ({ ...f, videoMode: mode, videoFile: null, videoUrl: '', duration: '' }))}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${form.videoMode === mode ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                          {mode === 'file' ? 'Upload file' : 'Nhập URL'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.videoMode === 'url' ? (
                    <div className="space-y-3">
                      <input type="url" value={form.videoUrl}
                        onChange={(e) => {
                          const url = e.target.value
                          setForm((f) => ({ ...f, videoUrl: url, duration: '' }))
                          if (!url) return
                          const vid = document.createElement('video')
                          vid.preload = 'metadata'; vid.src = url
                          vid.onloadedmetadata = () => { const mins = Math.round(vid.duration / 60); if (mins > 0) setForm((f) => ({ ...f, duration: String(mins) })); vid.remove() }
                          vid.onerror = () => vid.remove()
                        }}
                        placeholder="https://... (.mp4, .m3u8)"
                        className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 outline-none focus:border-gray-400 text-sm" />
                      <div className="flex items-center gap-3">
                        <label className="text-gray-400 text-sm shrink-0">Thời lượng (phút)</label>
                        <input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                          placeholder={form.videoUrl && !form.duration ? 'Đang đọc...' : 'VD: 148'}
                          className="w-28 bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 outline-none focus:border-gray-400 text-sm" />
                        {form.duration && <span className="text-green-400 text-xs">Tự động detect ✓</span>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm((p) => ({ ...p, videoFile: f })) }} />
                      <div onClick={() => videoInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                        <div className="text-gray-500 text-sm py-2">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          {form.videoFile ? <span className="text-green-400">{form.videoFile.name}</span> : 'Click để chọn video'}
                        </div>
                      </div>
                      {form.videoFile && <p className="text-gray-500 text-xs mt-1">Thời lượng sẽ tự động lấy từ video sau khi upload.</p>}
                      {uploadProgress.video && <p className="text-yellow-400 text-xs mt-1">Đang upload video (có thể mất vài phút)...</p>}
                    </>
                  )}
                </div>
              )}

              {/* Cast & Crew */}
              <div>
                <label className="block text-gray-400 text-sm mb-3">Diễn viên & Đoàn làm phim</label>

                {/* Cast list */}
                {form.cast.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.cast.map((c) => (
                      <div key={c.actorId} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                          {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{c.name[0]}</div>}
                        </div>
                        <span className="text-white text-sm flex-1 truncate">{c.name}</span>
                        <select value={c.role} onChange={(e) => updateCastRole(c.actorId, e.target.value)}
                          className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1 outline-none border border-gray-600">
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          <option value={c.role}>{!ROLES.includes(c.role) ? c.role : ''}</option>
                        </select>
                        <button type="button" onClick={() => removeCast(c.actorId)} className="text-gray-500 hover:text-red-400 transition-colors ml-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search existing actor */}
                <div className="relative mb-2">
                  <input type="text" value={actorSearch} onChange={(e) => setActorSearch(e.target.value)}
                    placeholder="Tìm diễn viên đã có..."
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-4 py-2.5 text-sm outline-none focus:border-gray-400 placeholder-gray-500" />
                  {actorResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-b-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      {actorResults.map((a) => (
                        <button key={a.id} type="button" onClick={() => addActorFromSearch(a)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition-colors text-left">
                          <div className="w-7 h-7 rounded-full bg-gray-600 overflow-hidden shrink-0">
                            {a.avatar ? <img src={a.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs">{a.name[0]}</div>}
                          </div>
                          <span className="text-white text-sm">{a.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add new actor */}
                <div className="flex gap-2">
                  <input type="text" value={newActor.name} onChange={(e) => setNewActor((n) => ({ ...n, name: e.target.value }))}
                    placeholder="Thêm người mới..."
                    className="flex-1 bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-gray-400 placeholder-gray-500" />
                  <select value={newActor.role} onChange={(e) => setNewActor((n) => ({ ...n, role: e.target.value }))}
                    className="bg-gray-800 border border-gray-600 text-gray-300 text-xs rounded px-2 py-2 outline-none">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button type="button" onClick={addNewActor} disabled={!newActor.name.trim()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm px-3 py-2 rounded transition-colors">
                    + Thêm
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-300 hover:text-white text-sm">{t('common.cancel')}</button>
                <button type="submit" disabled={saving || isUploading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded transition-colors text-sm flex items-center gap-2">
                  {(saving || isUploading) && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving || isUploading ? 'Đang xử lý...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
