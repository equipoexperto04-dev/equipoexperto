/** Whether the user has finished the first-run onboarding wizard. */
export function hasCompletedOnboarding(user) {
    if (user?.onboarding_completed === true) return true;
    try {
        return localStorage.getItem('mm_onboarding_done') === '1';
    } catch {
        return false;
    }
}

export function markOnboardingDoneLocal() {
    try {
        localStorage.setItem('mm_onboarding_done', '1');
        localStorage.removeItem('mm_show_onboarding');
    } catch {
        /* ignore */
    }
}

export function parseFilteringQuestions(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((q) =>
            typeof q === 'object' && q !== null
                ? (q.label || q.question || q.text || '')
                : String(q)
        )
        .map((q) => q.trim())
        .filter(Boolean);
}
