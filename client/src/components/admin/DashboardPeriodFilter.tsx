import { useTranslation } from 'react-i18next'

interface Props {
  period: 'month' | 'year'
  month: number
  year: number
  years: number[]
  onPeriodChange: (period: 'month' | 'year') => void
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}
export default function DashboardPeriodFilter({ period, month, year, years, onPeriodChange, onMonthChange, onYearChange }: Props) {
  const { t } = useTranslation()
  const buttonClass = (active: boolean) => `flex-1 rounded-md px-3 py-2 text-sm transition-colors sm:w-28 sm:flex-none ${active ? 'bg-red-600 font-semibold text-white' : 'text-gray-400 hover:text-white'}`
  const selectClass = 'h-10 min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:w-28 sm:flex-none sm:text-base'

  return <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
    <div className="col-span-2 flex rounded-lg bg-gray-800 p-1 sm:col-span-1">
      <button onClick={() => onPeriodChange('month')} className={buttonClass(period === 'month')}>{t('admin.byMonth')}</button>
      <button onClick={() => onPeriodChange('year')} className={buttonClass(period === 'year')}>{t('admin.byYear')}</button>
    </div>
    <select disabled={period === 'year'} value={month} onChange={(event) => onMonthChange(Number(event.target.value))} className={selectClass} aria-label={t('admin.selectMonth')}>
      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{t('admin.month', { month: index + 1 })}</option>)}
    </select>
    <select value={year} onChange={(event) => onYearChange(Number(event.target.value))} className={selectClass} aria-label={t('admin.selectYear')}>
      {years.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>
}
