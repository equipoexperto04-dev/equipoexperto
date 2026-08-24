const RESUME_TTL_MS = 30 * 60 * 1000;

function storageKey(jobId) {
    return `ee_wizard_resume_${jobId}`;
}

export function saveWizardResume(jobId, payload) {
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

export function loadWizardResume(jobId) {
    if (!jobId) return null;
    try {
        const raw = sessionStorage.getItem(storageKey(jobId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.at || Date.now() - parsed.at > RESUME_TTL_MS) {
            clearWizardResume(jobId);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function clearWizardResume(jobId) {
    if (!jobId) return;
    try {
        sessionStorage.removeItem(storageKey(jobId));
    } catch {
        /* ignore */
    }
}

/** True when returning from Gmail OAuth during hire wizard. */
export function isWizardOAuthReturn(searchParams) {
    return searchParams?.get('success') === 'connected';
}

/** Hire wizard step after OAuth (platform step removed; channels live on employee config). */
function postOAuthWizardStep(jobId) {
    if (jobId === 'followup') return 4;
    if (jobId === 'review') return 3;
    return 1;
}

/**
 * Map step indices saved before the Connect channels hire step was removed.
 * Follow-up was 5 steps (platform @ 4); review was 4 steps (platform @ 2).
 */
export function normalizeWizardStep(jobId, step) {
    const n = Number(step);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (jobId === 'followup') {
        if (n >= 4) return 4;
    }
    if (jobId === 'review') {
        if (n >= 4) return 3;
        if (n === 3) return 2;
    }
    return n;
}

export function initialWizardStep(jobId, searchParams) {
    if (!isWizardOAuthReturn(searchParams)) return 1;
    const resume = loadWizardResume(jobId);
    if (resume?.step) return normalizeWizardStep(jobId, resume.step);
    return postOAuthWizardStep(jobId);
}
