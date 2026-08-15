import { api } from '@/lib/axios'
import type { Movie } from '@/types/movie'

export interface HistoryItem {
  id: string
  watchedAt: string
  movie: Movie
  episode: {
    id: string
    number: number
    title: string
    thumbnail: string | null
    season: { number: number }
  } | null
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const getWatchHistory = async (page = 1) => {
  const { data } = await api.get<HistoryResponse>('/watch-history', { params: { page, limit: 20 } })
  return data
}

export const removeWatchHistory = (id: string) => api.delete(`/watch-history/${id}`)
export const clearWatchHistory = () => api.delete('/watch-history')
