import React from 'react';
import {
    Edit2, Save, Play, Pause, Copy, Trash2, TrendingUp,
    Loader2, Copy as CopyIcon, Check, ExternalLink, QrCode, Upload, Users2, Zap, Code2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useEmployeeActivityStats } from '../../hooks/useEmployeeActivityStats';
import '../wizard/WizardPlatform.css';
import './EmployeeConfigHub.css';
import WizardPlatformStep from '../wizard/WizardPlatformStep.jsx';

export function EmployeeConfigGrid({ children }) {
    return <div className="ech-grid">{children}</div>;
}

export function EmployeeConfigMain({ children }) {
    return <div className="ech-main">{children}</div>;
}

export function EmployeeConfigAside({ children }) {
    return <div className="ech-aside">{children}</div>;
}

export function EmployeeConfigCard({ title, actions, children, className = '' }) {
    return (
        <section className={`ech-card ${className}`.trim()}>
            {(title || actions) && (
                <div className="ech-card-head">
                    {title ? <h3 className="ech-card-title">{title}</h3> : <span />}
                    {actions ? <div className="ech-card-actions">{actions}</div> : null}
                </div>
            )}
            {children}
        </section>
    );
}

export function EmployeeConfigField({ label, hint, children }) {
    return (
        <div className="ech-field">
            {label ? <label className="ech-label">{label}</label> : null}
            {children}
            {hint ? <p className="ech-hint">{hint}</p> : null}
        </div>
    );
}

/** Edit / Save / Cancel toolbar for settings cards */
export function EmployeeConfigEditActions({
    isEditing,
    onEdit,
    onCancel,
    onSave,
    saving,
}) {
    const { t } = useTranslation();
    if (!isEditing) {
        return (
            <button type="button" className="ech-btn" onClick={onEdit}>
                <Edit2 size={14} aria-hidden />
                {t('echEdit')}
            </button>
        );
    }
    return (
        <>
            <button type="button" className="ech-btn" onClick={onCancel} disabled={saving}>
                {t('echCancel')}
            </button>
            <button type="button" className="ech-btn ech-btn--primary" onClick={onSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Save size={14} aria-hidden />}
                {t('echSave')}
            </button>
        </>
    );
}

export function EmployeeConfigShareCard({
    title,
    description,
    qrCode,
    url,
    onDownloadQr,
    copied,
    onCopy,
    emptyHint,
}) {
    const { t } = useTranslation();
    return (
        <EmployeeConfigCard title={title}>
            {description ? <p className="ech-hint" style={{ marginTop: 0, marginBottom: '1rem' }}>{description}</p> : null}
            {qrCode && url ? (
                <div className="ech-share">
                    <div className="ech-share-qr" onClick={onDownloadQr} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onDownloadQr?.()}>
                        <img src={qrCode} alt="" />
                    </div>
                    <div className="ech-share-link">
                        <div className="ech-share-url">{url}</div>
                        <div className="ech-share-actions">
                            <button type="button" className="ech-btn" onClick={onCopy}>
                                {copied ? <><Check size={12} /> {t('cfgCopied')}</> : <><CopyIcon size={12} /> {t('cfgCopyURL')}</>}
                            </button>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="ech-btn" aria-label={t('cfgOpenLink')}>
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: 10, border: '1px dashed var(--border-color)' }}>
                    <QrCode size={28} style={{ opacity: 0.35, flexShrink: 0 }} aria-hidden />
                    <p className="ech-hint" style={{ margin: 0 }}>{emptyHint || t('cfgSaveToGenQR')}</p>
                </div>
            )}
        </EmployeeConfigCard>
    );
}

export function EmployeeConfigQuestionsCard({
    questions,
    isEditing = false,
    onChange,
    showWeights = true,
}) {
    const { t } = useTranslation();
    const list = (questions || []).filter((q) => {
        const text = typeof q === 'string' ? q : q?.question;
        return isEditing || (text && String(text).trim());
    });
    if (!list.length && !isEditing) return null;

    const rows = isEditing && list.length === 0 ? [{ question: '', weight: 7 }] : list;

    return (
        <EmployeeConfigCard title={t('echLeadScoring')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rows.map((q, index) => {
                    const text = typeof q === 'string' ? q : q.question || '';
                    const weight = typeof q === 'object' && q.weight != null ? q.weight : 7;

                    if (isEditing && onChange) {
                        return (
                            <div key={index} className="ech-question ech-question--edit">
                                <div className="ech-question-meta">
                                    <span className="ech-question-index">{t('echQuestionN', { n: index + 1 })}</span>
                                    {showWeights ? (
                                        <label className="ech-question-weight-edit">
                                            <span>{t('echWeightLabel')}</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                className="ech-input ech-input--compact"
                                                value={weight}
                                                onChange={(e) => {
                                                    const next = [...(questions || [])];
                                                    const item = typeof next[index] === 'string'
                                                        ? { question: next[index], weight: 7 }
                                                        : { ...next[index] };
                                                    item.weight = Math.min(10, Math.max(1, Number(e.target.value) || 7));
                                                    next[index] = item;
                                                    onChange(next);
                                                }}
                                            />
                                        </label>
                                    ) : null}
                                </div>
                                <input
                                    type="text"
                                    className="ech-input"
                                    value={text}
                                    placeholder={t('cfgQualifyPlaceholder')}
                                    onChange={(e) => {
                                        const next = [...(questions || [])];
                                        const item = typeof next[index] === 'string'
                                            ? { question: e.target.value, weight: 7 }
                                            : { ...next[index], question: e.target.value };
                                        next[index] = item;
                                        onChange(next);
                                    }}
                                />
                            </div>
                        );
                    }

                    return (
                        <div key={index} className="ech-question">
                            <div className="ech-question-meta">
                                <span className="ech-question-index">{t('echQuestionN', { n: index + 1 })}</span>
                                {showWeights ? (
                                    <span className="ech-question-weight">{t('echWeight', { w: weight })}</span>
                                ) : null}
                            </div>
                            <p className="ech-question-text">{text}</p>
                        </div>
                    );
                })}
            </div>
            {isEditing && onChange ? (
                <button
                    type="button"
                    className="ech-btn"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => {
                        const next = [...(questions || [])];
                        next.push(typeof next[0] === 'string' ? '' : { question: '', weight: 7 });
                        onChange(next);
                    }}
                >
                    + {t('cfgAddField')}
                </button>
            ) : null}
        </EmployeeConfigCard>
    );
}

export function EmployeeConfigPlatformsCard({
    jobId,
    accentColor,
    purpose,
    waConnected,
    gmailConnected,
    gmailEmail,
    channelPrefs,
    onChannelPrefsChange,
    onConnectionsRefresh,
    onBeforeOAuthRedirect,
    oauthFromConfig = true,
}) {
    const { t } = useTranslation();
    const oauthJobId = oauthFromConfig
        ? (jobId?.startsWith('config-') ? jobId : `config-${purpose === 'followup' ? 'followup' : purpose}`)
        : jobId;
    const prefs = {
        whatsapp: channelPrefs?.whatsapp ?? channelPrefs?.whatsapp_enabled ?? false,
        gmail: channelPrefs?.gmail ?? channelPrefs?.email_enabled ?? false,
    };

    const handlePrefs = (next) => {
        onChannelPrefsChange({
            whatsapp_enabled: next.whatsapp,
            email_enabled: next.gmail,
            whatsapp: next.whatsapp,
            gmail: next.gmail,
        });
    };

    return (
        <EmployeeConfigCard title={t('echConnectedPlatforms')}>
            <div className="ech-wiz-plat">
                <WizardPlatformStep
                    compact
                    hubStyle
                    jobId={oauthJobId}
                    accentColor={accentColor}
                    purpose={purpose}
                    waConnected={waConnected}
                    gmailConnected={gmailConnected}
                    gmailEmail={gmailEmail}
                    channelPrefs={prefs}
                    onChannelPrefsChange={handlePrefs}
                    onConnectionsRefresh={onConnectionsRefresh}
                    onBeforeOAuthRedirect={onBeforeOAuthRedirect}
                />
            </div>
        </EmployeeConfigCard>
    );
}

/** Website embed type picker + copyable snippet (lead capture hub). */
export function EmployeeConfigEmbedCard({
    embedType,
    onEmbedTypeChange,
    embedCode,
    automationId,
    initialLoaded,
    copied,
    onCopy,
}) {
    const { t } = useTranslation();

    return (
        <EmployeeConfigCard title={t('wizEmbedTypeTitle')}>
            <div className="cfg-embed-type-grid ech-embed-type-grid">
                <button
                    type="button"
                    className={`cfg-embed-type-card ${embedType === 'inline' ? 'is-active' : ''}`}
                    onClick={() => onEmbedTypeChange('inline')}
                >
                    <span className="cfg-embed-type-name">{t('wizEmbedInlineTitle')}</span>
                    <span className="cfg-embed-type-desc">{t('wizEmbedInlineDesc')}</span>
                </button>
                <button
                    type="button"
                    className={`cfg-embed-type-card ${embedType === 'widget' ? 'is-active' : ''}`}
                    onClick={() => onEmbedTypeChange('widget')}
                >
                    <span className="cfg-embed-type-name">{t('wizEmbedWidgetTitle')}</span>
                    <span className="cfg-embed-type-desc">{t('wizEmbedWidgetDesc')}</span>
                </button>
            </div>
            <div className="cfg-embed-code-panel ech-embed-code-panel" aria-live="polite">
                <span className="cfg-embed-code-label">{t('wizEmbedCodeTitle')}</span>
                <div className="cfg-embed-code">
                    <pre>
                        {!automationId && initialLoaded ? t('wizEmbedLoading') : embedCode}
                    </pre>
                    <button
                        type="button"
                        onClick={onCopy}
                        className="cfg-embed-code-btn"
                        disabled={!embedCode}
                    >
                        {copied ? (
                            <>
                                <Check size={10} aria-hidden /> {t('cfgCopied')}
                            </>
                        ) : (
                            <>
                                <Code2 size={10} aria-hidden /> {t('cfgCopyCode')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </EmployeeConfigCard>
    );
}

/** Contact import block for follow-up hub (matches Better UX card spacing). */
export function EmployeeConfigImportSection({
    title,
    description,
    accentColor = '#8b5cf6',
    lastUpload,
    importResult,
    importError,
    onImport,
    onClearResult,
    isActive,
    onActivate,
}) {
    const { t } = useTranslation();

    return (
        <EmployeeConfigCard title={title}>
            {description ? <p className="ech-hint" style={{ marginTop: 0 }}>{description}</p> : null}

            {lastUpload && (
                <div className="ech-import-last" style={{ borderColor: `${accentColor}33`, background: `${accentColor}0f` }}>
                    <div className="ech-import-last-copy">
                        <Check size={14} style={{ color: accentColor, flexShrink: 0 }} aria-hidden />
                        <div style={{ minWidth: 0 }}>
                            <p className="ech-import-last-title">{lastUpload.folderName || t('cfgUploadContactList')}</p>
                            <p className="ech-import-last-meta">
                                {lastUpload.count} {t('cfgContactsAdded')} · {new Date(lastUpload.date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <a href="/dashboard/leads" className="ech-import-last-link" style={{ color: accentColor }}>
                        {t('followViewContacts')} →
                    </a>
                </div>
            )}

            <button type="button" className="ech-import-dropzone" onClick={onImport}>
                <Upload size={28} aria-hidden />
                <p>
                    {t('cfgDropContactList')}{' '}
                    <span>{t('cfgBrowse')}</span>
                </p>
                <span className="ech-hint" style={{ margin: 0 }}>{t('cfgColumnsHint')}</span>
            </button>

            {importResult && (() => {
                const allDups = importResult.count === 0 && (importResult.fileDups > 0 || importResult.dbDups > 0);
                return (
                    <div className={`ech-import-result ${allDups ? 'is-warn' : 'is-ok'}`}>
                        <div className="ech-import-result-head">
                            <Check size={14} aria-hidden />
                            <div style={{ flex: 1 }}>
                                {allDups ? (
                                    <>
                                        <p className="ech-import-result-title">{t('followImportAllExist', { total: importResult.total })}</p>
                                        <p className="ech-import-result-sub">
                                            {importResult.dbDups > 0 && t('followImportDupInDb', { n: importResult.dbDups })}
                                            {importResult.dbDups > 0 && importResult.fileDups > 0 && ' • '}
                                            {importResult.fileDups > 0 && t('followImportDupInFile', { n: importResult.fileDups })}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="ech-import-result-title">{t('followImportAdded', { count: importResult.count })}</p>
                                        {(importResult.fileDups > 0 || importResult.dbDups > 0) && (
                                            <p className="ech-import-result-sub">
                                                {importResult.fileDups > 0 && t('followImportDupInFile', { n: importResult.fileDups })}
                                                {importResult.fileDups > 0 && importResult.dbDups > 0 && ' • '}
                                                {importResult.dbDups > 0 && t('followImportDupInDb', { n: importResult.dbDups })}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                            <button type="button" className="ech-import-dismiss" onClick={onClearResult} aria-label={t('close')}>
                                ✕
                            </button>
                        </div>
                        <div className="ech-import-result-body">
                            {!allDups && (
                                isActive ? (
                                    <p className="ech-hint" style={{ margin: 0, display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                                        <Zap size={14} style={{ color: accentColor, flexShrink: 0 }} aria-hidden />
                                        {t('followEmployeeActive')}
                                    </p>
                                ) : (
                                    <div className="ech-import-paused-banner">
                                        <strong>{t('followEmployeePaused')}</strong>
                                        <p>{t('followEmployeePausedHint')}</p>
                                        {onActivate ? (
                                            <button type="button" className="ech-btn ech-btn--primary" onClick={onActivate}>
                                                {t('followActivateNow')} →
                                            </button>
                                        ) : null}
                                    </div>
                                )
                            )}
                            <a href="/dashboard/leads" className="ech-import-view-leads" style={{ color: accentColor }}>
                                <Users2 size={13} aria-hidden />
                                {t('followViewContacts')} →
                            </a>
                        </div>
                    </div>
                );
            })()}

            {importError && (
                <p className="ech-import-error" role="alert">
                    <strong>{t('followImportFailed')}</strong> {importError}
                </p>
            )}

            <div className="cfg-simple-steps" style={{ marginTop: '1.25rem' }}>
                <p className="cfg-simple-steps-title">{t('followHowTitle')}</p>
                <ol>
                    <li>{t('followHowStep1')}</li>
                    <li>{t('followHowStep2')}</li>
                    <li>{t('followHowStep3')}</li>
                </ol>
            </div>
        </EmployeeConfigCard>
    );
}

export function EmployeeConfigScheduleCard({ schedule }) {
    const { t } = useTranslation();
    if (!schedule?.length) return null;

    return (
        <EmployeeConfigCard title={t('echFollowupSchedule')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {schedule.map((step, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 10,
                            background: 'var(--input-bg, rgba(0,0,0,0.02))',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {t('echFollowupStep', { n: i + 1 })}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {step.delay_value} {step.delay_unit}
                        </span>
                    </div>
                ))}
            </div>
        </EmployeeConfigCard>
    );
}

export function EmployeeConfigSidebar({
    employeeKey,
    typeLabel,
    sourceLabel,
    sourceExtra,
    createdAt,
    isActive,
    onRunNow,
    onToggleActive,
    onDuplicate,
    onDelete,
    runDisabled,
    showDuplicate = false,
    showDelete = false,
}) {
    const { t, language } = useTranslation();
    const { totalRuns, successRate, lastRun, loading } = useEmployeeActivityStats(employeeKey);

    const formatDate = (d) => {
        if (!d) return '—';
        try {
            return new Intl.DateTimeFormat(language === 'es' ? 'es' : 'en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(d instanceof Date ? d : new Date(d));
        } catch {
            return '—';
        }
    };

    return (
        <>
            <EmployeeConfigCard title={t('echQuickActions')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        type="button"
                        className="ech-btn ech-btn--primary ech-btn--block"
                        onClick={onRunNow}
                        disabled={runDisabled}
                    >
                        <Play size={16} aria-hidden />
                        {t('echRunNow')}
                    </button>
                    <button type="button" className="ech-btn ech-btn--block" onClick={onToggleActive}>
                        {isActive ? (
                            <>
                                <Pause size={16} aria-hidden />
                                {t('echPauseAutomation')}
                            </>
                        ) : (
                            <>
                                <Play size={16} aria-hidden />
                                {t('echActivateAutomation')}
                            </>
                        )}
                    </button>
                    {showDuplicate && (
                        <button type="button" className="ech-btn ech-btn--block" onClick={onDuplicate}>
                            <Copy size={16} aria-hidden />
                            {t('echDuplicate')}
                        </button>
                    )}
                    {showDelete && (
                        <button type="button" className="ech-btn ech-btn--block ech-btn--danger" onClick={onDelete}>
                            <Trash2 size={16} aria-hidden />
                            {t('echDelete')}
                        </button>
                    )}
                </div>
            </EmployeeConfigCard>

            <EmployeeConfigCard title={t('echPerformance')}>
                {loading ? (
                    <div className="wa-loader" style={{ margin: '0.5rem auto' }} />
                ) : (
                    <>
                        <div className="ech-stat-row">
                            <p className="ech-stat-label">{t('echTotalRuns')}</p>
                            <p className="ech-stat-value">{totalRuns}</p>
                        </div>
                        <div className="ech-stat-row">
                            <p className="ech-stat-label">{t('echSuccessRate')}</p>
                            <div className="ech-stat-inline">
                                <TrendingUp size={16} style={{ color: '#16a34a' }} aria-hidden />
                                <span className="ech-stat-value">{successRate}%</span>
                            </div>
                        </div>
                    </>
                )}
            </EmployeeConfigCard>

            <EmployeeConfigCard title={t('echDetails')}>
                <div className="ech-detail-row">
                    <p className="ech-detail-label">{t('echDetailType')}</p>
                    <p className="ech-detail-value">{typeLabel}</p>
                </div>
                <div className="ech-detail-row">
                    <p className="ech-detail-label">{t('echDetailSource')}</p>
                    <p className="ech-detail-value" style={{ textTransform: 'capitalize' }}>
                        {sourceLabel}
                        {sourceExtra ? (
                            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 2 }}>
                                ({sourceExtra})
                            </span>
                        ) : null}
                    </p>
                </div>
                {createdAt && (
                    <div className="ech-detail-row">
                        <p className="ech-detail-label">{t('echDetailCreated')}</p>
                        <p className="ech-detail-value">{formatDate(createdAt)}</p>
                    </div>
                )}
                <div className="ech-detail-row">
                    <p className="ech-detail-label">{t('echDetailLastRun')}</p>
                    <p className="ech-detail-value">{formatDate(lastRun)}</p>
                </div>
            </EmployeeConfigCard>
        </>
    );
}

export function EmployeeConfigSaveBar({ hasChanges, isSaving, label }) {
    const { t } = useTranslation();
    return (
        <div className="ech-save-bar">
            <button
                type="submit"
                className={`cfg-save-btn ${hasChanges ? 'has-changes' : 'no-changes'}`}
                disabled={isSaving || !hasChanges}
            >
                {isSaving ? (
                    <>
                        <Loader2 className="animate-spin" size={18} aria-hidden />
                        {t('cfgSaving')}
                    </>
                ) : (
                    <>
                        <Save size={16} aria-hidden />
                        {label || t('cfgSaveChanges')}
                    </>
                )}
            </button>
        </div>
    );
}
