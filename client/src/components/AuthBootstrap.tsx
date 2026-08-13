import { useEffect } from 'react'
import { bootstrapSession } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((state) => state.initialized)
  const setInitialized = useAuthStore((state) => state.setInitialized)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let active = true

    bootstrapSession()
      .catch(() => logout())
      .finally(() => {
        if (active) setInitialized(true)
      })

    return () => { active = false }
  }, [logout, setInitialized])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
