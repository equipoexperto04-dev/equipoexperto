import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, Upload, Star, Check } from 'lucide-react';

import SuccessModal from '../../components/SuccessModal';
import { useTranslation } from '../../context/LanguageContext';
import InlineMessagePreview from '../../components/InlineMessagePreview';
import LeadFolderImportModal from '../../components/LeadFolderImportModal.jsx';
import EmployeeWorkspaceHeader from '../../components/EmployeeWorkspaceHeader.jsx';
import GoogleReviewLinkSearch from '../../components/GoogleReviewLinkSearch.jsx';
import {
    EmployeeConfigGrid,
    EmployeeConfigMain,
    EmployeeConfigAside,
    EmployeeConfigCard,
    EmployeeConfigField,
    EmployeeConfigEditActions,
    EmployeeConfigShareCard,
    EmployeeConfigQuestionsCard,
    EmployeeConfigPlatformsCard,
    EmployeeConfigSidebar,
    EmployeeConfigSaveBar,
} from '../../components/employee-config/EmployeeConfigHub.jsx';
import { getEmployeeByGoal } from '../../constants/employees.js';
import './Config.css';
import '../../components/employee-config/EmployeeConfigHub.css';
import API_URL from '../../config.js';
import { isEmployeeConfigured } from '../../utils/employeeConfigured.js';
import {
    saveConfigResume,
    loadConfigResume,
    clearConfigResume,
    isConfigOAuthReturn,
    configOAuthJobId,
} from '../../utils/configResume.js';

const ACCENT = '#f59e0b';

const ReviewFunnel = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const resumeKey = configOAuthJobId('review');
    const emp = getEmployeeByGoal('review');
    const textareaRef = useRef(null);

    const defaultEmail = (() => {
        try {
            return JSON.parse(localStorage.getItem('user_profile') || '{}').email || '';
        } catch {
            return '';
        }
    })();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showInlinePreview, setShowInlinePreview] = useState(false);
    const [copied, setCopied] = useState(false);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const fetchEmployeeStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/stats/activity?employee=review`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setEmployeeStats(data.detailed_stats);
            }
        } catch (err) {
            console.error('Failed to fetch employee stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const [config, setConfig] = useState({
        google_review_url: '',
        notification_email: defaultEmail,
        auto_response_message:
            'Hi {NAME}! Thank you for visiting. Would you mind sharing your feedback with us on Google via {LINK}? It would mean a lot!',
        whatsapp_enabled: true,
        email_enabled: true,
        lead_sources: ['qr'],
        is_active: false,
        review_next_step_done: false,
        filtering_questions: [],
    });
    const [originalConfig, setOriginalConfig] = useState(null);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [createdAt, setCreatedAt] = useState(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [showFolderImport, setShowFolderImport] = useState(false);
    const [importSuccess, setImportSuccess] = useState(null);
    const [waConnected, setWaConnected] = useState(false);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

    const messageVariables = [
        { key: '{NAME}' },
        { key: '{LINK}' },
    ];

    const refreshConnections = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [waRes, intRes] = await Promise.all([
                fetch(`${API_URL}/api/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/integrations`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const waData = await waRes.json();
            setWaConnected(!!(waData.success && waData.status === 'connected'));
            const intData = await intRes.json();
            const gmail = intData.success && intData.integrations?.find((i) => i.provider === 'google');
            setGmailConnected(!!gmail);
            setGmailEmail(gmail?.email || gmail?.account_id || '');
        } catch (e) {
            console.error('[ReviewFunnel] connections', e);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
        fetchEmployeeStats();
    }, []);

    const parseQuestions = (fq) => {
        if (!Array.isArray(fq)) return [];
        return fq.map((q, i) => {
            if (typeof q === 'string') return { question: q, weight: 7, id: String(i) };
            return { question: q.question || '', weight: q.weight ?? 7, id: q.id || String(i) };
        }).filter((q) => q.question?.trim());
    };

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 404) {
                navigate('/dashboard/employee/review', { replace: true });
                return;
            }
            if (!res.ok) {
                setIsLoading(false);
                return;
            }
            const data = await res.json();

            if (data.success && data.config && isEmployeeConfigured('review', data.config)) {
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                const emailToUse =
                    data.config.notification_email && data.config.notification_email !== 'hello@business.com'
                        ? data.config.notification_email
                        : profile.email || defaultEmail;

                const initialData = {
                    google_review_url: data.config.google_review_url || '',
                    notification_email: emailToUse,
                    auto_response_message:
                        data.config.auto_response_message || config.auto_response_message,
                    whatsapp_enabled: data.config.whatsapp_enabled ?? true,
                    email_enabled: data.config.email_enabled ?? true,
                    lead_sources: data.config.lead_sources || [data.config.lead_source || 'qr'],
                    is_active: data.config.is_active === true,
                    review_next_step_done: data.config.review_next_step_done === true,
                    filtering_questions: parseQuestions(data.config.filtering_questions),
                };
                setConfig(initialData);
                setOriginalConfig(initialData);
                setInitialLoaded(true);
                if (data.config.updated_at) setCreatedAt(data.config.updated_at);
                if (data.config.surveyUrl) setWebhookUrl(data.config.surveyUrl);
                if (data.config.surveyQrCode) setQrCode(data.config.surveyQrCode);
            } else {
                navigate('/dashboard/employee/review', { replace: true, state: { freshHire: true } });
                return;
            }

            await refreshConnections();

            if (isConfigOAuthReturn(searchParams)) {
                const resume = loadConfigResume(resumeKey);
                if (resume?.config) {
                    const merged = { ...resume.config, email_enabled: true };
                    setConfig(merged);
                    setOriginalConfig(resume.originalConfig ?? resume.config);
                } else {
                    setConfig((c) => ({ ...c, email_enabled: true }));
                }
                clearConfigResume(resumeKey);
                navigate('/dashboard/config/review-funnel', { replace: true });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const persistConfig = async (payload, { closeEdit = false } = {}) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...payload,
                    filtering_questions: (payload.filtering_questions || []).map((q) => ({
                        question: q.question || q,
                        weight: q.weight ?? 7,
                    })),
                    goal: 'review',
                }),
            });
            const data = await res.json();
            if (data.success) {
                const done = data.config?.review_next_step_done === true;
                const merged = done
                    ? { ...payload, review_next_step_done: true }
                    : { ...payload };
                setConfig(merged);
                setOriginalConfig(merged);
                setSaved(true);
                if (closeEdit) setIsEditing(false);
                if (data.config?.surveyUrl) setWebhookUrl(data.config.surveyUrl);
                if (data.config?.surveyQrCode) setQrCode(data.config.surveyQrCode);
                window.dispatchEvent(new Event('activity:refresh'));
            }
        } catch (error) {
            console.error('Error saving config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        await persistConfig(config, { closeEdit: true });
    };

    const handleToggleActive = async () => {
        const next = { ...config, is_active: !config.is_active };
        setConfig(next);
        await persistConfig(next);
    };

    const insertVariable = (variable) => {
        const textarea = textareaRef.current;
        if (!textarea || !isEditing) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = config.auto_response_message.substring(0, start);
        const after = config.auto_response_message.substring(end);
        setConfig({ ...config, auto_response_message: before + variable + after });
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const copyToClipboard = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQRCode = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.download = 'review-agent-qr.png';
        link.href = qrCode;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onFolderImportSuccess = (data) => {
        const imported = data.imported ?? 0;
        if (imported > 0) {
            setImportSuccess(`${imported} contact${imported !== 1 ? 's' : ''} added. Review requests being sent.`);
            setTimeout(() => setImportSuccess(''), 6000);
            window.dispatchEvent(
                new CustomEvent('showNotifPopup', {
                    detail: {
                        count: imported,
                        message: `${imported} contact${imported > 1 ? 's' : ''} added! View in Contacts.`,
                    },
                })
            );
            localStorage.setItem('glowLeads', 'true');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('triggerLeadsGlow'));
            window.dispatchEvent(new Event('activity:refresh'));
        } else {
            setImportSuccess('All contacts already exist — nothing new added.');
            setTimeout(() => setImportSuccess(''), 5000);
        }
    };

    const hasChanges =
        initialLoaded && originalConfig !== null && JSON.stringify(config) !== JSON.stringify(originalConfig);

    const leadSources = (
        Array.isArray(config.lead_sources) ? config.lead_sources : [config.lead_sources || 'qr'].filter(Boolean)
    ).filter((id) => id !== 'website');
    const showUploadSource = leadSources.includes('excel');
    const sourceLabel = leadSources[0] || 'qr';

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="wa-loader" />
            </div>
        );
    }

    return (
        <div
            className="dashboard-page cfg-page cfg-page--hub animate-fade-in"
            style={{
                '--cfg-accent': ACCENT,
                '--cfg-accent-bg': 'rgba(245,158,11,0.07)',
                '--cfg-accent-border': 'rgba(245,158,11,0.25)',
            }}
        >
            <EmployeeWorkspaceHeader
                variant="hub"
                Icon={emp?.Icon || Star}
                title={t('empReviewShort')}
                subtitle={t('echTypeReview')}
                accent={ACCENT}
                accentBg="rgba(245,158,11,0.1)"
                statusLabel={config.is_active ? t('echStatusActive') : t('echStatusPaused')}
                statusActive={config.is_active}
            />

            <p className="ech-secondary-link">
                <Link to="/dashboard/feedback">{t('reviewsViewOpinions')} →</Link>
            </p>

            <form onSubmit={handleSave}>
                <EmployeeConfigGrid>
                    <EmployeeConfigMain>
                        <EmployeeConfigCard
                            title={t('echAutomationSettings')}
                            actions={
                                <EmployeeConfigEditActions
                                    isEditing={isEditing}
                                    onEdit={() => setIsEditing(true)}
                                    onCancel={() => {
                                        setConfig(originalConfig);
                                        setIsEditing(false);
                                    }}
                                    onSave={() => persistConfig(config, { closeEdit: true })}
                                    saving={isSaving}
                                />
                            }
                        >
                            <EmployeeConfigField label={t('echAutomationName')}>
                                <input
                                    type="text"
                                    className="ech-input"
                                    value={t('empReviewShort')}
                                    disabled
                                    readOnly
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('cfgGoogleLinkHeading')}>
                                <GoogleReviewLinkSearch
                                    value={config.google_review_url}
                                    disabled={!isEditing}
                                    onChange={(val) =>
                                        setConfig({ ...config, google_review_url: val })
                                    }
                                    className="ech-input"
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField
                                label={t('echMessageSubject')}
                                hint={t('cfgReviewAutoReplyDesc')}
                            >
                                <input
                                    type="text"
                                    className="ech-input"
                                    value={t('echReviewMessageSubjectDefault')}
                                    disabled
                                    readOnly
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('echMessageContent')}>
                                <div className="ech-pills">
                                    {messageVariables.map((v) => (
                                        <button
                                            key={v.key}
                                            type="button"
                                            className="ech-pill"
                                            disabled={!isEditing}
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // keep textarea focus & caret position
                                                insertVariable(v.key);
                                            }}
                                        >
                                            {v.key}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    className="ech-textarea"
                                    rows={5}
                                    disabled={!isEditing}
                                    value={config.auto_response_message}
                                    onChange={(e) =>
                                        setConfig({ ...config, auto_response_message: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    className={`cfg-preview-btn ${showInlinePreview ? 'active' : ''}`}
                                    style={{ marginTop: '0.5rem' }}
                                    onClick={() => setShowInlinePreview(!showInlinePreview)}
                                >
                                    <Eye size={14} />{' '}
                                    {showInlinePreview ? t('wizHidePreview') : t('wizLivePreview')}
                                </button>
                                {showInlinePreview && (
                                    <InlineMessagePreview
                                        message={config.auto_response_message}
                                        activeChannels={{
                                            whatsapp: config.whatsapp_enabled,
                                            email: config.email_enabled,
                                        }}
                                    />
                                )}
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('cfgNotifHeading')}>
                                <input
                                    type="email"
                                    className="ech-input"
                                    placeholder="your@email.com"
                                    disabled={!isEditing}
                                    value={config.notification_email}
                                    onChange={(e) =>
                                        setConfig({ ...config, notification_email: e.target.value })
                                    }
                                />
                            </EmployeeConfigField>
                        </EmployeeConfigCard>

                        {employeeStats && (
                            <EmployeeConfigCard title={t('cfgPerformanceMetrics') || 'Performance Metrics'}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                                    {/* QR Metrics */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📱</span> QR Code Funnel
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>QR Code Scans</span>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{employeeStats.qr?.scans || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Completed QR Surveys</span>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{employeeStats.qr?.answers || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Google Reviews Left</span>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>{employeeStats.qr?.reviews || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List Metrics */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#c084fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📊</span> Spreadsheet Imports
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Questionnaires Sent</span>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{employeeStats.list?.sent || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Emails Bounced</span>
                                                <span style={{ color: '#ef4444', fontWeight: 700 }}>{employeeStats.list?.bounces || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Completed Questionnaires</span>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{employeeStats.list?.answers || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Google Reviews Left</span>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>{employeeStats.list?.reviews || 0}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Unsatisfied Client Alerts</span>
                                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{employeeStats.list?.unsatisfied_alerts || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </EmployeeConfigCard>
                        )}

                        <EmployeeConfigPlatformsCard
                            jobId="review"
                            accentColor={ACCENT}
                            purpose="review"
                            waConnected={waConnected}
                            gmailConnected={gmailConnected}
                            gmailEmail={gmailEmail}
                            channelPrefs={config}
                            onChannelPrefsChange={(patch) => setConfig((c) => ({ ...c, ...patch }))}
                            onConnectionsRefresh={refreshConnections}
                            onBeforeOAuthRedirect={() =>
                                saveConfigResume(resumeKey, {
                                    config,
                                    originalConfig,
                                })
                            }
                        />

                        <EmployeeConfigQuestionsCard
                            questions={config.filtering_questions}
                            isEditing={isEditing}
                            onChange={(next) => setConfig((c) => ({ ...c, filtering_questions: next }))}
                        />

                        <EmployeeConfigShareCard
                            title={t('cfgShareReviewHeading')}
                            description={t('cfgShareReviewDesc')}
                            qrCode={qrCode}
                            url={webhookUrl}
                            onDownloadQr={downloadQRCode}
                            copied={copied}
                            onCopy={copyToClipboard}
                        />

                        {showUploadSource && (
                            <EmployeeConfigCard title={t('cfgImportHeading')}>
                                <p className="ech-hint" style={{ marginTop: 0 }}>
                                    {t('cfgImportReviewDesc')}
                                </p>
                                <button
                                    type="button"
                                    className="cfg-upload-btn"
                                    style={{ marginTop: '0.75rem' }}
                                    onClick={() => setShowFolderImport(true)}
                                >
                                    <Upload size={18} />
                                    <span>{t('cfgUploadContactList')}</span>
                                </button>
                                <p className="cfg-upload-note">{t('cfgColumnsHint')}</p>
                                {importSuccess && (
                                    <div className="cfg-feedback-success" style={{ marginTop: '0.5rem' }}>
                                        <Check size={14} />
                                        {importSuccess}
                                    </div>
                                )}
                            </EmployeeConfigCard>
                        )}
                    </EmployeeConfigMain>

                    <EmployeeConfigAside>
                        <EmployeeConfigSidebar
                            employeeKey="review"
                            typeLabel={t('echTypeReview')}
                            sourceLabel={sourceLabel}
                            isActive={config.is_active}
                            createdAt={createdAt}
                            onRunNow={() => {
                                if (showUploadSource) setShowFolderImport(true);
                                else if (webhookUrl) copyToClipboard();
                            }}
                            onToggleActive={handleToggleActive}
                            runDisabled={!config.is_active && !showUploadSource && !webhookUrl}
                        />
                    </EmployeeConfigAside>
                </EmployeeConfigGrid>

                <EmployeeConfigSaveBar hasChanges={hasChanges} isSaving={isSaving} />
            </form>

            <SuccessModal
                isOpen={saved}
                onClose={() => setSaved(false)}
                title={t('cfgSettingsSaved')}
                message={t('cfgReviewSavedMsg')}
                primaryActionText={t('cfgBackToTeam')}
                onPrimaryAction={() => navigate('/dashboard/employee-gallery')}
            />

            <LeadFolderImportModal
                open={showFolderImport}
                onClose={() => setShowFolderImport(false)}
                onSuccess={onFolderImportSuccess}
                importSource="Review Funnel Import"
                importPurpose="review"
                hideFollowupMessage
                skipCapture
            />
        </div>
    );
};

export default ReviewFunnel;
