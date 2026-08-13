export type ContentType = 'MOVIE' | 'SERIES'

export interface Genre {
  id: string
  name: string
}

export interface Episode {
  id: string
  number: number
  title: string
  duration: number | null
  thumbnail: string | null
}

export interface Season {
  id: string
  number: number
  title: string | null
  episodes: Episode[]
}

export interface Actor {
  id: string
  name: string
  avatar: string | null
  bio?: string | null
}

export interface Movie {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  trailerUrl: string | null
  type: ContentType
  videoUrl: string | null
  duration: number | null
  isPublished: boolean
  createdAt: string
  genres: { genre: Genre }[]
  actors?: { role: string | null; actor: Actor }[]
  seasons?: Season[]
}

export interface MovieListResponse {
  items: Movie[]
  total: number
  page: number
  limit: number
  totalPages: number
}
