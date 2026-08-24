import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { usePlanEntitlements } from '../../context/PlanEntitlementsContext';
import { useToast } from '../../components/Toast';
import {
    Save,
    Zap, Loader2,
    Plus, Trash2,
} from 'lucide-react';
// Zap used as Follow-up Agent icon

import LeadFolderImportModal from '../../components/LeadFolderImportModal.jsx';
import EmployeeWorkspaceHeader from '../../components/EmployeeWorkspaceHeader.jsx';
import {
    EmployeeConfigGrid,
    EmployeeConfigMain,
    EmployeeConfigAside,
    EmployeeConfigCard,
    EmployeeConfigField,
    EmployeeConfigPlatformsCard,
    EmployeeConfigImportSection,
    EmployeeConfigSidebar,
    EmployeeConfigSaveBar,
} from '../../components/employee-config/EmployeeConfigHub.jsx';
import WizardFollowupSchedule from '../../components/wizard/WizardFollowupSchedule.jsx';
import WizardFollowupMessages from '../../components/wizard/WizardFollowupMessages.jsx';
import '../../components/wizard/WizardFollowup.css';
import {
    parseFollowupFromConfig,
    sortFollowupStepsByDays,
    canAddMoreFollowupSteps,
    createFollowupStep,
    MAX_FOLLOWUP_STEPS_UI,
    reindexFollowupSteps,
    mergeTimelineIntoSequence,
    buildFollowupSequence,
    isFollowupScheduleValid,
} from '../../utils/followupWizard.js';
import { getEmployeeByGoal, getEmployeeWizardPath } from '../../constants/employees.js';
import { isEmployeeConfigured } from '../../utils/employeeConfigured.js';
import './Config.css';
import '../../components/employee-config/EmployeeConfigHub.css';
import API_URL from '../../config.js';
import {
    saveConfigResume,
    loadConfigResume,
    clearConfigResume,
    isConfigOAuthReturn,
    configOAuthJobId,
} from '../../utils/configResume.js';

const LeadFollowUp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const resumeKey = configOAuthJobId('followup');
    const emp = getEmployeeByGoal('followup');
    const { toast: toastNotify } = useToast();
    const { entitlements } = usePlanEntitlements();

    // Pre-fill email from signup account
    const userProfile = (() => {
        try {
            return JSON.parse(localStorage.getItem('user_profile') || '{}');
        } catch {
            return {};
        }
    })();
    const defaultEmail = userProfile.email || '';
    const templateUserId = userProfile.id ?? userProfile.user_id ?? userProfile.email ?? 'guest';

    /** UI cap for sequence steps — null / unlimited tier uses a generous cap. */
    const maxFollowupStepsUi =
        entitlements.max_followup_sequence_steps == null
            ? MAX_FOLLOWUP_STEPS_UI
            : entitlements.max_followup_sequence_steps;

    const [isLoading, setIsLoading] = useState(false);
    const [isConfigLoading, setIsConfigLoading] = useState(true);

    const [showDelayDropdown, setShowDelayDropdown] = useState(false);
    const [editingFollowupIndex, setEditingFollowupIndex] = useState(null);

    const delayRef = useRef(null);
    const textareaRef = useRef(null);
    const followupRefs = useRef([]);

    const [config, setConfig] = useState({
        is_active: false,
        followup_sequence: [
            { delay_value: 1, delay_unit: 'days', message: "Hi {NAME}, it's been a few hours since we last spoke. Just wanted to check if you had any other questions?" },
            { delay_value: 3, delay_unit: 'days', message: "Hi again {NAME}! Just a quick nudge — are you still interested?" }
        ],
        followup_next_step_done: false,
        lead_source: 'excel',
        lead_sources: ['excel'],
        whatsapp_enabled: true,
        email_enabled: true,
        notification_email: defaultEmail
    });
    
    const [originalConfig, setOriginalConfig] = useState(null);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const [integratedGmail, setIntegratedGmail] = useState('Not Integrated');
    const [activityStatus, setActivityStatus] = useState({ status: 'off_duty', is_active: false });
    const [showFolderImport, setShowFolderImport] = useState(false);
    const [importResult, setImportResult] = useState(null); // { count, skipped, isActive, firstDelay }
    const [importError, setImportError] = useState('');
    // Persist last upload so user can always find what they uploaded
    const [lastUpload, setLastUpload] = useState(() => {
        try { return JSON.parse(localStorage.getItem('followup_last_upload') || 'null'); } catch { return null; }
    });
    const [createdAt, setCreatedAt] = useState(null);
    const [waConnected, setWaConnected] = useState(false);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

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
            setGmailEmail(gmail?.email || gmail?.account_id || integratedGmail || '');
        } catch (e) {
            console.error('[LeadFollowUp] connections', e);
        }
    }, [integratedGmail]);

    const messageVariables = [
        { label: 'Name', key: '{NAME}' },
        { label: 'Your Business Name', key: '{COMPANY}' },
        { label: 'Link', key: '{LINK}' },
    ];

    const timelineSteps = useMemo(
        () => parseFollowupFromConfig(config.followup_sequence).steps,
        [config.followup_sequence],
    );

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        if (profile.email) setIntegratedGmail(profile.email);
        fetchConfig();
        fetchActivityStatus();
        // Poll activity status every 30 seconds
        const interval = setInterval(fetchActivityStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/lead-followup`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 404 = not hired yet; other non-2xx = server error (keep showing loading, don't crash)
            if (res.status === 404) {
                navigate(getEmployeeWizardPath('followup'), { replace: true });
                return;
            }
            if (!res.ok) {
                console.error('Follow-up config fetch failed:', res.status);
                setIsConfigLoading(false);
                return;
            }

            const data = await res.json();

            // Fetch integrations for official Gmail address
            const intRes = await fetch(`${API_URL}/api/integrations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const intData = await intRes.json();
            let freshIntegratedGmail = 'Not Integrated';
            
            if (intData.success && intData.integrations) {
                const googleInt = intData.integrations.find(i => i.provider === 'google');
                if (googleInt) {
                    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                    const accountEmail = googleInt.email || googleInt.identifier;
                    if (accountEmail) {
                        freshIntegratedGmail = accountEmail;
                    } else if (profile.email) {
                        freshIntegratedGmail = profile.email;
                    } else if (googleInt.account_id && !googleInt.account_id.includes('fetched_via_api')) {
                        freshIntegratedGmail = googleInt.account_id;
                    } else {
                        freshIntegratedGmail = 'Connected';
                    }
                    setIntegratedGmail(freshIntegratedGmail);
                }
            }

            if (data.success && data.config && isEmployeeConfigured('followup', data.config)) {
                // Determine if we should use a default email
                let emailToUse = data.config.notification_email;
                if (!emailToUse || emailToUse === 'hello@business.com') {
                    if (freshIntegratedGmail !== 'Not Integrated' && freshIntegratedGmail !== 'Connected') {
                        emailToUse = freshIntegratedGmail;
                    } else {
                        emailToUse = defaultEmail;
                    }
                }

                // Handle new followup_sequence format, fallback to old format for backwards compatibility
                let followupSequence = data.config.followup_sequence;
                if (!followupSequence && data.config.message) {
                    // Convert old format to new sequence format
                    followupSequence = [{
                        delay_value: data.config.delay_value || 24,
                        delay_unit: data.config.delay_unit || 'hours',
                        message: data.config.message
                    }];
                    // Add second follow-up if reminder was active
                    if (data.config.reminder_active && data.config.reminder_message) {
                        followupSequence.push({
                            delay_value: data.config.reminder_delay_value || 48,
                            delay_unit: data.config.reminder_delay_unit || 'hours',
                            message: data.config.reminder_message
                        });
                    }
                }

                const sequenceForState = followupSequence || config.followup_sequence;

                const initialData = {
                    ...config,
                    is_active: data.config.lead_followup_active === true || data.config.is_active === true,
                    followup_sequence: sequenceForState,
                    lead_source: data.config.lead_source || 'excel',
                    lead_sources: data.config.lead_sources || [data.config.lead_source || 'excel'],
                    whatsapp_enabled: data.config.whatsapp_enabled ?? true,
                    email_enabled: data.config.email_enabled ?? true,
                    notification_email: emailToUse,
                    followup_next_step_done: data.config.followup_next_step_done === true,
                };
                setConfig(initialData);
                setOriginalConfig(initialData);
                setInitialLoaded(true);
                if (data.config.updated_at) setCreatedAt(data.config.updated_at);
                await refreshConnections();

                if (isConfigOAuthReturn(searchParams)) {
                    const resume = loadConfigResume(resumeKey);
                    if (resume?.config) {
                        setConfig({ ...resume.config, email_enabled: true });
                        setOriginalConfig(resume.originalConfig ?? resume.config);
                    } else {
                        setConfig((c) => ({ ...c, email_enabled: true }));
                    }
                    clearConfigResume(resumeKey);
                    navigate('/dashboard/config/lead-followup', { replace: true });
                }
            } else {
                // Not hired yet — redirect to creation wizard
                navigate(getEmployeeWizardPath('followup'), { replace: true });
                return;
            }

        } catch (error) {
            console.error('Error fetching follow-up config:', error);
        } finally {
            setIsConfigLoading(false);
        }
    };

    const fetchActivityStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/stats/activity?employee=followup`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setActivityStatus({
                    status: data.status,
                    is_active: data.is_active,
                    last_activity: data.last_activity,
                    pending_count: data.pending_count,
                    sent_today: data.sent_today,
                    detailed_stats: data.detailed_stats
                });
            }
        } catch (error) {
            console.error('Error fetching activity status:', error);
        }
    };

    const onFolderImportSuccess = (data) => {
        const imported = data.imported ?? 0;
        const fileDups = data.fileDups ?? 0;
        const dbDups = data.dbDups ?? 0;
        const total = data.total ?? imported;
        const seq = config.followup_sequence || [];
        const firstDelay = seq.length > 0
            ? `${seq[0].delay_value} ${seq[0].delay_unit}`
            : null;
        setImportResult({ count: imported, fileDups, dbDups, total, firstDelay });
        setImportError('');
        // Persist so user can find their list after page reload
        const uploadRecord = { count: imported, total, date: new Date().toISOString(), folderName: data.folderName || '' };
        localStorage.setItem('followup_last_upload', JSON.stringify(uploadRecord));
        setLastUpload(uploadRecord);
        if (imported > 0) {
            window.dispatchEvent(new CustomEvent('showNotifPopup', {
                detail: {
                    count: imported,
                    message: `${imported} contact${imported > 1 ? 's' : ''} added to "${data.folderName}"! View in Leads.`,
                },
            }));
            localStorage.setItem('glowLeads', 'true');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('triggerLeadsGlow'));
        }
    };

    const handleToggle = async () => {
        const next = !config.is_active;
        setConfig(c => ({ ...c, is_active: next }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/lead-followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...config, is_active: next }),
            });
            let data = {};
            try {
                data = await res.json();
            } catch {
                /* non-JSON */
            }
            if (res.ok && data.success && data.config) {
                const done = data.config.followup_next_step_done === true;
                setConfig(c => ({ ...c, is_active: next, followup_next_step_done: done }));
                setOriginalConfig(c => ({ ...c, is_active: next, followup_next_step_done: done }));
            } else {
                setConfig(c => ({ ...c, is_active: !next }));
            }
        } catch {
            setConfig(c => ({ ...c, is_active: !next }));
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const { steps: stepsToSave } = parseFollowupFromConfig(config.followup_sequence);
        if (!isFollowupScheduleValid(stepsToSave)) {
            toastNotify(t('wizFollowupScheduleInvalid'), 'warning');
            return;
        }
        const payload = {
            ...config,
            followup_sequence: buildFollowupSequence(stepsToSave),
        };
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/lead-followup`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                const merged = data.config?.followup_next_step_done === true
                    ? { ...config, followup_next_step_done: true }
                    : config;
                setConfig(merged);
                setOriginalConfig({ ...merged });
                // Refresh activity status after save
                fetchActivityStatus();
                // Show brief toast notification instead of modal
                const toastEl = document.createElement('div');
                toastEl.className = 'save-toast';
                toastEl.innerHTML = '<span class="save-toast-check">✓</span> Saved';
                document.body.appendChild(toastEl);
                setTimeout(() => {
                    toastEl.classList.add('show');
                    setTimeout(() => {
                        toastEl.classList.remove('show');
                        setTimeout(() => toastEl.remove(), 300);
                    }, 1500);
                }, 10);
            } else if (data.code === 'FOLLOWUP_SEQUENCE_PLAN_LIMIT') {
                toastNotify(
                    t('planFollowupSequenceLimit', { max: data.max_steps ?? maxFollowupStepsUi }),
                    'warning'
                );
            }
        } catch (error) {
            console.error('Error saving config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const insertVariable = (variable, stepId = null) => {
        const textarea = stepId ? followupRefs.current[stepId] : textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const step = stepId
            ? timelineSteps.find((s) => s.id === stepId)
            : null;
        const text = step ? step.text : '';
        const before = text.substring(0, start);
        const after = text.substring(end);

        const newMessage = before + variable + after;
        if (stepId) {
            handleFollowupMessageChange(stepId, newMessage);
        }

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const addFollowup = () => {
        const current = config.followup_sequence || [];
        const { steps } = parseFollowupFromConfig(current);
        if (!canAddMoreFollowupSteps(steps.length, maxFollowupStepsUi)) {
            toastNotify(t('planFollowupSequenceLimit', { max: maxFollowupStepsUi }), 'warning');
            return;
        }
        const lastDays = steps[steps.length - 1]?.days || 0;
        const newStep = createFollowupStep(steps.length + 1, lastDays);
        newStep.text = `Hi {NAME}, just checking in!`;
        const next = sortFollowupStepsByDays([...steps, newStep]);
        setConfig((prev) => ({
            ...prev,
            followup_sequence: mergeTimelineIntoSequence(next, prev.followup_sequence),
        }));
    };

    const handleTimelineDayChange = (id, days) => {
        const next = sortFollowupStepsByDays(
            timelineSteps.map((s) => (s.id === id ? { ...s, days } : s)),
        );
        setConfig((prev) => ({
            ...prev,
            followup_sequence: mergeTimelineIntoSequence(next, prev.followup_sequence),
        }));
    };

    const handleTimelineAddStep = () => {
        addFollowup();
    };

    const handleTimelineRemoveStep = (id) => {
        if (timelineSteps.length <= 1) {
            toastNotify(t('wizFollowupMinOneStep'), 'warning');
            return;
        }
        const next = sortFollowupStepsByDays(
            reindexFollowupSteps(timelineSteps.filter((s) => s.id !== id)),
        );
        setConfig((prev) => ({
            ...prev,
            followup_sequence: mergeTimelineIntoSequence(next, prev.followup_sequence),
        }));
    };

    const handleFollowupMessageChange = (id, text) => {
        const next = timelineSteps.map((s) => (s.id === id ? { ...s, text } : s));
        setConfig((prev) => ({
            ...prev,
            followup_sequence: mergeTimelineIntoSequence(next, prev.followup_sequence),
        }));
    };

    const hasChanges = initialLoaded && (originalConfig !== null) && JSON.stringify(config) !== JSON.stringify(originalConfig);

    if (isConfigLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="wa-loader"></div>
            </div>
        );
    }

    const sourceLabel = (config.lead_sources?.[0] || config.lead_source || 'excel');

    return (
        <div className="dashboard-page cfg-page cfg-page--hub animate-fade-in" style={{ '--cfg-accent': '#8b5cf6', '--cfg-accent-bg': 'rgba(139,92,246,0.07)', '--cfg-accent-border': 'rgba(139,92,246,0.25)' }}>
            <EmployeeWorkspaceHeader
                variant="hub"
                Icon={emp?.Icon || Zap}
                title={t('empFollowShort')}
                subtitle={t('echTypeFollowup')}
                accent="#8b5cf6"
                accentBg="rgba(139,92,246,0.1)"
                statusLabel={config.is_active ? t('echStatusActive') : t('echStatusPaused')}
                statusActive={config.is_active}
            />

            <form onSubmit={handleSave}>
                <EmployeeConfigGrid>
                    <EmployeeConfigMain>
                        <EmployeeConfigCard title={t('echFollowupSchedule')}>
                            <WizardFollowupSchedule
                                steps={timelineSteps}
                                onDayChange={handleTimelineDayChange}
                                onAddStep={handleTimelineAddStep}
                                onRemoveStep={handleTimelineRemoveStep}
                                planMaxSteps={maxFollowupStepsUi}
                                accentColor="#8b5cf6"
                            />
                        </EmployeeConfigCard>

                        <EmployeeConfigCard title={t('cfgTabFollowupMessages')}>
                                <p className="ech-hint" style={{ marginTop: 0 }}>{t('cfgFollowSequenceHint')}</p>
                                <p className="cfg-hint" style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                                    {entitlements.max_followup_sequence_steps == null
                                        ? t('planFollowupSequenceUnlimitedUi')
                                        : t('planFollowupSequenceStepsHint')}
                                </p>
                                {timelineSteps.length === 0 ? (
                                    <div className="cfg-empty-state-small" style={{ marginTop: '0.75rem' }}>
                                        <p>{t('cfgNoFollowupsYet')}</p>
                                        <p style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>{t('cfgAddFirstFollowup')}</p>
                                    </div>
                                ) : (
                                    <WizardFollowupMessages
                                        showHeader={false}
                                        steps={timelineSteps}
                                        userId={templateUserId}
                                        onMessageChange={handleFollowupMessageChange}
                                        onAddStep={
                                            canAddMoreFollowupSteps(timelineSteps.length, maxFollowupStepsUi)
                                                ? addFollowup
                                                : undefined
                                        }
                                        onRemoveStep={handleTimelineRemoveStep}
                                        canAdd={canAddMoreFollowupSteps(timelineSteps.length, maxFollowupStepsUi)}
                                        accentColor="#8b5cf6"
                                        onRegisterTextarea={(stepId, el) => {
                                            followupRefs.current[stepId] = el;
                                        }}
                                        messageVariables={messageVariables}
                                        onInsertVariable={(stepId, key) => insertVariable(key, stepId)}
                                    />
                                )}
                                {timelineSteps.length === 0 && canAddMoreFollowupSteps(0, maxFollowupStepsUi) && (
                                    <button type="button" onClick={addFollowup} className="add-followup-btn" style={{ marginTop: '0.75rem' }}>
                                        <Plus size={18} />
                                        {t('cfgAddFollowup')}
                                    </button>
                                )}
                        </EmployeeConfigCard>

                        <EmployeeConfigCard title={t('cfgTabNotifications')}>
                            <EmployeeConfigField label={t('cfgNotifHeading')} hint={t('cfgNotifDesc')}>
                                <input
                                    type="email"
                                    className="ech-input"
                                    placeholder="your@email.com"
                                    name="notification_email"
                                    value={config.notification_email}
                                    onChange={handleChange}
                                />
                            </EmployeeConfigField>
                        </EmployeeConfigCard>

                        {activityStatus.detailed_stats && (
                            <EmployeeConfigCard title={t('cfgPerformanceMetrics') || 'Performance Metrics'}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Follow-up Messages Sent</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{activityStatus.detailed_stats.sent || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Leads Replied</span>
                                            <span style={{ color: '#10b981', fontWeight: 700 }}>{activityStatus.detailed_stats.replied || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </EmployeeConfigCard>
                        )}

                        <EmployeeConfigPlatformsCard
                            jobId="followup"
                            accentColor="#8b5cf6"
                            purpose="followup"
                            waConnected={waConnected}
                            gmailConnected={gmailConnected}
                            gmailEmail={gmailEmail}
                            channelPrefs={config}
                            onChannelPrefsChange={(patch) => setConfig((c) => ({ ...c, ...patch }))}
                            onConnectionsRefresh={refreshConnections}
                            onBeforeOAuthRedirect={() =>
                                saveConfigResume(resumeKey, { config, originalConfig })
                            }
                        />

                        <EmployeeConfigImportSection
                            title={t('cfgTabImportContacts')}
                            description={t('cfgUploadContactsFollowup')}
                            accentColor="#8b5cf6"
                            lastUpload={lastUpload}
                            importResult={importResult}
                            importError={importError}
                            onImport={() => setShowFolderImport(true)}
                            onClearResult={() => setImportResult(null)}
                            isActive={config.is_active}
                            onActivate={handleToggle}
                        />
                    </EmployeeConfigMain>

                    <EmployeeConfigAside>
                        <EmployeeConfigSidebar
                            employeeKey="followup"
                            typeLabel={t('echTypeFollowup')}
                            sourceLabel={sourceLabel}
                            createdAt={createdAt}
                            isActive={config.is_active}
                            onRunNow={() => setShowFolderImport(true)}
                            onToggleActive={handleToggle}
                        />
                    </EmployeeConfigAside>
                </EmployeeConfigGrid>

                <EmployeeConfigSaveBar hasChanges={hasChanges} isSaving={isLoading} />
            </form>

            <LeadFolderImportModal
                open={showFolderImport}
                onClose={() => setShowFolderImport(false)}
                onSuccess={onFolderImportSuccess}
                importSource="Lead Follow-up Import"
                skipCapture
                importPurpose="followup"
            />
        </div>
    );
};

export default LeadFollowUp;
