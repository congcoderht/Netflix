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
  const buttonClass = (active: boolean) => `w-28 rounded-md py-2 text-sm transition-colors ${active ? 'bg-red-600 font-semibold text-white' : 'text-gray-400 hover:text-white'}`
  const selectClass = 'h-10 w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-40'

  return <div className="flex shrink-0 items-center gap-2">
    <div className="flex rounded-lg bg-gray-800 p-1">
      <button onClick={() => onPeriodChange('month')} className={buttonClass(period === 'month')}>Theo tháng</button>
      <button onClick={() => onPeriodChange('year')} className={buttonClass(period === 'year')}>Theo năm</button>
    </div>
    <select disabled={period === 'year'} value={month} onChange={(event) => onMonthChange(Number(event.target.value))} className={selectClass} aria-label="Chọn tháng">
      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>)}
    </select>
    <select value={year} onChange={(event) => onYearChange(Number(event.target.value))} className={selectClass} aria-label="Chọn năm">
      {years.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  </div>
}
