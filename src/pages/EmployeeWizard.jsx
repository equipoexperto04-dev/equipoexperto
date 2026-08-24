import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, ArrowRight, CheckCircle2, Loader2, Globe,
    Settings, Play, Pause, Trash2, MessageSquare, TrendingUp,
    AlertTriangle, Bell, Ban, RefreshCw, LayoutDashboard, Shield, ShieldCheck
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { usePlanEntitlements } from '../context/PlanEntitlementsContext';
import { useToast } from '../components/Toast';
import API_URL from '../config.js';
import { isEmployeeConfigured } from '../utils/employeeConfigured.js';
import { normalizeContactSources } from '../utils/contactSources.js';
import QualifyQuestionsEditor from '../components/QualifyQuestionsEditor.jsx';
import EmployeeWizardStepper from '../components/EmployeeWizardStepper.jsx';
import EmployeeWizardSkeleton from '../components/EmployeeWizardSkeleton.jsx';
import WizardSourceStep from '../components/wizard/WizardSourceStep.jsx';
import WizardFollowupSchedule from '../components/wizard/WizardFollowupSchedule.jsx';
import WizardFollowupMessages from '../components/wizard/WizardFollowupMessages.jsx';
import GoogleReviewLinkSearch from '../components/GoogleReviewLinkSearch.jsx';
import {
    createDefaultFollowupSteps,
    createFollowupStep,
    reindexFollowupSteps,
    MAX_FOLLOWUP_STEPS_UI,
    parseFollowupFromConfig,
    buildFollowupSequence,
    isFollowupScheduleValid,
    isFollowupMessagesValid,
    sortFollowupStepsByDays,
    canAddMoreFollowupSteps,
} from '../utils/followupWizard.js';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';
import {
    loadWizardResume,
    clearWizardResume,
    isWizardOAuthReturn,
    initialWizardStep,
    normalizeWizardStep,
} from '../utils/wizardResume.js';
import { ensureCaptureAutomationAssets } from '../utils/captureEmbedCode.js';
import './EmployeeWizard.css';

const VALID_JOB_IDS = new Set(['review', 'capture', 'followup']);

const RECIPE_BY_JOB_ID = {
    review:   'reviewFunnel',
    capture:  'leadCapture',
    followup: 'leadFollowUp',
};

const CONFIG_PATH = {
    review:   '/dashboard/config/review-funnel',
    capture:  '/dashboard/config/lead-capture',
    followup: '/dashboard/config/lead-followup',
};

const SUMMARY_STEPS = {
    review: {
        strategy: { en: 'Balanced Mode', es: 'Modo Equilibrado' },
        willDo: [
            {
                icon: 'MessageSquare',
                color: '#10b981',
                text: {
                    en: 'Ask customers for private feedback before any review request',
                    es: 'Solicitar opinión privada antes de pedir una reseña pública',
                }
            },
            {
                icon: 'TrendingUp',
                color: '#10b981',
                text: {
                    en: 'Send Google review link only to customers rating 4+ stars',
                    es: 'Enviar enlace de reseña de Google solo a valoraciones de 4+ estrellas',
                }
            },
            {
                icon: 'AlertTriangle',
                color: '#f59e0b',
                text: {
                    en: 'Alert you instantly when a customer rates 3 stars or below',
                    es: 'Alertar al instante si un cliente valora con 3 estrellas o menos',
                }
            },
            {
                icon: 'Bell',
                color: '#3b82f6',
                text: {
                    en: 'Send one follow-up reminder after 24 hours of no response',
                    es: 'Enviar un recordatorio tras 24 horas sin respuesta',
                }
            },
            {
                icon: 'Ban',
                color: '#f97316',
                text: {
                    en: 'Stop messaging after 4 attempts',
                    es: 'Detener mensajes después de 4 intentos',
                }
            },
            {
                icon: 'RefreshCw',
                color: '#8b5cf6',
                text: {
                    en: 'Cooldown: never re-contact the same customer within 14 days',
                    es: 'Intervalo de espera: no volver a contactar en 14 días',
                }
            },
            {
                icon: 'LayoutDashboard',
                color: '#94a3b8',
                text: {
                    en: 'Track all conversations, ratings, and review rates in your dashboard',
                    es: 'Seguimiento de conversaciones, valoraciones y tasas en el panel',
                }
            }
        ]
    },
    capture: {
        strategy: { en: 'Instant Capture', es: 'Captura Instantánea' },
        willDo: [
            {
                icon: 'Globe',
                color: '#3b82f6',
                text: {
                    en: 'Present a premium contact form on your website or via QR code',
                    es: 'Mostrar un formulario de contacto en tu web o vía código QR',
                }
            },
            {
                icon: 'MessageSquare',
                color: '#10b981',
                text: {
                    en: 'Capture lead details and custom questionnaire answers',
                    es: 'Capturar datos de contacto y respuestas del cuestionario',
                }
            },
            {
                icon: 'TrendingUp',
                color: '#10b981',
                text: {
                    en: 'Send an instant automated response via WhatsApp or Email',
                    es: 'Enviar respuesta automática al instante por WhatsApp o Email',
                }
            },
            {
                icon: 'AlertTriangle',
                color: '#f59e0b',
                text: {
                    en: 'Alert you immediately via email when a new lead is captured',
                    es: 'Notificar de inmediato por email al recibir un nuevo contacto',
                }
            },
            {
                icon: 'Ban',
                color: '#f97316',
                text: {
                    en: 'Check double entries automatically to avoid duplicate leads',
                    es: 'Evitar duplicados comprobando entradas dobles automáticamente',
                }
            },
            {
                icon: 'RefreshCw',
                color: '#8b5cf6',
                text: {
                    en: 'Cooldown: never re-contact the same customer within 14 days',
                    es: 'Intervalo de espera: no volver a contactar en 14 días',
                }
            },
            {
                icon: 'LayoutDashboard',
                color: '#94a3b8',
                text: {
                    en: 'Track all captures, conversions, and statistics in your dashboard',
                    es: 'Seguimiento de captaciones y estadísticas en tu panel',
                }
            }
        ]
    },
    followup: {
        strategy: { en: 'Smart Sequence', es: 'Secuencia Inteligente' },
        willDo: [
            {
                icon: 'Globe',
                color: '#3b82f6',
                text: {
                    en: 'Import contacts from your uploaded lists or previous files',
                    es: 'Importar contactos desde archivos subidos o listas previas',
                }
            },
            {
                icon: 'MessageSquare',
                color: '#10b981',
                text: {
                    en: 'Start an automated message sequence to check in with leads',
                    es: 'Iniciar secuencia de mensajes automática para entablar contacto',
                }
            },
            {
                icon: 'TrendingUp',
                color: '#10b981',
                text: {
                    en: 'Send follow-up touchpoint messages on your custom schedule',
                    es: 'Enviar mensajes de seguimiento según tu horario personalizado',
                }
            },
            {
                icon: 'Ban',
                color: '#f97316',
                text: {
                    en: 'Stop sending follow-up messages immediately when a lead replies',
                    es: 'Pausar el seguimiento de inmediato si el lead responde',
                }
            },
            {
                icon: 'AlertTriangle',
                color: '#f59e0b',
                text: {
                    en: 'Keep lead status organized so you never lose a hot prospect',
                    es: 'Mantener organizado el estado del lead para no perder ventas',
                }
            },
            {
                icon: 'RefreshCw',
                color: '#8b5cf6',
                text: {
                    en: 'Cooldown: never re-contact the same customer within 14 days',
                    es: 'Intervalo de espera: no volver a contactar en 14 días',
                }
            },
            {
                icon: 'LayoutDashboard',
                color: '#94a3b8',
                text: {
                    en: 'Track all conversations, replies, and status in your dashboard',
                    es: 'Seguimiento de conversaciones, respuestas y estados en tu panel',
                }
            }
        ]
    }
};

const ICON_COMPONENTS = {
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    Bell,
    Ban,
    RefreshCw,
    LayoutDashboard,
    Globe
};

/** Shipped with the bundle so hire success never shows raw i18n keys if locale JSON is stale. */
const HIRE_SUCCESS_I18N = {
    en: {
        wizSuccessTitle: 'Employee hired and turned on',
        wizSuccessReview:
            'Your Review employee is live. Share the QR code or link with customers and every response will be handled automatically.',
        wizSuccessCapture:
            'Your Lead Capture employee is live. Share the form link or QR code and new enquiries will be saved and answered automatically.',
        wizSuccessFollowup:
            'Your Follow-up employee is live. Import contacts and they will enter the follow-up sequence automatically.',
        wizSummaryTitle: 'What you set up',
        wizSummarySources: 'Contact sources',
        wizSummaryQuestions: 'Questions',
        wizSummaryMessage: 'Message',
        wizSummaryEmail: 'Alert email',
        wizSummaryGoogleReview: 'Google review link',
        wizBackToTeam: 'Back to your team',
        wizStepSummaryTitle: 'Review & hire',
        wizStepSummarySub: 'Check your setup below, then hire your employee.',
        wizSummarySequence: 'Follow-up messages',
        wizSummaryNotSet: 'Not set yet — you can edit this in Employee Profile.',
        wizSummaryNextFollowup: 'Next: open this employee and import your contact list to start follow-ups.',
        wizSummaryNextCapture: 'Next: share your form link or QR code so new leads can reach you.',
        wizSummaryNextReview: 'Next: share your review QR or link with customers after each visit.',
    },
    es: {
        wizSuccessTitle: 'Empleado contratado y activado',
        wizSuccessReview:
            'Tu empleado de reseñas está activo. Comparte el código QR o el enlace con tus clientes y cada respuesta se gestionará automáticamente.',
        wizSuccessCapture:
            'Tu empleado de captación está activo. Comparte el enlace del formulario o el código QR y las consultas nuevas se guardarán y responderán solas.',
        wizSuccessFollowup:
            'Tu empleado de seguimiento está activo. Importa contactos y entrarán en la secuencia de seguimiento automáticamente.',
        wizSummaryTitle: 'Lo que configuraste',
        wizSummarySources: 'Fuentes de contacto',
        wizSummaryQuestions: 'Preguntas',
        wizSummaryMessage: 'Mensaje',
        wizSummaryEmail: 'Email de alertas',
        wizSummaryGoogleReview: 'Enlace de reseñas en Google',
        wizBackToTeam: 'Volver a tu equipo',
        wizStepSummaryTitle: 'Revisar y contratar',
        wizStepSummarySub: 'Revisa la configuración abajo y luego contrata a tu empleado.',
        wizSummarySequence: 'Mensajes de seguimiento',
        wizSummaryNotSet: 'Sin configurar — puedes editarlo en Perfil del empleado.',
        wizSummaryNextFollowup: 'Siguiente: abre este empleado e importa tu lista de contactos para iniciar los seguimientos.',
        wizSummaryNextCapture: 'Siguiente: comparte el enlace del formulario o el código QR para recibir leads.',
        wizSummaryNextReview: 'Siguiente: comparte el QR o enlace de reseñas con tus clientes después de cada visita.',
    },
};

const EmployeeWizard = () => {
    const { jobId: jobIdParam } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, language } = useTranslation();
    const { toast } = useToast();

    const templateUserId = useMemo(() => {
        try {
            const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
            return p.id ?? p.user_id ?? p.email ?? 'guest';
        } catch {
            return 'guest';
        }
    }, []);

    const jobId = jobIdParam && VALID_JOB_IDS.has(jobIdParam) ? jobIdParam : undefined;

    const [step, setStep] = useState(() => initialWizardStep(jobIdParam, new URLSearchParams(window.location.search)));
    const [isConfigured, setIsConfigured] = useState(false);
    const [isActive, setIsActive]       = useState(false);
    const [isLoading, setIsLoading]     = useState(true);

    const [contactSources, setContactSources] = useState(['qr']);
    const [embedType, setEmbedType] = useState(null);
    const [captureAutomationId, setCaptureAutomationId] = useState('');
    const [captureLeadUrl, setCaptureLeadUrl] = useState('');
    const handleCaptureAssetsReady = useCallback(({ automationId, leadUrl }) => {
        setCaptureAutomationId(automationId);
        setCaptureLeadUrl(leadUrl);
    }, []);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [listImportedCount, setListImportedCount] = useState(0);
    const [listImporting, setListImporting] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState('');
    const [message, setMessage]               = useState('');
    const textareaRef                         = useRef(null);
    const followupRefs                        = useRef({});

    const insertVariable = (variable, stepId = null) => {
        const textarea = stepId ? followupRefs.current[stepId] : textareaRef.current;
        if (!textarea) {
            if (!stepId) {
                setMessage((m) => variable + m);
            }
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (stepId) {
            const step = followupSteps.find((s) => s.id === stepId);
            const text = step ? (step.text || '') : '';
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newMessage = before + variable + after;
            handleFollowupMessageChange(stepId, newMessage);
        } else {
            const before = message.substring(0, start);
            const after = message.substring(end);
            setMessage(before + variable + after);
        }

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const [questions, setQuestions]           = useState(['', '']);
    const { entitlements } = usePlanEntitlements();
    const maxFollowupStepsUi =
        entitlements.max_followup_sequence_steps == null
            ? MAX_FOLLOWUP_STEPS_UI
            : entitlements.max_followup_sequence_steps;
    const [followupSteps, setFollowupSteps] = useState(() =>
        createDefaultFollowupSteps(maxFollowupStepsUi),
    );

    const [googleReviewLink, setGoogleReviewLink] = useState('');
    const [alertEmail, setAlertEmail]             = useState('');

    const [channelPrefs, setChannelPrefs]     = useState({ whatsapp: true, gmail: false });

    const [isFinalizing, setIsFinalizing]         = useState(false);
    const [isTogglingActive, setIsTogglingActive] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteRelatedData, setDeleteRelatedData] = useState(false);
    const [isRemoving, setIsRemoving]             = useState(false);

    const showFinalizing = useDelayedLoading(isFinalizing);

    const JOBS = {
        review:   { id: 'review',   title: t('empReviewTitle'), emoji: '⭐', color: '#f59e0b', hasQuestions: true,  needsGMB: true  },
        capture:  { id: 'capture',  title: t('empLeadTitle'),   emoji: '🎯', color: '#3b82f6', hasQuestions: true,  needsGMB: false },
        followup: { id: 'followup', title: t('empFollowTitle'), emoji: '📬', color: '#8b5cf6', hasQuestions: false, needsGMB: false },
    };

    const job = jobId ? JOBS[jobId] : null;

    useEffect(() => {
        if (!jobIdParam || !VALID_JOB_IDS.has(jobIdParam)) {
            navigate('/dashboard/employee-gallery', { replace: true });
        }
    }, [jobIdParam, navigate]);

    useEffect(() => {
        if (isWizardOAuthReturn(searchParams)) {
            toast(t('bridgeEstablished'), 'success');
            const resume = loadWizardResume(jobId);
            if (resume?.step) {
                setStep(normalizeWizardStep(jobId, resume.step));
            } else if (jobId === 'followup') {
                setStep(4);
            } else if (jobId === 'review') {
                setStep(3);
            }
            setChannelPrefs((prev) => ({
                ...prev,
                ...(resume?.channelPrefs || {}),
                gmail: true,
            }));
            if (resume?.contactSources?.length) {
                setContactSources(resume.contactSources);
            }
            clearWizardResume(jobId);
            const next = new URLSearchParams(searchParams);
            next.delete('success');
            next.delete('error');
            next.delete('details');
            setSearchParams(next, { replace: true });
        } else if (searchParams.get('error')) {
            const label = searchParams.get('error').replace(/_/g, ' ');
            toast(t('connectionFailed', { error: label }), 'error');
            const next = new URLSearchParams(searchParams);
            next.delete('success');
            next.delete('error');
            next.delete('details');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const fetchData = async () => {
            if (!job?.id) { setIsLoading(false); return; }
            setIsLoading(true);
            const token = localStorage.getItem('token');
            try {
                const endpoint = job.id === 'followup' ? 'lead-followup' : 'review-funnel';
                const cfgRes   = await fetch(`${API_URL}/api/config/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
                const cfgData  = await cfgRes.json();
                const c        = cfgData.success ? cfgData.config : null;
                const hired    = isEmployeeConfigured(job.id, c);
                const oauthReturn = isWizardOAuthReturn(searchParams);
                const resume = oauthReturn ? loadWizardResume(job.id) : null;

                if (c) {
                    setIsActive(
                        job.id === 'review'  ? c.is_active :
                        job.id === 'capture' ? c.lead_capture_active :
                        c.is_active
                    );
                    const fallback = job.id === 'followup' ? 'excel' : 'qr';
                    if (job.id === 'capture') {
                        setContactSources(normalizeContactSources(c.capture_sources ?? c.capture_source, fallback, job.id));
                    } else if (job.id === 'followup') {
                        setContactSources(normalizeContactSources(c.lead_sources ?? c.lead_source, fallback, job.id));
                    } else {
                        setContactSources(normalizeContactSources(c.lead_sources ?? c.lead_source, fallback, job.id));
                    }
                    setMessage(c.auto_response_message || c.message || '');
                    setAlertEmail(c.notification_email || '');
                    setGoogleReviewLink(c.google_review_url || '');
                    if (c.capture_embed_type === 'widget' || c.capture_embed_type === 'inline') {
                        setEmbedType(c.capture_embed_type);
                    }
                    if (c.automation_id) setCaptureAutomationId(c.automation_id);
                    if (c.leadUrl) setCaptureLeadUrl(c.leadUrl);
                    if (c.filtering_questions) setQuestions(c.filtering_questions.map(q => q.question || q));
                    if (job.id === 'followup') {
                        const parsed = parseFollowupFromConfig(c.followup_sequence);
                        setFollowupSteps(parsed.steps);
                    }
                    if (!oauthReturn && (c.whatsapp_enabled !== undefined || c.email_enabled !== undefined)) {
                        setChannelPrefs({
                            whatsapp: c.whatsapp_enabled !== false,
                            gmail: c.email_enabled !== false,
                        });
                    }
                }

                if (job.id === 'capture' && token) {
                    try {
                        const embedAssets = await ensureCaptureAutomationAssets(token);
                        setCaptureAutomationId(embedAssets.automationId);
                        setCaptureLeadUrl(embedAssets.leadUrl);
                    } catch (embedErr) {
                        console.error('Capture embed ID:', embedErr);
                    }
                }

                if (hired) {
                    setIsConfigured(true);
                    if (oauthReturn) clearWizardResume(job.id);
                } else {
                    setIsConfigured(false);
                    if (oauthReturn) {
                        const oauthStep = normalizeWizardStep(
                            job.id,
                            resume?.step ??
                                (job.id === 'followup' ? 4 : job.id === 'review' ? 3 : 1),
                        );
                        setStep(oauthStep);
                        setChannelPrefs((prev) => ({
                            ...prev,
                            ...(resume?.channelPrefs || {}),
                            gmail: true,
                        }));
                        if (resume?.contactSources?.length) {
                            setContactSources(resume.contactSources);
                        }
                        clearWizardResume(job.id);
                    } else {
                        setStep(1);
                        setContactSources(job.id === 'followup' ? ['excel'] : ['qr']);
                    }
                    if (!c?.notification_email) {
                        try {
                            const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
                            if (profile.email) setAlertEmail(profile.email);
                        } catch {
                            /* noop */
                        }
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleToggleActive = async () => {
        if (isTogglingActive || !job) return;
        setIsTogglingActive(true);
        try {
            const token  = localStorage.getItem('token');
            const recipe = RECIPE_BY_JOB_ID[job.id];
            const res    = await fetch(`${API_URL}/api/config/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipe, is_active: !isActive }),
            });
            let data = {};
            try { data = await res.json(); } catch { /* noop */ }
            if (res.ok && data.success) {
                setIsActive(!isActive);
                try { window.dispatchEvent(new Event('entitlements:refresh')); } catch { /* noop */ }
                return;
            }
            if (data.code === 'EMPLOYEE_PLAN_LIMIT') {
                toast(t('planEmployeeLimitReached', { max: data.max_employees ?? 1 }), 'warning');
            } else {
                toast(data.message || t('automationUpdateError'), 'error');
            }
        } catch {
            toast(t('automationUpdateError'), 'error');
        } finally {
            setIsTogglingActive(false);
        }
    };

    const handleRemoveEmployee = async () => {
        if (!job || isRemoving) return;
        setIsRemoving(true);
        setShowDeleteConfirm(false);
        const shouldDelete = deleteRelatedData;
        setDeleteRelatedData(false);
        try {
            const token  = localStorage.getItem('token');
            const recipe = RECIPE_BY_JOB_ID[job.id];
            const res    = await fetch(`${API_URL}/api/config/automation`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipe, deleteRelatedData: shouldDelete }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) { toast(data.message || t('removalFailed'), 'error'); return; }
            toast(t('toastRemoved', { title: job.title }), 'info');
            try { window.dispatchEvent(new Event('entitlements:refresh')); } catch { /* noop */ }
            navigate('/dashboard/employee-gallery', { replace: true });
        } catch {
            toast(t('removalFailed'), 'error');
        } finally {
            setIsRemoving(false);
        }
    };

    const postConfig = async (path, payload, token) => {
        const res = await fetch(`${API_URL}/api/config/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        let data = {};
        try { data = await res.json(); } catch { /* noop */ }
        return { res, data };
    };

    const handleActivate = async () => {
        setIsFinalizing(true);
        try {
            const token = localStorage.getItem('token');
            let saveResult;

            if (job.id === 'followup') {
                const sequence = buildFollowupSequence(followupSteps);
                const first = sequence[0];
                saveResult = await postConfig('lead-followup', {
                    message: first?.message || message,
                    delay_value: first?.delay_value ?? followupSteps[0]?.days,
                    delay_unit: 'days',
                    is_active: true,
                    lead_source:  contactSources[0] || 'excel',
                    lead_sources: contactSources,
                    followup_sequence: sequence,
                    whatsapp_enabled: channelPrefs.whatsapp,
                    email_enabled: channelPrefs.gmail,
                }, token);
            } else {
                saveResult = await postConfig('review-funnel', {
                    goal: job.id,
                    google_review_url:  googleReviewLink,
                    notification_email: alertEmail,
                    auto_response_message: message,
                    filtering_questions: questions.filter(q => q.trim()).map(q => ({ question: q.trim() })),
                    lead_source:    job.id === 'review'  ? (contactSources[0] || 'qr')  : undefined,
                    capture_source: job.id === 'capture' ? (contactSources[0] || 'qr')  : undefined,
                    lead_sources:    job.id === 'review'  ? contactSources : undefined,
                    capture_sources: job.id === 'capture' ? contactSources : undefined,
                    capture_embed_type: job.id === 'capture' && contactSources.includes('website') ? embedType : undefined,
                    whatsapp_enabled: channelPrefs.whatsapp,
                    email_enabled: channelPrefs.gmail,
                    is_active:           job.id === 'review'  ? true : undefined,
                    lead_capture_active: job.id === 'capture' ? true : undefined,
                }, token);
            }

            const { res, data } = saveResult;
            if (!res.ok || !data.success) {
                if (data.code === 'EMPLOYEE_PLAN_LIMIT') {
                    toast(t('planEmployeeLimitReached', { max: data.max_employees ?? 1 }), 'warning');
                } else if (data.code === 'FOLLOWUP_SEQUENCE_PLAN_LIMIT') {
                    toast(t('planFollowupStepsLimit', { max: data.max_steps ?? 2 }), 'warning');
                } else {
                    toast(data.message || t('automationUpdateError'), 'error');
                }
                return;
            }

            // Trigger folder actions if existing folder was selected
            if (selectedFolder) {
                try {
                    if (job.id === 'followup') {
                        await fetch(`${API_URL}/api/leads/folders/start-followup`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ folderName: selectedFolder }),
                        });
                    } else if (job.id === 'review') {
                        await fetch(`${API_URL}/api/leads/trigger-bulk`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ group: selectedFolder, purpose: 'review' }),
                        });
                    }
                } catch (triggerErr) {
                    console.error('Failed to trigger bulk/followup folder action:', triggerErr);
                }
            }

            if (window.confetti) {
                window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [job.color, '#ffffff', '#ffd700'] });
            }
            try { window.dispatchEvent(new Event('entitlements:refresh')); } catch { /* noop */ }
            navigate('/dashboard/employee-gallery', {
                replace: true,
                state: { hiredEmployeeId: job.id },
            });
        } catch (e) {
            console.error(e);
            toast(t('automationUpdateError'), 'error');
        } finally {
            setIsFinalizing(false);
        }
    };

    if (isLoading || !job) {
        return <EmployeeWizardSkeleton />;
    }

    const sourceLabel = (id) => {
        const key = { qr: 'wizSourceTitleQR', excel: 'wizSourceTitleExcel', website: 'wizSourceTitleWeb' }[id];
        const label = key ? t(key) : id;
        if (id === 'website' && embedType) {
            const embedLabel = embedType === 'widget' ? t('wizEmbedWidgetTitle') : t('wizEmbedInlineTitle');
            return `${label} (${embedLabel})`;
        }
        return label;
    };

    const getEntryMethodName = () => {
        const parts = [];
        if (contactSources.includes('qr')) {
            parts.push(language === 'es' ? 'Código QR' : 'QR Code');
        }
        if (contactSources.includes('excel')) {
            parts.push(language === 'es' ? 'Excel / CSV' : 'Excel / CSV');
        }
        if (contactSources.includes('website')) {
            parts.push(language === 'es' ? 'Enlace Web' : 'Website Link');
        }
        return parts.join(' / ') || (language === 'es' ? 'Automático' : 'Automatic');
    };

    const activeQuestions = questions.filter((q) => q.trim());
    const primaryMessage =
        job.id === 'followup'
            ? (followupSteps[0]?.text || message || '').trim()
            : (message || '').trim();
    const truncate = (text, max = 120) =>
        text.length <= max ? text : `${text.slice(0, max).trim()}…`;

    const formatFollowupDay = (days) => t('wizAfterDays', { n: Number(days) || 1 });

    const hireFallback = HIRE_SUCCESS_I18N[language] || HIRE_SUCCESS_I18N.en;
    const tx = (key, params = {}) => {
        const value = t(key, params);
        if (value !== key) return value;
        let fallback = hireFallback[key] ?? HIRE_SUCCESS_I18N.en[key] ?? key;
        Object.keys(params).forEach((param) => {
            fallback = fallback.replaceAll(`{${param}}`, String(params[param] ?? ''));
        });
        return fallback;
    };

    const summaryNotSet = <span className="wiz-hire-summary-empty">{tx('wizSummaryNotSet')}</span>;

    const hireSummaryList = (
        <dl className="wiz-hire-summary-list">
            <div className="wiz-hire-summary-row">
                <dt>{tx('wizSummarySources')}</dt>
                <dd>{contactSources.map(sourceLabel).join(' · ')}</dd>
            </div>

            {job.id === 'followup' && (
                <div className="wiz-hire-summary-row">
                    <dt>{tx('wizSummarySequence')}</dt>
                    <dd>
                        <ol className="wiz-hire-summary-sequence">
                            {followupSteps.map((row, index) => (
                                <li key={row.id}>
                                    <span className="wiz-hire-summary-seq-meta">
                                        {t('wizFollowupMsgLabel', { n: index + 1 })}
                                        {' · '}
                                        {formatFollowupDay(row.days)}
                                    </span>
                                    <span className="wiz-hire-summary-seq-text">
                                        {row.text?.trim() ? truncate(row.text.trim(), 100) : summaryNotSet}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </dd>
                </div>
            )}

            {job.hasQuestions && (
                <div className="wiz-hire-summary-row">
                    <dt>{tx('wizSummaryQuestions')}</dt>
                    <dd>
                        {activeQuestions.length > 0 ? (
                            <ul className="wiz-hire-summary-questions">
                                {activeQuestions.map((q) => (
                                    <li key={q}>{q}</li>
                                ))}
                            </ul>
                        ) : (
                            summaryNotSet
                        )}
                    </dd>
                </div>
            )}

            {job.id === 'capture' && (
                <div className="wiz-hire-summary-row">
                    <dt>{tx('wizSummaryMessage')}</dt>
                    <dd>{primaryMessage ? truncate(primaryMessage) : summaryNotSet}</dd>
                </div>
            )}

            {job.id === 'review' && (
                <div className="wiz-hire-summary-row">
                    <dt>{tx('wizSummaryGoogleReview')}</dt>
                    <dd className="wiz-hire-summary-mono">
                        {googleReviewLink.trim() ? googleReviewLink.trim() : summaryNotSet}
                    </dd>
                </div>
            )}

            {(job.id === 'review' || job.id === 'capture') && (
                <div className="wiz-hire-summary-row">
                    <dt>{tx('wizSummaryEmail')}</dt>
                    <dd>{alertEmail.trim() ? alertEmail.trim() : summaryNotSet}</dd>
                </div>
            )}
        </dl>
    );

    /* ══════════════════════════════════════════
       CONFIGURED STATE — simple management hub
       ══════════════════════════════════════════ */
    if (isConfigured) {
        return (
            <div className="wiz-page">
                <div className="wiz-header">
                    <button onClick={() => navigate('/dashboard/employee-gallery')} className="wiz-back-btn">
                        <ChevronLeft size={18} /> {(t('backBtn') || 'BACK').toUpperCase()}
                    </button>
                    <div className="wiz-job-badge" style={{ background: `${job.color}15`, color: job.color }}>
                        <span className="wiz-job-badge-emoji">{job.emoji}</span>
                        <span className="wiz-job-badge-title">{job.title}</span>
                    </div>
                </div>

                <div className="wiz-hub" style={{ '--hub-accent': job.color }}>
                    <div className={`wiz-hub-pill ${isActive ? 'is-on' : 'is-off'}`}>
                        <span className="wiz-hub-dot" />
                        {isActive ? (t('monitoring') || 'Activo') : (t('employeePaused') || 'Pausado')}
                    </div>

                    <div className="wiz-hub-emoji">{job.emoji}</div>
                    <h2 className="wiz-hub-title">{job.title}</h2>
                    <p className="wiz-hub-sub">
                        {isActive
                            ? (t('wizHubActiveSub') || 'Tu empleado está trabajando ahora mismo.')
                            : (t('wizHubPausedSub') || 'Tu empleado está pausado. Actívalo para que trabaje.')}
                    </p>

                    <div className="wiz-hub-actions">
                        <button
                            type="button"
                            className="wiz-hub-btn wiz-hub-btn--config"
                            style={{ borderColor: `${job.color}50`, color: job.color, background: `${job.color}08` }}
                            onClick={() => navigate(CONFIG_PATH[job.id])}
                        >
                            <Settings size={16} />
                            {t('editSetup') || 'Editar configuración'}
                        </button>
                        <button
                            type="button"
                            disabled={isTogglingActive}
                            className="wiz-hub-btn wiz-hub-btn--toggle"
                            style={{ background: isActive ? '#ef4444' : '#10b981' }}
                            onClick={handleToggleActive}
                        >
                            {isActive
                                ? <><Pause size={16} /> {t('pauseWork') || 'Pausar'}</>
                                : <><Play  size={16} /> {t('startWorking') || 'Activar'}</>}
                        </button>
                    </div>
                </div>

                <div className="wiz-mt-6">
                    {showDeleteConfirm ? (
                        <div className="wiz-delete-confirm">
                            <div className="wiz-delete-confirm-header">
                                <Trash2 size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                                <div>
                                    <p className="wiz-delete-title">{t('letGoTitle', { title: job.title })}</p>
                                    <p className="wiz-delete-desc">{t('letGoDesc')}</p>
                                </div>
                            </div>
                            <label className="wiz-delete-data-opt">
                                <input type="checkbox" checked={deleteRelatedData} onChange={e => setDeleteRelatedData(e.target.checked)} />
                                <span>{t(job.id === 'review' ? 'fireDeleteReviews' : 'fireDeleteLeads')}</span>
                            </label>
                            <div className="wiz-delete-actions">
                                <button type="button" className="wiz-delete-cancel" onClick={() => { setShowDeleteConfirm(false); setDeleteRelatedData(false); }}>
                                    {t('cancelBtn')}
                                </button>
                                <button type="button" className="wiz-delete-confirm-btn" onClick={handleRemoveEmployee} disabled={isRemoving}>
                                    <Trash2 size={14} />
                                    {isRemoving ? t('removing') : t('letGo')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button type="button" className="wiz-remove-link" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 size={14} /> {t('removeEmployee')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    /* ══════════════════════════════════════════
       SETUP FLOW — review/capture: 3 steps; followup: 4
       ══════════════════════════════════════════ */
    const isReview = job.id === 'review';
    const isFollowup = job.id === 'followup';
    const totalSteps = isFollowup ? 4 : 3;
    const isSourceStep = step === 1;
    const isScheduleStep = isFollowup && step === 2;
    const isMessagesStep = isFollowup && step === 3;
    const isConfigureStep = !isFollowup && step === 2;
    const isSummaryStep = isFollowup ? step === 4 : step === 3;

    const configureStepTitle = job.hasQuestions
        ? t('wizStep4TitleAsk')
        : t('wizStep4TitleSay');

    const wizardSteps = isReview
        ? [
            { id: 1, title: t('wizStep3Title') },
            { id: 2, title: configureStepTitle },
            { id: 3, title: tx('wizStepSummaryTitle') },
        ]
        : isFollowup
            ? [
                { id: 1, title: t('wizStep3Title'), description: t('wizFollowupStepSourceDesc') },
                { id: 2, title: t('wizFollowupStepSchedule'), description: t('wizFollowupStepScheduleDesc') },
                { id: 3, title: t('wizFollowupStepMessages'), description: t('wizFollowupStepMessagesDesc') },
                { id: 4, title: tx('wizStepSummaryTitle') },
            ]
            : [
                { id: 1, title: t('wizStep3Title') },
                { id: 2, title: configureStepTitle },
                { id: 3, title: tx('wizStepSummaryTitle') },
            ];

    const handleFollowupDayChange = (id, days) => {
        setFollowupSteps((prev) => {
            const next = prev.map((s) => (s.id === id ? { ...s, days } : s));
            return sortFollowupStepsByDays(next);
        });
    };

    const handleFollowupMessageChange = (id, text) => {
        setFollowupSteps((prev) =>
            prev.map((s) => (s.id === id ? { ...s, text } : s)),
        );
    };

    const handleAddFollowupStep = () => {
        if (!canAddMoreFollowupSteps(followupSteps.length, maxFollowupStepsUi)) {
            toast(t('planFollowupSequenceLimit', { max: maxFollowupStepsUi }), 'warning');
            return;
        }
        setFollowupSteps((prev) => {
            const lastDays = prev[prev.length - 1]?.days || 0;
            const next = sortFollowupStepsByDays([
                ...prev,
                createFollowupStep(prev.length + 1, lastDays),
            ]);
            return next;
        });
    };

    const handleRemoveFollowupStep = (id) => {
        setFollowupSteps((prev) => {
            if (prev.length <= 1) {
                toast(t('wizFollowupMinOneStep'), 'warning');
                return prev;
            }
            return sortFollowupStepsByDays(
                reindexFollowupSteps(prev.filter((s) => s.id !== id)),
            );
        });
    };

    const configurePanel = (
        <>
            {job.id === 'capture' && (
                <div className="wiz-message-box-card" style={{ marginBottom: '2rem' }}>
                    <div className="wiz-message-box-header">
                        <div className="wiz-variable-pills">
                            {['{name}', '{link}', '{number}'].map(v => (
                                <button key={v} type="button" onClick={() => insertVariable(v)} className="wiz-pill">
                                    {v.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <span className="wiz-char-count">{message.length}</span>
                    </div>
                    <textarea
                        ref={textareaRef}
                        className="wiz-message-textarea"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={t('wizMsgWritePlaceholder')}
                    />
                </div>
            )}

            {job.hasQuestions && (
                <>
                    <QualifyQuestionsEditor
                        jobId={job.id}
                        accent={job.color}
                        questions={questions}
                        onChange={setQuestions}
                    />
                    {job.id === 'review' && (
                        <div className="wiz-mt-8">
                            <label className="wiz-label">{t('wizGoogleReviewLabel')}</label>
                            <GoogleReviewLinkSearch
                                value={googleReviewLink}
                                onChange={setGoogleReviewLink}
                                className="input-field"
                            />
                            <p className="wiz-hint">{t('wizGoogleReviewHint')}</p>
                        </div>
                    )}
                    {(job.id === 'review' || job.id === 'capture') && (
                        <div className="wiz-mt-8">
                            <label className="wiz-label" htmlFor="wiz-alert-email">{t('wizNotifEmailLabel')}</label>
                            <input
                                id="wiz-alert-email"
                                type="email"
                                className="input-field"
                                placeholder="you@business.com"
                                value={alertEmail}
                                onChange={(e) => setAlertEmail(e.target.value)}
                            />
                            <p className="wiz-hint">{t('wizAlertsDesc')}</p>
                        </div>
                    )}
                </>
            )}
        </>
    );

    return (
        <div className="wiz-page">

            {/* ── Header ── */}
            <div className="wiz-header">
                <button onClick={() => navigate('/dashboard/employee-gallery')} className="wiz-back-btn">
                    <ChevronLeft size={18} /> {(t('backBtn') || 'BACK').toUpperCase()}
                </button>
                <div className="wiz-job-badge" style={{ background: `${job.color}15`, color: job.color }}>
                    <span className="wiz-job-badge-emoji">{job.emoji}</span>
                    <span className="wiz-job-badge-title">{job.title}</span>
                </div>
                <span className="wiz-step-label">{step} / {totalSteps}</span>
            </div>

            <div className="wiz-stepper-wrap">
                <EmployeeWizardStepper steps={wizardSteps} currentStep={step} accentColor={job.color} />
            </div>

            {/* ════ STEP 1: Source ════ */}
            {isSourceStep && (
                <div className="wiz-panel animate-slide-up">
                    <div className="wiz-content">
                        <WizardSourceStep
                            jobId={job.id}
                            accentColor={job.color}
                            contactSources={contactSources}
                            setContactSources={setContactSources}
                            embedType={embedType}
                            setEmbedType={setEmbedType}
                            uploadedFileName={uploadedFileName}
                            setUploadedFileName={setUploadedFileName}
                            listImportedCount={listImportedCount}
                            setListImportedCount={setListImportedCount}
                            listImporting={listImporting}
                            setListImporting={setListImporting}
                            captureAutomationId={captureAutomationId}
                            captureLeadUrl={captureLeadUrl}
                            onCaptureAssetsReady={handleCaptureAssetsReady}
                            selectedFolder={selectedFolder}
                            setSelectedFolder={setSelectedFolder}
                        />
                    </div>
                    <WizFooter
                        onBack={() => navigate('/dashboard/employee-gallery')}
                        onNext={() => {
                            if (!contactSources.length) { toast(t('wizSourcePickOne'), 'warning'); return; }
                            if (job.id === 'capture' && contactSources.includes('website') && !embedType) {
                                toast(t('wizEmbedPickOne'), 'warning');
                                return;
                            }
                            setStep(2);
                        }}
                        color={job.color}
                        hideBack
                        nextLoading={listImporting}
                    />
                </div>
            )}

            {/* ════ Follow-up: Schedule ════ */}
            {isScheduleStep && (
                <div className="wiz-panel animate-slide-up">
                    <div className="wiz-content">
                        <WizardFollowupSchedule
                            steps={followupSteps}
                            onDayChange={handleFollowupDayChange}
                            onAddStep={handleAddFollowupStep}
                            onRemoveStep={handleRemoveFollowupStep}
                            planMaxSteps={maxFollowupStepsUi}
                            accentColor={job.color}
                        />
                    </div>
                    <WizFooter
                        onBack={() => setStep(1)}
                        onNext={() => {
                            if (!isFollowupScheduleValid(followupSteps)) {
                                toast(t('wizFollowupScheduleInvalid'), 'warning');
                                return;
                            }
                            setStep(3);
                        }}
                        color={job.color}
                    />
                </div>
            )}

            {/* ════ Follow-up: Messages ════ */}
            {isMessagesStep && (
                <div className="wiz-panel animate-slide-up">
                    <div className="wiz-content">
                        <WizardFollowupMessages
                            steps={followupSteps}
                            userId={templateUserId}
                            onMessageChange={handleFollowupMessageChange}
                            onAddStep={handleAddFollowupStep}
                            onRemoveStep={handleRemoveFollowupStep}
                            canAdd={canAddMoreFollowupSteps(followupSteps.length, maxFollowupStepsUi)}
                            accentColor={job.color}
                            onRegisterTextarea={(stepId, el) => {
                                followupRefs.current[stepId] = el;
                            }}
                            messageVariables={[
                                { label: 'Name', key: '{NAME}' },
                                { label: 'Company', key: '{COMPANY}' },
                                { label: 'Link', key: '{LINK}' },
                            ]}
                            onInsertVariable={(stepId, key) => insertVariable(key, stepId)}
                        />
                    </div>
                    <WizFooter
                        onBack={() => setStep(2)}
                        onNext={() => {
                            if (!isFollowupMessagesValid(followupSteps)) {
                                toast(t('wizFollowupMessagesInvalid'), 'warning');
                                return;
                            }
                            setStep(4);
                        }}
                        color={job.color}
                    />
                </div>
            )}

            {/* ════ Configure: questions / messages (review & capture) ════ */}
            {isConfigureStep && (
                <div className="wiz-panel animate-slide-up">
                    <div className="wiz-content">
                        {configurePanel}
                    </div>
                    <WizFooter
                        onBack={() => setStep(1)}
                        onNext={() => setStep(isFollowup ? 4 : 3)}
                        color={job.color}
                    />
                </div>
            )}

            {/* ════ Summary & hire ════ */}
            {isSummaryStep && (
                <div className="wiz-panel animate-slide-up">
                    <div className="wiz-content wiz-content--summary-v2">
                        <h2 className="wiz-summary-heading-v2">
                            {language === 'es' ? 'Revisar y activar' : 'Review and activate'}
                        </h2>
                        <p className="wiz-summary-subheading-v2">
                            {language === 'es' 
                                ? `Tu empleado de ${job.id === 'review' ? 'Crecimiento de Reputación' : job.id === 'capture' ? 'Captación de Contactos' : 'Seguimiento de Leads'} está configurado y listo. Esto es exactamente lo que hará.`
                                : `Your ${job.id === 'review' ? 'Reputation Growth' : job.id === 'capture' ? 'Lead Capture' : 'Lead Follow-up'} Employee is configured and ready. Here's exactly what it will do.`}
                        </p>

                        <div className="wiz-summary-cards-v2">
                            <div className="wiz-summary-card-v2">
                                <span className="wiz-summary-card-label">
                                    {language === 'es' ? 'MÉTODO DE ENTRADA' : 'ENTRY METHOD'}
                                </span>
                                <strong className="wiz-summary-card-value">{getEntryMethodName()}</strong>
                            </div>
                            <div className="wiz-summary-card-v2">
                                <span className="wiz-summary-card-label">
                                    {language === 'es' ? 'ESTRATEGIA' : 'STRATEGY'}
                                </span>
                                <strong className="wiz-summary-card-value">
                                    {SUMMARY_STEPS[job.id]?.strategy[language] || SUMMARY_STEPS[job.id]?.strategy['en']}
                                </strong>
                            </div>
                        </div>

                        <div className="wiz-summary-will-do-box">
                            <div className="wiz-summary-will-do-header">
                                <Shield size={16} />
                                <span>{language === 'es' ? 'TU EMPLEADO HARÁ LO SIGUIENTE' : 'YOUR EMPLOYEE WILL'}</span>
                            </div>
                            <ul className="wiz-summary-will-do-list">
                                {SUMMARY_STEPS[job.id]?.willDo.map((item, idx) => {
                                    const IconComponent = ICON_COMPONENTS[item.icon];
                                    return (
                                        <li key={idx} className="wiz-summary-will-do-item">
                                            <div className="wiz-summary-item-icon" style={{ color: item.color }}>
                                                {IconComponent ? <IconComponent size={16} /> : null}
                                            </div>
                                            <span className="wiz-summary-item-text">
                                                {item.text[language] || item.text['en']}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={handleActivate}
                            disabled={isFinalizing}
                            className="wiz-activate-btn-v2"
                        >
                            {showFinalizing ? (
                                <Loader2 size={20} className="spin" />
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    <span>
                                        {language === 'es'
                                            ? `Activar empleado de ${job.id === 'review' ? 'Crecimiento de Reputación' : job.id === 'capture' ? 'Captación de Contactos' : 'Seguimiento de Leads'}`
                                            : `Activate ${job.id === 'review' ? 'Reputation Growth' : job.id === 'capture' ? 'Lead Capture' : 'Lead Follow-up'} Employee`}
                                    </span>
                                </>
                            )}
                        </button>

                        <p className="wiz-summary-footer-text">
                            {language === 'es'
                                ? 'Puedes pausar o modificar tu empleado en cualquier momento desde la página de Automatizaciones.'
                                : 'You can pause or modify your employee at any time from the Automations page.'}
                        </p>
                    </div>
                    <WizFooter
                        onBack={() => setStep(isFollowup ? 3 : 2)}
                        color={job.color}
                        hideNext
                    />
                </div>
            )}

        </div>
    );
};

/* ── Footer nav ── */
const WizFooter = ({ onBack, onNext, color, hideNext, hideBack, nextLabel, nextLoading }) => {
    const { t } = useTranslation();
    const showNextLoading = useDelayedLoading(!!nextLoading);
    return (
        <div className="wiz-footer">
            <button type="button" onClick={onBack} className={`wiz-back ${hideBack ? 'wiz-back--hidden' : ''}`}>
                <ChevronLeft size={16} /> {t('wizBack')}
            </button>
            {!hideNext && (
                <button
                    type="button"
                    onClick={onNext}
                    disabled={nextLoading}
                    className="wiz-next"
                    style={{ background: color }}
                >
                    {showNextLoading ? <Loader2 size={16} className="spin" /> : null}
                    {nextLabel || t('wizContinue')} {!showNextLoading && <ArrowRight size={16} />}
                </button>
            )}
        </div>
    );
};

export default EmployeeWizard;
