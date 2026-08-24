import API_URL from '../config.js';
import { buildCaptureEmbedCode, ensureCaptureAutomationAssets } from './captureEmbedCode.js';

/** @typedef {'review'|'capture'|'followup'} EmployeeGoal */

/**
 * @param {EmployeeGoal} jobId
 * @param {Record<string, unknown>} config
 */
export function getEmployeeSources(jobId, config) {
    if (!config) return ['qr'];
    if (jobId === 'followup') {
        const raw = config.lead_sources || config.lead_source || 'excel';
        return Array.isArray(raw) ? raw.filter(Boolean) : [raw];
    }
    if (jobId === 'capture') {
        const raw = config.capture_sources || config.capture_source || 'qr';
        return Array.isArray(raw) ? raw.filter(Boolean) : [raw];
    }
    const raw = config.lead_sources || config.lead_source || 'qr';
    const list = Array.isArray(raw) ? raw.filter(Boolean) : [raw];
    if (jobId === 'review') {
        return list.filter((id) => id !== 'website');
    }
    return list;
}

/**
 * @param {EmployeeGoal} jobId
 * @param {string} token
 */
export async function fetchEmployeeUseAssets(jobId, token) {
    const headers = { Authorization: `Bearer ${token}` };

    if (jobId === 'followup') {
        const res = await fetch(`${API_URL}/api/config/lead-followup`, { headers });
        const data = await res.json();
        if (!data.success || !data.config) return null;
        const config = data.config;
        return {
            jobId,
            sources: getEmployeeSources(jobId, config),
            automationId: null,
            url: null,
            qrCode: null,
            embedCode: null,
        };
    }

    const res = await fetch(`${API_URL}/api/config/review-funnel`, { headers });
    const data = await res.json();
    if (!data.success || !data.config) return null;
    const config = data.config;
    let automationId = config.automation_id;
    let url = config.leadUrl || '';
    let qrCode = config.leadQrCode || null;

    if (jobId === 'capture') {
        try {
            const ensured = await ensureCaptureAutomationAssets(token);
            automationId = ensured.automationId || automationId;
            url = ensured.leadUrl || url;
            if (ensured.leadQrCode) qrCode = ensured.leadQrCode;
        } catch {
            /* gallery may show empty embed until user saves config */
        }
    }

    if (jobId === 'capture') {
        const embedMode = config.capture_embed_type === 'widget' ? 'widget' : 'inline';
        const embedCode = buildCaptureEmbedCode({
            embedType: embedMode,
            automationId,
            leadUrl: url,
        });
        return {
            jobId,
            sources: getEmployeeSources(jobId, config),
            automationId,
            url,
            qrCode,
            embedCode,
            captureEmbedType: embedMode,
        };
    }

    const surveyUrl = config.surveyUrl || config.publicUrl || '';
    return {
        jobId,
        sources: getEmployeeSources(jobId, config),
        automationId,
        url: surveyUrl,
        qrCode: config.surveyQrCode || config.qrCodeDataUrl || null,
        embedCode: automationId
            ? buildCaptureEmbedCode({
                  embedType: 'widget',
                  automationId,
                  leadUrl: surveyUrl,
              })
            : null,
    };
}

export function downloadDataUrl(dataUrl, filename) {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
