/** Translate lead source / follow-up status strings stored in English in the DB. */

function normalizeKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const SOURCE_I18N_KEYS = {
    'bulk import': 'leadSourceBulkImport',
    imported: 'leadSourceImported',
    'excel upload': 'leadSourceExcelUpload',
    'csv upload': 'leadSourceCsvUpload',
    'qr survey': 'leadSourceQrSurvey',
    'website widget': 'leadSourceWebsiteWidget',
    'lead capture': 'leadSourceLeadCapture',
    'review funnel': 'leadSourceReviewFunnel',
    'survey funnel': 'leadSourceSurveyFunnel',
};

const STATUS_I18N_KEYS = {
    pending: 'leadFollowupPending',
    success: 'leadFollowupSuccess',
    processing: 'leadFollowupProcessing',
    failed: 'leadFollowupFailed',
    new: 'statusNew',
    contacted: 'statusContacted',
    closed: 'statusClosed',
    replied: 'statusReplied',
};

export function translateLeadSource(t, source) {
    if (!source) return '';
    const key = normalizeKey(source);
    if (key.includes('apify') || key.includes('marketplace') || key.includes('google maps')) {
        return t('leadSourceMarketplace');
    }
    const i18nKey = SOURCE_I18N_KEYS[key];
    return i18nKey ? t(i18nKey) : source.replace(/_/g, ' ');
}

export function translateLeadPipelineStatus(t, status) {
    if (!status) return '';
    const key = normalizeKey(status);
    const i18nKey = STATUS_I18N_KEYS[key];
    return i18nKey ? t(i18nKey) : status;
}
