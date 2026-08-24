import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QrCode, Upload, Globe, Code2, Layout, MessageSquare, CheckCircle2, Loader2, Copy, Check, FolderOpen } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../Toast';
import { getAllowedContactSources, toggleContactSource } from '../../utils/contactSources.js';
import { importLeadsFromFile } from '../../utils/leadImport.js';
import { useDelayedLoading } from '../../hooks/useDelayedLoading.js';
import { SkeletonLine } from '../SkeletonLoader.jsx';
import { buildCaptureEmbedCode, ensureCaptureAutomationAssets } from '../../utils/captureEmbedCode.js';
import API_URL from '../../config.js';

const ACCEPT = '.csv,.xlsx,.xls,.ods,.txt,.tsv,.vcf';

/**
 * Step 1: contact sources with simple copy, inline list upload, and embed type picker.
 */
export default function WizardSourceStep({
    jobId,
    accentColor,
    contactSources,
    setContactSources,
    embedType,
    setEmbedType,
    uploadedFileName,
    setUploadedFileName,
    listImportedCount,
    setListImportedCount,
    listImporting,
    setListImporting,
    captureAutomationId,
    captureLeadUrl = '',
    onCaptureAssetsReady,
    selectedFolder,
    setSelectedFolder,
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const showImportLoading = useDelayedLoading(listImporting);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [embedProvisioning, setEmbedProvisioning] = useState(false);
    const [existingFolders, setExistingFolders] = useState([]);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const [excelMode, setExcelMode] = useState(() => {
        if (selectedFolder) return 'existing';
        if (uploadedFileName) return 'new';
        return null;
    });

    useEffect(() => {
        const fetchExistingFolders = async () => {
            setFoldersLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/leads/folders`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    // Only show folders that have leads
                    setExistingFolders((data.folders || []).filter(f => f.total > 0));
                }
            } catch (err) {
                console.error('Failed to fetch existing folders in wizard:', err);
            } finally {
                setFoldersLoading(false);
            }
        };
        fetchExistingFolders();
    }, []);

    useEffect(() => {
        if (!foldersLoading && !excelMode) {
            if (selectedFolder) {
                setExcelMode('existing');
            } else if (uploadedFileName) {
                setExcelMode('new');
            }
        }
    }, [foldersLoading, selectedFolder, uploadedFileName, excelMode]);

    const handleSelectExistingFolder = (folder) => {
        if (typeof setSelectedFolder === 'function') {
            setSelectedFolder(folder.name);
        }
        if (typeof setUploadedFileName === 'function') {
            setUploadedFileName(`Folder: ${folder.name}`);
        }
        if (typeof setListImportedCount === 'function') {
            setListImportedCount(folder.total);
        }
        setContactSources((prev) => {
            const next = toggleContactSource(
                prev.includes('excel') ? prev : [...prev, 'excel'],
                'excel',
                jobId,
            );
            return next.includes('excel') ? next : [...next, 'excel'];
        });
    };

    const sources = [
        {
            id: 'qr',
            icon: QrCode,
            titleKey: 'wizSourceTitleQR',
            descKey: 'wizSourceDescQR',
            tagKey: 'wizSourceTagMostPop',
        },
        {
            id: 'excel',
            icon: Upload,
            titleKey: 'wizSourceTitleExcel',
            descKey: 'wizSourceDescExcel',
            tagKey: 'wizSourceTagBulk',
            isUpload: true,
        },
        {
            id: 'website',
            icon: Globe,
            titleKey: 'wizSourceTitleWeb',
            descKey: 'wizSourceDescWeb',
            tagKey: null,
            hide: jobId === 'followup' || jobId === 'review',
        },
    ].filter((s) => !s.hide && getAllowedContactSources(jobId).includes(s.id));

    const websiteSelected = contactSources.includes('website');
    const showEmbedUi = websiteSelected && jobId === 'capture';

    useEffect(() => {
        if (!showEmbedUi || captureAutomationId) return undefined;
        let cancelled = false;
        setEmbedProvisioning(true);
        ensureCaptureAutomationAssets()
            .then((assets) => {
                if (!cancelled && onCaptureAssetsReady) onCaptureAssetsReady(assets);
            })
            .catch(() => {
                if (!cancelled) {
                    toast(
                        t('wizEmbedProvisionFailed') || 'Could not generate your embed code. Refresh and try again.',
                        'error',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setEmbedProvisioning(false);
            });
        return () => {
            cancelled = true;
        };
    }, [showEmbedUi, captureAutomationId, onCaptureAssetsReady, t, toast]);

    const embedCode = useMemo(() => {
        if (!showEmbedUi || !embedType) return '';
        return buildCaptureEmbedCode({
            embedType,
            automationId: captureAutomationId,
            leadUrl: captureLeadUrl,
        });
    }, [showEmbedUi, embedType, captureAutomationId, captureLeadUrl]);
    const embedTypeLabel =
        embedType === 'widget' ? t('wizEmbedWidgetTitle') : t('wizEmbedInlineTitle');

    const copyEmbedCode = async () => {
        if (!embedCode || !captureAutomationId) return;
        try {
            await navigator.clipboard.writeText(embedCode);
            setEmbedCopied(true);
            setTimeout(() => setEmbedCopied(false), 2000);
        } catch {
            toast(t('copyFailed') || 'Could not copy', 'error');
        }
    };

    const selectSource = (id) => {
        setContactSources((prev) => {
            const next = toggleContactSource(prev, id, jobId);
            if (id === 'website' && jobId === 'capture') {
                if (next.includes('website')) {
                    setEmbedType((current) => current || 'inline');
                } else {
                    setEmbedType(null);
                    setEmbedCopied(false);
                }
            }
            return next;
        });
    };

    const pickEmbedType = (type) => {
        setEmbedType(type);
        setEmbedCopied(false);
    };

    const processFile = async (file) => {
        if (!file || listImporting) return;
        setListImporting(true);
        try {
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const cleanFolderName = baseName
                .replace(/[_-]+/g, ' ')
                .trim()
                .replace(/\b\w/g, (c) => c.toUpperCase()) || t('wizImportDefaultFolder');

            const data = await importLeadsFromFile(file, {
                folderName: cleanFolderName,
                source: 'Wizard Import',
                skipCapture: jobId === 'followup',
                importPurpose: jobId === 'followup' ? 'followup' : jobId === 'capture' ? 'capture' : 'review',
            });
            const count = data.imported ?? 0;
            setListImportedCount(count);
            setUploadedFileName(file.name);
            if (typeof setSelectedFolder === 'function') {
                setSelectedFolder(''); // Clear selected folder
            }
            setContactSources((prev) => {
                const next = toggleContactSource(
                    prev.includes('excel') ? prev : [...prev, 'excel'],
                    'excel',
                    jobId,
                );
                return next.includes('excel') ? next : [...next, 'excel'];
            });
        } catch (err) {
            if (err.message === 'no_contacts_found') {
                toast(t('importNoContacts'), 'warning');
            } else {
                toast(err.message || t('csvImportFailed'), 'error');
            }
        } finally {
            setListImporting(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) processFile(file);
    };

    const renderCard = (s) => {
        const selected = contactSources.includes(s.id);
        const Icon = s.icon;
        const cardClass = `wiz-source-card ${selected ? 'active' : ''} ${s.isUpload ? 'wiz-source-card--upload' : ''}`;

        const inner = (
            <>
                <div
                    className="wiz-source-icon"
                    style={{
                        background: selected ? `${accentColor}15` : undefined,
                        color: selected ? accentColor : undefined,
                    }}
                >
                    {showImportLoading && s.isUpload ? (
                        <Loader2 size={28} className="spin" aria-hidden />
                    ) : (
                        <Icon size={28} aria-hidden />
                    )}
                </div>
                <div className="wiz-source-info">
                    <div className="wiz-source-header">
                        <span className="wiz-source-title">{t(s.titleKey)}</span>
                        {s.tagKey ? <span className="wiz-source-tag">{t(s.tagKey)}</span> : null}
                    </div>
                    <p className="wiz-source-desc">
                        {s.isUpload && uploadedFileName
                            ? uploadedFileName
                            : t(s.descKey)}
                    </p>
                    {s.isUpload && listImportedCount > 0 && (
                        <p className="wiz-source-import-ok">
                            <CheckCircle2 size={14} aria-hidden />
                            {t('wizImportSuccess', { n: listImportedCount })}
                        </p>
                    )}
                </div>
                {selected && !showImportLoading && (
                    <CheckCircle2 className="wiz-source-check" size={20} style={{ color: accentColor }} />
                )}
            </>
        );

        return (
            <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                className={cardClass}
                onClick={() => selectSource(s.id)}
                style={{ borderColor: selected ? accentColor : undefined }}
            >
                {inner}
            </button>
        );
    };

    const isExcelOnly = sources.length === 1 && sources[0].id === 'excel';

    return (
        <div className="wiz-source-step">
            <p className="wiz-instruction">{t('wizStep3Sub')}</p>
            {!isExcelOnly && (
                <p className="wiz-instruction wiz-instruction--muted">{t('wizSourceMultiHint')}</p>
            )}

            {!isExcelOnly && (
                <div className={`wiz-source-grid wiz-source-grid--${sources.length}`}>
                    {sources.map(renderCard)}
                </div>
            )}

            {contactSources.includes('excel') && (
                <div 
                    className={isExcelOnly ? "animate-slide-up" : "wiz-existing-folders-section animate-slide-up"} 
                    style={isExcelOnly ? { marginTop: '1.5rem' } : { marginTop: '1.5rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                >
                    {!isExcelOnly && (
                        <h4 className="wiz-existing-folders-title" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                            {t('wizExcelOptionTitle') || 'Excel / CSV List Source'}
                        </h4>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {excelMode === null ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.25rem', maxWidth: '560px' }}>
                                <button
                                    type="button"
                                    onClick={() => setExcelMode('new')}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        padding: '1.5rem 1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = accentColor;
                                        e.currentTarget.style.backgroundColor = `${accentColor}05`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: `${accentColor}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: accentColor
                                    }}>
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('wizUploadNewFileOption') || 'Upload new file'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t('wizUploadNewFileDesc') || 'Import from .csv, .xlsx, etc.'}</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setExcelMode('existing')}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        padding: '1.5rem 1rem',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--card-bg)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'center',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = accentColor;
                                        e.currentTarget.style.backgroundColor = `${accentColor}05`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: `${accentColor}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: accentColor
                                    }}>
                                        <FolderOpen size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('wizSelectExistingOption') || 'Select previous files'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t('wizSelectExistingDesc') || 'Choose from lists already uploaded'}</div>
                                    </div>
                                </button>
                            </div>
                        ) : excelMode === 'new' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <label className="wiz-upload-new-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                                        <Upload size={16} />
                                        {t('wizUploadNewFile') || 'Upload new file'}
                                        <input
                                            type="file"
                                            className="wiz-source-file-input"
                                            style={{ display: 'none' }}
                                            accept={ACCEPT}
                                            onChange={onFileChange}
                                            disabled={listImporting}
                                        />
                                    </label>
                                    {uploadedFileName && !selectedFolder && (
                                        <span className="wiz-upload-success-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'rgba(34, 197, 94, 0.08)', color: '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(34, 197, 94, 0.2)', maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                            <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                                            <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{uploadedFileName} ({listImportedCount} contacts)</span>
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExcelMode('existing');
                                            if (typeof setSelectedFolder === 'function') setSelectedFolder('');
                                            if (typeof setUploadedFileName === 'function') setUploadedFileName('');
                                            if (typeof setListImportedCount === 'function') setListImportedCount(0);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: accentColor,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: 0
                                        }}
                                    >
                                        <FolderOpen size={12} />
                                        {t('wizSelectExistingInstead') || 'Select previous files instead'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem', maxWidth: '480px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                                        {t('wizOrSelectExisting') || 'Select a list you already uploaded:'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExcelMode('new');
                                            if (typeof setSelectedFolder === 'function') setSelectedFolder('');
                                            if (typeof setUploadedFileName === 'function') setUploadedFileName('');
                                            if (typeof setListImportedCount === 'function') setListImportedCount(0);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: accentColor,
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: 0
                                        }}
                                    >
                                        <Upload size={12} />
                                        {t('wizUploadNewInstead') || 'Upload a new file instead'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '480px' }}>
                                    {existingFolders.length === 0 ? (
                                        <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg)', textAlign: 'center' }}>
                                            {t('wizNoPreviousFolders') || 'No previous lists found. Upload a new file first.'}
                                        </div>
                                    ) : (
                                        existingFolders.map((folder) => {
                                            const isSelected = selectedFolder === folder.name;
                                            return (
                                                <button
                                                    key={folder.name}
                                                    type="button"
                                                    className={`wiz-folder-option-btn ${isSelected ? 'active' : ''}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: isSelected ? `1.5px solid ${accentColor}` : '1px solid var(--border-color)',
                                                        backgroundColor: isSelected ? `${accentColor}08` : 'var(--card-bg)',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        width: '100%',
                                                    }}
                                                    onClick={() => handleSelectExistingFolder(folder)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                                        <FolderOpen
                                                            size={18}
                                                            style={{ color: isSelected ? accentColor : 'var(--text-secondary)' }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {folder.name}
                                                            </p>
                                                            <p style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                                {folder.total} {folder.total === 1 ? 'contact' : 'contacts'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 size={16} style={{ color: accentColor, flexShrink: 0 }} />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showEmbedUi && (
                <div className="wiz-embed-type-block animate-slide-up">
                    <div className="wiz-embed-type-head">
                        <Code2 size={18} aria-hidden style={{ color: accentColor }} />
                        <h3 className="wiz-embed-type-title">{t('wizEmbedTypeTitle')}</h3>
                    </div>
                    <div className="wiz-embed-type-grid">
                        <button
                            type="button"
                            className={`wiz-embed-type-card ${embedType === 'inline' ? 'is-active' : ''}`}
                            style={embedType === 'inline' ? { borderColor: accentColor } : undefined}
                            onClick={() => pickEmbedType('inline')}
                        >
                            <Layout size={22} aria-hidden />
                            <span className="wiz-embed-type-name">{t('wizEmbedInlineTitle')}</span>
                            <span className="wiz-embed-type-desc">{t('wizEmbedInlineDesc')}</span>
                        </button>
                        <button
                            type="button"
                            className={`wiz-embed-type-card ${embedType === 'widget' ? 'is-active' : ''}`}
                            style={embedType === 'widget' ? { borderColor: accentColor } : undefined}
                            onClick={() => pickEmbedType('widget')}
                        >
                            <MessageSquare size={22} aria-hidden />
                            <span className="wiz-embed-type-name">{t('wizEmbedWidgetTitle')}</span>
                            <span className="wiz-embed-type-desc">{t('wizEmbedWidgetDesc')}</span>
                        </button>
                    </div>

                    {embedType && (
                        <div
                            className="wiz-embed-panel"
                            style={{ borderColor: `${accentColor}30` }}
                            aria-live="polite"
                        >
                            <h4 className="wiz-embed-panel-title">
                                {t('wizEmbedCodeTitle')}
                                <span className="wiz-embed-panel-type"> — {embedTypeLabel}</span>
                            </h4>
                            <pre key={embedType} className="wiz-embed-code">
                                {embedProvisioning ? (
                                    <span className="wiz-embed-provisioning">
                                        <Loader2 size={14} className="wiz-embed-spin" aria-hidden />
                                        {t('wizEmbedLoading') || 'Generating your embed code…'}
                                    </span>
                                ) : (
                                    embedCode
                                )}
                            </pre>
                            <div className="wiz-embed-panel-actions">
                                <button
                                    type="button"
                                    className="wiz-embed-copy-btn"
                                    onClick={copyEmbedCode}
                                    disabled={embedProvisioning || !captureAutomationId || !embedCode}
                                    style={{ borderColor: accentColor, color: accentColor }}
                                >
                                    {embedCopied ? (
                                        <>
                                            <Check size={14} aria-hidden />
                                            {t('cfgCopied')}
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} aria-hidden />
                                            {t('cfgCopyCode')}
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="wiz-embed-panel-hint">{t('wizEmbedCodeHint')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/** Skeleton for wizard step 1 cards */
export function WizardSourceStepSkeleton() {
    return (
        <div className="wiz-source-step wiz-source-step--loading" aria-busy="true">
            <div className="wiz-skel-line wiz-skel-instruction" />
            <div className="wiz-skel-line wiz-skel-instruction-short" />
            <div className="wiz-source-grid wiz-source-grid--2">
                {[1, 2].map((i) => (
                    <div key={i} className="wiz-source-card wiz-source-card--skel">
                        <SkeletonLine width={52} height={52} style={{ borderRadius: 'var(--radius-md)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <SkeletonLine width="55%" height={14} />
                            <SkeletonLine width="90%" height={12} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
