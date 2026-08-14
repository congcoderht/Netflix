import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/layout/Layout'
import HeroBanner from '@/components/movie/HeroBanner'
import MovieRow from '@/components/movie/MovieRow'
import { getMovies } from '@/services/movie.service'
import type { Movie } from '@/types/movie'
import ContinueWatchingRow from '@/components/movie/ContinueWatchingRow'
import { getContinueWatching, type ContinueWatchingItem } from '@/services/watch-progress.service'

export default function Home() {
  const { t } = useTranslation()
  const [featured, setFeatured] = useState<Movie | null>(null)
  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Movie[]>([])
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, seriesRes, progressRes] = await Promise.all([
          getMovies({ type: 'MOVIE', limit: 20 }),
          getMovies({ type: 'SERIES', limit: 20 }),
          getContinueWatching().catch(() => []),
        ])
        setAllMovies(moviesRes.items)
        setSeries(seriesRes.items)
        setContinueWatching(progressRes)
        // Featured = phim đầu tiên có thumbnail
        const feat = [...moviesRes.items, ...seriesRes.items].find((m) => m.thumbnail)
        setFeatured(feat || moviesRes.items[0] || seriesRes.items[0] || null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {featured && <HeroBanner movie={featured} />}

      <div className={`${featured ? '-mt-16 relative z-10' : 'pt-20'} pb-16`}>
        <ContinueWatchingRow items={continueWatching} />
        {allMovies.length > 0 && (
          <MovieRow title={t('home.sections.trending')} movies={allMovies} />
        )}
        {series.length > 0 && (
          <MovieRow title="Phim bộ nổi bật" movies={series} />
        )}
        {allMovies.length > 0 && (
          <MovieRow title={t('home.sections.newRelease')} movies={[...allMovies].reverse()} />
        )}
      </div>
    </Layout>
  )
}
