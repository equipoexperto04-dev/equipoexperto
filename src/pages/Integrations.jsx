import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Unlink, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Loader2,
    Sparkles, Mail, ShieldCheck, Server, Send, Trash2, X,
    ChevronRight, ChevronLeft, Zap, Shield, Lock, ArrowRight,
    Building2, MapPin, ExternalLink, Search
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { createSanitizedHtml } from '../utils/sanitizeHtml';
import './configurations/Config.css';
import './Integrations.css';
import API_URL from '../config.js';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';
import { clearClientSession } from '../utils/sessionClient.js';

/* ─── Gmail OAuth2 SVG ─── */
const GmailSVG = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const WhatsAppSVG = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
);

const SMTP_PROVIDER_PRESETS = [
    { id: 'gmail', label: 'Google Workspace / Gmail', host: 'smtp.gmail.com', port: '587', secure: false },
    { id: 'outlook', label: 'Microsoft 365 / Outlook', host: 'smtp.office365.com', port: '587', secure: false },
    { id: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: '465', secure: true },
    { id: 'privateemail', label: 'Namecheap Private Email', host: 'mail.privateemail.com', port: '587', secure: false },
    { id: 'hostinger', label: 'Hostinger Email', host: 'smtp.hostinger.com', port: '465', secure: true },
    { id: 'titan', label: 'Titan Email', host: 'smtp.titan.email', port: '465', secure: true },
    { id: 'cpanel', label: 'cPanel / Webmail', host: 'mail.yourdomain.com', port: '587', secure: false },
];

const normalizeSmtpHost = (host = '') =>
    String(host).trim().replace(/^\w+:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '').toLowerCase();

const findSmtpProviderByHost = (host) =>
    SMTP_PROVIDER_PRESETS.find((provider) => provider.host === normalizeSmtpHost(host)) || null;

const composeSmtpStatusMessage = (message, hint) =>
    [message, hint].filter(Boolean).join(' ');
/* ─── Gallery Card ─── */
const IntegrationCard = ({ integration, integrations, smtpSettings, onAction, onConfigure, confirmingId, setConfirmingId, testingId, executeDisconnect, disconnectingId, showDisconnectLoading, gbpStatus, onFindListing, findingListing }) => {
    const { t, tWithFallback } = useTranslation();
    const { id, name, color, iconEl, description, category } = integration;

    const isConnected = (() => {
        if (id === 'whatsapp') return integrations?.some(i => i.provider === 'whatsapp');
        if (id === 'gmail') return integrations?.some(i => i.provider === 'google');
        if (id === 'google-business') return integrations?.some(i => i.provider === 'google');
        if (id === 'business-mail') return !!smtpSettings?.is_active;
        return false;
    })();

    const lastSync = (() => {
        if (id === 'whatsapp') return integrations?.find(i => i.provider === 'whatsapp')?.updated_at;
        if (id === 'gmail') return integrations?.find(i => i.provider === 'google')?.updated_at;
        if (id === 'business-mail') return smtpSettings?.updated_at;
        return null;
    })();

    const connectedLabel = (() => {
        if (id === 'gmail') return integrations?.find(i => i.provider === 'google')?.metadata?.email;
        if (id === 'google-business') return gbpStatus?.businessName || null;
        if (id === 'business-mail') return smtpSettings?.from_email;
        return null;
    })();

    const isConfirming = confirmingId === id;

    return (
        <div className="integration-card-wrap">
            <div className={`integration-card ${isConfirming ? 'integration-card--confirm' : ''}`}>

                <div className="integration-card-row">
                    <div className="integration-card-icon-wrap" style={{ color }}>
                        {iconEl}
                    </div>
                    <div className="integration-card-status">
                        {isConnected ? (
                            <>
                                <span className="integration-live-dot" aria-hidden />
                                <span className="integration-status-label integration-status-label--live">{t('Live')}</span>
                            </>
                        ) : (
                            <span className="integration-status-label--ready">{t('badgeReady')}</span>
                        )}
                    </div>
                </div>

                <div>
                    <span className="integration-card-category" style={{ color }}>{category}</span>
                    <h3 className="integration-card-title">{name}</h3>
                </div>

                <div className="flex-1">
                    <p className="integration-card-desc">
                        &ldquo;{description}&rdquo;
                    </p>
                </div>

                {isConnected && connectedLabel && (
                    <div className="integration-card-connected">
                        <div className="integration-card-connected-row">
                            {id === 'google-business' ? (
                                <MapPin size={13} style={{ flexShrink: 0, opacity: 0.65 }} />
                            ) : (
                                <Mail size={13} style={{ flexShrink: 0, opacity: 0.65 }} />
                            )}
                            <span className="integration-card-connected-email">{connectedLabel}</span>
                        </div>
                        {id === 'google-business' && (gbpStatus?.mapsUri || gbpStatus?.reviewUrl) && (
                            <a
                                href={gbpStatus.mapsUri || gbpStatus.reviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="integration-card-sync"
                                style={{ color: 'var(--accent-color)', textDecoration: 'none' }}
                            >
                                <ExternalLink size={10} />
                                <span>{tWithFallback('gbpViewListing', 'View listing')}</span>
                            </a>
                        )}
                        {lastSync && (
                            <div className="integration-card-sync">
                                <RefreshCw size={10} />
                                <span>{t('synchronized')} {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        )}
                    </div>
                )}

                {isConnected && id === 'google-business' && !connectedLabel && gbpStatus && (
                    <div className="integration-card-connected">
                        <div className="integration-card-connected-row">
                            <AlertCircle size={13} style={{ flexShrink: 0, opacity: 0.65 }} />
                            <span className="integration-card-connected-email">
                                {gbpStatus.code === 'GBP_AMBIGUOUS'
                                    ? tWithFallback('gbpAmbiguous', 'Multiple listings found — choose one in Review settings')
                                    : tWithFallback('gbpNoListing', 'No business listing found yet')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="integration-card-actions">
                    {isConfirming ? (
                        <div className="integration-disconnect-prompt animate-fade-in">
                            <p>{t('severConnection')}</p>
                            <div className="integration-btn-row">
                                <button type="button" onClick={() => setConfirmingId(null)} className="btn-secondary">{t('cancel')}</button>
                                <button
                                    type="button"
                                    onClick={() => executeDisconnect(id === 'gmail' ? 'google' : id === 'business-mail' ? 'smtp' : id)}
                                    className="btn-primary"
                                    style={{ backgroundColor: 'var(--danger)', boxShadow: 'none' }}
                                    disabled={showDisconnectLoading && disconnectingId === (id === 'gmail' ? 'google' : id === 'business-mail' ? 'smtp' : id)}
                                >
                                    {showDisconnectLoading && disconnectingId === (id === 'gmail' ? 'google' : id === 'business-mail' ? 'smtp' : id) ? (
                                        <Loader2 size={14} className="animate-spin" aria-hidden />
                                    ) : null}
                                    {t('confirm')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {!isConnected ? (
                                <div className="integration-connect-actions">
                                    <button
                                        type="button"
                                        onClick={onAction}
                                        className="btn-primary w-full"
                                        style={{ backgroundColor: color, border: 'none' }}
                                    >
                                        <Zap size={14} />
                                        <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('connectProvider', { name })}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="integration-connected-actions">
                                    {id === 'whatsapp' && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onAction('test'); }}
                                            disabled={testingId === 'whatsapp'}
                                            className="btn-secondary flex-1"
                                            title={t('waSendTestMsg')}
                                        >
                                            {testingId === 'whatsapp' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                        </button>
                                    )}
                                    {id === 'gmail' && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onAction('test'); }}
                                            disabled={testingId === 'gmail'}
                                            className="btn-secondary flex-1"
                                            title={t('smtpSendTestBtn')}
                                        >
                                            {testingId === 'gmail' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                        </button>
                                    )}
                                    {id === 'business-mail' ? (
                                        <button type="button" onClick={onConfigure} className="btn-secondary flex-1">
                                            <Server size={15} />
                                            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>{t('configure')}</span>
                                        </button>
                                    ) : id === 'google-business' ? (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onFindListing && onFindListing(); }}
                                            disabled={findingListing}
                                            className="btn-secondary flex-1 w-full"
                                        >
                                            {findingListing ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                                            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                {connectedLabel ? tWithFallback('gbpRefreshListing', 'Refresh listing') : tWithFallback('gbpFindListing', 'Find my business')}
                                            </span>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => setConfirmingId(id)} className="btn-secondary flex-1 w-full">
                                            <Unlink size={15} />
                                            <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t('disconnect')}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


/* ─── MAIN INTEGRATIONS PAGE ─── */
const Integrations = () => {
    const { t, tWithFallback } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);
    const [testingId, setTestingId] = useState(null);
    const [disconnectingId, setDisconnectingId] = useState(null);
    const [waConnecting, setWaConnecting] = useState(false);

    // Modals visibility
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [showSmtpModal, setShowSmtpModal] = useState(false);

    // WhatsApp polling state
    const [waState, setWaState] = useState('loading');
    const [waQR, setWaQR] = useState(null);

    // SMTP State
    const [smtpSettings, setSmtpSettings] = useState(null);
    const [smtpSaving, setSmtpSaving] = useState(false);
    const [smtpFormData, setSmtpFormData] = useState({
        host: '', port: '587', secure: false,
        auth_user: '', auth_pass: '', from_email: '', from_name: '', is_active: true
    });
    const [smtpTestStatus, setSmtpTestStatus] = useState(null);
    const [smtpHelperStatus, setSmtpHelperStatus] = useState(null);
    const [smtpDetecting, setSmtpDetecting] = useState(false);

    // Google Business Profile listing lookup
    const [gbpStatus, setGbpStatus] = useState(null);
    const [findingListing] = useState(false);
    const [showGbpModal, setShowGbpModal] = useState(false);
    const [gbpListings, setGbpListings] = useState([]);
    const [gbpListingsLoading, setGbpListingsLoading] = useState(false);
    const [gbpListingsError, setGbpListingsError] = useState(null);
    const [selectingListing, setSelectingListing] = useState(null);

    const showRefreshLoading = useDelayedLoading(loading);
    const showDisconnectLoading = useDelayedLoading(!!disconnectingId);
    const showSmtpSaveLoading = useDelayedLoading(smtpSaving);
    const showSmtpTestLoading = useDelayedLoading(smtpTestStatus?.type === 'loading');
    const [activeSmtpTab, setActiveSmtpTab] = useState('connection'); // connection, authentication, identity
    const [smtpErrors, setSmtpErrors] = useState({});

    const handleUnauthorized = () => {
        clearClientSession();
        setShowWhatsAppModal(false);
        setWaState('error');
        setStatusMessage({ type: 'error', text: t('sessionExpiredLogin') });
        setTimeout(() => navigate('/login?session=expired'), 1200);
    };

    const authFetch = async (url, options = {}) => {
        const res = await fetch(url, {
            credentials: 'include',
            ...options,
            headers: {
                ...options.headers,
            },
        });

        if (res.status === 401) {
            handleUnauthorized();
            const error = new Error('Session expired. Please log in again.');
            error.status = 401;
            throw error;
        }

        return res;
    };

    const openSmtpModal = () => {
        setSmtpTestStatus(null);
        setSmtpHelperStatus(null);
        setShowSmtpModal(true);
    };

    const closeSmtpModal = () => {
        setShowSmtpModal(false);
        setSmtpTestStatus(null);
        setSmtpHelperStatus(null);
    };

    /* ─── Effects ─── */
    useEffect(() => { fetchIntegrations(); fetchSmtpSettings(); }, []);

    useEffect(() => {
        let intervalId;
        if (showWhatsAppModal) {
            const checkStatus = async () => {
                try {
                    const res = await authFetch(`${API_URL}/api/whatsapp/status`);
                    const data = await res.json();
                    if (data.success) {
                        if (data.status === 'initializing' || data.status === 'restoring') setWaState('loading');
                        else if (data.status === 'qr_ready' && data.qr) { setWaState('qr'); setWaQR(data.qr); }
                        else if (data.status === 'connected') {
                            setWaState('success'); setWaQR(null); clearInterval(intervalId);
                            fetchIntegrations();
                            setTimeout(() => {
                                setShowWhatsAppModal(false);
                                setStatusMessage({ type: 'success', text: t('waLinked') });
                                const params = new URLSearchParams(window.location.search);
                                if (params.get('from') === 'onboard') {
                                    const goal = localStorage.getItem('mm_onboard_goal') || 'capture';
                                    navigate(`/dashboard/employee/${goal}?from=onboard`);
                                }
                            }, 3000);
                        } else if (data.status === 'error' || data.status === 'auth_failed') { setWaState('error'); clearInterval(intervalId); }
                    }
                } catch (e) {
                    if (e.status === 401) {
                        clearInterval(intervalId);
                        return;
                    }
                    console.error('Polling error', e);
                }
            };
            intervalId = setInterval(checkStatus, 3000);
            checkStatus();
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [showWhatsAppModal]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'connected') {
            setStatusMessage({ type: 'success', text: t('bridgeEstablished') });
            setTimeout(() => setStatusMessage(null), 5000);
        } else if (params.get('error')) {
            const label = params.get('error').replace(/_/g, ' ');
            const details = params.get('details') ? `: ${decodeURIComponent(params.get('details')).split('—')[0].trim()}` : '';
            setStatusMessage({ type: 'error', text: `${t('connectionFailed', { error: label })}${details}` });
            setTimeout(() => setStatusMessage(null), 10000);
        }
        if (params.get('success') || params.get('error')) window.history.replaceState({}, document.title, location.pathname);
    }, [location]);

    /* ─── API Actions ─── */
    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_URL}/api/integrations`);
            const data = await res.json();
            if (data.success) setIntegrations(data.integrations);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSmtpSettings = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/smtp`);
            const data = await res.json();
            if (data.success && data.settings) {
                setSmtpSettings(data.settings);
                setSmtpFormData({ ...data.settings, auth_pass: '' });
            }
        } catch (err) { console.error(err); }
    };

    // Disabled along with the Google Business Profile card (see INTEGRATIONS_LIST).
    // const fetchGoogleBusinessListing = async () => {
    //     setFindingListing(true);
    //     try {
    //         const res = await authFetch(`${API_URL}/api/integrations/google/review-link`);
    //         const data = await res.json().catch(() => ({}));
    //         setGbpStatus(data || null);
    //     } catch (err) {
    //         if (err.status !== 401) setGbpStatus({ success: false, code: 'ERROR' });
    //     } finally {
    //         setFindingListing(false);
    //     }
    // };

    const openGbpModal = async () => {
        setShowGbpModal(true);
        setGbpListingsError(null);
        setGbpListingsLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/integrations/google/business-listings`);
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setGbpListings(data.listings || []);
            } else {
                setGbpListings([]);
                setGbpListingsError(data.message || tWithFallback('gbpListingsError', 'Could not load your Google Business listings.'));
            }
        } catch (err) {
            if (err.status === 401) return;
            setGbpListings([]);
            setGbpListingsError(tWithFallback('gbpListingsError', 'Could not load your Google Business listings.'));
        } finally {
            setGbpListingsLoading(false);
        }
    };

    const selectGbpListing = async (listing) => {
        setSelectingListing(listing.name || listing.title);
        try {
            const res = await authFetch(`${API_URL}/api/integrations/google/business-listing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewUrl: listing.reviewUrl,
                    mapsUri: listing.mapsUri,
                    placeId: listing.placeId,
                    title: listing.title,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                setGbpStatus({
                    success: true,
                    businessName: data.businessName,
                    reviewUrl: data.reviewUrl,
                    mapsUri: data.mapsUri,
                    placeId: data.placeId,
                });
                setShowGbpModal(false);
                setStatusMessage({ type: 'success', text: tWithFallback('gbpListingSaved', 'Business listing connected.') });
                setTimeout(() => setStatusMessage(null), 4000);
            } else {
                setStatusMessage({ type: 'error', text: data.message || t('networkLost') });
            }
        } catch (err) {
            if (err.status === 401) return;
            setStatusMessage({ type: 'error', text: t('networkLost') });
        } finally {
            setSelectingListing(null);
        }
    };

    // Auto-look-up the business listing once Google is connected
    // Disabled for now along with the Google Business Profile card (see INTEGRATIONS_LIST).
    // useEffect(() => {
    //     if (loading) return;
    //     const googleConnected = integrations.some((i) => i.provider === 'google');
    //     if (googleConnected && !gbpStatus) fetchGoogleBusinessListing();
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [loading, integrations]);

    const handleConnect = async (provider, action = 'connect') => {
        if (action === 'test') {
            if (provider === 'whatsapp') handleSendTestWhatsApp();
            if (provider === 'gmail') handleSendTestGmail();
            if (provider === 'business-mail') handleTestSmtp();
            return;
        }
        if (provider === 'business-mail') { openSmtpModal(); return; }
        if (provider === 'whatsapp') {
            setShowWhatsAppModal(true); setWaState('loading');
            setWaConnecting(true);
            try {
                const res = await authFetch(`${API_URL}/api/whatsapp/connect`, { method: 'POST' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === false) {
                    setWaState('error');
                    setStatusMessage({ type: 'error', text: data.message || t('waConnectFailed') });
                }
            } catch (err) {
                if (err.status === 401) return;
                setWaState('error');
                setStatusMessage({ type: 'error', text: t('waConnectFailed') });
            } finally {
                setWaConnecting(false);
            }
            return;
        }
        // Map frontend provider IDs to backend provider IDs
        const backendProvider = (provider === 'gmail' || provider === 'google-business') ? 'google' : provider;
        const res = await authFetch(`${API_URL}/api/integrations/${backendProvider}/connect-ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.url) {
            window.location.href = data.url;
            return;
        }
        setStatusMessage({ type: 'error', text: data.message || t('networkLost') });
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('connect') !== 'whatsapp' || loading) return;
        const connected = integrations.some((i) => i.provider === 'whatsapp');
        if (connected) return;
        handleConnect('whatsapp');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep-link from onboarding
    }, [location.search, loading]);

    const executeDisconnect = async (provider) => {
        setConfirmingId(null);
        setDisconnectingId(provider);
        try {
            let url, method;
            if (provider === 'whatsapp') {
                url = `${API_URL}/api/whatsapp/disconnect`;
                method = 'POST';
            } else if (provider === 'smtp' || provider === 'business-mail') {
                url = `${API_URL}/api/smtp`;
                method = 'DELETE';
            } else {
                url = `${API_URL}/api/integrations/${provider}`;
                method = 'DELETE';
            }
            const res = await authFetch(url, { method });
            const data = await res.json();
            if (data.success) {
                setStatusMessage({ type: 'success', text: t('waSevered', { provider }) });
                fetchIntegrations();
                if (provider === 'smtp' || provider === 'business-mail') setSmtpSettings(null);
                setTimeout(() => setStatusMessage(null), 4000);
            } else setStatusMessage({ type: 'error', text: data.message });
        } catch (err) {
            if (err.status === 401) return;
            setStatusMessage({ type: 'error', text: t('networkLost') });
        } finally {
            setDisconnectingId(null);
        }
    };

    const handleTestSmtp = async () => {
        const errors = {};
        if (!smtpFormData.host) errors.host = t('smtpErrorHostRequired');
        if (!smtpFormData.auth_user) errors.auth_user = t('smtpErrorUserRequired');
        if (!smtpSettings && !smtpFormData.auth_pass) errors.auth_pass = t('smtpErrorPassRequired');
        if (Object.keys(errors).length > 0) {
            setSmtpErrors((prev) => ({ ...prev, ...errors }));
            if (errors.host) setActiveSmtpTab('connection');
            else setActiveSmtpTab('authentication');
            setSmtpTestStatus({ type: 'error', message: tWithFallback('smtpFillRequiredFirst', 'Fill the required SMTP fields first.') });
            return;
        }

        setSmtpHelperStatus(null);
        setSmtpTestStatus({ type: 'loading', message: t('loading') });

        try {
            // Step 1: POST — returns immediately with a jobId (no timeout risk)
            const startRes = await authFetch(`${API_URL}/api/smtp/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpFormData),
            });
            const startData = await startRes.json();

            if (!startRes.ok || !startData.jobId) {
                // Validation error (400) before test even started
                setSmtpTestStatus({
                    type: 'error',
                    message: composeSmtpStatusMessage(
                        startData.message || 'Could not start SMTP test.',
                        startData.hint
                    ),
                });
                return;
            }

            const { jobId } = startData;

            // Step 2: Poll GET /test/:jobId every 2 s until done (max 60 s)
            const MAX_WAIT_MS = 60000;
            const POLL_INTERVAL_MS = 2000;
            const deadline = Date.now() + MAX_WAIT_MS;

            const poll = async () => {
                if (Date.now() > deadline) {
                    setSmtpTestStatus({
                        type: 'error',
                        message: composeSmtpStatusMessage(
                            'The mail server did not respond in time.',
                            'Try SSL/TLS on port 465, or Standard on port 587. Also enable outbound SMTP in cPanel → Email → SMTP Restrictions.'
                        ),
                    });
                    return;
                }

                try {
                    const pollRes = await authFetch(`${API_URL}/api/smtp/test/${jobId}`);
                    const data = await pollRes.json();

                    if (pollRes.status === 202) {
                        // Still pending — wait and try again
                        setTimeout(poll, POLL_INTERVAL_MS);
                        return;
                    }

                    // Final result
                    if (data.success) {
                        setSmtpTestStatus({
                            type: 'success',
                            message: composeSmtpStatusMessage(
                                data.message || t('smtpTestSuccess') || 'Connection Successful!',
                                data.hint
                            ),
                        });
                    } else {
                        setSmtpTestStatus({
                            type: 'error',
                            message: composeSmtpStatusMessage(
                                data.message || t('smtpTestFailed') || 'Connection Failed',
                                data.hint
                            ),
                        });
                    }
                } catch {
                    setTimeout(poll, POLL_INTERVAL_MS);
                }
            };

            setTimeout(poll, POLL_INTERVAL_MS);

        } catch (err) {
            if (err.status === 401) return;
            setSmtpTestStatus({ type: 'error', message: err.message || t('networkError') });
        }
    };

    const handleDetectSmtp = async () => {
        const email = String(smtpFormData.auth_user || smtpFormData.from_email || '').trim();
        if (!email) {
            setSmtpErrors((prev) => ({ ...prev, auth_user: t('smtpErrorUserRequired') }));
            setActiveSmtpTab('authentication');
            setSmtpHelperStatus({
                type: 'error',
                message: tWithFallback('smtpAutoDetectNeedsEmail', 'Enter the mailbox email first, then use auto-detect.'),
            });
            return;
        }

        setSmtpDetecting(true);
        setSmtpHelperStatus({
            type: 'loading',
            message: tWithFallback('smtpAutoDetectLoading', 'Detecting your email provider...'),
        });

        try {
            const res = await authFetch(`${API_URL}/api/smtp/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!data.success || !data.config) {
                setSmtpHelperStatus({
                    type: 'error',
                    message: composeSmtpStatusMessage(
                        data.message || tWithFallback('smtpAutoDetectFailed', 'Could not detect server settings.'),
                        data.hint
                    ),
                });
                return;
            }

            setSmtpFormData((prev) => ({
                ...prev,
                host: data.config.host || prev.host,
                port: String(data.config.port || prev.port || '587'),
                secure: typeof data.config.secure === 'boolean' ? data.config.secure : prev.secure,
                auth_user: prev.auth_user || email,
                from_email: prev.from_email || email,
            }));
            setActiveSmtpTab('connection');
            setSmtpErrors((prev) => ({ ...prev, auth_user: undefined, host: undefined }));
            setSmtpHelperStatus({
                type: 'success',
                message: composeSmtpStatusMessage(data.message, data.config.hint || data.hint),
            });
        } catch (err) {
            if (err.status === 401) return;
            setSmtpHelperStatus({ type: 'error', message: t('networkError') });
        } finally {
            setSmtpDetecting(false);
        }
    };

    const handleSendTestWhatsApp = async () => {
        setTestingId('whatsapp');
        try {
            const res = await authFetch(`${API_URL}/api/whatsapp/test-message`, { method: 'POST' });
            const data = await res.json();
            if (data.success) setStatusMessage({ type: 'success', text: t('testMessageSent') || 'Test WhatsApp message sent!' });
            else setStatusMessage({ type: 'error', text: data.message });
        } catch (err) {
            if (err.status !== 401) setStatusMessage({ type: 'error', text: t('networkError') });
        }
        finally { setTestingId(null); }
    };

    const handleSendTestGmail = async () => {
        setTestingId('gmail');
        try {
            const res = await authFetch(`${API_URL}/api/integrations/google/test-email`, { method: 'POST' });
            const data = await res.json();
            if (data.success) setStatusMessage({ type: 'success', text: t('testEmailSent') || 'Test email sent via Gmail!' });
            else setStatusMessage({ type: 'error', text: data.message });
        } catch (err) {
            if (err.status !== 401) setStatusMessage({ type: 'error', text: t('networkError') });
        }
        finally { setTestingId(null); }
    };

    const handleSaveSmtp = async () => {
        // Inline validation — show exactly which fields are missing
        const errors = {};
        if (!smtpFormData.host) errors.host = t('smtpErrorHostRequired');
        if (!smtpFormData.auth_user) errors.auth_user = t('smtpErrorUserRequired');
        if (!smtpSettings && !smtpFormData.auth_pass) errors.auth_pass = t('smtpErrorPassRequired');
        if (!smtpFormData.from_email) errors.from_email = t('smtpErrorFromEmailRequired');
        if (!smtpFormData.from_name) errors.from_name = t('smtpErrorFromNameRequired');
        if (Object.keys(errors).length > 0) {
            setSmtpErrors(errors);
            // Navigate to the first tab with an error
            if (errors.host) setActiveSmtpTab('connection');
            else if (errors.auth_user || errors.auth_pass) setActiveSmtpTab('authentication');
            else setActiveSmtpTab('identity');
            return;
        }
        setSmtpErrors({});
        setSmtpSaving(true);
        try {
            const res = await authFetch(`${API_URL}/api/smtp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smtpFormData)
            });
            const data = await res.json();
            if (data.success) {
                setSmtpSettings(data.settings);
                closeSmtpModal();
                setStatusMessage({ type: 'success', text: tWithFallback('smtpConnectedShort', 'Business mail connected.') });
                // Show next steps hint
                setTimeout(() => {
                    setStatusMessage({ 
                        type: 'info', 
                        text: t('smtpNextStepsHint'),
                        action: () => navigate('/dashboard/config/lead-followup')
                    });
                }, 3000);
            } else setStatusMessage({ type: 'error', text: data.message });
        } catch (err) {
            if (err.status !== 401) setStatusMessage({ type: 'error', text: t('networkError') });
        }
        finally { setSmtpSaving(false); }
    };

    // Auto-port logic
    useEffect(() => {
        if (smtpFormData.secure) {
            if (smtpFormData.port === '587' || smtpFormData.port === '') setSmtpFormData(prev => ({ ...prev, port: '465' }));
        } else {
            if (smtpFormData.port === '465' || smtpFormData.port === '') setSmtpFormData(prev => ({ ...prev, port: '587' }));
        }
    }, [smtpFormData.secure]);

    const INTEGRATIONS_LIST = [
        {
            id: 'whatsapp',
            name: t('waName') || 'WhatsApp Cloud',
            category: 'Messaging',
            color: '#25D366',
            iconEl: <WhatsAppSVG size={32} />,
            description: t('waDesc') || 'Native broadcast features and instant triggers via Meta\'s official WhatsApp API.',
        },
        {
            id: 'gmail',
            name: t('gmailName') || 'Gmail OAuth2',
            category: 'Email · OAuth2',
            color: '#4285F4',
            iconEl: <GmailSVG size={30} />,
            description: t('gmailDesc') || 'Connect your personal or workspace account via OAuth2. No password required — revoke anytime.',
        },
        {
            id: 'business-mail',
            name: t('smtpName') || 'Business Mail (SMTP)',
            category: 'Email · SMTP',
            color: '#6366f1',
            iconEl: <Server size={28} />,
            description: t('smtpDesc') || 'Connect your professional domain email via SMTP. Compatible with CDMON, cPanel, and custom servers.',
        },
        // Google Business Profile integration temporarily disabled — pending Google API quota/setup.
        // {
        //     id: 'google-business',
        //     name: tWithFallback('gbpName', 'Google Business Profile'),
        //     category: tWithFallback('gbpCategory', 'Local SEO · OAuth2'),
        //     color: '#1a73e8',
        //     iconEl: <Building2 size={28} />,
        //     description: tWithFallback('gbpDesc', 'Connect your Google Business Profile so we can find your listing and review link automatically.'),
        // },
    ];

    return (
        <div className="dashboard-page integrations-root animate-fade-in pb-20">
            <header className="integrations-header">
                <div>
                    <h2 className="integrations-title">
                        {t('integrationsTitle') || 'Connect your channels'}
                    </h2>
                    <p className="integrations-subtitle">
                        {tWithFallback(
                            'integrationsSubSimple',
                            'Connect Gmail and WhatsApp so your employees can send messages.'
                        )}
                    </p>
                </div>

                <div className="integrations-toolbar">
                    <div className="integrations-toolbar-actions">
                    {statusMessage && (
                        <div
                            className={`badge py-3 px-5 shadow-lg animate-fade-in ${
                                statusMessage.type === 'success'
                                    ? 'badge-success'
                                    : statusMessage.type === 'info'
                                      ? 'badge-accent'
                                      : ''
                            }`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'none',
                                letterSpacing: 'normal',
                                ...(statusMessage.type === 'error'
                                    ? {
                                          background: 'var(--danger-bg)',
                                          color: 'var(--danger)',
                                          border: '1px solid rgba(220, 38, 38, 0.22)',
                                      }
                                    : {}),
                            }}
                        >
                            {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : statusMessage.type === 'info' ? <ArrowRight size={14} /> : <AlertCircle size={14} />}
                            <span>{statusMessage.text}</span>
                            {statusMessage.action && (
                                <button 
                                    type="button"
                                    onClick={statusMessage.action}
                                    className="underline hover:no-underline font-semibold"
                                    style={{ marginLeft: '0.25rem', border: 'none', background: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                                >
                                    Go →
                                </button>
                            )}
                        </div>
                    )}
                    <button type="button" onClick={fetchIntegrations} className="btn-secondary py-3 px-6 shadow-sm transition-all active:scale-95" disabled={loading}>
                        {showRefreshLoading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} />}
                        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{showRefreshLoading ? t('syncing') : tWithFallback('refreshConnections', 'Refresh')}</span>
                    </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="mb-16">
                    <SkeletonCard height={90} />
                    <SkeletonCard height={90} />
                    <SkeletonCard height={90} />
                </div>
            ) : (
                <div className="integrations-grid">
                    {INTEGRATIONS_LIST.map(int => (
                        <IntegrationCard
                            key={int.id}
                            integration={int}
                            integrations={integrations}
                            smtpSettings={smtpSettings}
                            onAction={() => handleConnect(int.id)}
                            onConfigure={openSmtpModal}
                            confirmingId={confirmingId}
                            setConfirmingId={setConfirmingId}
                            testingId={testingId}
                            executeDisconnect={executeDisconnect}
                            disconnectingId={disconnectingId}
                            showDisconnectLoading={showDisconnectLoading}
                            gbpStatus={int.id === 'google-business' ? gbpStatus : null}
                            onFindListing={int.id === 'google-business' ? openGbpModal : null}
                            findingListing={findingListing}
                        />
                    ))}
                </div>
            )}

            {/* BETA PIPELINE banner removed — clutter cleanup */}

            {/* ── SMTP MODAL ── */}
            {showSmtpModal && (() => {
                const applyProvider = (p) => {
                    setSmtpFormData((prev) => {
                        const mailboxEmail = String(prev.auth_user || prev.from_email || '').trim().toLowerCase();
                        const emailDomain = mailboxEmail.includes('@') ? mailboxEmail.split('@')[1] : '';
                        const resolvedHost =
                            p.id === 'cpanel' && emailDomain
                                ? `mail.${emailDomain}`
                                : p.host;
                        return { ...prev, host: resolvedHost, port: p.port, secure: p.secure };
                    });
                    setSmtpHelperStatus({
                        type: 'info',
                        message:
                            p.id === 'gmail'
                                ? tWithFallback('smtpGoogleOauthHint', 'If this mailbox is Google Workspace or Gmail, Google OAuth is easier than SMTP. Use an app password if you stay on SMTP.')
                                : tWithFallback('smtpProviderApplied', `${p.label} settings loaded.`),
                    });
                    if (p.id !== 'custom') setActiveSmtpTab('authentication');
                };
                const TABS = [
                    { id: 'connection',     Icon: Zap,        label: t('smtpTabServer'), sub: t('smtpTabServerSub'),   color: '#6366f1', hasError: !!(smtpErrors.host) },
                    { id: 'authentication', Icon: ShieldCheck, label: t('smtpTabLogin'),  sub: t('smtpTabLoginSub'),  color: '#10b981', hasError: !!(smtpErrors.auth_user || smtpErrors.auth_pass) },
                    { id: 'identity',       Icon: Send,        label: t('smtpTabSender'), sub: t('smtpTabSenderSub'), color: '#f97316', hasError: !!(smtpErrors.from_email || smtpErrors.from_name) },
                ];
                const testColors = {
                    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#059669' },
                    error:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#dc2626' },
                    info:    { bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)', text: '#0369a1' },
                    loading: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' },
                };
                const normalizedHost = normalizeSmtpHost(smtpFormData.host);
                const activeProvider =
                    findSmtpProviderByHost(normalizedHost) ||
                    (/^mail\./.test(normalizedHost) ? { id: 'cpanel' } : null);
                return (
                <div className="wa-modal-overlay">
                    <div className="smtp-modal">

                        {/* ── Header ── */}
                        <div className="smtp-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                <div className="smtp-header-icon">
                                    <Server size={21} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 className="smtp-header-title">{t('smtpModalTitle')}</h3>
                                    <p className="smtp-header-sub">{t('smtpModalSub')}</p>
                                </div>
                            </div>
                            <button className="smtp-close-btn" onClick={closeSmtpModal}>
                                <X size={17} />
                            </button>
                        </div>

                        {/* ── Step tab nav ── */}
                        <div className="smtp-tab-nav">
                            {TABS.map(tab => {
                                const active = activeSmtpTab === tab.id;
                                return (
                                    <button key={tab.id} type="button"
                                        className={`smtp-tab-btn${active ? ' smtp-tab-active' : ''}`}
                                        style={{ borderBottomColor: active ? tab.color : 'transparent', background: active ? `${tab.color}0d` : undefined, position: 'relative' }}
                                        onClick={() => setActiveSmtpTab(tab.id)}>
                                        {tab.hasError && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />}
                                        <div className="smtp-tab-icon"
                                            style={active ? { background: `${tab.color}20`, color: tab.color, borderColor: `${tab.color}40` } : {}}>
                                            <tab.Icon size={14} />
                                        </div>
                                        <p className="smtp-tab-label" style={active ? { color: 'var(--text-primary)' } : {}}>{tab.label}</p>
                                        <p className="smtp-tab-sub" style={active ? { color: tab.color, opacity: 1 } : {}}>{tab.sub}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Tab content ── */}
                        <div className="smtp-content premium-scrollbar">

                            {/* TAB 1 — Server */}
                            {activeSmtpTab === 'connection' && (
                                <div className="animate-fade-in-up">

                                    {/* Provider quick-pick */}
                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpChooseProvider')}</label>
                                        <p className="smtp-hint" style={{ marginTop: 0, marginBottom: '10px' }}>{t('smtpChooseProviderSub')}</p>
                                        <div className="smtp-providers">
                                            {[...SMTP_PROVIDER_PRESETS, { id: 'custom', label: t('smtpProviderOther'), host: '', port: '587', secure: false }].map(p => {
                                                const active = p.id === 'custom' ? !activeProvider && !!smtpFormData.host : activeProvider?.id === p.id;
                                                return (
                                                    <button key={p.id} type="button"
                                                        className={`smtp-provider-btn${active ? ' smtp-provider-active' : ''}`}
                                                        onClick={() => applyProvider(p)}>
                                                        {p.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="smtp-divider" />

                                    {/* Host */}
                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpHostLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="smtp-input-wrap" style={smtpErrors.host ? { borderColor: '#ef4444' } : {}}>
                                            <Server size={14} className="smtp-input-icon" />
                                            <input type="text" className="smtp-input"
                                                placeholder={t('smtpHostPlaceholder')}
                                                value={smtpFormData.host}
                                                onChange={e => { setSmtpFormData({ ...smtpFormData, host: e.target.value }); setSmtpErrors(p => ({ ...p, host: undefined })); }} />
                                        </div>
                                        {smtpErrors.host ? <p className="smtp-hint" style={{ color: '#ef4444' }}>{smtpErrors.host}</p>
                                            : <p className="smtp-hint">{t('smtpHostHint')}</p>}
                                    </div>

                                    {/* Security protocol */}
                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpConnectionSecurity')}</label>
                                        <div className="smtp-protocol-grid">
                                            {[
                                                { val: false, label: t('smtpSecureStandard'),  badge: t('smtpSecureStandardBadge'), port: '587', color: '#6366f1', Icon: Shield },
                                                { val: true,  label: t('smtpSecureStrict'), badge: t('smtpSecureStrictBadge'),  port: '465', color: '#10b981', Icon: Lock  },
                                            ].map(opt => {
                                                const active = smtpFormData.secure === opt.val;
                                                return (
                                                    <button key={String(opt.val)} type="button"
                                                        className={`smtp-protocol-card${active ? ' smtp-protocol-active' : ''}`}
                                                        style={active ? { borderColor: `${opt.color}55`, background: `${opt.color}0e`, boxShadow: `0 0 18px ${opt.color}15` } : {}}
                                                        onClick={() => setSmtpFormData({ ...smtpFormData, secure: opt.val, port: opt.port })}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                            <div className="smtp-protocol-card-icon"
                                                                style={active ? { background: `${opt.color}1a`, color: opt.color, borderColor: `${opt.color}35` } : {}}>
                                                                <opt.Icon size={14} />
                                                            </div>
                                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${active ? opt.color : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: opt.color }} />}
                                                            </div>
                                                        </div>
                                                        <p className="smtp-protocol-name" style={active ? { color: 'var(--text-primary)' } : {}}>{opt.label}</p>
                                                        <p className="smtp-protocol-badge" style={active ? { color: opt.color, opacity: 1 } : {}}>{opt.badge}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Port chips */}
                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpPortNumber')}</label>
                                        <div className="smtp-port-grid">
                                            {[
                                                { val: '587', note: 'STARTTLS' },
                                                { val: '465', note: 'SSL/TLS'  },
                                                { val: '25',  note: t('smtpPortPlain')    },
                                                { val: '2525',note: t('smtpPortAlt')      },
                                            ].map(p => (
                                                <button key={p.val} type="button"
                                                    className={`smtp-port-btn${smtpFormData.port === p.val ? ' smtp-port-active' : ''}`}
                                                    onClick={() => setSmtpFormData({ ...smtpFormData, port: p.val })}>
                                                    <span style={{ display: 'block' }}>{p.val}</span>
                                                    <span style={{ fontSize: '9px', fontWeight: 500, opacity: 0.65 }}>{p.note}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2 — Login */}
                            {activeSmtpTab === 'authentication' && (
                                <div className="animate-fade-in-up">
                                    <div className="smtp-info-banner">
                                        <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: '1px' }} />
                                        <p dangerouslySetInnerHTML={createSanitizedHtml(t('smtpPasswordBanner'))} />
                                    </div>

                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpEmailAddressLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="smtp-input-wrap" style={smtpErrors.auth_user ? { borderColor: '#ef4444' } : {}}>
                                            <Mail size={14} className="smtp-input-icon" />
                                            <input type="text" className="smtp-input focus-green"
                                                placeholder="info@yourdomain.com"
                                                value={smtpFormData.auth_user}
                                                onChange={e => {
                                                    const nextEmail = e.target.value;
                                                    setSmtpFormData((prev) => ({
                                                        ...prev,
                                                        auth_user: nextEmail,
                                                        from_email: prev.from_email || nextEmail,
                                                    }));
                                                    setSmtpErrors(p => ({ ...p, auth_user: undefined }));
                                                }} />
                                        </div>
                                        {smtpErrors.auth_user ? <p className="smtp-hint" style={{ color: '#ef4444' }}>{smtpErrors.auth_user}</p>
                                            : <p className="smtp-hint">{t('smtpEmailAddressHint')}</p>}
                                    </div>

                                    <div className="smtp-info-banner" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                            <Sparkles size={14} style={{ color: '#6366f1', flexShrink: 0, marginTop: '1px' }} />
                                            <p>{tWithFallback('smtpAutoDetectHint', 'Not sure about the mail server? Enter the mailbox email and we will try to fill the provider settings for you.')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleDetectSmtp}
                                            disabled={smtpDetecting}
                                            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                        >
                                            {smtpDetecting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden />}
                                            {smtpDetecting ? t('loading') : tWithFallback('smtpAutoDetectBtn', 'Auto-detect')}
                                        </button>
                                    </div>

                                    <div className="smtp-field">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                                            <label className="smtp-label" style={{ margin: 0 }}>{t('smtpPasswordLabel')} {!smtpSettings && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                            {smtpSettings && <span className="smtp-saved-badge">{t('smtpSavedBadge')}</span>}
                                        </div>
                                        <div className="smtp-input-wrap" style={smtpErrors.auth_pass ? { borderColor: '#ef4444' } : {}}>
                                            <Lock size={14} className="smtp-input-icon" />
                                            <input type="password" className="smtp-input focus-green"
                                                placeholder={smtpSettings ? t('smtpPasswordHint') : t('smtpPasswordPlaceholder')}
                                                value={smtpFormData.auth_pass}
                                                onChange={e => { setSmtpFormData({ ...smtpFormData, auth_pass: e.target.value }); setSmtpErrors(p => ({ ...p, auth_pass: undefined })); }} />
                                        </div>
                                        {smtpErrors.auth_pass ? <p className="smtp-hint" style={{ color: '#ef4444' }}>{smtpErrors.auth_pass}</p>
                                            : <p className="smtp-hint" dangerouslySetInnerHTML={createSanitizedHtml(t('smtpGmailAppPassHint'))} />}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3 — Sender */}
                            {activeSmtpTab === 'identity' && (
                                <div className="animate-fade-in-up">

                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpSenderEmailLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="smtp-input-wrap" style={smtpErrors.from_email ? { borderColor: '#ef4444' } : {}}>
                                            <Mail size={14} className="smtp-input-icon" />
                                            <input type="email" className="smtp-input focus-orange"
                                                placeholder="hello@yourdomain.com"
                                                value={smtpFormData.from_email}
                                                onChange={e => { setSmtpFormData({ ...smtpFormData, from_email: e.target.value }); setSmtpErrors(p => ({ ...p, from_email: undefined })); }} />
                                        </div>
                                        {smtpErrors.from_email ? <p className="smtp-hint" style={{ color: '#ef4444' }}>{smtpErrors.from_email}</p>
                                            : <p className="smtp-hint">{t('smtpSenderEmailHint')}</p>}
                                    </div>

                                    <div className="smtp-field">
                                        <label className="smtp-label">{t('smtpSenderNameLabel')} <span style={{ color: '#ef4444' }}>*</span></label>
                                        <div className="smtp-input-wrap" style={smtpErrors.from_name ? { borderColor: '#ef4444' } : {}}>
                                            <Sparkles size={14} className="smtp-input-icon" />
                                            <input type="text" className="smtp-input focus-orange"
                                                placeholder="Acme Corp"
                                                value={smtpFormData.from_name}
                                                onChange={e => { setSmtpFormData({ ...smtpFormData, from_name: e.target.value }); setSmtpErrors(p => ({ ...p, from_name: undefined })); }} />
                                        </div>
                                        {smtpErrors.from_name ? <p className="smtp-hint" style={{ color: '#ef4444' }}>{smtpErrors.from_name}</p>
                                            : <p className="smtp-hint" dangerouslySetInnerHTML={createSanitizedHtml(t('smtpSenderNameHint'))} />}
                                    </div>

                                    {(smtpFormData.from_name || smtpFormData.from_email) && (
                                        <div className="smtp-preview-box smtp-field">
                                            <p className="smtp-preview-title">{t('smtpInboxPreviewTitle')}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="smtp-preview-avatar">
                                                    {(smtpFormData.from_name || smtpFormData.from_email)[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="smtp-preview-name">{smtpFormData.from_name || '—'}</p>
                                                    <p className="smtp-preview-email">{smtpFormData.from_email || '—'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="smtp-toggle-row smtp-field">
                                        <div>
                                            <p className="smtp-toggle-label">{t('smtpEnableSendingLabel')}</p>
                                            <p className="smtp-toggle-sub">{t('smtpEnableSendingSub')}</p>
                                        </div>
                                        <button type="button" className="smtp-toggle-track"
                                            style={{ background: smtpFormData.is_active ? '#10b981' : 'var(--border-color)' }}
                                            onClick={() => setSmtpFormData({ ...smtpFormData, is_active: !smtpFormData.is_active })}>
                                            <div className="smtp-toggle-thumb" style={{ left: smtpFormData.is_active ? '23px' : '3px' }} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {smtpHelperStatus && (() => {
                                const c = testColors[smtpHelperStatus.type] || testColors.info;
                                return (
                                    <div className="smtp-test-result" style={{ background: c.bg, borderColor: c.border, color: c.text }}>
                                        {smtpHelperStatus.type === 'loading' ? <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0 }} />
                                            : smtpHelperStatus.type === 'success' ? <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                                            : smtpHelperStatus.type === 'error' ? <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                            : <Sparkles size={14} style={{ flexShrink: 0 }} />}
                                        {smtpHelperStatus.message}
                                    </div>
                                );
                            })()}

                            {/* Test result */}
                            {smtpTestStatus && (() => {
                                const c = testColors[smtpTestStatus.type] || testColors.loading;
                                return (
                                    <div className="smtp-test-result" style={{ background: c.bg, borderColor: c.border, color: c.text }}>
                                        {smtpTestStatus.type === 'loading' ? <Loader2 size={14} className="animate-spin" style={{ flexShrink: 0 }} />
                                            : smtpTestStatus.type === 'success' ? <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                                            : <AlertCircle size={14} style={{ flexShrink: 0 }} />}
                                        {smtpTestStatus.message}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Footer ── */}
                        <div className="smtp-footer">
                            <button className="smtp-btn-test" disabled={smtpTestStatus?.type === 'loading'} onClick={handleTestSmtp}>
                                {showSmtpTestLoading ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Send size={13} />}
                                {showSmtpTestLoading ? t('loading') : t('smtpSendTestBtn')}
                            </button>
                            <button className="smtp-btn-save" disabled={smtpSaving} onClick={handleSaveSmtp}>
                                {showSmtpSaveLoading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ShieldCheck size={15} />}
                                {showSmtpSaveLoading ? t('saving') : t('smtpSaveActivateBtn')}
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* ── WhatsApp QR Modal ── */}
            {showWhatsAppModal && (
                <div className="wa-modal-overlay">
                    <div className="wa-modal-content border border-white/10 shadow-2xl">
                        <button onClick={() => setShowWhatsAppModal(false)} className="wa-close-btn hover:bg-white/5 transition-colors">
                            <X size={24} />
                        </button>

                        <div className="w-20 h-20 bg-[#25D366]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <WhatsAppSVG size={40} />
                        </div>

                        {waState === 'qr' && waQR && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">{t('linkWA') || 'Link WhatsApp'}</h3>
                                <p className="text-sm text-secondary/70 font-medium mb-8 max-w-[320px] leading-relaxed mx-auto text-center border-b border-white/10 pb-8 w-full" dangerouslySetInnerHTML={createSanitizedHtml(t('waScanInst') || 'Scan this QR code from your mobile WhatsApp application settings.')} />
                                <div className="p-5 mb-8 bg-white rounded-[2.5rem] shadow-2xl shadow-white/5">
                                    <img src={waQR} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
                                </div>
                                <div className="px-6 py-2.5 bg-[#25D366]/10 rounded-full flex items-center gap-2 animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-[#25D366]" />
                                    <span className="text-[11px] font-black text-[#25D366] uppercase tracking-[0.2em]">
                                        {t('awaitingScan') || 'Awaiting Device Handshake'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {waState === 'loading' && (
                            <div className="py-12 animate-fade-in text-center">
                                <div className="wa-spinner mb-8 mx-auto" style={{ width: 60, height: 60 }} />
                                <h3 className="text-2xl font-black text-white mb-3 animate-pulse uppercase tracking-wider">{t('initEngine') || 'Priming Protocol'}</h3>
                                <p className="text-sm text-secondary/60 font-medium">{t('bootingProto') || 'Establishing secure WebSocket handshake...'}</p>
                            </div>
                        )}

                        {waState === 'error' && (
                            <div className="py-12 animate-fade-in text-center">
                                <div className="w-20 h-20 bg-danger/10 rounded-full mx-auto mb-8 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-danger" />
                                </div>
                                <h3 className="text-2xl font-black text-danger mb-3">{t('connFailed') || 'Connection Fault'}</h3>
                                <p className="text-sm text-secondary/60 font-medium mb-8">{t('sessionError') || 'The connection timed out or another session is active.'}</p>
                                <button onClick={() => setShowWhatsAppModal(false)} className="btn-secondary px-8 !bg-white/5 hover:!bg-white/10">{t('close') || 'Abort'}</button>
                            </div>
                        )}

                        {waState === 'success' && (
                            <div className="py-8 animate-fade-in text-center">
                                <div className="wa-success-icon bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={48} className="text-success" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">{t('deviceLinked') || 'WhatsApp Connected!'}</h3>
                                <p className="text-sm text-secondary/60 font-medium mb-6">{t('waActiveSub') || 'Your WhatsApp is now ready to send messages.'}</p>
                                
                                {/* Next Steps after WhatsApp connection */}
                                <div style={{ 
                                    maxWidth: '320px', 
                                    margin: '0 auto 1.5rem',
                                    padding: '1rem',
                                    background: 'rgba(16,185,129,0.08)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(16,185,129,0.2)'
                                }}>
                                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                                        What would you like to do next?
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => { setShowWhatsAppModal(false); navigate('/dashboard/config/lead-followup'); }}
                                            style={{
                                                padding: '0.625rem 1rem',
                                                background: 'rgba(16,185,129,0.15)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <ArrowRight size={14} />
                                            Set up Follow-up Messages
                                        </button>
                                        <button
                                            onClick={() => { setShowWhatsAppModal(false); navigate('/dashboard/leads'); }}
                                            style={{
                                                padding: '0.625rem 1rem',
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Go to My Contacts →
                                        </button>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setShowWhatsAppModal(false)}
                                    className="btn-secondary px-8 !bg-white/5 hover:!bg-white/10"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Google Business Profile Listing Picker ── */}
            {showGbpModal && (
                <div className="wa-modal-overlay" onClick={() => setShowGbpModal(false)}>
                    <div className="smtp-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="smtp-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                <div className="smtp-header-icon" style={{ background: 'rgba(26,115,232,0.12)', color: '#1a73e8' }}>
                                    <Building2 size={21} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 className="smtp-header-title">{tWithFallback('gbpModalTitle', 'Choose your business listing')}</h3>
                                    <p className="smtp-header-sub">{tWithFallback('gbpModalSub', 'Pick the listing on your Google account to use for reviews and local search.')}</p>
                                </div>
                            </div>
                            <button className="smtp-close-btn" onClick={() => setShowGbpModal(false)}>
                                <X size={17} />
                            </button>
                        </div>

                        <div className="smtp-content">
                            {gbpListingsLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <SkeletonCard height={64} />
                                    <SkeletonCard height={64} />
                                </div>
                            ) : gbpListingsError ? (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{gbpListingsError}</span>
                                </div>
                            ) : gbpListings.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem 0' }}>
                                    {tWithFallback('gbpNoListingsFound', 'No Google Business listings were found on this account.')}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {gbpListings.map((listing) => {
                                        const isSelecting = selectingListing === (listing.name || listing.title);
                                        const isCurrent = gbpStatus?.businessName === listing.title && gbpStatus?.placeId === listing.placeId;
                                        return (
                                            <div
                                                key={listing.name || listing.title}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--bg-secondary)',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', minWidth: 0 }}>
                                                    <div style={{
                                                        flexShrink: 0, width: 36, height: 36, borderRadius: 9,
                                                        background: 'rgba(26,115,232,0.12)', color: '#1a73e8',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {listing.title || tWithFallback('gbpUntitledListing', 'Untitled listing')}
                                                            </span>
                                                            {listing.isVerified ? (
                                                                <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                                                    {tWithFallback('gbpVerified', 'Verified')}
                                                                </span>
                                                            ) : (
                                                                <span className="badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                                    {listing.hasPendingVerification
                                                                        ? tWithFallback('gbpPendingVerification', 'Verification pending')
                                                                        : tWithFallback('gbpNotVerified', 'Not verified')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {listing.address && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {listing.address}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectGbpListing(listing)}
                                                    disabled={isSelecting || isCurrent}
                                                    className="btn-secondary"
                                                    style={{ flexShrink: 0, fontSize: '11px', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                                                >
                                                    {isSelecting ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : isCurrent ? (
                                                        <CheckCircle2 size={14} />
                                                    ) : null}
                                                    {isCurrent ? tWithFallback('gbpConnected', 'Connected') : tWithFallback('gbpUseListing', 'Use this')}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Integrations;
