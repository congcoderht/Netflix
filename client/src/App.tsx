import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import OAuthCallback from '@/pages/auth/OAuthCallback'
import VerifyOtp from '@/pages/auth/VerifyOtp'
import Movies from '@/pages/Movies'
import Profile from '@/pages/Profile'
import MovieDetail from '@/pages/MovieDetail'
import AdminMovies from '@/pages/admin/AdminMovies'
import ProtectedRoute from '@/components/ProtectedRoute'
import AuthBootstrap from '@/components/AuthBootstrap'
import WatchHistory from '@/pages/WatchHistory'
import MyList from '@/pages/MyList'
import RoleHome from '@/components/RoleHome'
import AdminLayout from '@/components/admin/AdminLayout'

const Billing = lazy(() => import('@/pages/Billing'))
const PaymentResult = lazy(() => import('@/pages/PaymentResult'))
const MockCheckout = lazy(() => import('@/pages/MockCheckout'))
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap><Suspense fallback={<div className="min-h-screen bg-black" />}><Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><RoleHome /></ProtectedRoute>} />
        <Route path="/movies" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><WatchHistory /></ProtectedRoute>} />
        <Route path="/my-list" element={<ProtectedRoute><MyList /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute customerOnly><Billing /></ProtectedRoute>} />
        <Route path="/payment/result" element={<ProtectedRoute customerOnly><PaymentResult /></ProtectedRoute>} />
        <Route path="/mock-payment/:provider" element={<ProtectedRoute customerOnly><MockCheckout /></ProtectedRoute>} />
        <Route path="/movies/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense></AuthBootstrap>
    </BrowserRouter>
  )
}
