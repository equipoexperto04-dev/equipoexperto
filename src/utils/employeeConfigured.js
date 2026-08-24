/**
 * Whether a digital employee is "hired" (setup completed), aligned with /api/stats configured flags.
 * Review and capture share review_funnel_settings — presence of a row ≠ hired for both roles.
 */
export function isEmployeeConfigured(jobId, config) {
    if (!config) return false;

    if (jobId === 'review') {
        return !!(config.is_active || config.review_next_step_done);
    }

    if (jobId === 'capture') {
        return !!(config.lead_capture_active || config.capture_next_step_done);
    }

    if (jobId === 'followup') {
        return !!(config.is_active || config.followup_next_step_done);
    }

    return false;
}
