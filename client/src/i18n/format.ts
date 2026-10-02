export const localeFor = (language: string) => language.startsWith('en') ? 'en-US' : 'vi-VN'

export const formatDate = (value: string | Date, language: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(localeFor(language), options).format(new Date(value))

export const formatMoney = (amount: number, currency: string, language: string) =>
  new Intl.NumberFormat(localeFor(language), { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

export const currentLanguage = (language: string) => language.startsWith('en') ? 'en' : 'vi'
