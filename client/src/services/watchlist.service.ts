import { api } from '@/lib/axios'
import type { Movie } from '@/types/movie'

export interface WatchlistItem {
  createdAt: string
  movie: Movie
}

export const getWatchlist = async () => {
  const { data } = await api.get<WatchlistItem[]>('/watchlist')
  return data
}

export const getWatchlistStatus = async (movieId: string) => {
  const { data } = await api.get<{ inWatchlist: boolean }>(`/watchlist/${movieId}/status`)
  return data.inWatchlist
}

export const addToWatchlist = (movieId: string) => api.post(`/watchlist/${movieId}`)
export const removeFromWatchlist = (movieId: string) => api.delete(`/watchlist/${movieId}`)
