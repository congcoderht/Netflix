import { api } from '@/lib/axios'
import type { Movie } from '@/types/movie'

export interface WatchProgress {
  progressSec: number
  durationSec: number | null
  completed: boolean
  resumeFromSec: number
  updatedAt: string | null
}

export interface ContinueWatchingItem {
  movie: Movie
  progressSec: number
  durationSec: number | null
  progressPercent: number
  updatedAt: string
}

export const getContinueWatching = async (limit = 20) => {
  const { data } = await api.get<ContinueWatchingItem[]>('/watch-progress', { params: { limit } })
  return data
}

export const getWatchProgress = async (movieId: string) => {
  const { data } = await api.get<WatchProgress>(`/watch-progress/${movieId}`)
  return data
}

export const saveWatchProgress = async (
  movieId: string,
  progressSec: number,
) => {
  const { data } = await api.put<WatchProgress>(`/watch-progress/${movieId}`, {
    progressSec: Math.max(0, Math.floor(progressSec)),
  })
  return data
}
