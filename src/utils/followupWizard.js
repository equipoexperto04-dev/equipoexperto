/** Default day offsets for new follow-up timelines (matches Better UX starter). */
const DEFAULT_DAY_VALUES = [3, 7, 14];

/** UI + API safety cap when plan entitlements do not specify a lower limit. */
export const MAX_FOLLOWUP_STEPS_UI = 50;

let stepIdCounter = 0;

function nextStepId() {
    stepIdCounter += 1;
    return `fu-${Date.now()}-${stepIdCounter}`;
}

/** @typedef {{ id: string, sequence: number, days: number, text: string }} FollowupWizardStep */

/**
 * @param {number|null|undefined} maxCount plan/UI cap; null = use full default starter (3)
 * @returns {FollowupWizardStep[]}
 */
export function createDefaultFollowupSteps(maxCount = null) {
    const starterLen = DEFAULT_DAY_VALUES.length;
    const cap =
        maxCount == null
            ? starterLen
            : Math.max(1, Math.min(maxCount, starterLen));
    return DEFAULT_DAY_VALUES.slice(0, cap).map((days, i) => ({
        id: nextStepId(),
        sequence: i + 1,
        days,
        text: '',
    }));
}

/** Trim steps to plan/UI maximum while preserving order. */
export function clampFollowupSteps(steps, maxCount) {
    const list = steps || [];
    if (maxCount == null || list.length <= maxCount) return list;
    return reindexFollowupSteps(list.slice(0, maxCount));
}

/** @param {number} sequence 1-based index for the new step */
/** @param {number} prevDays days value of the previous touchpoint (0 if none) */
export function createFollowupStep(sequence, prevDays = 0) {
    const days = prevDays > 0 ? Math.min(prevDays + 4, 90) : 3;
    return {
        id: nextStepId(),
        sequence,
        days,
        text: '',
    };
}

/** @param {FollowupWizardStep[]} steps */
export function reindexFollowupSteps(steps) {
    return steps.map((s, i) => ({ ...s, sequence: i + 1 }));
}

/**
 * @param {Array<{ step?: number, message?: string, delay_value?: number, delay_unit?: string }>|null|undefined} sequence
 * @param {number|null|undefined} [maxCount]
 * @returns {{ steps: FollowupWizardStep[] }}
 */
export function parseFollowupFromConfig(sequence, maxCount = null) {
    if (!Array.isArray(sequence) || sequence.length === 0) {
        return { steps: createDefaultFollowupSteps(maxCount) };
    }

    const sorted = [...sequence].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
    const steps = sorted.map((s, i) => {
        const v = Number(s.delay_value);
        const prevVal = Number(sorted[i - 1]?.delay_value);
        const fallback = DEFAULT_DAY_VALUES[i]
            ?? (i > 0 && Number.isFinite(prevVal) && prevVal > 0 ? prevVal + 4 : 3);
        const days = Number.isFinite(v) && v > 0 ? v : fallback;
        const stepNum = s.step ?? i + 1;
        return {
            id: s.id || `fu-seq-${stepNum}`,
            sequence: i + 1,
            days,
            text: s.message || '',
        };
    });

    return { steps: sortFollowupStepsByDays(steps) };
}

/** Keep steps ordered by increasing day offset (for timeline UI). */
export function sortFollowupStepsByDays(steps) {
    return [...(steps || [])].sort((a, b) => (a.days || 0) - (b.days || 0));
}

/** Whether the user can add another touchpoint (plan cap or UI safety max). */
export function canAddMoreFollowupSteps(currentLength, maxCount) {
    const cap = maxCount == null ? MAX_FOLLOWUP_STEPS_UI : maxCount;
    return (currentLength ?? 0) < cap;
}

/**
 * Merge timeline day edits into an existing API sequence (keeps messages & delay units).
 * @param {FollowupWizardStep[]} timelineSteps
 * @param {Array<{ message?: string, delay_unit?: string }>|null|undefined} existingSequence
 */
export function mergeTimelineIntoSequence(timelineSteps, existingSequence) {
    const built = buildFollowupSequence(timelineSteps);
    const existing = Array.isArray(existingSequence) ? existingSequence : [];
    const byId = new Map();
    const byStep = new Map();
    existing.forEach((row, i) => {
        if (row?.id) byId.set(row.id, row);
        byStep.set(row.step ?? i + 1, row);
    });
    return built.map((row, i) => {
        const wiz = timelineSteps[i];
        const prev =
            (wiz?.id && byId.get(wiz.id)) ||
            byStep.get(row.step) ||
            existing[i] ||
            {};
        return {
            ...row,
            id: wiz?.id || prev.id || `fu-seq-${row.step}`,
            message: (prev.message ?? row.message ?? '').trim(),
            delay_unit: prev.delay_unit || row.delay_unit || 'days',
        };
    });
}

/** @param {FollowupWizardStep[]} steps */
export function buildFollowupSequence(steps) {
    return (steps || []).map((s, i) => ({
        step: i + 1,
        id: s.id || `fu-seq-${i + 1}`,
        message: (s.text || '').trim(),
        delay_value: s.days,
        delay_unit: 'days',
    }));
}

/** @param {FollowupWizardStep[]} steps */
export function isFollowupScheduleValid(steps) {
    const list = steps || [];
    if (list.length === 0) return false;
    let prev = 0;
    for (const s of list) {
        const d = Number(s.days);
        if (!Number.isFinite(d) || d <= prev || d < 1 || d > 90) return false;
        prev = d;
    }
    return true;
}

/** @param {FollowupWizardStep[]} steps */
export function isFollowupMessagesValid(steps, maxLen = 500) {
    return (steps || []).every((s) => {
        const text = (s.text || '').trim();
        return text.length > 0 && text.length <= maxLen;
    });
}

/** Stats for schedule summary cards */
export function followupScheduleStats(steps) {
    const list = steps || [];
    const count = list.length;
    const lastDays = count
        ? Math.max(...list.map((s) => Number(s.days) || 0))
        : 0;
    let avgInterval = 0;
    if (count > 1) {
        const first = Number(list[0].days) || 0;
        avgInterval = Math.round((lastDays - first) / (count - 1));
    } else if (count === 1) {
        avgInterval = lastDays;
    }
    return { totalDays: lastDays, count, avgInterval };
}
