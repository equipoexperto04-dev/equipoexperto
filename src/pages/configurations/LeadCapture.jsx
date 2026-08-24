import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Save, Users, Loader2, Upload, Check,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LeadFolderImportModal from '../../components/LeadFolderImportModal.jsx';
import EmployeeWorkspaceHeader from '../../components/EmployeeWorkspaceHeader.jsx';
import { useTranslation } from '../../context/LanguageContext';
import { getEmployeeByGoal } from '../../constants/employees.js';
import SuccessModal from '../../components/SuccessModal';
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
    EmployeeConfigEmbedCard,
    EmployeeConfigSidebar,
    EmployeeConfigSaveBar,
} from '../../components/employee-config/EmployeeConfigHub.jsx';
import './Config.css';
import '../../components/employee-config/EmployeeConfigHub.css';
import API_URL from '../../config.js';
import { isEmployeeConfigured } from '../../utils/employeeConfigured.js';
import { buildCaptureEmbedCode, ensureCaptureAutomationAssets } from '../../utils/captureEmbedCode.js';
import {
    saveConfigResume,
    loadConfigResume,
    clearConfigResume,
    isConfigOAuthReturn,
    configOAuthJobId,
} from '../../utils/configResume.js';

const ACCENT = '#3b82f6';

const LeadCapture = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const resumeKey = configOAuthJobId('capture');
    const emp = getEmployeeByGoal('capture');

    const defaultEmail = (() => {
        try {
            return JSON.parse(localStorage.getItem('user_profile') || '{}').email || '';
        } catch {
            return '';
        }
    })();

    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const fetchEmployeeStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/stats/activity?employee=capture`, {
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

    const [webhookUrl, setWebhookUrl] = useState('');
    const [qrCode, setQrCode] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [createdAt, setCreatedAt] = useState(null);

    const [settings, setSettings] = useState({
        notification_email: defaultEmail,
        auto_response_message:
            "Hi {NAME}! Thanks for checking us out. We've received your inquiry and will be with you shortly.",
        intro_text: '',
        whatsapp_enabled: true,
        email_enabled: true,
    });
    const [filteringQuestions, setFilteringQuestions] = useState([]);
    const [originalSettings, setOriginalSettings] = useState(null);
    const [originalQuestions, setOriginalQuestions] = useState([]);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const [showFolderImport, setShowFolderImport] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [automationId, setAutomationId] = useState('');
    const [captureEmbedType, setCaptureEmbedType] = useState('inline');
    const [captureSources, setCaptureSources] = useState(['qr']);
    const [waConnected, setWaConnected] = useState(false);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

    const textareaRef = useRef(null);

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
            console.error('[LeadCapture] connections', e);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.status === 404) {
                    navigate('/dashboard/employee/capture', { replace: true });
                    return;
                }
                const data = res.ok ? await res.json() : { success: false };
                if (data.success && data.config && isEmployeeConfigured('capture', data.config)) {
                    let leadUrl = data.config.leadUrl || '';
                    let aid = data.config.automation_id || '';
                    let leadQr = data.config.leadQrCode || null;
                    try {
                        const ensured = await ensureCaptureAutomationAssets(token);
                        aid = ensured.automationId;
                        leadUrl = ensured.leadUrl || leadUrl;
                        if (ensured.leadQrCode) leadQr = ensured.leadQrCode;
                    } catch (ensureErr) {
                        console.error('ensure automation id:', ensureErr);
                    }
                    setWebhookUrl(leadUrl);
                    setQrCode(leadQr);
                    setAutomationId(aid);
                    setCaptureEmbedType(data.config.capture_embed_type === 'widget' ? 'widget' : 'inline');
                    setIsActive(data.config.lead_capture_active === true);
                    if (data.config.updated_at) setCreatedAt(data.config.updated_at);
                    const sources = data.config.capture_sources
                        ? typeof data.config.capture_sources === 'string'
                            ? JSON.parse(data.config.capture_sources)
                            : data.config.capture_sources
                        : [data.config.capture_source || 'qr'];
                    setCaptureSources(Array.isArray(sources) ? sources : ['qr']);
                    const q = (data.config.filtering_questions || []).map((x) =>
                        typeof x === 'string' ? x : x.question || ''
                    );
                    setFilteringQuestions(q.length ? q : ['']);
                    const init = {
                        notification_email: data.config.notification_email || defaultEmail,
                        auto_response_message:
                            data.config.auto_response_message || settings.auto_response_message,
                        intro_text: data.config.intro_text || '',
                        whatsapp_enabled: data.config.whatsapp_enabled ?? true,
                        email_enabled: data.config.email_enabled ?? true,
                    };
                    setSettings(init);
                    setOriginalSettings(init);
                    setOriginalQuestions(q);
                    setInitialLoaded(true);
                    await refreshConnections();

                    if (isConfigOAuthReturn(searchParams)) {
                        const resume = loadConfigResume(resumeKey);
                        if (resume?.settings) {
                            setSettings({ ...resume.settings, email_enabled: true });
                            setOriginalSettings(resume.originalSettings ?? resume.settings);
                        } else {
                            setSettings((s) => ({ ...s, email_enabled: true }));
                        }
                        if (resume?.filteringQuestions) {
                            setFilteringQuestions(resume.filteringQuestions);
                            setOriginalQuestions(resume.originalQuestions ?? resume.filteringQuestions);
                        }
                        clearConfigResume(resumeKey);
                        navigate('/dashboard/config/lead-capture', { replace: true });
                    }
                } else {
                    navigate('/dashboard/employee/capture', { replace: true, state: { freshHire: true } });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        })();
        fetchEmployeeStats();
    }, []);

    const persist = async (payload, { closeEdit = false } = {}) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    notification_email: payload.settings.notification_email,
                    auto_response_message: payload.settings.auto_response_message,
                    intro_text: payload.settings.intro_text,
                    whatsapp_enabled: payload.settings.whatsapp_enabled,
                    email_enabled: payload.settings.email_enabled,
                    filtering_questions: payload.questions
                        .filter((q) => q.trim())
                        .map((q) => ({ question: q })),
                    lead_capture_active: payload.isActive,
                    capture_embed_type: payload.captureEmbedType,
                    goal: 'capture',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                if (data.config?.automation_id) setAutomationId(data.config.automation_id);
                if (data.config?.leadUrl) setWebhookUrl(data.config.leadUrl);
                if (data.config?.leadQrCode) setQrCode(data.config.leadQrCode);
                setOriginalSettings({ ...payload.settings });
                setOriginalQuestions([...payload.questions]);
                if (closeEdit) setIsEditing(false);
                window.dispatchEvent(new Event('activity:refresh'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        await persist(
            {
                settings,
                questions: filteringQuestions,
                isActive,
                captureEmbedType,
            },
            { closeEdit: true }
        );
    };

    const handleToggleActive = async () => {
        const next = !isActive;
        setIsActive(next);
        await persist({
            settings,
            questions: filteringQuestions,
            isActive: next,
            captureEmbedType,
        });
    };

    const hasChanges =
        initialLoaded &&
        (JSON.stringify(settings) !== JSON.stringify(originalSettings) ||
            JSON.stringify(filteringQuestions) !== JSON.stringify(originalQuestions));

    const embedCode = useMemo(
        () =>
            buildCaptureEmbedCode({
                embedType: captureEmbedType,
                automationId,
                leadUrl: webhookUrl,
            }),
        [captureEmbedType, automationId, webhookUrl]
    );

    const insertVariable = (v) => {
        if (!isEditing) return;
        const ta = textareaRef.current;
        if (!ta) return;
        const s = ta.selectionStart;
        const e = ta.selectionEnd;
        const msg = settings.auto_response_message;
        setSettings((p) => ({ ...p, auto_response_message: msg.slice(0, s) + v + msg.slice(e) }));
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(s + v.length, s + v.length);
        }, 0);
    };

    const downloadQR = () => {
        if (!qrCode) return;
        const a = document.createElement('a');
        a.download = 'lead-capture-qr.png';
        a.href = qrCode;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyEmbed = () => {
        if (!embedCode) return;
        navigator.clipboard.writeText(embedCode);
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);
    };

    const onFolderImportSuccess = (data) => {
        setImportResult({
            count: data.imported ?? 0,
            fileDups: data.fileDups ?? 0,
            dbDups: data.dbDups ?? 0,
            total: data.total ?? data.imported ?? 0,
        });
        if ((data.imported ?? 0) > 0) {
            window.dispatchEvent(
                new CustomEvent('showNotifPopup', {
                    detail: {
                        count: data.imported,
                        message: `${data.imported} contact${data.imported > 1 ? 's' : ''} added! View in Contacts.`,
                    },
                })
            );
            localStorage.setItem('glowLeads', 'true');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('triggerLeadsGlow'));
            window.dispatchEvent(new Event('activity:refresh'));
        }
    };

    const sourceLabel = captureSources.includes('website') ? 'embed' : captureSources[0] || 'qr';
    const sourceExtra =
        captureSources.includes('website') || captureEmbedType
            ? captureEmbedType === 'widget'
                ? t('wizEmbedWidgetTitle')
                : t('wizEmbedInlineTitle')
            : null;

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
                '--cfg-accent-bg': 'rgba(59,130,246,0.06)',
                '--cfg-accent-border': 'rgba(59,130,246,0.2)',
            }}
        >
            <EmployeeWorkspaceHeader
                variant="hub"
                Icon={emp?.Icon || Users}
                title={t('empLeadShort')}
                subtitle={t('echTypeCapture')}
                accent={ACCENT}
                accentBg="rgba(59,130,246,0.1)"
                statusLabel={isActive ? t('echStatusActive') : t('echStatusPaused')}
                statusActive={isActive}
            />

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
                                        setSettings(originalSettings);
                                        setFilteringQuestions(originalQuestions);
                                        setIsEditing(false);
                                    }}
                                    onSave={() =>
                                        persist(
                                            {
                                                settings,
                                                questions: filteringQuestions,
                                                isActive,
                                                captureEmbedType,
                                            },
                                            { closeEdit: true }
                                        )
                                    }
                                    saving={isSaving}
                                />
                            }
                        >
                            <EmployeeConfigField label={t('echAutomationName')}>
                                <input
                                    type="text"
                                    className="ech-input"
                                    value={t('empLeadShort')}
                                    disabled
                                    readOnly
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('echMessageSubject')}>
                                <input
                                    type="text"
                                    className="ech-input"
                                    value={t('echCaptureMessageSubjectDefault')}
                                    disabled
                                    readOnly
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('cfgIntroHeading')}>
                                <textarea
                                    className="ech-textarea"
                                    rows={3}
                                    disabled={!isEditing}
                                    value={settings.intro_text}
                                    onChange={(e) =>
                                        setSettings((p) => ({ ...p, intro_text: e.target.value }))
                                    }
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('echMessageContent')}>
                                <div className="ech-pills">
                                    {['{NAME}', '{LINK}', '{NUMBER}'].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            className="ech-pill"
                                            disabled={!isEditing}
                                            onClick={() => insertVariable(v)}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    className="ech-textarea"
                                    rows={4}
                                    disabled={!isEditing}
                                    value={settings.auto_response_message}
                                    onChange={(e) =>
                                        setSettings((p) => ({
                                            ...p,
                                            auto_response_message: e.target.value,
                                        }))
                                    }
                                />
                            </EmployeeConfigField>

                            <EmployeeConfigField label={t('cfgNotifHeading')}>
                                <input
                                    type="email"
                                    className="ech-input"
                                    disabled={!isEditing}
                                    value={settings.notification_email}
                                    onChange={(e) =>
                                        setSettings((p) => ({
                                            ...p,
                                            notification_email: e.target.value,
                                        }))
                                    }
                                />
                            </EmployeeConfigField>
                        </EmployeeConfigCard>

                        {employeeStats && (
                            <EmployeeConfigCard title={t('cfgPerformanceMetrics') || 'Performance Metrics'}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Questionnaire Views</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{employeeStats.form_views || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Completed Questionnaires</span>
                                            <span style={{ color: '#10b981', fontWeight: 700 }}>{employeeStats.completed || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>High-Priority Alerts</span>
                                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{employeeStats.high_priority || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Abandoned Forms</span>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{employeeStats.abandoned || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </EmployeeConfigCard>
                        )}

                        <EmployeeConfigPlatformsCard
                            jobId="capture"
                            accentColor={ACCENT}
                            purpose="capture"
                            waConnected={waConnected}
                            gmailConnected={gmailConnected}
                            gmailEmail={gmailEmail}
                            channelPrefs={settings}
                            onChannelPrefsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                            onConnectionsRefresh={refreshConnections}
                            onBeforeOAuthRedirect={() =>
                                saveConfigResume(resumeKey, {
                                    settings,
                                    originalSettings,
                                    filteringQuestions,
                                    originalQuestions,
                                })
                            }
                        />

                        <EmployeeConfigQuestionsCard
                            questions={filteringQuestions.map((q) =>
                                typeof q === 'string' ? { question: q, weight: 7 } : q
                            )}
                            isEditing={isEditing}
                            showWeights={false}
                            onChange={(next) =>
                                setFilteringQuestions(next.map((item) => item.question || ''))
                            }
                        />

                        <EmployeeConfigShareCard
                            title={t('cfgShareFormHeading')}
                            description={t('cfgShareFormDesc')}
                            qrCode={qrCode}
                            url={webhookUrl}
                            onDownloadQr={downloadQR}
                            copied={copied}
                            onCopy={copyUrl}
                        />

                        {(captureSources.includes('website') || webhookUrl) && (
                            <EmployeeConfigEmbedCard
                                embedType={captureEmbedType}
                                onEmbedTypeChange={setCaptureEmbedType}
                                embedCode={embedCode}
                                automationId={automationId}
                                initialLoaded={initialLoaded}
                                copied={embedCopied}
                                onCopy={copyEmbed}
                            />
                        )}

                        <EmployeeConfigCard title={t('cfgImportHeading')}>
                            <p className="ech-hint" style={{ marginTop: 0 }}>
                                {t('cfgImportDesc')}
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
                            {importResult && (
                                <div className="cfg-feedback-success" style={{ marginTop: '0.5rem' }}>
                                    <Check size={14} />
                                    {importResult.count > 0
                                        ? `${importResult.count} contact${importResult.count !== 1 ? 's' : ''} added`
                                        : `All ${importResult.total} contacts already exist`}
                                </div>
                            )}
                        </EmployeeConfigCard>
                    </EmployeeConfigMain>

                    <EmployeeConfigAside>
                        <EmployeeConfigSidebar
                            employeeKey="capture"
                            typeLabel={t('echTypeCapture')}
                            sourceLabel={sourceLabel}
                            sourceExtra={sourceExtra}
                            createdAt={createdAt}
                            isActive={isActive}
                            onRunNow={() => setShowFolderImport(true)}
                            onToggleActive={handleToggleActive}
                        />
                    </EmployeeConfigAside>
                </EmployeeConfigGrid>

                <EmployeeConfigSaveBar hasChanges={hasChanges} isSaving={isSaving} />
            </form>

            <SuccessModal
                isOpen={saved}
                onClose={() => setSaved(false)}
                title={t('cfgSettingsSaved')}
                message={t('cfgLeadSavedMsg')}
                primaryActionText={t('cfgBackToTeam')}
                onPrimaryAction={() => navigate('/dashboard/employee-gallery')}
            />

            <LeadFolderImportModal
                open={showFolderImport}
                onClose={() => setShowFolderImport(false)}
                onSuccess={onFolderImportSuccess}
                importSource="Lead Capture Import"
                importPurpose="capture"
                hideFollowupMessage
            />
        </div>
    );
};

export default LeadCapture;
