import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Loader2, FolderOpen, FolderPlus, MessageSquare, CheckCircle2, Users, SkipForward, ChevronDown } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { normalizeLeadGroup } from '../constants/leadGroups.js';
import { importLeadsFromFile } from '../utils/leadImport.js';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';
import API_URL from '../config.js';
import './LeadFolderImportModal.css';

/**
 * Two-step import: name the list (folder) → upload file.
 */
export default function LeadFolderImportModal({
    open,
    onClose,
    onSuccess,
    importSource = 'Excel Upload',
    skipCapture = false,
    hideFollowupMessage = false,
    importPurpose,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [step, setStep] = useState('folder');
    const [folderName, setFolderName] = useState('');
    const [followupMessage, setFollowupMessage] = useState('');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [existingFolders, setExistingFolders] = useState([]);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const [folderMode, setFolderMode] = useState('existing');
    const [selectedFolder, setSelectedFolder] = useState('');
    const showImportLoading = useDelayedLoading(importing);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setFoldersLoading(true);
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/leads/folders`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const names = (data?.folders || [])
                    .map((f) => f.name)
                    .filter(Boolean);
                setExistingFolders(names);
                setFolderMode(names.length > 0 ? 'existing' : 'new');
                if (names.length > 0) setSelectedFolder((prev) => prev || names[0]);
            })
            .catch(() => {
                if (!cancelled) setFolderMode('new');
            })
            .finally(() => {
                if (!cancelled) setFoldersLoading(false);
            });
        return () => { cancelled = true; };
    }, [open]);

    if (!open) return null;

    const ACCEPTED_EXTS = ['.csv', '.xlsx', '.xls', '.ods', '.txt', '.tsv', '.vcf'];
    const ACCEPTED_MIME = [
        'text/csv', 'text/plain', 'text/tab-separated-values',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet',
        'text/vcard', 'text/x-vcard',
    ];

    const reset = () => {
        setStep('folder');
        setFolderName('');
        setFollowupMessage('');
        setError('');
        setImporting(false);
        setImportResult(null);
        setDragOver(false);
        setFolderMode(existingFolders.length > 0 ? 'existing' : 'new');
        setSelectedFolder(existingFolders[0] || '');
    };

    const handleClose = () => {
        if (importing) return;
        reset();
        onClose();
    };

    const resolvedName = () =>
        folderMode === 'existing' ? selectedFolder : normalizeLeadGroup(folderName);
    const canContinue =
        folderMode === 'existing' ? selectedFolder.trim().length > 0 : folderName.trim().length > 0;

    const processFile = async (file) => {
        if (!file) return;
        setImporting(true);
        setError('');
        try {
            const data = await importLeadsFromFile(file, {
                folderName: resolvedName(),
                followupMessage: hideFollowupMessage ? undefined : followupMessage,
                source: importSource,
                skipCapture,
                importPurpose: importPurpose || (skipCapture ? 'followup' : 'capture'),
            });
            onSuccess?.(data);
            const folder = resolvedName();
            const imported = data.imported ?? 0;
            if (imported > 0 && folder) {
                reset();
                onClose();
                navigate(`/dashboard/leads?folder=${encodeURIComponent(folder)}`);
                return;
            }
            setImportResult({
                imported,
                fileDups: data.fileDups ?? 0,
                dbDups: data.dbDups ?? 0,
                folderName: folder,
            });
            setStep('success');
        } catch (err) {
            const READ_ERRORS = ['csv_read_error', 'xlsx_read_error', 'vcf_read_error', 'file_read_error'];
            if (err.message === 'no_contacts_found') {
                setError(t('importNoContacts'));
            } else if (READ_ERRORS.includes(err.message) || err.message === 'unsupported_file_type') {
                setError(t('csvReadError'));
            } else {
                setError(err.message || t('csvImportFailed'));
            }
        } finally {
            setImporting(false);
        }
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = null;
        processFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (importing) return;
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_EXTS.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
            setError(t('csvReadError'));
            return;
        }
        processFile(file);
    };

    return createPortal(
        <div className="lead-import-overlay" onClick={handleClose} role="presentation">
            <div
                className="lead-import-modal"
                onClick={(ev) => ev.stopPropagation()}
                role="dialog"
                aria-labelledby="lead-import-title"
                aria-modal="true"
            >
                <header className="lead-import-header">
                    <div className="lead-import-header-icon" aria-hidden>
                        <FolderOpen size={22} />
                    </div>
                    <div className="lead-import-header-text">
                        <h2 id="lead-import-title" className="lead-import-title">
                            {step === 'folder' ? t('leadFolderNameTitle') : t('importStepUploadTitle')}
                        </h2>
                        <p className="lead-import-subtitle">
                            {step === 'folder'
                                ? t('leadFolderNameSub')
                                : t('importStepUploadSub', { group: resolvedName() })}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="lead-import-close"
                        onClick={handleClose}
                        disabled={importing}
                        aria-label={t('cancel')}
                    >
                        <X size={20} />
                    </button>
                </header>

                <nav className="lead-import-steps" aria-label="Import progress" style={{ display: step === 'success' ? 'none' : undefined }}>
                    <div className={`lead-import-step ${step === 'folder' ? 'is-active' : 'is-done'}`}>
                        <span className="lead-import-step-badge">1</span>
                        <span className="lead-import-step-label">{t('leadImportStepName')}</span>
                    </div>
                    <div className="lead-import-step-connector" aria-hidden />
                    <div className={`lead-import-step ${step === 'upload' ? 'is-active' : ''}`}>
                        <span className="lead-import-step-badge">2</span>
                        <span className="lead-import-step-label">{t('leadImportStepUpload')}</span>
                    </div>
                </nav>

                <div className="lead-import-body">
                    {step === 'success' && importResult ? (
                        <div className="lead-import-success">
                            <div className="lead-import-success-icon">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="lead-import-success-title">
                                {importResult.imported > 0
                                    ? t('importSuccessTitle', { n: importResult.imported }) || `${importResult.imported} contacto${importResult.imported !== 1 ? 's' : ''} importado${importResult.imported !== 1 ? 's' : ''}`
                                    : t('importSuccessNoneTitle') || 'Lista procesada'}
                            </h3>
                            <p className="lead-import-success-sub">
                                {t('importSuccessSub') || 'Tu empleado comenzará a enviar messages en breve.'}
                            </p>
                            <div className="lead-import-success-stats">
                                <div className="lead-import-stat">
                                    <Users size={16} />
                                    <span><strong>{importResult.imported}</strong> {t('importStatNew') || 'nuevos'}</span>
                                </div>
                                {(importResult.fileDups + importResult.dbDups) > 0 && (
                                    <div className="lead-import-stat lead-import-stat--muted">
                                        <SkipForward size={16} />
                                        <span><strong>{importResult.fileDups + importResult.dbDups}</strong> {t('importStatSkipped') || 'duplicados omitidos'}</span>
                                    </div>
                                )}
                            </div>
                            <div className="lead-import-success-folder">
                                <FolderOpen size={14} />
                                <span>{importResult.folderName}</span>
                            </div>
                            <button
                                type="button"
                                className="lead-import-cta"
                                onClick={() => {
                                    const folder = importResult.folderName;
                                    reset();
                                    onClose();
                                    if (importResult.imported > 0 && folder) {
                                        navigate(`/dashboard/leads?folder=${encodeURIComponent(folder)}`);
                                    }
                                }}
                            >
                                {importResult.imported > 0
                                    ? (t('importViewLeads') || 'View in Leads')
                                    : (t('importSuccessDone') || 'Done')}
                            </button>
                        </div>
                    ) : step === 'folder' ? (
                        <>
                            {foldersLoading ? (
                                <div className="lead-import-field">
                                    <Loader2 size={18} className="animate-spin" aria-hidden />
                                </div>
                            ) : existingFolders.length > 0 ? (
                                <div className="lead-import-field">
                                    <label className="lead-import-label">{t('leadImportModeLabel')}</label>
                                    <div className="lead-import-chips">
                                        <button
                                            type="button"
                                            className={`lead-import-chip${folderMode === 'existing' ? ' is-active' : ''}`}
                                            onClick={() => setFolderMode('existing')}
                                        >
                                            <FolderOpen size={14} aria-hidden style={{ marginRight: '0.35rem' }} />
                                            {t('leadImportModeExisting')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`lead-import-chip${folderMode === 'new' ? ' is-active' : ''}`}
                                            onClick={() => setFolderMode('new')}
                                        >
                                            <FolderPlus size={14} aria-hidden style={{ marginRight: '0.35rem' }} />
                                            {t('leadImportModeNew')}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {folderMode === 'existing' && existingFolders.length > 0 ? (
                                <div className="lead-import-field">
                                    <label htmlFor="lead-folder-select" className="lead-import-label">
                                        {t('leadImportSelectFolderLabel')}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            id="lead-folder-select"
                                            className="lead-import-input"
                                            value={selectedFolder}
                                            onChange={(e) => setSelectedFolder(e.target.value)}
                                            style={{ appearance: 'none', cursor: 'pointer', paddingRight: '2.25rem' }}
                                        >
                                            {existingFolders.map((name) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={16}
                                            aria-hidden
                                            style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }}
                                        />
                                    </div>
                                    <p className="lead-import-preview">
                                        <FolderOpen size={14} aria-hidden />
                                        {t('leadImportFolderPreview', { name: resolvedName() })}
                                    </p>
                                </div>
                            ) : (
                                <div className="lead-import-field">
                                    <label htmlFor="lead-folder-name" className="lead-import-label">
                                        {t('leadFolderNameLabel')}
                                    </label>
                                    <input
                                        id="lead-folder-name"
                                        type="text"
                                        className="lead-import-input"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        placeholder={t('leadFolderNamePlaceholder')}
                                        maxLength={100}
                                        autoFocus
                                    />
                                    {folderName.trim() && (
                                        <p className="lead-import-preview">
                                            <FolderOpen size={14} aria-hidden />
                                            {t('leadImportFolderPreview', { name: resolvedName() })}
                                        </p>
                                    )}
                                </div>
                            )}
                            {folderMode === 'new' && (
                                <p className="lead-import-hint">{t('leadFolderNameHint')}</p>
                            )}

                            {!hideFollowupMessage && (
                                <div className="lead-import-field lead-import-field--message">
                                    <label htmlFor="lead-folder-message" className="lead-import-label">
                                        <MessageSquare size={14} aria-hidden />
                                        {t('leadFolderMessageLabel')}
                                        <span className="lead-import-optional">{t('leadImportOptional')}</span>
                                    </label>
                                    <textarea
                                        id="lead-folder-message"
                                        className="lead-import-textarea"
                                        value={followupMessage}
                                        onChange={(e) => setFollowupMessage(e.target.value)}
                                        placeholder={t('leadFolderMessagePlaceholder')}
                                        rows={3}
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                className="lead-import-cta"
                                disabled={!canContinue}
                                onClick={() => setStep('upload')}
                            >
                                {t('importContinueToUpload')}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="lead-import-folder-banner">
                                <FolderOpen size={18} aria-hidden />
                                <span className="lead-import-folder-banner-name">{resolvedName()}</span>
                                <button
                                    type="button"
                                    className="lead-import-folder-banner-edit"
                                    disabled={importing}
                                    onClick={() => setStep('folder')}
                                >
                                    {t('importChangeGroup')}
                                </button>
                            </div>

                            {error && (
                                <p className="lead-import-error" role="alert">{error}</p>
                            )}

                            <button
                                type="button"
                                className={`lead-import-dropzone${dragOver ? ' is-drag-over' : ''}`}
                                disabled={importing}
                                onClick={() => !importing && fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); if (!importing) setDragOver(true); }}
                                onDragEnter={(e) => { e.preventDefault(); if (!importing) setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                <span className="lead-import-dropzone-icon">
                                    {showImportLoading ? (
                                        <Loader2 size={28} className="animate-spin" aria-hidden />
                                    ) : (
                                        <Upload size={28} />
                                    )}
                                </span>
                                <span className="lead-import-dropzone-title">
                                    {importing
                                        ? t('importReadingFile')
                                        : dragOver
                                            ? (t('importDropNow') || 'Drop to import')
                                            : t('importChooseFile')}
                                </span>
                                <span className="lead-import-dropzone-hint">
                                    CSV, Excel, TXT, TSV, VCF, ODS
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="sr-only"
                                    accept=".csv,.xlsx,.xls,.ods,.txt,.tsv,.vcf"
                                    onChange={handleFile}
                                />
                            </button>

                            <button
                                type="button"
                                className="lead-import-back"
                                disabled={importing}
                                onClick={() => setStep('folder')}
                            >
                                {t('importBackToGroup')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
