import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OAuthCallback from '@/pages/auth/OAuthCallback'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
              <p className="text-2xl">Trang chủ — đang xây dựng</p>
            </div>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
