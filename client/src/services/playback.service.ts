import { api } from '@/lib/axios'

const DEVICE_KEY = 'netflix-device-id'

export const getDeviceId = () => {
  let value = localStorage.getItem(DEVICE_KEY)
  if (!value) {
    value = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, value)
  }
  return value
}

export interface PlaybackSessionResponse {
  sessionId: string
  videoUrl: string
  heartbeatIntervalSec: number
  expiresAfterSec: number
}

export interface ActivePlaybackSession {
  id: string
  deviceId: string
  movieId: string
  movieTitle: string
  startedAt: string
  lastHeartbeat: string
}

export const startPlaybackSession = async (movieId: string) => {
  const { data } = await api.post<PlaybackSessionResponse>('/playback-sessions', {
    movieId, deviceId: getDeviceId(),
  })
  return data
}

export const heartbeatPlaybackSession = (sessionId: string) => api.patch(`/playback-sessions/${sessionId}/heartbeat`)
export const endPlaybackSession = (sessionId: string) => api.delete(`/playback-sessions/${sessionId}`)
export const takeOverPlaybackSession = (sessionId: string) => api.post(`/playback-sessions/${sessionId}/takeover`)
export const getActivePlaybackSessions = async () => (await api.get<ActivePlaybackSession[]>('/playback-sessions')).data
