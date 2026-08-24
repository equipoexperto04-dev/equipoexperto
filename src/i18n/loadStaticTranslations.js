/** Cached fetch of locale JSON from /public/i18n (keeps ~1.3MB out of the main JS bundle). */
let cache = null;

const localeVersion =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_BUILD_ID
        ? String(import.meta.env.VITE_APP_BUILD_ID)
        : '1';

export function loadStaticTranslations() {
    if (!cache) {
        const q = `?v=${encodeURIComponent(localeVersion)}`;
        cache = Promise.all([
            fetch(`/i18n/en.json${q}`).then((r) => {
                if (!r.ok) throw new Error(`en.json ${r.status}`);
                return r.json();
            }),
            fetch(`/i18n/es.json${q}`).then((r) => {
                if (!r.ok) throw new Error(`es.json ${r.status}`);
                return r.json();
            }),
        ]).then(([en, es]) => ({ en, es }));
    }
    return cache;
}
