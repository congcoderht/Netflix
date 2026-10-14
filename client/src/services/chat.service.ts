import { api } from '@/lib/axios'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessagePayload {
  role: ChatRole
  content: string
}

export interface ChatMovieSuggestion {
  id: string
  title: string
  thumbnail: string | null
  duration: number | null
}

export interface ChatResponse {
  message: string
  movies: ChatMovieSuggestion[]
}

export const sendChatMessage = async (messages: ChatMessagePayload[]) => {
  const { data } = await api.post<ChatResponse>('/chat', { messages })
  return data
}
