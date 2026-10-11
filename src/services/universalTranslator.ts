// Universal translation helper
// Uses native in-app dictionary translations (LanguageContext) and safely sets
// HTML document attributes without injecting conflicting third-party DOM scripts.

import { Language } from '../contexts/LanguageContext';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

// Map application language codes
export const GOOGLE_LANG_MAP: Record<Language, string> = {
  fr: 'fr',
  en: 'en',
  es: 'es',
  zh: 'zh-CN',
  ja: 'ja',
  pt: 'pt'
};

/**
 * Initializes and cleans up any legacy Google Translate artifacts
 * to protect React Virtual DOM from external script crashes.
 */
export function initGoogleTranslate(): void {
  if (typeof window === 'undefined') return;

  try {
    // Remove legacy script tag if present
    const scriptEl = document.getElementById('google-translate-script');
    if (scriptEl) {
      scriptEl.remove();
    }

    // Remove legacy container if present
    const mountEl = document.getElementById('google_translate_element');
    if (mountEl) {
      mountEl.remove();
    }

    // Clean up any old Google Translate cookies that might trigger unwanted external scripts
    const host = window.location.hostname;
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      document.cookie = `googtrans=; domain=.${host}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    }
  } catch (err) {
    // Graceful degradation
  }
}

/**
 * Updates application document language without crashing the DOM.
 */
export function applyGoogleLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;

  try {
    // Update HTML lang attribute safely
    document.documentElement.lang = lang;

    // Clear any obsolete googtrans cookie that could conflict with browser extensions
    const host = window.location.hostname;
    document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      document.cookie = `googtrans=; domain=.${host}; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    }
  } catch {
    // Graceful silent fallback
  }
}

