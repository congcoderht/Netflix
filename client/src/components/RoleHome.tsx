import { Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import { useAuthStore } from '@/store/auth.store'

export default function RoleHome() {
  const role = useAuthStore((state) => state.user?.role)
  return role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Home />
}
