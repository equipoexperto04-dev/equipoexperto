import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import {
    ChevronLeft, Star, Users, Zap,
    Upload, QrCode, Mail, CheckCircle2,
    MessageSquare, Globe, Loader2, Clock,
    ArrowRight, Eye, Check, Plus, Trash2,
    AlertTriangle, X, List
} from 'lucide-react';
import SuccessModal from '../components/SuccessModal';
import InlineMessagePreview from '../components/InlineMessagePreview';
import GoogleReviewLinkSearch from '../components/GoogleReviewLinkSearch';
import './CreateAutomation.css';
import API_URL from '../config.js';
import { markOnboardingDoneLocal } from '../utils/onboarding.js';

const ROLES = [
    {
        goal: 'review',
        titleKey: 'empReviewTitle',
        taglineKey: 'wizRoleReviewTagline',
        detailKey: 'wizRoleReviewDetail',
        Icon: Star,
        color: '#f59e0b',
        colorBg: 'rgba(245,158,11,0.12)',
    },
    {
        goal: 'capture',
        titleKey: 'empLeadTitle',
        taglineKey: 'wizRoleLeadTagline',
        detailKey: 'wizRoleLeadDetail',
        Icon: Users,
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.12)',
    },
    {
        goal: 'followup',
        titleKey: 'empFollowTitle',
        taglineKey: 'wizRoleFollowTagline',
        detailKey: 'wizRoleFollowDetail',
        Icon: Zap,
        color: '#8b5cf6',
        colorBg: 'rgba(139,92,246,0.12)',
    },
];

const ROLE_LABELS = {
    review: 'empReviewTitle',
    capture: 'empLeadTitle',
    followup: 'empFollowTitle',
};

/** i18n keys for experience-style template questions (review qualifying step) */
const REVIEW_QUALIFY_TEMPLATE_KEYS = [
    'wizDefaultQ1',
    'wizDefaultQ2',
    'wizDefaultQ3',
    'wizTQ12',
    'wizTQ13',
    'wizTQ14',
];

const QUALIFY_USER_TPL_STORAGE = 'mm_review_qualify_user_templates_v1';
const MAX_USER_QUALIFY_TEMPLATES = 25;

const DELAY_OPTIONS = [
    { value: '5:minutes', label: '5 min', sublabel: 'Instant' },
    { value: '1:hours',   label: '1 hr',  sublabel: 'Same day' },
    { value: '1:days',    label: '1 day', sublabel: 'Next day' },
    { value: '3:days',    label: '3 days',sublabel: 'Follow-up' },
    { value: '7:days',    label: '1 week',sublabel: 'Long-term' },
];

const createDefaultFollowup = (index) => ({
    message: index === 0 
        ? 'Hi {name}! Just checking in — are you still interested? Let me know if you have any questions!'
        : `Hey {name}, wanted to make sure you saw my last message.`,
    delay_value: index === 0 ? 1 : 3,
    delay_unit: 'days',
});

const CreateAutomation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [showInlinePreview, setShowInlinePreview] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [activeChannels, setActiveChannels] = useState({ whatsapp: true, email: true });
    const [connectedChannels, setConnectedChannels] = useState({ gmail: false, whatsapp: false });
    const [flashIdx, setFlashIdx] = useState(null);
    const [addedPill, setAddedPill] = useState(null);   // index of pill showing "✓ Added"
    /** Survey / funnel questions for Review goal only (saved as filtering_questions) */
    const [filteringQuestions, setFilteringQuestions] = useState([]);
    const [userQualifyTemplates, setUserQualifyTemplates] = useState(() => {
        try {
            const raw = localStorage.getItem(QUALIFY_USER_TPL_STORAGE);
            if (!raw) return [];
            const p = JSON.parse(raw);
            if (!Array.isArray(p)) return [];
            return p.filter((x) => typeof x === 'string' && x.trim()).slice(0, MAX_USER_QUALIFY_TEMPLATES);
        } catch {
            return [];
        }
    });
    const [customTemplateDraft, setCustomTemplateDraft] = useState('');
    const flashTimerRef = React.useRef(null);
    const pillTimerRef = React.useRef(null);
    const sequenceEndRef = React.useRef(null);

    const [formData, setFormData] = useState({
        goal: '',
        lead_sources: ['qr'],        // review: selected trigger sources
        capture_sources: ['qr'],     // capture: selected trigger sources
        followup_sources: ['excel'], // followup: selected trigger sources
        googleReviewLink: '',
        alertContact: '',
        whatsappMessage: 'Hi {name}! Thanks for choosing us. We hope you had a great experience! Would you mind sharing your feedback? {link}',
        followupDelay: '1:days',
        followupSequence: [createDefaultFollowup(0)],
    });

    const hasGoal = Boolean(formData.goal);
    const isFollowup = formData.goal === 'followup';
    const isReview = formData.goal === 'review';
    const [urlHadGoal, setUrlHadGoal] = useState(false);

    /** Review funnel: sources → message → qualifying questions → alerts; others: 3 steps */
    const wizardStepCount = isReview ? 4 : 3;
    const totalSteps = urlHadGoal ? wizardStepCount : wizardStepCount + 1;
    const wizardStep = urlHadGoal ? currentStep : currentStep - 1;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    useEffect(() => {
        const loadIntegrations = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/integrations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!data.success) return;
                const providers = new Set((data.integrations || []).map(item => item.provider));
                setConnectedChannels({
                    gmail: providers.has('google') || providers.has('microsoft'),
                    whatsapp: providers.has('whatsapp'),
                });
            } catch {
                setConnectedChannels({ gmail: false, whatsapp: false });
            }
        };
        loadIntegrations();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(QUALIFY_USER_TPL_STORAGE, JSON.stringify(userQualifyTemplates));
        } catch { /* quota / private mode */ }
    }, [userQualifyTemplates]);

    // Warn user if they try to exit mid-setup without completing hire
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Only warn if user has started the wizard but not completed it
            if (hasGoal && !showSuccess && currentStep > 1 && currentStep < totalSteps) {
                e.preventDefault();
                e.returnValue = 'You are in the middle of hiring an employee. If you leave now, your progress will be lost and the employee will NOT be hired.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasGoal, showSuccess, currentStep, totalSteps]);

    const fetchData = async (urlGoal) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success && data.config && (urlGoal === 'review' || urlGoal === 'capture')) {
                const c = data.config;
                let parsedQs = [];
                const fq = c.filtering_questions;
                if (Array.isArray(fq)) {
                    parsedQs = fq.map((q) => (typeof q === 'string' ? q : q?.question || '')).filter(Boolean);
                } else if (fq && typeof fq === 'string') {
                    try {
                        const arr = JSON.parse(fq);
                        if (Array.isArray(arr)) {
                            parsedQs = arr.map((q) => (typeof q === 'string' ? q : q?.question || '')).filter(Boolean);
                        }
                    } catch { /* ignore */ }
                }
                if (urlGoal === 'review') {
                    setFilteringQuestions(parsedQs.length > 0 ? parsedQs : ['']);
                } else {
                    setFilteringQuestions([]);
                }
                setFormData((prev) => ({
                    ...prev,
                    googleReviewLink: c.google_review_url || prev.googleReviewLink,
                    alertContact: c.notification_email || prev.alertContact,
                    whatsappMessage: c.auto_response_message || prev.whatsappMessage,
                    lead_sources: c.lead_sources || (c.lead_source ? [c.lead_source] : prev.lead_sources),
                    capture_sources: c.capture_sources || (c.capture_source ? [c.capture_source] : prev.capture_sources),
                    goal: urlGoal,
                }));
            } else if (data.success && !data.config && urlGoal === 'review') {
                setFilteringQuestions(['']);
            }
        } catch {}
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlGoal = params.get('goal') || params.get('configure');
        if (urlGoal) {
            setFormData(prev => ({ ...prev, goal: urlGoal }));
            setUrlHadGoal(true);
            setCurrentStep(1);
            fetchData(urlGoal);
        } else {
            setCurrentStep(1);
        }
    }, [location.search]);

    const handleSelect = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const toggleSource = (id) => {
        const field =
            formData.goal === 'review'   ? 'lead_sources' :
            formData.goal === 'capture'  ? 'capture_sources' : 'followup_sources';
        const current = formData[field] || [];
        const isActive = current.includes(id);
        if (isActive && current.length === 1) return; // keep at least one
        if (isActive) {
            setFormData(prev => ({ ...prev, [field]: current.filter(s => s !== id) }));
        } else {
            if (formData.goal === 'followup' && current.length >= 2) return; // followup max 2
            setFormData(prev => ({ ...prev, [field]: [...current, id] }));
        }
    };

    const addFollowup = () => {
        const current = formData.followupSequence || [];
        if (current.length >= 15) return;
        setFormData(prev => ({
            ...prev,
            followupSequence: [...current, createDefaultFollowup(current.length)]
        }));
    };

    const removeFollowup = (index) => {
        const current = formData.followupSequence || [];
        const newSequence = current.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, followupSequence: newSequence }));
    };

    const updateFollowup = (index, field, value) => {
        const current = formData.followupSequence || [];
        const newSequence = current.map((f, i) => i === index ? { ...f, [field]: value } : f);
        setFormData(prev => ({ ...prev, followupSequence: newSequence }));
    };

    const selectRole = (goal) => {
        setFormData((prev) => ({ ...prev, goal }));
        if (goal !== 'review') setFilteringQuestions([]);
        fetchData(goal);
        setCurrentStep(2);
    };

    const nextStep = () => { if (currentStep < totalSteps) setCurrentStep(v => v + 1); };
    const prevStep = () => { if (currentStep > 1) setCurrentStep(v => v - 1); };

    const handleFinalize = async () => {
        setIsFinalizing(true);
        try {
            const token = localStorage.getItem('token');
            const { goal, googleReviewLink, alertContact, whatsappMessage, followupDelay } = formData;

            if (goal === 'review' || goal === 'capture') {
                const sources = goal === 'review' ? formData.lead_sources : formData.capture_sources;
                const res = await fetch(`${API_URL}/api/config/review-funnel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        google_review_url: googleReviewLink,
                        notification_email: activeChannels.email ? alertContact : '',
                        auto_response_message: whatsappMessage,
                        filtering_questions:
                            goal === 'review'
                                ? filteringQuestions.filter((q) => q.trim()).map((q) => ({ question: q.trim() }))
                                : [],
                        lead_source: goal === 'review' ? (sources[0] || 'qr') : undefined,
                        capture_source: goal === 'capture' ? (sources[0] || 'qr') : undefined,
                        lead_sources: goal === 'review' ? sources : undefined,
                        capture_sources: goal === 'capture' ? sources : undefined,
                        goal,
                        whatsapp_enabled: activeChannels.whatsapp,
                        email_enabled: activeChannels.email,
                        is_active: goal === 'review' ? true : undefined,
                        lead_capture_active: goal === 'capture' ? true : undefined,
                    })
                });
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || 'Failed to save configuration.');
                }
            } else if (goal === 'followup') {
                const res = await fetch(`${API_URL}/api/config/lead-followup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        followup_sequence: formData.followupSequence || [createDefaultFollowup(0)],
                        is_active: true,
                        lead_sources: formData.followup_sources || ['excel'],
                        lead_source: (formData.followup_sources || ['excel'])[0],
                        goal,
                        notification_email: activeChannels.email ? alertContact : '',
                        whatsapp_enabled: activeChannels.whatsapp,
                        email_enabled: activeChannels.email,
                    })
                });
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error(errBody.message || 'Failed to save follow-up.');
                }
            }
            window.dispatchEvent(new Event('entitlements:refresh'));
            markOnboardingDoneLocal();
            try {
                const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                const token = localStorage.getItem('token');
                if (profile.email && token) {
                    const profileRes = await fetch(`${API_URL}/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            email: profile.email,
                            company_name: profile.company_name ?? '',
                            phone: profile.phone ?? '',
                            weekly_reports_enabled: profile.weekly_reports_enabled ?? true,
                            onboarding_completed: true,
                        }),
                    });
                    const profileData = await profileRes.json();
                    if (profileData.success && profileData.user) {
                        localStorage.setItem('user_profile', JSON.stringify(profileData.user));
                    }
                }
            } catch {
                /* onboarding flag is best-effort */
            }
            setShowSuccess(true);
        } catch (err) {
            setSaveError(err.message || 'Failed to save. Please try again.');
        } finally {
            setIsFinalizing(false);
        }
    };

    const currentSources =
        formData.goal === 'review'  ? (formData.lead_sources    || ['qr']) :
        formData.goal === 'capture' ? (formData.capture_sources || ['qr']) :
                                      (formData.followup_sources || ['excel']);
    const selectedRole = ROLES.find(r => r.goal === formData.goal);
    const messageHelpers = [
        { token: '{name}', label: t('wizPersonalizeName') },
        { token: '{link}', label: t('wizPersonalizeLink') },
        { token: '{number}', label: t('wizPersonalizeNumber') },
    ];

    const addQuestionFromTemplate = (rawText) => {
        const line = (rawText || '').trim();
        if (!line) return;
        setFilteringQuestions((prev) => {
            const emptyIdx = prev.findIndex((q) => q.trim() === '');
            if (emptyIdx !== -1) {
                const next = [...prev];
                next[emptyIdx] = line;
                return next;
            }
            return [...prev, line];
        });
    };

    const removeFilteringQuestionAt = (idx) => {
        setFilteringQuestions((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            return next.length === 0 ? [''] : next;
        });
    };

    /** Hide a template row once that exact question is already in the questionnaire (restores if row removed). */
    const availableQualifyTemplateKeys = REVIEW_QUALIFY_TEMPLATE_KEYS.filter((key) => {
        const templateText = t(key).trim();
        if (!templateText) return false;
        return !filteringQuestions.some((q) => q.trim() === templateText);
    });

    const availableUserQualifyTemplates = userQualifyTemplates.filter(
        (ut) =>
            ut.trim() &&
            !filteringQuestions.some((q) => q.trim() === ut.trim())
    );

    const getStepNames = () => {
        if (isFollowup) {
            const base = [t('wizStepSources'), t('wizStepMessage'), t('wizStepTiming')];
            return urlHadGoal ? base : [t('wizStepChooseRole'), ...base];
        }
        const baseNonReview = [t('wizStepTrigger'), t('wizStepMessage'), t('wizStepAlerts')];
        const baseReview = [t('wizStepTrigger'), t('wizStepMessage'), t('wizStepQualify'), t('wizStepAlerts')];
        const base = isReview ? baseReview : baseNonReview;
        return urlHadGoal ? base : [t('wizStepChooseRole'), ...base];
    };

    const stepNames = getStepNames();
    const isLastStep = currentStep === totalSteps;
    const isRoleSelectStep = !urlHadGoal && currentStep === 1;
    const fallbackEmailReady = activeChannels.email && (connectedChannels.gmail || Boolean(formData.alertContact.trim()));
    const whatsappReady = activeChannels.whatsapp && connectedChannels.whatsapp;
    const readinessChecks = [
        {
            key: 'job',
            ready: Boolean(selectedRole),
            label: selectedRole ? t(selectedRole.titleKey) : t('wizReadinessChooseJob'),
            detail: selectedRole ? t('wizReadinessJobReady') : t('wizReadinessChooseJobDetail'),
        },
        {
            key: 'source',
            ready: currentSources.length > 0,
            label: t('wizReadinessSource'),
            detail: currentSources.length > 0 ? t('wizReadinessSourceReady') : t('wizReadinessSourceMissing'),
        },
        {
            key: 'message',
            ready: Boolean(formData.whatsappMessage.trim()) || (formData.followupSequence || []).length > 0,
            label: t('wizReadinessMessage'),
            detail: t('wizReadinessMessageDetail'),
        },
        {
            key: 'channels',
            ready: fallbackEmailReady || whatsappReady,
            label: t('wizReadinessChannels'),
            detail: whatsappReady
                ? t('wizReadinessWhatsappReady')
                : fallbackEmailReady
                  ? t('wizReadinessEmailReady')
                  : t('wizReadinessFallbackReady'),
        },
    ];

    return (
        <div className="wiz-page create-automation-page">
            {/* ── Top bar ── */}
            <div className="wiz-topbar">
                <button onClick={() => {
                    // Go to previous step if not on first step
                    if (currentStep > 1) {
                        prevStep();
                    } else {
                        // On first step - confirm exit
                        if (hasGoal && !showSuccess) {
                            setShowExitConfirm(true);
                        } else {
                            navigate('/dashboard/employee-gallery');
                        }
                    }
                }} className="wiz-back-btn">
                    <ChevronLeft size={16} /> {t('backBtn')}
                </button>

                {selectedRole && (
                    <div className="wiz-role-pill">
                        <div className="wiz-role-pill-icon" style={{ background: selectedRole.colorBg }}>
                            <selectedRole.Icon size={13} style={{ color: selectedRole.color }} />
                        </div>
                        <span>{t(selectedRole.titleKey)}</span>
                    </div>
                )}

                <div className="wiz-step-counter">
                    {currentStep} / {totalSteps}
                </div>
            </div>

            {/* ── Progress bar ── */}
            <div className="wiz-progress">
                {stepNames.map((name, i) => {
                    const stepNum = i + 1;
                    const done = currentStep > stepNum;
                    const active = currentStep === stepNum;
                    return (
                        <div key={i} className={`wiz-seg ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                            <div className="wiz-seg-bar" />
                            <span className="wiz-seg-label">{name}</span>
                        </div>
                    );
                })}
            </div>

            {/* ── Body ── */}
            <div className="wiz-body">

                {/* ── ROLE SELECT ── */}
                {isRoleSelectStep && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{t('wizWhoHire')}</h2>
                            <p className="wiz-subtitle">{t('wizPickRole')}</p>
                        </div>
                        <div className="role-grid">
                            {ROLES.map(({ goal, titleKey, taglineKey, detailKey, Icon, color, colorBg }) => (
                                <button
                                    key={goal}
                                    onClick={() => selectRole(goal)}
                                    className={`role-card ${formData.goal === goal ? 'selected' : ''}`}
                                >
                                    <div className="role-card-icon" style={{ background: colorBg }}>
                                        {React.createElement(Icon, { size: 28, style: { color } })}
                                    </div>
                                    <div className="role-card-body">
                                        <div className="role-card-header">
                                            <span className="role-card-title">{t(titleKey)}</span>
                                            {formData.goal === goal && <CheckCircle2 size={16} style={{ color }} />}
                                        </div>
                                        <span className="role-card-tagline">{t(taglineKey)}</span>
                                        <span className="role-card-summary-label">{t('wizRoleWillDo')}</span>
                                        <span className="role-card-detail">{t(detailKey)}</span>
                                    </div>
                                    <div className="role-card-bar" style={{ background: color }} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TRIGGER (unified multi-select for all employee types) ── */}
                {hasGoal && wizardStep === 1 && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{isFollowup ? t('wizLeadsFrom') : t('wizHowReach')}</h2>
                            <p className="wiz-subtitle">{isFollowup ? t('wizSelectSources') : t('wizChooseChannel')}</p>
                        </div>
                        <div className="trigger-grid">
                            {(() => {
                                const availableSources = [
                                    { id: 'qr',     titleKey: 'wizTriggerQRTitle',   descKey: isFollowup ? 'wizTriggerQRFollowDesc' : 'wizTriggerQRDesc',   icon: <QrCode size={28} />,  goals: ['review','capture','followup'] },
                                    { id: 'excel',  titleKey: 'wizTriggerListTitle', descKey: 'wizTriggerListDesc', icon: <Upload size={28} />,               goals: ['review','capture','followup'] },
                                    { id: 'website',titleKey: 'wizTriggerWebTitle',  descKey: 'wizTriggerWebDesc',  icon: <Globe size={28} />,                goals: ['capture'] },
                                ].filter(s => s.goals.includes(formData.goal));
                                
                                return availableSources.map(s => {
                                    const isActive = currentSources.includes(s.id);
                                    const atMax = isFollowup && currentSources.length >= 2 && !isActive;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleSource(s.id)}
                                            disabled={atMax}
                                            className={`trigger-card ${isActive ? 'selected' : ''} ${atMax ? 'disabled' : ''}`}
                                        >
                                            <div className={`trigger-icon ${isActive ? 'active' : ''}`}>{s.icon}</div>
                                            <div className="trigger-text">
                                                <span className="trigger-title">{t(s.titleKey)}</span>
                                                <span className="trigger-desc">{t(s.descKey)}</span>
                                            </div>
                                            {isActive && <CheckCircle2 size={18} className="trigger-check" />}
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                        {currentSources.length > 0 && (
                            <div className="source-count">
                                <span className={isFollowup && currentSources.length === 2 ? 'text-accent font-bold' : ''}>
                                    {(() => {
                                        const totalCount = [
                                            { id: 'qr', goals: ['review','capture','followup'] },
                                            { id: 'excel', goals: ['review','capture','followup'] },
                                            { id: 'website', goals: ['capture'] },
                                        ].filter(s => s.goals.includes(formData.goal)).length;
                                        return t('wizSelected', { n: currentSources.length, total: totalCount });
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── MESSAGE ── */}
                {hasGoal && ((!isFollowup && wizardStep === 2) || (isFollowup && wizardStep === 2)) && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{t('wizWhatSay')}</h2>
                            <p className="wiz-subtitle">{t('wizWriteMsg')}</p>
                        </div>

                        <div className="msg-editor">
                            <div className="msg-toolbar">
                                <div className="msg-pills">
                                    {messageHelpers.map(item => (
                                        <button
                                            key={item.token}
                                            type="button"
                                            onClick={() => handleSelect('whatsappMessage', `${formData.whatsappMessage}${item.token}`)}
                                            className="msg-pill"
                                            title={item.token}
                                        >+ {item.label}</button>
                                    ))}
                                </div>
                                <span className="msg-helper-note">{t('wizPersonalizeHint')}</span>
                                <span className={`msg-char-count ${formData.whatsappMessage.length > 160 ? 'warn' : ''}`}>
                                    {formData.whatsappMessage.length}
                                </span>
                            </div>

                            <textarea
                                className="msg-textarea"
                                placeholder={t('wizWriteMsg')}
                                value={formData.whatsappMessage}
                                onChange={(e) => handleSelect('whatsappMessage', e.target.value)}
                                rows={6}
                            />

                            <button
                                type="button"
                                onClick={() => setShowInlinePreview(!showInlinePreview)}
                                className={`msg-preview-btn ${showInlinePreview ? 'active' : ''}`}
                            >
                                <Eye size={14} />
                                {showInlinePreview ? t('wizHidePreview') : t('wizLivePreview')}
                            </button>

                            {showInlinePreview && (
                                <div className="msg-preview-wrap">
                                    <InlineMessagePreview message={formData.whatsappMessage} activeChannels={activeChannels} />
                                </div>
                            )}

                            {/* Question templates + sequence editor — followup wizard only */}
                            {isFollowup && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>

                                    {/* ── Quick-add template questions ── */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>
                                                {t('wizAddQuestion')}
                                            </p>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                                — {t('wizQuickAdd')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                            {[t('wizQ1'), t('wizQ2'), t('wizQ3'), t('wizQ4'), t('wizQ5')].map((q, i) => {
                                                const wasAdded = addedPill === i;
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            const newIdx = (formData.followupSequence || []).length;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                followupSequence: [
                                                                    ...(prev.followupSequence || []),
                                                                    { message: q, delay_value: 1, delay_unit: 'days' }
                                                                ]
                                                            }));
                                                            clearTimeout(flashTimerRef.current);
                                                            clearTimeout(pillTimerRef.current);
                                                            setFlashIdx(newIdx);
                                                            setAddedPill(i);
                                                            flashTimerRef.current = setTimeout(() => setFlashIdx(null), 1400);
                                                            pillTimerRef.current = setTimeout(() => setAddedPill(null), 1600);
                                                            setTimeout(() => sequenceEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
                                                        }}
                                                        style={{
                                                            padding: '0.3rem 0.75rem',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 600,
                                                            borderRadius: '999px',
                                                            border: wasAdded ? '1px solid #16a34a' : '1px solid var(--border-color)',
                                                            background: wasAdded ? 'rgba(22,163,74,0.08)' : 'var(--bg-secondary)',
                                                            color: wasAdded ? '#16a34a' : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                        }}
                                                        onMouseEnter={e => { if (!wasAdded) { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}}
                                                        onMouseLeave={e => { if (!wasAdded) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}}
                                                    >
                                                        {wasAdded ? <><Check size={11} style={{ flexShrink: 0 }} /> Added!</> : <>+ {q}</>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ── Follow-up sequence ── */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>
                                                    {t('wizFollowupSteps')}
                                                    {(formData.followupSequence || []).length > 0 && (
                                                        <span style={{ marginLeft: '0.4rem', background: '#8b5cf6', color: '#fff', borderRadius: '999px', padding: '0 0.4rem', fontSize: '0.65rem', fontWeight: 700, verticalAlign: 'middle' }}>
                                                            {(formData.followupSequence || []).length}
                                                        </span>
                                                    )}
                                                </p>
                                                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', opacity: 0.7, margin: '0.1rem 0 0' }}>
                                                    {t('wizFollowupStepsDesc')}
                                                </p>
                                            </div>
                                        </div>

                                        {(formData.followupSequence || []).length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '1.25rem', border: '1.5px dashed var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.78rem', opacity: 0.6 }}>
                                                No steps yet — click a question above or add a custom step below.
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {(formData.followupSequence || []).map((step, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        border: flashIdx === idx ? '1.5px solid #8b5cf6' : '1px solid var(--border-color)',
                                                        borderRadius: '10px',
                                                        overflow: 'hidden',
                                                        background: flashIdx === idx ? 'rgba(139,92,246,0.04)' : 'var(--bg-secondary)',
                                                        transition: 'border-color 0.4s, background 0.4s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderRadius: '5px', padding: '0.1rem 0.4rem' }}>
                                                                {t('wizStepLabelSimple')} #{idx + 1}
                                                            </span>
                                                            <Clock size={11} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
                                                            <select
                                                                value={`${step.delay_value}:${step.delay_unit}`}
                                                                onChange={e => {
                                                                    const [v, u] = e.target.value.split(':');
                                                                    updateFollowup(idx, 'delay_value', parseInt(v));
                                                                    updateFollowup(idx, 'delay_unit', u);
                                                                }}
                                                                style={{ fontSize: '0.68rem', fontWeight: 600, border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}
                                                            >
                                                                {DELAY_OPTIONS.map(o => (
                                                                    <option key={o.value} value={o.value}>{t('wizAfter')} {o.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFollowup(idx)}
                                                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center' }}
                                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={step.message}
                                                        onChange={e => updateFollowup(idx, 'message', e.target.value)}
                                                        rows={2}
                                                        placeholder="Write this follow-up message..."
                                                        style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.8rem', resize: 'vertical', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div ref={sequenceEndRef} />

                                        {/* Add custom step */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newIdx = (formData.followupSequence || []).length;
                                                addFollowup();
                                                clearTimeout(flashTimerRef.current);
                                                setFlashIdx(newIdx);
                                                flashTimerRef.current = setTimeout(() => setFlashIdx(null), 1400);
                                            }}
                                            style={{ marginTop: '0.625rem', width: '100%', padding: '0.55rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', border: '1.5px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <Plus size={13} /> {t('wizAddCustomStep')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── QUALIFYING QUESTIONS (review funnel only) ── */}
                {hasGoal && isReview && !isFollowup && wizardStep === 3 && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{t('wizStep4TitleAsk')}</h2>
                            <p className="wiz-subtitle">{t('wizStep4InstructionReview')}</p>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0.65rem 0 0', lineHeight: 1.55 }}>
                                {t('wizQualifyShortHelp')}
                            </p>
                        </div>
                        <div className="msg-editor" style={{ marginTop: '0.25rem' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                                {t('wizYourQuestionsTitle')}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {filteringQuestions.map((q, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span
                                            style={{
                                                flexShrink: 0,
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                color: 'var(--text-secondary)',
                                                minWidth: '1.5rem',
                                            }}
                                        >
                                            {i + 1}.
                                        </span>
                                        <input
                                            type="text"
                                            className="text-input"
                                            style={{ flex: 1 }}
                                            value={q}
                                            onChange={(e) => {
                                                const next = [...filteringQuestions];
                                                next[i] = e.target.value;
                                                setFilteringQuestions(next);
                                            }}
                                            placeholder={t('wizQualifyQuestionPlaceholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFilteringQuestionAt(i)}
                                            aria-label={t('wizRemoveQuestion')}
                                            style={{
                                                flexShrink: 0,
                                                color: 'var(--text-secondary)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.35rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setFilteringQuestions([...filteringQuestions, ''])}
                                style={{
                                    marginBottom: '1rem',
                                    width: '100%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                    padding: '0.55rem 0.85rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    border: '1.5px dashed var(--border-color)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                }}
                            >
                                <Plus size={16} /> {t('wizAddQuestion')}
                            </button>

                            {availableQualifyTemplateKeys.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.65rem' }}>
                                        {t('wizQualifyStarterTitle')}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        {availableQualifyTemplateKeys.map((key) => {
                                            const templateText = t(key);
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => addQuestionFromTemplate(templateText)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '0.5rem',
                                                        padding: '0.65rem 0.85rem',
                                                        fontSize: '0.84rem',
                                                        fontWeight: 600,
                                                        lineHeight: 1.35,
                                                        borderRadius: '10px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        transition: 'border-color 0.15s, background 0.15s',
                                                        textAlign: 'left',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#f59e0b';
                                                        e.currentTarget.style.background = 'rgba(245,158,11,0.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                                    }}
                                                >
                                                    <Plus size={18} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#f59e0b' }} />
                                                    <span>{templateText}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                                    {t('wizQualifyMyTemplatesTitle')}
                                </p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.65rem', lineHeight: 1.45 }}>
                                    {t('wizQualifyMyTemplatesDesc')}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <input
                                        type="text"
                                        className="text-input"
                                        value={customTemplateDraft}
                                        onChange={(e) => setCustomTemplateDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const s = customTemplateDraft.trim();
                                                if (
                                                    !s ||
                                                    userQualifyTemplates.length >= MAX_USER_QUALIFY_TEMPLATES ||
                                                    userQualifyTemplates.some((x) => x.trim() === s)
                                                ) {
                                                    return;
                                                }
                                                setUserQualifyTemplates((prev) => [...prev, s].slice(0, MAX_USER_QUALIFY_TEMPLATES));
                                                setCustomTemplateDraft('');
                                            }
                                        }}
                                        placeholder={t('wizQualifySaveTemplatePlaceholder')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const s = customTemplateDraft.trim();
                                            if (
                                                !s ||
                                                userQualifyTemplates.length >= MAX_USER_QUALIFY_TEMPLATES ||
                                                userQualifyTemplates.some((x) => x.trim() === s)
                                            ) {
                                                return;
                                            }
                                            setUserQualifyTemplates((prev) => [...prev, s].slice(0, MAX_USER_QUALIFY_TEMPLATES));
                                            setCustomTemplateDraft('');
                                        }}
                                        disabled={
                                            !customTemplateDraft.trim() ||
                                            userQualifyTemplates.length >= MAX_USER_QUALIFY_TEMPLATES
                                        }
                                        style={{
                                            alignSelf: 'flex-start',
                                            padding: '0.45rem 1rem',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            opacity: !customTemplateDraft.trim() ? 0.5 : 1,
                                        }}
                                    >
                                        {t('wizQualifySaveTemplateBtn')}
                                    </button>
                                </div>
                                {availableUserQualifyTemplates.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        {availableUserQualifyTemplates.map((ut) => (
                                            <div
                                                key={ut}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.35rem',
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => addQuestionFromTemplate(ut)}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '0.5rem',
                                                        padding: '0.65rem 0.85rem',
                                                        fontSize: '0.84rem',
                                                        fontWeight: 600,
                                                        lineHeight: 1.35,
                                                        borderRadius: '10px',
                                                        border: '1px solid var(--border-color)',
                                                        background: 'var(--bg-secondary)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    <Plus size={18} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#3b82f6' }} />
                                                    <span>{ut}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setUserQualifyTemplates((prev) =>
                                                            prev.filter((x) => x !== ut)
                                                        )
                                                    }
                                                    aria-label={t('wizQualifyRemoveSavedTpl')}
                                                    style={{
                                                        flexShrink: 0,
                                                        padding: '0.5rem',
                                                        color: 'var(--text-secondary)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {availableQualifyTemplateKeys.length === 0 &&
                                availableUserQualifyTemplates.length === 0 &&
                                (REVIEW_QUALIFY_TEMPLATE_KEYS.length > 0 || userQualifyTemplates.length > 0) &&
                                filteringQuestions.some((q) => q.trim()) && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', lineHeight: 1.45 }}>
                                        {t('wizQualifyAllSuggestionsUsed')}
                                    </p>
                                )}
                        </div>
                    </div>
                )}

                {/* ── TIMING (followup only) ── */}
                {hasGoal && isFollowup && wizardStep === 3 && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{t('wizNotifSettings')}</h2>
                            <p className="wiz-subtitle">{t('wizNotifDesc')}</p>
                        </div>

                        {/* Email Sender Field */}
                        <div className="field-group animate-slide-up" style={{ marginTop: '0.5rem' }}>
                            <label className="field-label">{t('wizSenderEmail')}</label>
                            <div className="input-wrap">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="text-input"
                                    placeholder="your@email.com"
                                    value={formData.alertContact}
                                    onChange={(e) => handleSelect('alertContact', e.target.value)}
                                />
                            </div>
                            <p className="field-hint">{t('wizSenderHint')}</p>
                        </div>
                    </div>
                )}

                {/* ── ALERTS (review/capture only) ── */}
                {hasGoal && !isFollowup && wizardStep === (isReview ? 4 : 3) && (
                    <div className="wiz-step animate-slide-up">
                        <div className="wiz-step-heading">
                            <h2 className="wiz-title">{t('wizAlertsGo')}</h2>
                            <p className="wiz-subtitle">{t('wizAlertsDesc')}</p>
                        </div>

                        <div className="alerts-stack">
                            {/* Email field */}
                            <div className="alerts-field">
                                <label className="alerts-label">{t('wizNotifEmailLabel')}</label>
                                <div className="alerts-input-wrap">
                                    <Mail size={16} className="alerts-input-icon" />
                                    <input
                                        type="email"
                                        className="alerts-input"
                                        placeholder="your@email.com"
                                        value={formData.alertContact}
                                        onChange={(e) => handleSelect('alertContact', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Google Review URL for review type */}
                            {formData.goal === 'review' && (
                                <div className="alerts-field">
                                    <label className="alerts-label">{t('wizGoogleReviewLabel')}</label>
                                    <GoogleReviewLinkSearch
                                        value={formData.googleReviewLink}
                                        onChange={(val) => handleSelect('googleReviewLink', val)}
                                        className="alerts-input"
                                    />
                                    <p className="alerts-hint">{t('wizGoogleReviewHint')}</p>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {!isRoleSelectStep && isLastStep && (
                <>
                    <div className="hire-summary-card animate-slide-up">
                        <span className="hire-summary-label">{t('wizBeforeHireLabel')}</span>
                        <h3>{selectedRole ? t(selectedRole.titleKey) : t('wizHireEmployee')}</h3>
                        <p>{selectedRole ? t(selectedRole.detailKey) : t('wizBeforeHireFallback')}</p>
                    </div>
                    <div className="readiness-card animate-slide-up">
                        <div className="readiness-heading">
                            <h3>{t('wizReadinessTitle')}</h3>
                            <p>{t('wizReadinessSubtitle')}</p>
                        </div>
                        <div className="channel-toggle-row">
                            <button
                                type="button"
                                className={`channel-toggle ${activeChannels.whatsapp ? 'active' : ''}`}
                                onClick={() => setActiveChannels(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                            >
                                <MessageSquare size={15} />
                                {t('wizChannelWhatsapp')}
                            </button>
                            <button
                                type="button"
                                className={`channel-toggle ${activeChannels.email ? 'active' : ''}`}
                                onClick={() => setActiveChannels(prev => ({ ...prev, email: !prev.email }))}
                            >
                                <Mail size={15} />
                                {t('wizChannelEmail')}
                            </button>
                        </div>
                        <div className="readiness-list">
                            {readinessChecks.map(check => (
                                <div key={check.key} className={`readiness-item ${check.ready ? 'ready' : 'warn'}`}>
                                    {check.ready ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                    <div>
                                        <strong>{check.label}</strong>
                                        <span>{check.detail}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Footer nav ── */}
            <div className="wiz-footer">
                {saveError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.4rem 0.75rem', maxWidth: '320px' }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        {saveError}
                        <button type="button" onClick={() => setSaveError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, marginLeft: '0.25rem', display: 'flex' }}><X size={12} /></button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="wiz-btn-back"
                        style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
                    >
                        <ChevronLeft size={16} /> {t('backBtn')}
                    </button>

                    {isRoleSelectStep ? (
                        <button
                            disabled={!formData.goal}
                            onClick={nextStep}
                            className="wiz-btn-next"
                        >
                            {t('continueBtn')} <ArrowRight size={16} />
                        </button>
                    ) : isLastStep ? (
                        <button
                            disabled={isFinalizing}
                            onClick={() => { setSaveError(''); handleFinalize(); }}
                            className="wiz-btn-hire"
                        >
                            {isFinalizing
                                ? <><Loader2 className="animate-spin" size={18} /> {t('wizHiring')}</>
                                : <>{t('wizHireEmployee')} <ArrowRight size={18} /></>
                            }
                        </button>
                    ) : (
                        <button onClick={nextStep} className="wiz-btn-next">
                            {t('nextBtn')} <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => navigate('/dashboard/employee-gallery')}
                title={t('wizSuccessTitle')}
                message={
                    formData.goal === 'review'
                        ? t('wizSuccessReview')
                        : formData.goal === 'capture'
                          ? t('wizSuccessCapture')
                          : t('wizSuccessFollowup')
                }
                primaryActionText={
                    formData.goal === 'followup'
                        ? t('wizSuccessPrimaryFollowup')
                        : t('wizSuccessPrimary')
                }
                onPrimaryAction={() => {
                    const paths = { review: '/dashboard/config/review-funnel', capture: '/dashboard/config/lead-capture', followup: '/dashboard/config/lead-followup' };
                    navigate(paths[formData.goal] || '/dashboard/employee-gallery');
                }}
                secondaryActionText={t('wizSuccessSecondary')}
                onSecondaryAction={() => navigate('/dashboard/employee-gallery')}
            />

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
                    <div className="modal-content exit-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="exit-confirm-header">
                            <div className="exit-confirm-icon">
                                <AlertTriangle size={28} />
                            </div>
                            <button className="modal-close" onClick={() => setShowExitConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <h3 className="exit-confirm-title">{t('wizExitTitle')}</h3>
                        <p className="exit-confirm-message">
                            {t('wizExitMsg')}
                        </p>
                        <div className="exit-confirm-actions">
                            <button
                                className="exit-confirm-btn exit-confirm-stay"
                                onClick={() => setShowExitConfirm(false)}
                            >
                                {t('wizStayBtn')}
                            </button>
                            <button
                                className="exit-confirm-btn exit-confirm-leave"
                                onClick={() => navigate('/dashboard/employee-gallery')}
                            >
                                {t('wizExitBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateAutomation;
