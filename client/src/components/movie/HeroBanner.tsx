import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Movie } from '@/types/movie'

interface Props {
  movie: Movie
}

export default function HeroBanner({ movie }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-[56vw] max-h-[780px] min-h-[400px]">
      {/* Background */}
      <div className="absolute inset-0">
        {movie.thumbnail ? (
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}
        {/* Cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414] to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-[20%] left-4 sm:left-12 md:left-16 max-w-xl z-10">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 leading-tight drop-shadow-lg">
          {movie.title}
        </h1>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-4">
          {movie.genres.slice(0, 3).map(({ genre }) => (
            <span key={genre.id} className="text-xs text-gray-300 border border-gray-500 px-2 py-0.5 rounded-full">
              {genre.name}
            </span>
          ))}
          {movie.type === 'SERIES' && (
            <span className="text-xs text-red-400 border border-red-700 px-2 py-0.5 rounded-full">Series</span>
          )}
        </div>

        <p className="text-sm sm:text-base text-gray-200 mb-6 line-clamp-3 drop-shadow max-w-md">
          {movie.description}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded hover:bg-gray-200 transition-colors text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('home.hero.watchNow')}
          </button>
          <button
            onClick={() => navigate(`/movies/${movie.id}`)}
            className="flex items-center gap-2 bg-gray-600/70 text-white font-bold px-6 py-2.5 rounded hover:bg-gray-500/70 transition-colors backdrop-blur-sm text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('movie.trailer')}
          </button>
        </div>
      </div>
    </div>
  )
}
