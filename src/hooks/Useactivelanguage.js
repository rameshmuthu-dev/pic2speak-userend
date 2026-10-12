import { useState, useEffect, useCallback } from 'react';
import API from '../api/api';

const STORAGE_KEY = 'pic2speak_active_language';
const CHANGE_EVENT = 'pic2speak:language-change';

const readStoredLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  } catch {
    return 'en';
  }
};

export const useActiveLanguage = () => {
  const [activeLanguage, setActiveLanguageState] = useState(readStoredLanguage);

  useEffect(() => {
    const onCustomChange = (e) => setActiveLanguageState(e.detail ?? readStoredLanguage());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setActiveLanguageState(readStoredLanguage());
    };
    window.addEventListener(CHANGE_EVENT, onCustomChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onCustomChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setActiveLanguage = useCallback((code) => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Local storage may be unavailable in restricted browser contexts.
    }
    setActiveLanguageState(code);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: code }));
  }, []);

  return [activeLanguage, setActiveLanguage];
};

const EMPTY_LANGUAGES = [];

export const useLanguageOptionsState = (enabled = true, retryKey = 0) => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    API.get('/languages', { timeout: 30000 })
      .then((res) => {
        if (cancelled) return;
        if (!res.data?.success || !Array.isArray(res.data.data)) {
          throw new Error('Unable to load languages.');
        }
        setResult({ key: retryKey, languages: res.data.data, error: null });
      })
      .catch((requestError) => {
        if (cancelled) return;
        setResult({
          key: retryKey,
          languages: EMPTY_LANGUAGES,
          error: requestError.response?.data?.message || requestError.message || 'Unable to load languages.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, retryKey]);

  const currentResult = result?.key === retryKey ? result : null;
  return {
    languages: currentResult?.languages || EMPTY_LANGUAGES,
    status: !enabled ? 'idle' : !currentResult ? 'loading' : currentResult.error ? 'failed' : 'succeeded',
    error: currentResult?.error || null,
  };
};

export const useLanguageOptions = (enabled = true) => {
  const { languages } = useLanguageOptionsState(enabled);
  return languages;
};
