import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ContinueWatchingItem } from '@/services/watch-progress.service'

export default function ContinueWatchingRow({ items }: { items: ContinueWatchingItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  if (!items.length) return null

  const scroll = (direction: number) => {
    rowRef.current?.scrollBy({ left: direction * 600, behavior: 'smooth' })
  }

  return (
    <section className="mb-8 group/row">
      <h2 className="text-white font-bold text-lg sm:text-xl px-4 sm:px-12 md:px-16 mb-3">
        Tiếp tục xem
      </h2>
      <div className="relative px-4 sm:px-12 md:px-16">
        <button onClick={() => scroll(-1)} aria-label="Cuộn sang trái"
          className="absolute left-0 sm:left-4 md:left-6 top-0 z-10 h-full w-10 bg-black/50 opacity-0 group-hover/row:opacity-100">
          ‹
        </button>
        <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
          {items.map((item) => {
            const query = new URLSearchParams({ play: '1' })
            if (item.episode) query.set('episodeId', item.episode.id)
            const image = item.episode?.thumbnail || item.movie.thumbnail
            return (
              <button key={`${item.movie.id}-${item.episode?.id || 'movie'}`}
                onClick={() => navigate(`/movies/${item.movie.id}?${query}`)}
                className="group/card w-64 sm:w-72 shrink-0 text-left">
                <div className="relative aspect-video overflow-hidden rounded bg-gray-800">
                  {image ? <img src={image} alt={item.movie.title} className="h-full w-full object-cover transition-transform group-hover/card:scale-105" /> : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/card:opacity-100">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-black">▶</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gray-700">
                    <div className="h-full bg-red-600" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-white">{item.movie.title}</p>
                <p className="truncate text-xs text-gray-400">
                  {item.episode
                    ? `P${item.episode.seasonNumber}:T${item.episode.number} · ${item.episode.title}`
                    : `Đã xem ${item.progressPercent}%`}
                </p>
              </button>
            )
          })}
        </div>
        <button onClick={() => scroll(1)} aria-label="Cuộn sang phải"
          className="absolute right-0 sm:right-4 md:right-6 top-0 z-10 h-full w-10 bg-black/50 opacity-0 group-hover/row:opacity-100">
          ›
        </button>
      </div>
    </section>
  )
}
