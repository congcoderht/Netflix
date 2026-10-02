export interface Genre {
  id: string
  name: string
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
  videoUrl: string | null
  hasVideo?: boolean
  duration: number | null
  isPublished: boolean
  createdAt: string
  genres: { genre: Genre }[]
  actors?: { role: string | null; actor: Actor }[]
}

export interface MovieListResponse {
  items: Movie[]
  total: number
  page: number
  limit: number
  totalPages: number
}
