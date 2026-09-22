import { Outlet } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import AdminNav from './AdminNav'

export default function AdminLayout() {
  return <Layout>
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="text-3xl font-black text-white">Quản trị</h1>
        <AdminNav />
        <div className="mt-6 min-h-[640px]">
          <Outlet />
        </div>
      </div>
    </main>
  </Layout>
}
