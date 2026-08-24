import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Loader2, CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { createSanitizedHtml } from '../../utils/sanitizeHtml';
import API_URL from '../../config.js';
import './WizardPlatform.css';

const WhatsAppIcon = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
);

function PlatformToggle({ checked, onChange, accentColor, ariaLabel }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            className={`wiz-plat-toggle${checked ? ' is-on' : ''}`}
            style={checked ? { background: accentColor, borderColor: accentColor } : undefined}
            onClick={() => onChange(!checked)}
        >
            <span className="wiz-plat-toggle-knob" />
        </button>
    );
}

/**
 * Connect WhatsApp / Gmail inline (Better UX style) — no redirect to Integrations page.
 */
export default function WizardPlatformStep({
    jobId,
    accentColor,
    waConnected,
    gmailConnected,
    gmailEmail,
    channelPrefs,
    onChannelPrefsChange,
    onConnectionsRefresh,
    onBeforeOAuthRedirect,
    purpose = 'review',
    compact = false,
    /** Minimal name + toggle rows (employee config hub) */
    hubStyle = false,
}) {
    const { t } = useTranslation();
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [waState, setWaState] = useState('loading');
    const [waQR, setWaQR] = useState(null);
    const [waConnecting, setWaConnecting] = useState(false);

    const authFetch = useCallback(async (url, options = {}) => {
        const res = await fetch(url, {
            credentials: 'include',
            ...options,
            headers: {
                ...options.headers,
            },
        });
        return res;
    }, []);

    const startWhatsAppConnect = async () => {
        setShowWhatsAppModal(true);
        setWaState('loading');
        setWaConnecting(true);
        try {
            const res = await authFetch(`${API_URL}/api/whatsapp/connect`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                setWaState('error');
            }
        } catch {
            setWaState('error');
        } finally {
            setWaConnecting(false);
        }
    };

    const startGmailConnect = async () => {
        onBeforeOAuthRedirect?.();
        const res = await authFetch(`${API_URL}/api/integrations/google/connect-ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: jobId || 'review' }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.url) {
            window.location.href = data.url;
        }
    };

    const handleToggle = (platform) => {
        const key = platform === 'whatsapp' ? 'whatsapp' : 'gmail';
        const next = !channelPrefs[key];
        onChannelPrefsChange({ ...channelPrefs, [key]: next });
        if (next) {
            if (platform === 'whatsapp' && !waConnected) startWhatsAppConnect();
            if (platform === 'gmail' && !gmailConnected) startGmailConnect();
        }
    };

    useEffect(() => {
        let intervalId;
        if (!showWhatsAppModal) return undefined;

        const checkStatus = async () => {
            try {
                const res = await authFetch(`${API_URL}/api/whatsapp/status`);
                const data = await res.json();
                if (!data.success) return;
                if (data.status === 'initializing' || data.status === 'restoring') {
                    setWaState('loading');
                } else if (data.status === 'qr_ready' && data.qr) {
                    setWaState('qr');
                    setWaQR(data.qr);
                } else if (data.status === 'connected') {
                    setWaState('success');
                    setWaQR(null);
                    clearInterval(intervalId);
                    onConnectionsRefresh?.();
                    setTimeout(() => setShowWhatsAppModal(false), 2000);
                } else if (data.status === 'error' || data.status === 'auth_failed') {
                    setWaState('error');
                    clearInterval(intervalId);
                }
            } catch (e) {
                console.error('[WizardPlatform] WA poll', e);
            }
        };

        intervalId = setInterval(checkStatus, 3000);
        checkStatus();
        return () => clearInterval(intervalId);
    }, [showWhatsAppModal, authFetch, onConnectionsRefresh]);

    const purposeCopy =
        purpose === 'followup'
            ? t('wizPlatformSubFollowup')
            : t('wizPlatformSubReview');

    const platforms = [
        {
            id: 'whatsapp',
            prefKey: 'whatsapp',
            connected: waConnected,
            icon: <WhatsAppIcon size={26} />,
            iconBg: 'rgba(37, 211, 102, 0.12)',
            title: t('wizChannelWhatsapp'),
            desc: t('wizPlatformWhatsappDesc'),
            onConnect: startWhatsAppConnect,
        },
        {
            id: 'gmail',
            prefKey: 'gmail',
            connected: gmailConnected,
            icon: <Mail size={26} style={{ color: '#EA4335' }} aria-hidden />,
            iconBg: 'rgba(234, 67, 53, 0.1)',
            title: t('gmailName'),
            desc: t('wizPlatformGmailDesc'),
            onConnect: startGmailConnect,
        },
    ];

    const anySelected = channelPrefs.whatsapp || channelPrefs.gmail;

    return (
        <div
            className={`wiz-plat${compact ? ' wiz-plat--compact' : ''}${hubStyle ? ' wiz-plat--hub' : ''}`}
        >
            {!compact && (
                <header className="wiz-plat-header">
                    <h2 className="wiz-plat-title">{t('wizPlatformTitle')}</h2>
                    <p className="wiz-plat-sub">{purposeCopy}</p>
                </header>
            )}

            <div className="wiz-plat-list">
                {platforms.map((p) => {
                    const enabled = channelPrefs[p.prefKey];
                    return (
                        <div
                            key={p.id}
                            className={`wiz-plat-row${p.connected ? ' is-connected' : ''}${enabled ? ' is-enabled' : ''}`}
                            style={enabled ? { borderColor: `${accentColor}44` } : undefined}
                        >
                            <div className="wiz-plat-row-main">
                                <div className="wiz-plat-icon" style={{ background: p.iconBg }}>
                                    {p.icon}
                                </div>
                                <div className="wiz-plat-copy">
                                    <p className="wiz-plat-name">{p.title}</p>
                                    <p className="wiz-plat-desc">{p.desc}</p>
                                    {p.connected && p.id === 'gmail' && gmailEmail && (
                                        <p className="wiz-plat-email">{gmailEmail}</p>
                                    )}
                                    {p.connected && p.id === 'whatsapp' && (
                                        <p className="wiz-plat-live">
                                            <span className="wiz-plat-live-dot" aria-hidden />
                                            {t('wizPlatformConnected')}
                                        </p>
                                    )}
                                </div>
                                <PlatformToggle
                                    checked={enabled}
                                    onChange={() => handleToggle(p.id)}
                                    accentColor={accentColor}
                                    ariaLabel={t('wizPlatformUseChannel', { name: p.title })}
                                />
                            </div>

                            {!p.connected && (
                                <div className="wiz-plat-row-actions">
                                    <button
                                        type="button"
                                        className="wiz-plat-connect-btn"
                                        style={{ background: p.id === 'whatsapp' ? '#25D366' : '#EA4335' }}
                                        disabled={p.id === 'whatsapp' && waConnecting}
                                        onClick={p.onConnect}
                                    >
                                        {p.id === 'whatsapp' && waConnecting ? (
                                            <Loader2 size={16} className="animate-spin" aria-hidden />
                                        ) : (
                                            <Zap size={16} aria-hidden />
                                        )}
                                        {t('wizPlatformConnect', { name: p.title })}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {anySelected && (
                <p className="wiz-plat-note">
                    <strong>{t('wizPlatformNoteLabel')}</strong> {t('wizPlatformNoteBody')}
                </p>
            )}

            {showWhatsAppModal && (
                <div className="wa-modal-overlay" role="dialog" aria-modal="true">
                    <div className="wa-modal-content border border-white/10 shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setShowWhatsAppModal(false)}
                            className="wa-close-btn hover:bg-white/5 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-20 h-20 bg-[#25D366]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <WhatsAppIcon size={40} />
                        </div>

                        {waState === 'qr' && waQR && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">
                                    {t('linkWA')}
                                </h3>
                                <p
                                    className="text-sm text-secondary/70 font-medium mb-8 max-w-[320px] leading-relaxed mx-auto text-center border-b border-white/10 pb-8 w-full"
                                    dangerouslySetInnerHTML={createSanitizedHtml(t('waScanInst'))}
                                />
                                <div className="p-5 mb-8 bg-white rounded-[2.5rem] shadow-2xl shadow-white/5">
                                    <img src={waQR} alt="" className="w-56 h-56 object-contain" />
                                </div>
                                <div className="px-6 py-2.5 bg-[#25D366]/10 rounded-full flex items-center gap-2 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-[#25D366]" />
                                    <span className="text-[11px] font-black text-[#25D366] uppercase tracking-[0.2em]">
                                        {t('awaitingScan')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {waState === 'loading' && (
                            <div className="py-12 animate-fade-in text-center">
                                <div className="wa-spinner mb-8 mx-auto" style={{ width: 60, height: 60 }} />
                                <h3 className="text-2xl font-black text-white mb-3 animate-pulse uppercase tracking-wider">
                                    {t('initEngine')}
                                </h3>
                                <p className="text-sm text-secondary/60 font-medium">{t('bootingProto')}</p>
                            </div>
                        )}

                        {waState === 'error' && (
                            <div className="py-12 animate-fade-in text-center">
                                <div className="w-20 h-20 bg-danger/10 rounded-full mx-auto mb-8 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-danger" />
                                </div>
                                <h3 className="text-2xl font-black text-danger mb-3">{t('connFailed')}</h3>
                                <p className="text-sm text-secondary/60 font-medium mb-8">{t('sessionError')}</p>
                                <button
                                    type="button"
                                    onClick={() => setShowWhatsAppModal(false)}
                                    className="btn-secondary px-8 !bg-white/5 hover:!bg-white/10"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        )}

                        {waState === 'success' && (
                            <div className="py-12 animate-fade-in text-center">
                                <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-white mb-2">{t('deviceLinked')}</h3>
                                <p className="text-sm text-secondary/60">{t('waActiveSub')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
