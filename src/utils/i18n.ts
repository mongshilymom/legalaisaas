import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationKO from './locales/ko/translation.json';
import translationJA from './locales/ja/translation.json';
import translationZH from './locales/zh/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      ko: { translation: translationKO },
      ja: { translation: translationJA },
      zh: { translation: translationZH },
    },
    lng: 'ko',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;