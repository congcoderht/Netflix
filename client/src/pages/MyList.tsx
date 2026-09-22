import { useEffect, useState } from 'react'
import Layout from '@/components/layout/Layout'
import MovieCard from '@/components/movie/MovieCard'
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from '@/services/watchlist.service'

export default function MyList() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getWatchlist()
      .then(setItems)
      .catch(() => setError('Không thể tải danh sách của bạn.'))
      .finally(() => setLoading(false))
  }, [])

  const remove = async (movieId: string) => {
    await removeFromWatchlist(movieId)
    setItems((current) => current.filter((item) => item.movie.id !== movieId))
  }

  return (
    <Layout>
      <main className="min-h-screen px-4 pb-16 pt-24 sm:px-8 md:px-16">
        <div className="mx-auto max-w-screen-2xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Danh sách của tôi</h1>
          {loading ? <div className="py-20 text-center text-gray-400">Đang tải...</div>
            : error ? <div className="py-20 text-center text-red-400">{error}</div>
            : items.length === 0 ? <div className="py-20 text-center text-gray-400">Bạn chưa thêm phim nào.</div>
            : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {items.map(({ movie }) => (
                <div key={movie.id} className="relative">
                  <MovieCard movie={movie} gridMode />
                  <button onClick={() => void remove(movie.id)} className="mt-2 w-full rounded bg-gray-800 py-2 text-xs text-gray-300 hover:bg-red-700 hover:text-white">
                    Xóa khỏi danh sách
                  </button>
                </div>
              ))}
            </div>}
        </div>
      </main>
    </Layout>
  )
}
