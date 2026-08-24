/**
 * Ready-to-use follow-up message templates (built-in + user-created custom).
 */

export const BUILTIN_TEMPLATE_COUNT = 5;

/** @typedef {{ id: string, builtin?: boolean, labelKey?: string, label?: string, hintKey?: string, hint?: string, body: string }} FollowupMessageTemplate */

export const BUILTIN_FOLLOWUP_TEMPLATES = [
    {
        id: 'initialGreeting',
        labelKey: 'wizTplInitialGreeting',
        hintKey: 'wizFollowupMsgHint1',
        body:
            'Hi {NAME}! Thank you for your interest. I\'m excited to connect with you — at {COMPANY}, we\'d love to learn more about your goals and how we can help.',
    },
    {
        id: 'professionalFollowup',
        labelKey: 'wizTplProfessionalFollowup',
        hintKey: 'wizTplHintProfessional',
        body:
            'Hi {NAME}, I wanted to follow up on our recent conversation. Please let me know if you have any questions or if there\'s a good time to talk.',
    },
    {
        id: 'friendlyCheckin',
        labelKey: 'wizTplFriendlyCheckin',
        hintKey: 'wizTplHintFriendly',
        body:
            'Hi {NAME}, just checking in to see how things are going. Is there anything {COMPANY} can help with?',
    },
    {
        id: 'valueAddition',
        labelKey: 'wizTplValueAddition',
        hintKey: 'wizTplHintValue',
        body:
            'Hi {NAME}, I thought you might find this helpful. Happy to share more details from {COMPANY} whenever it suits you.',
    },
    {
        id: 'finalReminder',
        labelKey: 'wizTplFinalReminder',
        hintKey: 'wizTplHintFinal',
        body:
            'Hi {NAME}, I wanted to reach out one last time. If you\'d like to continue the conversation, just reply and I\'ll be happy to help.',
    },
];

export const CREATE_TEMPLATE_ID = '__create_new__';

function storageKey(userId) {
    const uid = userId != null && userId !== '' ? String(userId) : 'guest';
    return `ee_followup_custom_templates_${uid}`;
}

function normalizeTemplateBody(body) {
    return String(body || '')
        .replace(/\{name\}/gi, '{NAME}')
        .replace(/\{company\}/gi, '{COMPANY}');
}

/**
 * @param {string} userId
 * @returns {FollowupMessageTemplate[]}
 */
export function loadCustomFollowupTemplates(userId) {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * @param {string} userId
 * @param {FollowupMessageTemplate[]} templates
 */
export function saveCustomFollowupTemplates(userId, templates) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(templates.slice(0, 200)));
    } catch {
        /* ignore quota */
    }
}

/**
 * @param {string} userId
 * @param {{ name: string, body: string }} input
 * @returns {FollowupMessageTemplate|null}
 */
export function createCustomFollowupTemplate(userId, input) {
    const name = (input?.name || '').trim();
    const body = normalizeTemplateBody(input?.body || '');
    if (!body) return null;
    const template = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        label: name || undefined,
        body,
    };
    const list = loadCustomFollowupTemplates(userId);
    saveCustomFollowupTemplates(userId, [...list, template]);
    return template;
}

/**
 * @param {string} userId
 * @param {string} templateId
 */
export function removeCustomFollowupTemplate(userId, templateId) {
    const list = loadCustomFollowupTemplates(userId).filter((t) => t.id !== templateId);
    saveCustomFollowupTemplates(userId, list);
}

/**
 * @param {string} userId
 * @param {(keyof typeof BUILTIN_FOLLOWUP_TEMPLATES[number]['id'])|string} templateId
 * @param {(t: FollowupMessageTemplate) => string} t
 */
export function resolveFollowupTemplate(userId, templateId, t) {
    const builtin = BUILTIN_FOLLOWUP_TEMPLATES.find((b) => b.id === templateId);
    if (builtin) return builtin;
    return loadCustomFollowupTemplates(userId).find((c) => c.id === templateId) || null;
}

/**
 * @param {string} userId
 * @param {(t: FollowupMessageTemplate) => string} t
 * @returns {Array<{ id: string, label: string, hint?: string, body: string, builtin: boolean }>}
 */
export function listFollowupTemplateOptions(userId, t) {
    const custom = loadCustomFollowupTemplates(userId);
    const builtin = BUILTIN_FOLLOWUP_TEMPLATES.map((b) => ({
        id: b.id,
        label: b.labelKey ? t(b.labelKey) : b.label || b.id,
        hint: b.hintKey ? t(b.hintKey) : undefined,
        body: b.body,
        builtin: true,
    }));
    const customOpts = custom.map((c) => ({
        id: c.id,
        label: c.label || t('wizTplCustomUnnamed'),
        hint: undefined,
        body: c.body,
        builtin: false,
    }));
    return [...builtin, ...customOpts];
}
