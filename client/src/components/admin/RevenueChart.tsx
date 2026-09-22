interface RevenuePoint {
  key: string
  label: string
  amount: number
}

interface Props {
  items: RevenuePoint[]
  period: 'month' | 'year'
  formatMoney: (amount: number) => string
}

export default function RevenueChart({ items, period, formatMoney }: Props) {
  const max = Math.max(...items.map((item) => item.amount), 1)
  const formatCompactMoney = (amount: number) => {
    if (!amount) return '0 ₫'
    if (amount >= 1_000_000_000) return `${Number((amount / 1_000_000_000).toFixed(1))}B ₫`
    if (amount >= 1_000_000) return `${Number((amount / 1_000_000).toFixed(1))}M ₫`
    if (amount >= 1_000) return `${Number((amount / 1_000).toFixed(1))}K ₫`
    return formatMoney(amount)
  }

  return <div className="mt-7 grid h-72 items-end gap-1 border-b border-gray-700 px-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item, index) => {
      const showDayLabel = period === 'year' || index % 2 === 0 || index === items.length - 1
      const accessibleLabel = `${item.label}: ${formatMoney(item.amount)}`
      return <div
        key={item.key}
        tabIndex={0}
        aria-label={accessibleLabel}
        className="group relative flex h-full min-w-0 cursor-default flex-col items-center justify-end gap-2 rounded-t outline-none focus-visible:ring-2 focus-visible:ring-red-500/80"
      >
        <div role="tooltip" className="pointer-events-none absolute left-1/2 top-2 z-20 w-max max-w-44 -translate-x-1/2 translate-y-1 rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-center opacity-0 shadow-xl shadow-black/40 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <span className="block text-[11px] text-gray-400">{item.label}</span>
          <strong className="mt-0.5 block whitespace-nowrap text-xs text-white">{formatMoney(item.amount)}</strong>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-gray-600 bg-gray-950" />
        </div>
        <span className="h-4 whitespace-nowrap text-[10px] text-gray-400 transition-colors group-hover:text-white group-focus-visible:text-white">{formatCompactMoney(item.amount)}</span>
        <div className="w-full max-w-12 origin-bottom rounded-t bg-gradient-to-t from-red-800 to-red-500 shadow-red-600/20 transition-[height,filter,transform,box-shadow] duration-200 group-hover:scale-x-110 group-hover:brightness-125 group-hover:shadow-lg group-focus-visible:scale-x-110 group-focus-visible:brightness-125 group-focus-visible:shadow-lg" style={{ height: `${Math.max(item.amount ? 8 : 2, (item.amount / max) * 82)}%` }} />
        <span className="h-5 pb-2 text-[11px] text-gray-500 transition-colors group-hover:text-gray-200 group-focus-visible:text-gray-200">{showDayLabel ? item.label : ''}</span>
      </div>
    })}
  </div>
}
