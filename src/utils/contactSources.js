export const CONTACT_SOURCE_IDS = ['qr', 'excel', 'website'];

/** Allowed contact sources per employee type (review has no website embed). */
export const CONTACT_SOURCES_BY_JOB = {
    review: ['qr', 'excel'],
    capture: ['qr', 'excel', 'website'],
    followup: ['excel'],
};

/** @param {string} [jobId] */
export function getAllowedContactSources(jobId) {
    return CONTACT_SOURCES_BY_JOB[jobId] || CONTACT_SOURCE_IDS;
}

/** @param {unknown} raw @param {string} fallback @param {string} [jobId] */
export function normalizeContactSources(raw, fallback = 'qr', jobId = null) {
    const allowed = getAllowedContactSources(jobId);
    if (Array.isArray(raw)) {
        const filtered = raw.filter((id) => allowed.includes(id));
        if (filtered.length) return [...new Set(filtered)];
    }
    if (typeof raw === 'string' && allowed.includes(raw)) {
        return [raw];
    }
    const fb = allowed.includes(fallback) ? fallback : allowed[0];
    return [fb];
}

/** @param {string[]} selected @param {string} id */
export function toggleContactSource(selected, id, jobId = null) {
    const allowed = getAllowedContactSources(jobId);
    if (!allowed.includes(id)) return selected;
    if (selected.includes(id)) {
        if (selected.length <= 1) return selected;
        return selected.filter((s) => s !== id);
    }
    return [...selected, id];
}
