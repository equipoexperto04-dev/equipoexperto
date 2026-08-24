import React, { useEffect, useRef, useState } from 'react';
import { Globe, Edit3, Trash2, X, PlayCircle, Loader, CheckCircle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';

// ── YouTube tutorial video ID ──────────────────────────────────────────────
// Replace with your own tutorial video showing how to get a Google review link
const REVIEW_TUTORIAL_YOUTUBE_ID = 'Q9GQ2xC9cc4';

// ── Helpers ────────────────────────────────────────────────────────────────

const getUserBusinessQuery = () => {
    try {
        const raw = JSON.parse(localStorage.getItem('user_profile') || '{}');
        return String(raw.company_name || raw.name || '').trim();
    } catch {
        return '';
    }
};

// ── Component ──────────────────────────────────────────────────────────────

const GoogleReviewLinkSearch = ({ value, onChange, disabled, className }) => {
    const { tWithFallback } = useTranslation();

    // The text the user is typing / has typed
    const [draft, setDraft] = useState(value || '');

    // Auto-fill states
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [autoFillSuccess, setAutoFillSuccess] = useState(false);

    // Whether the user has confirmed/saved a link (shows the "Connected" card)
    const [confirmed, setConfirmed] = useState(!!value);
    const [connectedName, setConnectedName] = useState(
        () => localStorage.getItem('mm_selected_google_business') || ''
    );

    // Help modal
    const [showHelp, setShowHelp] = useState(false);

    const attemptedRef = useRef(false);

    // ── Keep draft in sync if parent changes value externally ──────────────
    useEffect(() => {
        if (value && value !== draft) {
            setDraft(value);
            setConfirmed(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // ── Auto-fill via backend (runs once on mount when value is empty) ─────
    useEffect(() => {
        if (value || disabled || attemptedRef.current) return;
        attemptedRef.current = true;

        let alive = true;
        (async () => {
            setIsAutoFilling(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await fetch(`${API_URL}/api/integrations/google/review-link`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));

                if (!alive) return;

                if (res.ok && data?.success && data?.reviewUrl) {
                    const name = data.businessName || getUserBusinessQuery() || '';
                    setDraft(data.reviewUrl);
                    setConnectedName(name);
                    if (name) localStorage.setItem('mm_selected_google_business', name);
                    setConfirmed(true);
                    setAutoFillSuccess(true);
                    onChange(data.reviewUrl);
                }
            } catch {
                // silently ignore – user can paste manually
            } finally {
                if (alive) setIsAutoFilling(false);
            }
        })();

        return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleConfirm = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        onChange(trimmed);
        setConfirmed(true);
    };

    const handleEdit = () => {
        setConfirmed(false);
        setAutoFillSuccess(false);
    };

    const handleClear = () => {
        setDraft('');
        setConfirmed(false);
        setAutoFillSuccess(false);
        setConnectedName('');
        localStorage.removeItem('mm_selected_google_business');
        onChange('');
    };

    const handleDraftChange = (e) => {
        setDraft(e.target.value);
        // If the user clears the field, also clear the parent value
        if (!e.target.value) onChange('');
    };

    // ── Help Modal ─────────────────────────────────────────────────────────

    const HelpModal = () => (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                padding: '1rem'
            }}
            onClick={() => setShowHelp(false)}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    maxWidth: '580px',
                    width: '100%',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlayCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {tWithFallback('wizHelpModalTitle', 'How to find your Google review link')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowHelp(false)}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            padding: '0.25rem', borderRadius: '6px',
                            display: 'flex', alignItems: 'center'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* YouTube Embed (responsive 16:9) */}
                <div style={{
                    position: 'relative', width: '100%', paddingBottom: '56.25%',
                    borderRadius: '10px', overflow: 'hidden', background: '#000'
                }}>
                    <iframe
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        src={`https://www.youtube.com/embed/${REVIEW_TUTORIAL_YOUTUBE_ID}?rel=0&modestbranding=1`}
                        title="How to get your Google Maps review link"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Steps */}
                <div style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: '10px', padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem'
                }}>
                    <p style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                        {tWithFallback('wizHelpStepsTitle', 'Quick steps')}
                    </p>
                    {[
                        tWithFallback('wizHelpStep1', 'Go to Google Maps and search your business name'),
                        tWithFallback('wizHelpStep2', 'Click on your business listing'),
                        tWithFallback('wizHelpStep3', 'Scroll down and click "Get more reviews"'),
                        tWithFallback('wizHelpStep4', 'Copy the link shown — then paste it in the field and click Save')
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <div style={{
                                minWidth: '22px', height: '22px', borderRadius: '50%',
                                background: 'var(--accent-color)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                            }}>{i + 1}</div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{step}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.65rem 1rem', background: 'var(--accent-color)', color: '#fff',
                        borderRadius: '8px', textDecoration: 'none', fontWeight: 600,
                        fontSize: '0.85rem', transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <Globe size={15} />
                    {tWithFallback('wizOpenGoogleMaps', 'Open Google Maps')}
                </a>
            </div>
        </div>
    );

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <>
            {showHelp && <HelpModal />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>

                {/* ── Auto-fill loading banner ── */}
                {isAutoFilling && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.75rem', borderRadius: '8px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        fontSize: '0.78rem', color: 'var(--text-secondary)'
                    }}>
                        <Loader size={13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                        {tWithFallback('wizAutoFindingReviewLink', 'Looking for your Google review link...')}
                    </div>
                )}

                {/* ── Auto-fill success banner ── */}
                {autoFillSuccess && confirmed && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.75rem', borderRadius: '8px',
                        background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                        fontSize: '0.78rem', color: '#16a34a'
                    }}>
                        <CheckCircle size={13} style={{ flexShrink: 0 }} />
                        {tWithFallback('wizAutoFillSuccess', 'Review link found automatically!')}
                    </div>
                )}

                {/* ── Confirmed / connected card ── */}
                {confirmed && value ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.75rem 1rem', borderRadius: '8px',
                        border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                        width: '100%', boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden', marginRight: '0.5rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tWithFallback('wizConnectedBusiness', 'Review link saved')}
                            </span>
                            {connectedName && (
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {connectedName}
                                </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {value}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                            <button
                                type="button"
                                onClick={handleEdit}
                                title={tWithFallback('wizEditLinkManually', 'Edit')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <Edit3 size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                title={tWithFallback('wizRemoveLink', 'Remove')}
                                style={{ background: 'none', border: 'none', color: '#ef4444', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Input + Save row ── */
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', width: '100%' }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Globe size={15} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)', pointerEvents: 'none', flexShrink: 0 }} />
                            <input
                                type="url"
                                disabled={disabled}
                                autoComplete="off"
                                spellCheck={false}
                                style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', width: '100%', boxSizing: 'border-box' }}
                                className={className || 'input-field'}
                                placeholder={tWithFallback('wizGoogleReviewPlaceholder', 'Paste your Google review link here...')}
                                value={draft}
                                onChange={handleDraftChange}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); } }}
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!draft.trim() || disabled}
                            onClick={handleConfirm}
                            style={{
                                padding: '0 1rem',
                                background: draft.trim() ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                color: draft.trim() ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                cursor: draft.trim() ? 'pointer' : 'default',
                                whiteSpace: 'nowrap',
                                transition: 'background 0.15s, color 0.15s',
                                flexShrink: 0
                            }}
                        >
                            {tWithFallback('wizSaveLink', 'Save')}
                        </button>
                    </div>
                )}

                {/* ── Bottom row: help link ── */}
                {!isAutoFilling && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setShowHelp(true)}
                            style={{
                                background: 'none', border: 'none',
                                color: 'var(--accent-color)', fontSize: '0.73rem',
                                fontWeight: 600, cursor: 'pointer', padding: '0.1rem 0',
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                opacity: 0.85
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
                        >
                            <PlayCircle size={12} />
                            {tWithFallback('wizFindReviewLinkHelper', 'Where do I find this link?')}
                        </button>
                    </div>
                )}
            </div>

            {/* Spinner keyframe (injected once) */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    );
};

export default GoogleReviewLinkSearch;
