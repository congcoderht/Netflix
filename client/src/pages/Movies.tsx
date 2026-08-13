import { useCallback, useEffect, useState } from 'react'
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
  const [searchInput, setSearchInput] = useState(searchParam)

  const LIMIT = 15

  const setParam = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setLoading(true)
    setPage(1)
    setSearchParams(next)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    getGenres().then(setGenres)
  }, [])

  useEffect(() => {
    getMovies({
      type: typeParam || undefined,
      genreId: genreParam || undefined,
      search: searchParam || undefined,
      page,
      limit: LIMIT,
    })
      .then((res) => {
        setMovies(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
        console.log('movies response:', res.total, 'total,', res.totalPages, 'pages')
      })
      .finally(() => setLoading(false))
  }, [typeParam, genreParam, searchParam, page])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setParam('search', searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput, setParam])

  const title = typeParam === 'MOVIE' ? t('nav.movies') : typeParam === 'SERIES' ? t('nav.series') : 'Tất cả phim'

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-8 md:px-12">
        <div className="max-w-screen-xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              {!loading && <p className="text-gray-400 text-sm mt-1">{total} phim</p>}
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
          <div className="flex flex-wrap gap-4 mb-8">
            {/* Type filter */}
            <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
              {TYPES.map((tp) => (
                <button key={tp.value} onClick={() => setParam('type', tp.value)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeParam === tp.value ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tp.label}
                </button>
              ))}
            </div>

            {/* Genre filter */}
            <div className="flex flex-wrap gap-2">
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
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-500 text-lg">{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} gridMode />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button onClick={() => { setLoading(true); setPage((p) => p - 1) }} disabled={page === 1}
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
                  : <button key={p} onClick={() => { setLoading(true); setPage(p as number) }}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                      {p}
                    </button>
                )}

              <button onClick={() => { setLoading(true); setPage((p) => p + 1) }} disabled={page === totalPages}
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
