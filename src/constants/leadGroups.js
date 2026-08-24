/** Preset categories for import UI and filters (labels via i18n). */
export const LEAD_GROUP_PRESETS = [
    { value: 'School', labelKey: 'leadGroupSchool' },
    { value: 'Business', labelKey: 'leadGroupBusiness' },
    { value: 'Healthcare', labelKey: 'leadGroupHealthcare' },
    { value: 'Events', labelKey: 'leadGroupEvents' },
    { value: 'Real Estate', labelKey: 'leadGroupRealEstate' },
    { value: 'Other', labelKey: 'leadGroupOther' },
];

export const DEFAULT_LEAD_GROUP = 'General';

/** Trim and cap length; fall back when empty. */
export function normalizeLeadGroup(input, fallback = DEFAULT_LEAD_GROUP) {
    const v = String(input ?? '').trim();
    if (!v) return fallback;
    return v.slice(0, 100);
}
