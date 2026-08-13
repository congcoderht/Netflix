import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Movie } from '@/types/movie'

interface Props {
  movie: Movie
  gridMode?: boolean
}

export default function MovieCard({ movie, gridMode = false }: Props) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:z-10 ${gridMode ? 'w-full' : 'shrink-0 w-36 sm:w-44 md:w-52'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/movies/${movie.id}`)}
    >
      {/* Thumbnail */}
      <div className="aspect-[2/3] rounded overflow-hidden bg-gray-800">
        {movie.thumbnail ? (
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black/60 flex flex-col justify-end p-3 transition-opacity duration-200 rounded ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-xs font-semibold line-clamp-2 mb-1">{movie.title}</p>
          <div className="flex items-center gap-1 flex-wrap">
            {movie.type === 'SERIES' && (
              <span className="text-red-400 text-[10px] font-medium">Series</span>
            )}
            {movie.duration && (
              <span className="text-gray-300 text-[10px]">{movie.duration}m</span>
            )}
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              className="flex-1 bg-white text-black text-[11px] font-bold py-1 rounded flex items-center justify-center gap-1"
              onClick={(e) => { e.stopPropagation(); navigate(`/watch/${movie.id}`) }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            <button className="w-7 h-7 bg-gray-700/80 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Title below card */}
      <p className="mt-1.5 text-xs text-gray-400 line-clamp-1 px-0.5">{movie.title}</p>
    </div>
  )
}
