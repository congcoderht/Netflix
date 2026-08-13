import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

type RefreshResponse = { accessToken: string }
type RetryableRequest = { _retry?: boolean; headers: Record<string, string> }

let refreshPromise: Promise<string> | null = null

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.accessToken)
        return data.accessToken
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

const redirectToLogin = () => {
  useAuthStore.getState().logout()
  if (window.location.pathname.startsWith('/login')) return
  const returnTo = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`)
}

export const bootstrapSession = async () => {
  const token = await refreshAccessToken()
  const { data: user } = await axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  })
  useAuthStore.getState().setAuth(user, token)
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableRequest | undefined
    const isAuthEndpoint = original && typeof (original as { url?: string }).url === 'string'
      && (original as { url?: string }).url?.startsWith('/auth/')

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        const accessToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        redirectToLogin()
      }
    }
    return Promise.reject(error)
  }
)
