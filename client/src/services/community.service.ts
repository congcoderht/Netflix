import { api } from '@/lib/axios'

export interface CommentAuthor {
  id: string
  name: string | null
  avatar: string | null
}

export interface MovieComment {
  id: string
  content: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  user: CommentAuthor
  replies?: MovieComment[]
}

export interface CommentPage {
  items: MovieComment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RatingSummary {
  average: number
  count: number
  myRating: number | null
}

const baseUrl = (movieId: string) => `/movies/${movieId}/community`

export const getComments = async (movieId: string, page = 1, limit = 10) => {
  const { data } = await api.get<CommentPage>(`${baseUrl(movieId)}/comments`, { params: { page, limit } })
  return data
}

export const createComment = async (movieId: string, content: string, parentId?: string) => {
  const { data } = await api.post<MovieComment>(`${baseUrl(movieId)}/comments`, { content, parentId })
  return data
}

export const updateComment = async (movieId: string, commentId: string, content: string) => {
  const { data } = await api.patch(`${baseUrl(movieId)}/comments/${commentId}`, { content })
  return data
}

export const deleteComment = (movieId: string, commentId: string) =>
  api.delete(`${baseUrl(movieId)}/comments/${commentId}`)

export const getRating = async (movieId: string) => {
  const { data } = await api.get<RatingSummary>(`${baseUrl(movieId)}/rating`)
  return data
}

export const setRating = async (movieId: string, score: number) => {
  const { data } = await api.put<RatingSummary>(`${baseUrl(movieId)}/rating`, { score })
  return data
}
