import { useRef } from 'react'
import MovieCard from './MovieCard'
import type { Movie } from '@/types/movie'

interface Props {
  title: string
  movies: Movie[]
}

export default function MovieRow({ title, movies }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return
    rowRef.current.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' })
  }

  if (!movies.length) return null

  return (
    <div className="mb-8 group/row">
      <h2 className="text-white font-bold text-lg sm:text-xl px-4 sm:px-12 md:px-16 mb-3">{title}</h2>

      <div className="relative px-4 sm:px-12 md:px-16">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-black/50 hover:bg-black/80 transition-all opacity-0 group-hover/row:opacity-100 flex items-center justify-center rounded-r"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Row */}
        <div
          ref={rowRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-black/50 hover:bg-black/80 transition-all opacity-0 group-hover/row:opacity-100 flex items-center justify-center rounded-l"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
