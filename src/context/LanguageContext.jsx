import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import API_URL from '../config.js';
import { loadStaticTranslations } from '../i18n/loadStaticTranslations.js';

const LanguageContext = createContext();

const EMPTY_LOCALES = { en: {}, es: {} };

/** Marketing root paths whose language is determined by the URL itself (for hreflang/SEO). */
const URL_LOCALE_PATHS = { '/': 'en', '/es': 'es' };

export const LanguageProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const urlLang = URL_LOCALE_PATHS[location.pathname];

    const [language, setLanguage] = useState(() => urlLang || localStorage.getItem('language') || 'en');
    const [dynamicTranslations, setDynamicTranslations] = useState({});
    const [staticTranslations, setStaticTranslations] = useState(EMPTY_LOCALES);
    const [i18nReady, setI18nReady] = useState(false);

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    // On marketing root paths (/ and /es), the URL is the source of truth for language.
    useEffect(() => {
        if (urlLang && urlLang !== language) {
            setLanguage(urlLang);
        }
    }, [urlLang, language]);

    useEffect(() => {
        let cancelled = false;
        loadStaticTranslations()
            .then((locales) => {
                if (!cancelled) {
                    setStaticTranslations(locales);
                    setI18nReady(true);
                }
            })
            .catch((err) => {
                console.error('Failed to load locale files', err);
                if (!cancelled) setI18nReady(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const fetchDynamic = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${API_URL}/api/translations`, { headers });
                if (!res.ok) return;
                const data = await res.json();
                if (data.success) {
                    setDynamicTranslations(data.translations);
                }
            } catch (err) {
                console.error('Failed to fetch dynamic translations', err);
            }
        };
        fetchDynamic();
    }, []);

    const toggleLanguage = () => {
        const next = language === 'en' ? 'es' : 'en';
        // On marketing root paths, switch via URL so /es stays the canonical Spanish URL.
        if (urlLang) {
            navigate(next === 'es' ? '/es' : '/');
            return;
        }
        setLanguage(next);
    };

    const value = {
        language,
        setLanguage,
        toggleLanguage,
        i18nReady,
        formatRelativeTime: (date) => {
            try {
                return formatDistanceToNow(new Date(date), {
                    addSuffix: true,
                    locale: language === 'es' ? es : undefined,
                });
            } catch {
                return date;
            }
        },
        t: (key, params = {}) => {
            const dynamic = language === 'es' ? dynamicTranslations[key] : null;
            const hardcoded = staticTranslations[language]?.[key];
            let text =
                dynamic && typeof dynamic === 'string' && dynamic.trim() !== '' && dynamic.trim() !== key
                    ? dynamic
                    : hardcoded || key;

            if (typeof text === 'string') {
                Object.keys(params).forEach((param) => {
                    const value = params[param] ?? '';
                    text = text.replaceAll(`{${param}}`, String(value));
                });
            }
            return text;
        },
        /** Returns fallback when the key is missing from static/dynamic catalogs. */
        tWithFallback: (key, fallback, params = {}) => {
            const dynamic = language === 'es' ? dynamicTranslations[key] : null;
            const hardcoded = staticTranslations[language]?.[key];
            let text =
                dynamic && typeof dynamic === 'string' && dynamic.trim() !== '' && dynamic.trim() !== key
                    ? dynamic
                    : hardcoded;
            if (!text || text === key) text = fallback;
            if (typeof text === 'string') {
                Object.keys(params).forEach((param) => {
                    const value = params[param] ?? '';
                    text = text.replaceAll(`{${param}}`, String(value));
                });
            }
            return text;
        },
    };

    return (
        <LanguageContext.Provider value={value}>
            {!i18nReady ? (
                <div
                    className="i18n-boot"
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-primary, #fff)',
                    }}
                    aria-busy="true"
                />
            ) : (
                children
            )}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};

/** @deprecated Use loadStaticTranslations() — kept for tooling that imported this module. */
export const translations = EMPTY_LOCALES;
