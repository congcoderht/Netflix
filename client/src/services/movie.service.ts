import { api } from '@/lib/axios'
import type { Movie, MovieListResponse, Genre } from '@/types/movie'

export const getMovies = async (params?: {
  type?: string
  genreId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<MovieListResponse> => {
  const { data } = await api.get('/movies', { params })
  return data
}

export const getMovie = async (id: string): Promise<Movie> => {
  const { data } = await api.get(`/movies/${id}`)
  return data
}

export const getGenres = async (): Promise<Genre[]> => {
  const { data } = await api.get('/genres')
  return data
}
