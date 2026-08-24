const RESUME_TTL_MS = 30 * 60 * 1000;

function storageKey(jobId) {
    return `ee_config_resume_${jobId}`;
}

/** OAuth jobId sent from employee config hub (returns to /dashboard/config/...). */
export function configOAuthJobId(purposeOrJob) {
    const key = purposeOrJob === 'followup' ? 'followup' : purposeOrJob;
    return `config-${key}`;
}

export function saveConfigResume(jobId, payload) {
    if (!jobId) return;
    try {
        sessionStorage.setItem(
            storageKey(jobId),
            JSON.stringify({ ...payload, at: Date.now() }),
        );
    } catch {
        /* ignore quota */
    }
}

export function loadConfigResume(jobId) {
    if (!jobId) return null;
    try {
        const raw = sessionStorage.getItem(storageKey(jobId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.at || Date.now() - parsed.at > RESUME_TTL_MS) {
            clearConfigResume(jobId);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function clearConfigResume(jobId) {
    if (!jobId) return;
    try {
        sessionStorage.removeItem(storageKey(jobId));
    } catch {
        /* ignore */
    }
}

export function isConfigOAuthReturn(searchParams) {
    return searchParams?.get('success') === 'connected';
}
