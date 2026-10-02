import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import vi from './locales/vi.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    supportedLngs: ['vi', 'en'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
    interpolation: {
      escapeValue: false,
    },
  })

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.startsWith('en') ? 'en' : 'vi'
}

syncDocumentLanguage(i18n.resolvedLanguage || i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
