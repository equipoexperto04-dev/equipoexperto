/** Normalize phone to digits for tel:/wa.me links */
export function normalizePhoneDigits(phone) {
    if (!phone || typeof phone !== 'string') return '';
    return phone.replace(/\D/g, '');
}

export function getWhatsAppChatUrl(phone, text = '') {
    const digits = normalizePhoneDigits(phone);
    if (!digits) return null;
    const base = `https://wa.me/${digits}`;
    if (!text?.trim()) return base;
    return `${base}?text=${encodeURIComponent(text.trim())}`;
}

export function getTelUrl(phone) {
    const digits = normalizePhoneDigits(phone);
    if (!digits) return null;
    return `tel:+${digits}`;
}

export function getMailtoUrl(email, subject = '', body = '') {
    const addr = email?.trim();
    if (!addr) return null;
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return qs ? `mailto:${addr}?${qs}` : `mailto:${addr}`;
}

/** Score 0–100. Prefers the DB-computed `lead_score` (set on capture/status update); falls
 *  back to the same heuristic for older rows that predate the column (lead_score === 0/null). */
export function getLeadScore(lead) {
    if (!lead) return 0;
    if (typeof lead.lead_score === 'number' && lead.lead_score > 0) return lead.lead_score;
    let score = 35;
    if (lead.email?.trim()) score += 15;
    if (lead.phone?.trim()) score += 15;
    if (lead.consent_given || lead.marketing_consent) score += 10;
    if (lead.lead_status === 'Contacted') score += 15;
    if (lead.lead_status === 'Closed') score += 20;
    return Math.min(100, score);
}

/** Whether this lead triggered (or would trigger) the 🔥 hot-lead instant alert. */
export function isHotLead(lead) {
    if (!lead) return false;
    if (lead.lead_score_tier) return lead.lead_score_tier === 'high';
    return getLeadScoreTier(getLeadScore(lead)) === 'high';
}

export function getLeadScoreTier(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'mid';
    return 'low';
}

export function getLeadDisplayName(lead, importedLabel = 'Imported Lead') {
    const name = lead?.full_name?.trim();
    if (!name || name === 'Imported Lead') return importedLabel;
    return name;
}

export function getLeadCompanyLabel(lead) {
    const group = lead?.lead_group?.trim();
    if (group && group !== 'General') return group;
    const org = lead?.organization?.trim();
    if (org) return org;
    return '—';
}

export function openExternalUrl(url) {
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
}

/** Table column date — e.g. May 28, 03:30 PM */
export function formatLeadTableDate(dateInput, locale = undefined) {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale || undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
