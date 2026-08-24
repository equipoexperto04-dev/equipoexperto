/** Map API activity-log strings (stored in English) to i18n keys. */

const AUTOMATION_NAME_KEYS = [
    ['lead follow-up', 'activityAutomationLeadFollowUp'],
    ['follow-up agent', 'activityAutomationLeadFollowUp'],
    ['survey funnel', 'activityAutomationSurveyFunnel'],
    ['review funnel', 'activityAutomationReviewFunnel'],
    ['lead capture', 'activityAutomationLeadCapture'],
    ['lead import', 'activityAutomationLeadImport'],
];

const TRIGGER_STEP_KEYS = [
    ['sequence step 1', 'activityStepInitialReachOut'],
    ['sequence step 2', 'activityStep2ndFollowUp'],
    ['sequence step 3', 'activityStep3rdFollowUp'],
    ['sequence step 4', 'activityStep4thFollowUp'],
    ['manual trigger', 'activityStepManualTrigger'],
    ['bulk trigger', 'activityStepBulkTrigger'],
    ['review request', 'activityStepReviewRequest'],
    ['review request batch', 'activityStepReviewRequestBatch'],
    ['contact import', 'activityStepContactImport'],
    ['auto-response', 'activityStepAutoResponse'],
];

export function translateAutomationName(t, name) {
    if (!name) return t('activityAutomationGeneric');
    const lower = name.toLowerCase();
    const match = AUTOMATION_NAME_KEYS.find(([needle]) => lower.includes(needle));
    return match ? t(match[1]) : name;
}

export function translateTriggerStep(t, step) {
    if (!step) return '—';
    const lower = step.toLowerCase();
    const exact = TRIGGER_STEP_KEYS.find(([needle]) => lower === needle || lower.includes(needle));
    if (exact) return t(exact[1]);
    if (lower.includes('sequence step')) {
        return step.replace(/sequence step/i, t('activityStepFollowUp'));
    }
    return step;
}

export function translateChannelLabel(t, channel) {
    if (!channel) return t('activityChannelMessage');
    const c = channel.toLowerCase();
    if (c.includes('whatsapp')) return t('activityChannelWhatsApp');
    if (c.includes('email')) return t('activityChannelEmail');
    if (c.includes('sms')) return t('activityChannelSms');
    return channel;
}

export function translateLogDetail(t, detail) {
    if (!detail) return '';

    const followUpVia = detail.match(/^Follow-up(?: #\d+)? sent via (Email|WhatsApp|SMS):?\s*(.*)$/i);
    if (followUpVia) {
        const channel = translateChannelLabel(t, followUpVia[1]);
        const body = (followUpVia[2] || '').trim();
        const prefix = t('activityDetailFollowUpVia', { channel });
        return body ? `${prefix}: ${body}` : prefix;
    }

    const followUpSimple = detail.match(/^Follow-up sent via (Email|WhatsApp|SMS)\.?$/i);
    if (followUpSimple) {
        return t('activityDetailFollowUpVia', { channel: translateChannelLabel(t, followUpSimple[1]) });
    }

    const captureVia = detail.match(/^Lead Capture message sent via (Email|WhatsApp|SMS):?\s*(.*)$/i);
    if (captureVia) {
        const channel = translateChannelLabel(t, captureVia[1]);
        const body = (captureVia[2] || '').trim();
        const prefix = t('activityDetailLeadCaptureVia', { channel });
        return body ? `${prefix}: ${body}` : prefix;
    }

    const retryFail = detail.match(/Follow-up could not be sent/i);
    if (retryFail) return t('activityDetailFollowUpFailed');

    const bulkSent = detail.match(/^(\d+) follow-up messages sent$/i);
    if (bulkSent) return t('activityDetailBulkFollowUp', { count: bulkSent[1] });

    const bulkReview = detail.match(/^(\d+)\/(\d+) review requests sent$/i);
    if (bulkReview) {
        return t('activityDetailBulkReview', {
            sent: bulkReview[1],
            total: bulkReview[2],
        });
    }

    const importAdded = detail.match(/^(\d+) contact(?:\(s\)|s)? added to (.+)$/i);
    if (importAdded) {
        return t('activityDetailContactsImported', {
            count: importAdded[1],
            folder: importAdded[2],
        });
    }

    return detail;
}

export function translateDeliveryStatus(t, status) {
    if ((status || '').toLowerCase() === 'success') return t('activityStatusDelivered');
    return t('activityStatusNotSent');
}
