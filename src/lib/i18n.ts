// i18n bootstrap. We register all 4 supported languages up front so the
// switcher can flip instantly without dynamic imports. Auto-detects the
// device locale on first launch; a persisted user choice from the Zustand
// store overrides it.
//
// Keep ICU plural forms inside the JSON files (e.g. "key_one"/"key_other")
// — i18next handles per-language plural rules automatically.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'de', label: 'German', native: 'Deutsch' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * Returns the best initial language for this device. Honours the user's
 * device locale, falling back to 'en' if it's not one of our supported
 * languages. The store override takes precedence at runtime.
 */
export function detectDeviceLanguage(): LanguageCode {
  const locales = Localization.getLocales();
  const tag = locales?.[0]?.languageCode ?? 'en';
  const supported = SUPPORTED_LANGUAGES.map((l) => l.code) as readonly string[];
  return (supported.includes(tag) ? tag : 'en') as LanguageCode;
}

let initialized = false;

/** Lazy init — safe to call multiple times. */
export function initI18n(initialLang?: LanguageCode) {
  if (initialized) return;
  initialized = true;
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4', // RN Hermes JSC quirks — keep on v4 plural API
      lng: initialLang ?? detectDeviceLanguage(),
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
        es: { translation: es },
        pt: { translation: pt },
        de: { translation: de },
      },
      interpolation: { escapeValue: false }, // React already escapes
      returnNull: false,
      returnEmptyString: false,
    });
}

export function setLanguage(lang: LanguageCode) {
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }
}

export { i18n };
