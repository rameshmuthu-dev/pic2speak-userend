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
    } catch {}
    setActiveLanguageState(code);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: code }));
  }, []);

  return [activeLanguage, setActiveLanguage];
};

export const useLanguageOptions = (enabled = true) => {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    if (!enabled || languages.length > 0) return undefined;
    let cancelled = false;
    API.get('/languages')
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && Array.isArray(res.data.data)) {
          // 💡 _id -யையும் சேர்த்து map செய்கிறோம்
          setLanguages(res.data.data.map((l) => ({ _id: l._id, code: l.code, name: l.name })));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, languages.length]);

  return languages;
};