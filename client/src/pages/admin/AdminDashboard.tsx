import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '@/lib/api-error'
import { getAdminDashboard, type AdminDashboardData } from '@/services/admin-dashboard.service'
import DashboardPeriodFilter from '@/components/admin/DashboardPeriodFilter'
import RevenueChart from '@/components/admin/RevenueChart'
import { useTranslation } from 'react-i18next'
import { formatDate, formatMoney, localeFor } from '@/i18n/format'

const now = new Date()
const availableYears = Array.from({ length: 7 }, (_, index) => now.getFullYear() - index)

export default function AdminDashboard() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language
  const money = (amount: number) => formatMoney(amount, 'VND', language)
  const number = (value: number) => new Intl.NumberFormat(localeFor(language)).format(value)
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminDashboard(period, year, month)
      .then((result) => { if (active) { setData(result); setError('') } })
      .catch((err) => { if (active) setError(getApiErrorMessage(err, t('admin.dashboardLoadError'))) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [month, period, t, year])

  const periodLabel = period === 'month' ? t('admin.periodMonth', { month, year }) : t('admin.periodYear', { year })
  const cards = data ? [
    { label: t('admin.users'), value: number(data.summary.totalUsers), note: t('admin.newUsers', { count: number(data.summary.newUsersThisMonth) }), color: 'text-blue-400', to: '/admin/users' },
    { label: t('admin.activeSubscriptions'), value: number(data.summary.activeSubscriptions), note: t('admin.manageSubscriptions'), color: 'text-green-400', to: '/admin/plans' },
    { label: t('admin.periodRevenue', { period: periodLabel }), value: money(data.summary.revenueInPeriod), note: t('admin.viewPlansAndPayments'), color: 'text-red-400', to: '/admin/plans' },
    { label: t('admin.content'), value: number(data.summary.movies), note: t('admin.movieCount', { count: data.summary.movies }), color: 'text-purple-400', to: '/admin/movies' },
  ] : []

  return <>
      {error ? <div className="mt-8 rounded-xl bg-red-950/40 p-5 text-red-300">{error}</div> : <div className={loading ? 'pointer-events-none opacity-50' : ''}>
        <section className="mt-5 grid gap-4 sm:mt-7 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Link key={card.label} to={card.to} className="group rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:-translate-y-0.5 hover:border-gray-600 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"><p className="text-sm text-gray-400">{card.label}</p><p className={`mt-2 break-words text-2xl font-black sm:text-3xl ${card.color}`}>{card.value}</p><p className="mt-2 text-xs text-gray-500 group-hover:text-gray-300">{card.note}</p></Link>)}</section>

        {data && <><section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
          <article className="min-w-0 rounded-2xl border border-gray-800 bg-gray-900 p-4 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-xl font-bold text-white">{t('admin.periodRevenue', { period: periodLabel })}</h2>
              <DashboardPeriodFilter period={period} month={month} year={year} years={availableYears} onPeriodChange={setPeriod} onMonthChange={setMonth} onYearChange={setYear} />
            </div>
            <RevenueChart items={data.revenueSeries} period={period} formatMoney={money} />
          </article>

          <article className="rounded-2xl border border-gray-800 bg-gray-900 p-6"><h2 className="text-xl font-bold text-white">{t('admin.mostWatched')}</h2><div className="mt-5 space-y-3">{data.topMovies.map((movie, index) => <div key={movie.id} className="flex items-center gap-3 rounded-xl bg-gray-800/60 p-3"><span className="w-6 text-lg font-black text-red-500">{index + 1}</span><div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-700">{movie.thumbnail && <img src={movie.thumbnail} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><p className="truncate font-semibold text-white">{movie.title}</p><p className="text-xs text-gray-400">{t('admin.views', { count: number(movie.views) })}</p></div></div>)}{!data.topMovies.length && <p className="py-12 text-center text-gray-500">{t('admin.noViewData')}</p>}</div></article>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-900"><div className="border-b border-gray-800 p-5"><h2 className="text-xl font-bold text-white">{t('admin.recentPayments')}</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="text-gray-500"><tr><th className="p-4">{t('admin.customer')}</th><th className="p-4">{t('subscription.plan')}</th><th className="p-4">{t('subscription.method')}</th><th className="p-4">{t('subscription.amount')}</th><th className="p-4">{t('admin.paymentDate')}</th><th className="p-4">{t('subscription.status')}</th></tr></thead><tbody className="divide-y divide-gray-800">{data.recentPayments.map((payment) => <tr key={payment.id} className="text-gray-300"><td className="p-4"><span className="block text-white">{payment.user.name || t('common.user')}</span><span className="text-xs text-gray-500">{payment.user.email}</span></td><td className="p-4">{payment.planName}</td><td className="p-4">{payment.provider.includes('VNPAY') ? 'VNPAY' : 'MoMo'}</td><td className="p-4">{money(payment.amount)}</td><td className="p-4">{formatDate(payment.revenueAt, language, { timeZone: 'Asia/Ho_Chi_Minh' })}</td><td className="p-4"><span className={payment.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>{t(`subscription.statuses.${payment.status}`)}</span></td></tr>)}</tbody></table>{!data.recentPayments.length && <p className="py-10 text-center text-gray-500">{t('subscription.noPayments')}</p>}</div></section></>}
      </div>}
  </>
}
