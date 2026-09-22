import { Outlet } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import AdminNav from './AdminNav'

export default function AdminLayout() {
  return <Layout>
    <main className="min-h-screen px-4 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-24">
      <div className="mx-auto w-full max-w-screen-2xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Quản trị</h1>
        <AdminNav />
        <div className="mt-4 min-h-[480px] sm:mt-6 sm:min-h-[640px]">
          <Outlet />
        </div>
      </div>
    </main>
  </Layout>
}
