import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';

const DISMISS_KEY = 'integration_health_dismissed';

/**
 * Polls /api/integrations/health and shows a dismissible banner when WhatsApp or Gmail need attention.
 */
export default function IntegrationHealthBanner() {
    const { t } = useTranslation();
    const [issues, setIssues] = useState([]);
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');

    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/integrations/health`, {
                credentials: 'include',
            });
            if (res.status === 401) return;
            const data = await res.json();
            if (data.success && Array.isArray(data.issues) && data.issues.length > 0) {
                setIssues(data.issues);
                if (sessionStorage.getItem(DISMISS_KEY) === '1') {
                    const codes = data.issues.map((i) => i.code).sort().join(',');
                    const prev = sessionStorage.getItem(`${DISMISS_KEY}_codes`);
                    if (prev !== codes) {
                        sessionStorage.removeItem(DISMISS_KEY);
                        setDismissed(false);
                    }
                    sessionStorage.setItem(`${DISMISS_KEY}_codes`, codes);
                }
            } else {
                setIssues([]);
            }
        } catch {
            /* silent — don't block dashboard */
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const id = setInterval(fetchHealth, 60000);
        const onFocus = () => fetchHealth();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchHealth]);

    if (dismissed || issues.length === 0) return null;

    const messages = issues.map((issue) => {
        if (issue.code === 'whatsapp_disconnected') return t('healthBannerWhatsapp');
        if (issue.code === 'gmail_disconnected') return t('healthBannerGmail');
        if (issue.code === 'email_send_blocked') return t('healthBannerEmail');
        return t('healthBannerGeneric');
    });

    const uniqueMessages = [...new Set(messages)];

    return (
        <div className="integration-health-banner" role="alert" aria-live="polite">
            <div className="integration-health-banner__inner">
                <AlertTriangle size={18} className="integration-health-banner__icon" aria-hidden />
                <div className="integration-health-banner__text">
                    <strong>{t('healthBannerTitle')}</strong>
                    <ul>
                        {uniqueMessages.map((msg) => (
                            <li key={msg}>{msg}</li>
                        ))}
                    </ul>
                </div>
                <Link to="/dashboard/integrations" className="integration-health-banner__cta">
                    {t('healthBannerCta')}
                </Link>
                <button
                    type="button"
                    className="integration-health-banner__dismiss"
                    onClick={() => {
                        sessionStorage.setItem(DISMISS_KEY, '1');
                        sessionStorage.setItem(
                            `${DISMISS_KEY}_codes`,
                            issues.map((i) => i.code).sort().join(',')
                        );
                        setDismissed(true);
                    }}
                    aria-label={t('healthBannerDismiss')}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
