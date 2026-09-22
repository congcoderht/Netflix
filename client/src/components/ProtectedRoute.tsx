import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
  customerOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false, customerOnly = false }: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated()) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" replace />
  if (customerOnly && user?.role === 'ADMIN') return <Navigate to="/admin" replace />

  return <>{children}</>
}
