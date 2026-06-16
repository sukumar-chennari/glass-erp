import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enResources } from './locales/en';
import { teResources } from './locales/te';
import { hiResources } from './locales/hi';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enResources,
      te: teResources,
      hi: hiResources,
    },
    defaultNS: 'common',
    fallbackNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'te', 'hi'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'erp-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
