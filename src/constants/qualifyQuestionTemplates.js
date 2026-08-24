/** Built-in i18n keys for review funnel qualifying questions */
export const REVIEW_QUALIFY_TEMPLATE_KEYS = [
    'wizDefaultQ1',
    'wizDefaultQ2',
    'wizDefaultQ3',
    'wizTQ1',
    'wizTQ4',
    'wizTQ12',
    'wizTQ13',
    'wizTQ14',
    'wizTQ15',
];

/** Fallback labels when locale JSON is stale or missing keys (EN/ES). */
export const QUALIFY_I18N_FALLBACKS = {
    en: {
        wizQuestionSingular: 'question',
        wizQuestionPlural: 'questions',
        wizCaptureTpl1: 'What is your budget for this project?',
        wizCaptureTpl2: 'When do you need this done?',
        wizCaptureTpl3: 'How did you hear about us?',
        wizCaptureTpl4: 'What service are you most interested in?',
        wizCaptureTpl5: 'Is there anything else we should know?',
        wizCaptureTpl6: 'What is the best time to call you back?',
    },
    es: {
        wizQuestionSingular: 'pregunta',
        wizQuestionPlural: 'preguntas',
        wizCaptureTpl1: '¿Cuál es su presupuesto para este proyecto?',
        wizCaptureTpl2: '¿Para cuándo lo necesita?',
        wizCaptureTpl3: '¿Cómo nos conoció?',
        wizCaptureTpl4: '¿Qué servicio le interesa más?',
        wizCaptureTpl5: '¿Hay algo más que debamos saber?',
        wizCaptureTpl6: '¿Cuál es el mejor momento para devolverle la llamada?',
    },
};

/**
 * @param {(key: string) => string} t
 * @param {'en'|'es'} language
 * @param {string} key
 */
export function qualifyI18n(t, language, key) {
    const text = t(key);
    if (text !== key) return text;
    return QUALIFY_I18N_FALLBACKS[language]?.[key] ?? QUALIFY_I18N_FALLBACKS.en[key] ?? key;
}

/** Built-in i18n keys for lead capture qualifying questions */
export const CAPTURE_QUALIFY_TEMPLATE_KEYS = [
    'wizCaptureTpl1',
    'wizCaptureTpl2',
    'wizCaptureTpl3',
    'wizCaptureTpl4',
    'wizCaptureTpl5',
    'wizCaptureTpl6',
];

export const QUALIFY_USER_TPL_STORAGE = 'mm_review_qualify_user_templates_v1';
export const MAX_USER_QUALIFY_TEMPLATES = 25;

/** @param {string[]} questions @param {string} text */
export function addQuestionFromTemplate(questions, text) {
    const line = (text || '').trim();
    if (!line) return questions;
    const emptyIdx = questions.findIndex((q) => q.trim() === '');
    if (emptyIdx !== -1) {
        const next = [...questions];
        next[emptyIdx] = line;
        return next;
    }
    if (questions.some((q) => q.trim() === line)) return questions;
    return [...questions, line];
}

/** @param {string[]} questions @param {number} idx */
export function removeQuestionAt(questions, idx) {
    const next = questions.filter((_, i) => i !== idx);
    return next.length === 0 ? [''] : next;
}
