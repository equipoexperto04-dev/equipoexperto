import React, { useEffect, useMemo, useState } from 'react';
import {
    X, QrCode, Upload, Globe, Copy, Check, Download, ExternalLink, Loader2,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from './Toast';
import LeadFolderImportModal from './LeadFolderImportModal.jsx';
import { downloadDataUrl } from '../utils/employeeUseAssets.js';
import { buildCaptureEmbedCode } from '../utils/captureEmbedCode.js';
import './EmployeeUsePanel.css';

const MODE_META = {
    qr: { icon: QrCode, labelKey: 'wizSourceTitleQR', descKey: 'galleryUseQrDesc' },
    excel: { icon: Upload, labelKey: 'wizSourceTitleExcel', descKey: 'galleryUseUploadDesc' },
    website: { icon: Globe, labelKey: 'wizSourceTitleWeb', descKey: 'galleryUseEmbedDesc' },
};

export default function EmployeeUsePanel({ open, onClose, job, assets, loading, accent = '#3b82f6' }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [mode, setMode] = useState('qr');
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [embedType, setEmbedType] = useState('inline');

    const modes = useMemo(() => {
        if (!assets?.sources?.length) return ['excel'];
        const order = ['qr', 'excel', 'website'];
        return order.filter((m) => assets.sources.includes(m));
    }, [assets]);

    useEffect(() => {
        if (!open) return;
        setCopiedUrl(false);
        setCopiedEmbed(false);
        if (modes.length) setMode(modes[0]);
        if (assets?.captureEmbedType) setEmbedType(assets.captureEmbedType);
    }, [open, modes.join(','), assets?.captureEmbedType]);

    const liveEmbedCode = useMemo(() => {
        if (job?.id !== 'capture' || !assets?.automationId) return '';
        return buildCaptureEmbedCode({
            embedType,
            automationId: assets.automationId,
            leadUrl: assets.url,
        });
    }, [job?.id, assets?.automationId, assets?.url, embedType]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || !job) return null;

    const title = t(job.titleKey);
    const copyText = async (text, which) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            if (which === 'url') {
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
            } else {
                setCopiedEmbed(true);
                setTimeout(() => setCopiedEmbed(false), 2000);
            }
            toast(t('cfgCopied'), 'success');
        } catch {
            toast(t('automationUpdateError'), 'error');
        }
    };

    const onImportSuccess = (data) => {
        setShowImport(false);
        const n = data.imported ?? 0;
        if (n > 0) {
            toast(t('galleryUseImportDone', { count: n }), 'success');
            localStorage.setItem('glowLeads', 'true');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('triggerLeadsGlow'));
        } else {
            toast(t('galleryUseImportNone'), 'info');
        }
    };

    const qrFilename =
        job.id === 'review' ? 'review-form-qr.png' : job.id === 'capture' ? 'lead-form-qr.png' : 'qr.png';

    return (
        <>
            <div className="emp-use-backdrop" onClick={onClose} aria-hidden />
            <div
                className="emp-use-panel"
                role="dialog"
                aria-labelledby="emp-use-title"
                style={{ '--emp-use-accent': accent }}
            >
                <header className="emp-use-header">
                    <div>
                        <p className="emp-use-kicker">{t('galleryUseKicker')}</p>
                        <h2 id="emp-use-title" className="emp-use-title">
                            <span className="emp-use-emoji" aria-hidden>{job.emoji}</span>
                            {title}
                        </h2>
                        <p className="emp-use-sub">{t('galleryUseSubtitle')}</p>
                    </div>
                    <button type="button" className="emp-use-close" onClick={onClose} aria-label={t('close')}>
                        <X size={20} />
                    </button>
                </header>

                {loading ? (
                    <div className="emp-use-loading">
                        <Loader2 size={28} className="emp-use-spin" />
                        <span>{t('galleryUseLoading')}</span>
                    </div>
                ) : !assets ? (
                    <div className="emp-use-empty">
                        <p>{t('galleryUseNotReady')}</p>
                        <button type="button" className="emp-use-primary" onClick={onClose}>
                            {t('close')}
                        </button>
                    </div>
                ) : (
                    <>
                        {modes.length > 1 && (
                            <div className="emp-use-tabs" role="tablist">
                                {modes.map((m) => {
                                    const Meta = MODE_META[m];
                                    const Icon = Meta.icon;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            role="tab"
                                            aria-selected={mode === m}
                                            className={`emp-use-tab ${mode === m ? 'emp-use-tab--active' : ''}`}
                                            onClick={() => setMode(m)}
                                        >
                                            <Icon size={16} />
                                            {t(Meta.labelKey)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="emp-use-body">
                            {mode === 'qr' && (
                                <section className="emp-use-section">
                                    <p className="emp-use-section-desc">{t('galleryUseQrDesc')}</p>
                                    {assets.qrCode && assets.url ? (
                                        <div className="emp-use-qr-row">
                                            <button
                                                type="button"
                                                className="emp-use-qr-box"
                                                onClick={() => downloadDataUrl(assets.qrCode, qrFilename)}
                                                title={t('galleryUseDownloadQr')}
                                            >
                                                <img src={assets.qrCode} alt="" />
                                                <span className="emp-use-qr-overlay">
                                                    <Download size={18} />
                                                    {t('galleryUseDownloadQr')}
                                                </span>
                                            </button>
                                            <div className="emp-use-link-col">
                                                <label className="emp-use-label">{t('galleryUsePublicLink')}</label>
                                                <div className="emp-use-url-row">
                                                    <input readOnly value={assets.url} className="emp-use-url-input" />
                                                    <button
                                                        type="button"
                                                        className="emp-use-icon-btn"
                                                        onClick={() => copyText(assets.url, 'url')}
                                                    >
                                                        {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                    <a
                                                        href={assets.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="emp-use-icon-btn emp-use-icon-btn--ghost"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                </div>
                                                <p className="emp-use-hint">{t('galleryUseQrHint')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="emp-use-warn">{t('cfgSaveToGenQR')}</p>
                                    )}
                                </section>
                            )}

                            {mode === 'excel' && (
                                <section className="emp-use-section">
                                    <p className="emp-use-section-desc">
                                        {job.id === 'followup'
                                            ? t('cfgUploadContactsFollowup')
                                            : t('galleryUseUploadDesc')}
                                    </p>
                                    <button
                                        type="button"
                                        className="emp-use-drop"
                                        onClick={() => setShowImport(true)}
                                    >
                                        <Upload size={32} strokeWidth={1.75} />
                                        <span className="emp-use-drop-title">{t('cfgUploadContactList')}</span>
                                        <span className="emp-use-drop-hint">{t('cfgDropContactList')}</span>
                                    </button>
                                </section>
                            )}

                            {mode === 'website' && (
                                <section className="emp-use-section">
                                    <p className="emp-use-section-desc">{t('galleryUseEmbedDesc')}</p>
                                    {job.id === 'capture' ? (
                                        <>
                                            <p className="emp-use-embed-type-label">{t('wizEmbedTypeTitle')}</p>
                                            <div className="emp-use-embed-type-grid">
                                                <button
                                                    type="button"
                                                    className={`emp-use-embed-type-card ${embedType === 'inline' ? 'is-active' : ''}`}
                                                    onClick={() => {
                                                        setEmbedType('inline');
                                                        setCopiedEmbed(false);
                                                    }}
                                                >
                                                    <span className="emp-use-embed-type-name">
                                                        {t('wizEmbedInlineTitle')}
                                                    </span>
                                                    <span className="emp-use-embed-type-desc">
                                                        {t('wizEmbedInlineDesc')}
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`emp-use-embed-type-card ${embedType === 'widget' ? 'is-active' : ''}`}
                                                    onClick={() => {
                                                        setEmbedType('widget');
                                                        setCopiedEmbed(false);
                                                    }}
                                                >
                                                    <span className="emp-use-embed-type-name">
                                                        {t('wizEmbedWidgetTitle')}
                                                    </span>
                                                    <span className="emp-use-embed-type-desc">
                                                        {t('wizEmbedWidgetDesc')}
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    ) : null}
                                    {liveEmbedCode ? (
                                        <div className="emp-use-embed-block" aria-live="polite">
                                            <p className="emp-use-embed-code-label">
                                                {t('wizEmbedCodeTitle')}
                                                {job.id === 'capture' && (
                                                    <>
                                                        {' — '}
                                                        {embedType === 'widget'
                                                            ? t('wizEmbedWidgetTitle')
                                                            : t('wizEmbedInlineTitle')}
                                                    </>
                                                )}
                                            </p>
                                            <pre key={embedType} className="emp-use-embed">
                                                {liveEmbedCode}
                                            </pre>
                                            <button
                                                type="button"
                                                className="emp-use-primary"
                                                onClick={() => copyText(liveEmbedCode, 'embed')}
                                            >
                                                {copiedEmbed ? <Check size={16} /> : <Copy size={16} />}
                                                {t('galleryUseCopyEmbed')}
                                            </button>
                                            <p className="emp-use-hint">{t('wizEmbedCodeHint')}</p>
                                        </div>
                                    ) : (
                                        <p className="emp-use-warn">{t('galleryUseEmbedMissing')}</p>
                                    )}
                                </section>
                            )}
                        </div>
                    </>
                )}
            </div>

            <LeadFolderImportModal
                open={showImport}
                onClose={() => setShowImport(false)}
                onSuccess={onImportSuccess}
                importSource={
                    job.id === 'review'
                        ? 'Review Funnel Import'
                        : job.id === 'capture'
                          ? 'Lead Capture Import'
                          : 'Gallery'
                }
                skipCapture={job.id !== 'capture'}
                importPurpose={job.id === 'followup' ? 'followup' : job.id === 'capture' ? 'capture' : 'review'}
                hideFollowupMessage={job.id === 'review' || job.id === 'capture'}
            />
        </>
    );
}
