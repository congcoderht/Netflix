import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { getPaymentByOrder, type Payment } from '@/services/billing.service'
import { useTranslation } from 'react-i18next'

export default function PaymentResult() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [error, setError] = useState('')
  const queryError = orderId ? '' : t('subscription.missingOrder')

  useEffect(() => {
    if (!orderId) return
    getPaymentByOrder(orderId)
      .then(setPayment)
      .catch(() => setError(t('subscription.notFound')))
  }, [orderId, t])

  const title = payment?.status === 'SUCCESS'
    ? t('subscription.resultSuccess')
    : payment?.status === 'PENDING'
      ? t('subscription.resultPending')
      : t('subscription.resultFailed')
  const status = payment && t(`subscription.statuses.${payment.status}`)

  return <Layout><main className="flex min-h-screen items-center justify-center px-4 pt-16">
    <div className="w-full max-w-lg rounded-2xl bg-gray-900 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">{queryError || error || title}</h1>
      {payment && <p className="mt-3 text-gray-400">{t('subscription.transaction', { id: payment.orderId })}<br />{t('subscription.transactionStatus', { status })}</p>}
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/billing" className="rounded bg-red-600 px-5 py-3 font-bold text-white">{t('nav.managePlans')}</Link>
        <Link to="/" className="rounded bg-gray-700 px-5 py-3 text-white">{t('nav.home')}</Link>
      </div>
    </div>
  </main></Layout>
}
