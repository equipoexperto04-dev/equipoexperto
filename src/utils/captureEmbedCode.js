import API_URL from '../config.js';

/** Origin where `public/widget.js` and `/l/:id` forms are served (not the API host). */
export function getPublicSiteOrigin() {
    const fromEnv =
        typeof import.meta.env.VITE_PUBLIC_SITE_URL === 'string'
            ? import.meta.env.VITE_PUBLIC_SITE_URL.trim().replace(/\/+$/, '')
            : '';
    if (fromEnv) return fromEnv;
    if (typeof window !== 'undefined') return window.location.origin;
    return 'https://equipoexperto.com';
}

/**
 * Idempotent: ensures review_funnel_settings has automation_id; returns URLs for embed copy-paste.
 * @returns {Promise<{ automationId: string, leadUrl: string, leadQrCode?: string }>}
 */
export async function ensureCaptureAutomationAssets() {
    const res = await fetch(`${API_URL}/api/config/ensure-automation-id`, {
        method: 'POST',
        credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.automation_id) {
        throw new Error(data.message || 'Could not provision embed ID');
    }
    const automationId = data.automation_id;
    const leadUrl =
        data.leadUrl || `${getPublicSiteOrigin()}/l/${automationId}`;
    return {
        automationId,
        leadUrl,
        leadQrCode: data.leadQrCode,
    };
}

function publicOriginFromLeadUrl(leadUrl, automationId) {
    const trimmed = typeof leadUrl === 'string' ? leadUrl.trim() : '';
    if (trimmed) {
        try {
            return new URL(trimmed).origin;
        } catch {
            /* fall through */
        }
    }
    return getPublicSiteOrigin();
}

/**
 * @param {{ embedType: 'inline' | 'widget', automationId?: string | null, leadUrl?: string | null }} opts
 * @returns {string} Empty string when automationId is missing (caller should provision first).
 */
export function buildCaptureEmbedCode({ embedType, automationId, leadUrl }) {
    if (!automationId) return '';

    const trimmedLead = typeof leadUrl === 'string' ? leadUrl.trim() : '';
    const formUrl =
        trimmedLead || `${getPublicSiteOrigin()}/l/${encodeURIComponent(automationId)}`;
    const siteOrigin = publicOriginFromLeadUrl(trimmedLead, automationId);

    if (embedType === 'widget') {
        return `<script src="${siteOrigin}/widget.js" data-token="${automationId}" data-api-url="${API_URL}"></script>`;
    }

    return `<iframe
  src="${formUrl}"
  width="100%"
  height="620"
  style="border:none;border-radius:12px;"
  title="Lead Capture Form"
></iframe>`;
}
