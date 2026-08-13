import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OAuthCallback from '@/pages/auth/OAuthCallback'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import Home from '@/pages/Home'
import Movies from '@/pages/Movies'
import Profile from '@/pages/Profile'
import MovieDetail from '@/pages/MovieDetail'
import AdminMovies from '@/pages/admin/AdminMovies'
import ProtectedRoute from '@/components/ProtectedRoute'
import AuthBootstrap from '@/components/AuthBootstrap'

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap><Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/movies" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/movies/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
        <Route path="/admin/movies" element={<ProtectedRoute adminOnly><AdminMovies /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></AuthBootstrap>
    </BrowserRouter>
  )
}
