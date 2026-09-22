import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/layout/Layout'
import MovieCard from '@/components/movie/MovieCard'
import { getMovies, getGenres } from '@/services/movie.service'
import type { Movie, Genre } from '@/types/movie'

const TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'MOVIE', label: 'Phim lẻ' },
  { value: 'SERIES', label: 'Phim bộ' },
]

const preloadPosters = (items: Movie[]) => Promise.all(items.map((movie) => new Promise<void>((resolve) => {
  if (!movie.thumbnail) {
    resolve()
    return
  }

  const image = new Image()
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    window.clearTimeout(timeout)
    resolve()
  }
  const timeout = window.setTimeout(finish, 800)
  image.onload = finish
  image.onerror = finish
  image.src = movie.thumbnail
})))

export default function Movies() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get('type') || ''
  const genreParam = searchParams.get('genreId') || ''
  const searchParam = searchParams.get('search') || ''

  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(searchParam)

  const LIMIT = 15

  const setParam = (key: string, value: string) => {
    const currentValue = searchParams.get(key) || ''
    if (currentValue === value) return

    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setLoading(true)
    setError('')
    setPage(1)
    setSearchParams(next)
  }

  useEffect(() => {
    getGenres().then(setGenres)
  }, [])

  useEffect(() => {
    let active = true

    getMovies({
      type: typeParam || undefined,
      genreId: genreParam || undefined,
      search: searchParam || undefined,
      page,
      limit: LIMIT,
    })
      .then(async (res) => {
        await preloadPosters(res.items)
        if (!active) return
        setError('')
        setMovies(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      })
      .catch(() => {
        if (!active) return
        setError('Không thể tải danh sách phim. Vui lòng thử lại.')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          setHasLoaded(true)
        }
      })

    return () => { active = false }
  }, [typeParam, genreParam, searchParam, page])

  // Debounce search
  useEffect(() => {
    if (searchInput === searchParam) return

    const t = setTimeout(() => {
      setLoading(true)
      setError('')
      setPage(1)
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (searchInput) next.set('search', searchInput)
        else next.delete('search')
        next.delete('page')
        return next
      })
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, searchParam, setSearchParams])

  const title = typeParam === 'MOVIE' ? t('nav.movies') : typeParam === 'SERIES' ? t('nav.series') : 'Tất cả phim'

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-8 md:px-12">
        <div className="mx-auto max-w-screen-2xl">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="mt-1 min-h-5 text-sm text-gray-400">{hasLoaded ? `${total} phim` : 'Đang tải...'}</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('common.search')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-gray-500 text-sm placeholder-gray-500"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setParam('search', '') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Type filter */}
            <div className="flex w-fit shrink-0 rounded-lg bg-gray-800 p-1 gap-1">
              {TYPES.map((tp) => (
                <button key={tp.value} onClick={() => setParam('type', tp.value)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeParam === tp.value ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Genre filter */}
            <div className="flex min-w-0 flex-wrap gap-2">
              <button onClick={() => setParam('genreId', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${!genreParam ? 'border-white text-white' : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'}`}>
                Tất cả thể loại
              </button>
              {genres.map((g) => (
                <button key={g.id} onClick={() => setParam('genreId', genreParam === g.id ? '' : g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${genreParam === g.id ? 'border-red-500 bg-red-600/20 text-red-400' : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'}`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading && !hasLoaded ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error && movies.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-500 text-lg">{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="relative min-h-[60vh]">
              {loading && <div className="absolute -top-3 left-0 right-0 z-20 h-0.5 overflow-hidden rounded-full bg-gray-800"><div className="h-full w-1/3 animate-pulse rounded-full bg-red-600" /></div>}
              <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${loading ? 'pointer-events-none opacity-55' : 'opacity-100'}`} aria-busy={loading}>
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} gridMode />
                ))}
              </div>
            </div>
          )}

          {error && movies.length > 0 && <p className="mt-5 rounded-lg border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}

          {/* Pagination */}
          {!error && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button onClick={() => { setLoading(true); setError(''); setPage((p) => p - 1) }} disabled={loading || page === 1}
                className="w-9 h-9 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`dot-${i}`} className="text-gray-600 px-1">...</span>
                  : <button key={p} disabled={loading} onClick={() => { setLoading(true); setError(''); setPage(p as number) }}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {p}
                    </button>
                )}

              <button onClick={() => { setLoading(true); setError(''); setPage((p) => p + 1) }} disabled={loading || page === totalPages}
                className="w-9 h-9 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
