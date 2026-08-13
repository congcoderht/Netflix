import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '@/components/layout/Layout'
import VideoPlayer from '@/components/movie/VideoPlayer'
import { getMovie } from '@/services/movie.service'
import type { Movie } from '@/types/movie'

const CREW_ROLES = ['Đạo diễn', 'Giám đốc sản xuất', 'Nhà sản xuất', 'Biên kịch']

function TrailerModal({ url, onClose }: { url: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // YouTube embed
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/)
  const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` : null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === ref.current && onClose()}>
      <div ref={ref} className="absolute inset-0" />
      <div className="relative w-full max-w-4xl z-10">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Đóng
        </button>
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          {embedUrl
            ? <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay" />
            : <VideoPlayer url={url} autoPlay />
          }
        </div>
      </div>
    </div>
  )
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [activeSeason, setActiveSeason] = useState(0)
  const [activeEpisode, setActiveEpisode] = useState<{ url: string; title: string; id: string } | null>(null)

  useEffect(() => {
    if (!id) return
    getMovie(id)
      .then(setMovie)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  if (!movie) return null

  const actors = movie.actors?.filter((a) => !CREW_ROLES.includes(a.role || '')) || []
  const crew = movie.actors?.filter((a) => CREW_ROLES.includes(a.role || '')) || []

  const currentVideoUrl = activeEpisode?.url || movie.videoUrl || ''

  return (
    <Layout>
      {showTrailer && movie.trailerUrl && (
        <TrailerModal url={movie.trailerUrl} onClose={() => setShowTrailer(false)} />
      )}

      <div className="min-h-screen pt-16">
        {/* Hero / Player area */}
        <div className="bg-black">
          {playing && currentVideoUrl ? (
            <div className="max-w-5xl mx-auto px-4 py-6">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => { setPlaying(false); setActiveEpisode(null) }}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại
                </button>
                {activeEpisode && <span className="text-white text-sm font-medium">{activeEpisode.title}</span>}
              </div>
              <VideoPlayer url={currentVideoUrl} autoPlay />
            </div>
          ) : (
            <div className="relative w-full h-[55vw] max-h-[680px] min-h-[320px]">
              {movie.thumbnail
                ? <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover object-top" />
                : <div className="w-full h-full bg-gray-900" />
              }
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

              {/* Play button overlay */}
              {(movie.videoUrl || (movie.seasons && movie.seasons.length > 0)) && (
                <button
                  onClick={() => {
                    if (movie.type === 'MOVIE') setPlaying(true)
                    else document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 group-hover:bg-white/30 transition-all">
                    <svg className="w-7 h-7 sm:w-9 sm:h-9 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
          {/* Title & actions */}
          <div className="py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">{movie.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {movie.type === 'SERIES' && (
                    <span className="text-xs font-bold text-red-400 border border-red-700 px-2 py-0.5 rounded">SERIES</span>
                  )}
                  {movie.duration && (
                    <span className="text-gray-400 text-sm">{Math.floor(movie.duration / 60) > 0 ? `${Math.floor(movie.duration / 60)}g ` : ''}{movie.duration % 60}p</span>
                  )}
                  {movie.genres.map(({ genre }) => (
                    <span key={genre.id} className="text-xs text-gray-300 border border-gray-600 px-2 py-0.5 rounded-full">{genre.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {movie.type === 'MOVIE' && movie.videoUrl && (
                <button onClick={() => { setPlaying(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  {t('home.hero.watchNow')}
                </button>
              )}
              {movie.type === 'SERIES' && (
                <button onClick={() => document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  Xem ngay
                </button>
              )}
              {movie.trailerUrl && (
                <button onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-gray-700/80 text-white font-semibold px-6 py-3 rounded hover:bg-gray-600/80 transition-colors backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('movie.trailer')}
                </button>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="text-gray-300 text-base leading-relaxed max-w-3xl">{movie.description}</p>
            )}
          </div>

          {/* Cast & Crew */}
          {(actors.length > 0 || crew.length > 0) && (
            <div className="border-t border-gray-800 py-8">
              <h2 className="text-xl font-bold text-white mb-6">Diễn viên & Đoàn làm phim</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Diễn viên */}
                {actors.length > 0 && (
                  <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Diễn viên</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {actors.map(({ actor, role }) => (
                        <div key={actor.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors">
                          <div className="w-11 h-11 rounded-full bg-gray-700 overflow-hidden shrink-0 ring-2 ring-gray-600">
                            {actor.avatar
                              ? <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-white font-bold">{actor.name[0]}</div>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{actor.name}</p>
                            {role && <p className="text-gray-400 text-xs truncate">{role}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Đoàn làm phim */}
                {crew.length > 0 && (
                  <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Đoàn làm phim</h3>
                    <div className="space-y-3">
                      {CREW_ROLES.map((role) => {
                        const people = crew.filter((c) => c.role === role)
                        if (!people.length) return null
                        return (
                          <div key={role} className="flex gap-3">
                            <span className="text-gray-500 text-sm w-36 shrink-0">{role}</span>
                            <span className="text-white text-sm">{people.map((p) => p.actor.name).join(', ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Episodes — Series */}
          {movie.type === 'SERIES' && movie.seasons && movie.seasons.length > 0 && (
            <div id="episodes-section" className="border-t border-gray-800 py-8">
              <h2 className="text-xl font-bold text-white mb-5">Tập phim</h2>
              <div className="flex gap-2 mb-6 flex-wrap">
                {movie.seasons.map((season, i) => (
                  <button key={season.id} onClick={() => setActiveSeason(i)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeSeason === i ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                    {season.title || `${t('movie.season')} ${season.number}`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {movie.seasons[activeSeason]?.episodes.map((ep, idx) => {
                  const isActive = activeEpisode?.id === ep.id
                  return (
                    <div key={ep.id} onClick={() => { setActiveEpisode({ url: ep.id, title: `Tập ${ep.number}: ${ep.title}`, id: ep.id }); setPlaying(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-white/10 border-white/20' : 'bg-gray-800/40 border-transparent hover:bg-gray-800 hover:border-gray-700'}`}>
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{ background: isActive ? 'white' : '#374151', color: isActive ? 'black' : 'white' }}>
                        {isActive
                          ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                          : idx + 1
                        }
                      </div>
                      {ep.thumbnail && (
                        <img src={ep.thumbnail} alt="" className="w-24 h-14 object-cover rounded hidden sm:block" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{t('movie.episode')} {ep.number}: {ep.title}</p>
                        {ep.duration && <p className="text-gray-400 text-xs mt-0.5">{ep.duration} phút</p>}
                      </div>
                      <svg className="w-5 h-5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
