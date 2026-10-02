import { useEffect, useRef, useState } from 'react'
import Layout from '@/components/layout/Layout'
import { useTranslation } from 'react-i18next'
import { formatDate, formatMoney } from '@/i18n/format'
import { getApiErrorMessage } from '@/lib/api-error'
import {
  checkout,
  getCurrentSubscription,
  getPayments,
  getPlans,
  type Payment,
  type PaymentProvider,
  type Plan,
  type Subscription,
} from '@/services/billing.service'

const providerName = (provider: PaymentProvider | 'MOMO') => provider === 'MOCK_VNPAY' ? 'VNPAY' : 'MoMo'
const providerLogo = (provider: PaymentProvider | 'MOMO') => provider === 'MOCK_VNPAY' ? '/payments/vnpay.svg' : '/payments/momo.svg'

function ProviderLogo({ provider }: { provider: PaymentProvider | 'MOMO' }) {
  return <span className="flex h-11 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl">
    <img src={providerLogo(provider)} alt={providerName(provider)} className="block h-full w-full object-contain" />
  </span>
}

export default function Billing() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language
  const money = (amount: number) => formatMoney(amount, 'VND', language)
  const date = (value: string) => formatDate(value, language)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [provider, setProvider] = useState<PaymentProvider>('MOCK_MOMO')
  const [buying, setBuying] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    Promise.all([getPlans(), getCurrentSubscription(), getPayments()])
      .then(([planItems, current, paymentItems]) => {
        setPlans(planItems)
        setSubscription(current)
        setPayments(paymentItems)
      })
      .catch((err) => showToast(getApiErrorMessage(err, t('subscription.loadError'))))
    return () => { if (toastTimer.current) window.clearTimeout(toastTimer.current) }
  }, [t])

  const buy = async () => {
    if (!selectedPlan) return
    setBuying(true)
    try {
      const result = await checkout(selectedPlan.id, provider)
      showToast(t('subscription.checkoutCreated'))
      window.location.assign(result.payUrl)
    } catch (err) {
      showToast(getApiErrorMessage(err, t('subscription.checkoutError')))
      setBuying(false)
    }
  }

  return <Layout>
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-8">
      <div className="mx-auto w-full max-w-screen-xl">
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t('nav.billing')}</h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan.id === plan.id
            return <article key={plan.id} className={`relative flex flex-col rounded-2xl border p-5 transition-colors sm:p-6 ${isCurrent ? 'border-red-500/50 bg-red-950/10' : 'border-gray-700 bg-gray-900'}`}>
              {isCurrent && <span className="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">{t('subscription.currentPlanBadge')}</span>}
              <h2 className="pr-24 text-2xl font-bold text-white">{plan.name}</h2>
              <p className="mt-2 text-3xl font-black text-red-500">{money(plan.price)}</p>
              <p className="text-sm text-gray-500">/{t('common.days', { count: plan.durationDays })}</p>
              <p className="mt-5 text-gray-300">
                {t(`subscription.planDescriptions.${plan.code}`, { defaultValue: plan.description || '' })}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t('subscription.concurrentScreens', { count: plan.maxScreens })}</p>
              {isCurrent && <div className="mt-5 rounded-lg bg-black/30 p-3 text-sm text-gray-200">
                {t('subscription.validUntil', { date: date(subscription.expiresAt) })}
              </div>}
              <button onClick={() => setSelectedPlan(plan)} className="mt-auto rounded bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">
                {isCurrent ? t('subscription.renew') : subscription ? t('subscription.changePlan') : t('subscription.buyPlan')}
              </button>
            </article>
          })}
        </div>

        <h2 className="mt-12 text-xl font-bold text-white">{t('subscription.paymentHistory')}</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400"><tr><th className="p-4">{t('subscription.plan')}</th><th className="p-4">{t('subscription.method')}</th><th className="p-4">{t('subscription.amount')}</th><th className="p-4">{t('subscription.createdAt')}</th><th className="p-4">{t('subscription.status')}</th></tr></thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {payments.map((payment) => <tr key={payment.id}>
                <td className="p-4">{payment.planName}</td>
                <td className="p-4"><span className="flex items-center gap-3"><ProviderLogo provider={payment.provider} /><span>{providerName(payment.provider)}</span></span></td>
                <td className="p-4">{money(payment.amount)}</td>
                <td className="p-4">{date(payment.createdAt)}</td>
                <td className="p-4">{t(`subscription.statuses.${payment.status}`)}</td>
              </tr>)}
              {!payments.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">{t('subscription.noPayments')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>

    {selectedPlan && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation" onMouseDown={() => !buying && setSelectedPlan(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="payment-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm text-gray-400">{t('subscription.paymentFor')}</p><h2 id="payment-title" className="text-2xl font-bold text-white">{selectedPlan.name}</h2></div>
          <button disabled={buying} onClick={() => setSelectedPlan(null)} className="text-2xl text-gray-400 hover:text-white" aria-label={t('common.close')}>×</button>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-800 p-4"><span className="text-gray-300">{t('subscription.total')}</span><strong className="text-2xl text-red-500">{money(selectedPlan.price)}</strong></div>

        {subscription && subscription.plan.id !== selectedPlan.id && <p className="mt-4 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
          {t('subscription.replaceWarning', { newPlan: selectedPlan.name, currentPlan: subscription.plan.name })}
        </p>}

        <fieldset className="mt-6">
          <legend className="mb-3 font-semibold text-white">{t('subscription.chooseMethod')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['MOCK_MOMO', 'MOCK_VNPAY'] as PaymentProvider[]).map((item) => <label key={item} className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${provider === item ? 'border-red-500/60 bg-red-950/15' : 'border-gray-700 hover:border-gray-500'}`}>
              <input className="sr-only" type="radio" name="provider" checked={provider === item} onChange={() => setProvider(item)} />
              <ProviderLogo provider={item} />
              <span className="font-semibold text-white">{providerName(item)}</span>
            </label>)}
          </div>
        </fieldset>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
          <button disabled={buying} onClick={() => setSelectedPlan(null)} className="flex-1 rounded-lg bg-gray-700 px-4 py-3 font-semibold text-white hover:bg-gray-600 disabled:opacity-50">{t('common.cancel')}</button>
          <button disabled={buying} onClick={() => void buy()} className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50">{buying ? t('subscription.processing') : t('subscription.continuePayment')}</button>
        </div>
      </section>
    </div>}

    {toast && <div role="status" className="fixed left-4 right-4 top-20 z-[60] rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 text-white shadow-2xl sm:left-auto sm:right-5 sm:max-w-sm">
      <div className="flex items-start gap-4"><span className="mt-0.5 text-green-400">●</span><p className="flex-1">{toast}</p><button onClick={() => setToast('')} className="text-gray-400 hover:text-white" aria-label={t('common.close')}>×</button></div>
    </div>}
  </Layout>
}
