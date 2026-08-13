import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  role: 'USER' | 'ADMIN'
  hasPassword: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  initialized: boolean
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
  setInitialized: (initialized: boolean) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      initialized: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
      setInitialized: (initialized) => set({ initialized }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: 'auth',
      // Access tokens stay in memory. A reload restores the session from the
      // HTTP-only refresh cookie through AuthBootstrap.
      partialize: () => ({}),
    }
  )
)
