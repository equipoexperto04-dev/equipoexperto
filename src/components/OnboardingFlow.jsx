import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Star,
    Users,
    Zap,
    MessageSquare,
    ChevronRight,
    CheckCircle2,
    Loader2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';
import { markOnboardingDoneLocal } from '../utils/onboarding.js';
import './OnboardingFlow.css';

const GOALS = [
    {
        id: 'capture',
        titleKey: 'empLeadTitle',
        taglineKey: 'wizRoleLeadTagline',
        Icon: Users,
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.12)',
    },
    {
        id: 'review',
        titleKey: 'empReviewTitle',
        taglineKey: 'wizRoleReviewTagline',
        Icon: Star,
        color: '#f59e0b',
        colorBg: 'rgba(245,158,11,0.12)',
    },
    {
        id: 'followup',
        titleKey: 'empFollowTitle',
        taglineKey: 'wizRoleFollowTagline',
        Icon: Zap,
        color: '#8b5cf6',
        colorBg: 'rgba(139,92,246,0.12)',
    },
];

const STEP_COUNT = 3;

/** @typedef {'idle' | 'checking' | 'loading' | 'qr' | 'connected' | 'error'} WaLinkState */

export default function OnboardingFlow({ user, onComplete, onUserUpdate }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [companyName, setCompanyName] = useState(user?.company_name || user?.name || '');
    const [goal, setGoal] = useState('capture');
    const [waConnected, setWaConnected] = useState(false);
    /** @type {[WaLinkState, React.Dispatch<React.SetStateAction<WaLinkState>>]} */
    const [waState, setWaState] = useState('idle');
    const [waQR, setWaQR] = useState(null);
    const [waError, setWaError] = useState('');
    const [saving, setSaving] = useState(false);
    const waPollRef = useRef(null);

    const token = () => localStorage.getItem('token');

    const authHeaders = () => ({
        Authorization: `Bearer ${token()}`,
    });

    const readProfile = () => {
        try {
            return JSON.parse(localStorage.getItem('user_profile') || '{}');
        } catch {
            return {};
        }
    };

    const saveProfile = async (patch) => {
        const base = { ...readProfile(), ...user };
        const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders(),
            },
            body: JSON.stringify({
                email: base.email,
                company_name: base.company_name ?? '',
                phone: base.phone ?? '',
                weekly_reports_enabled: base.weekly_reports_enabled ?? true,
                ...patch,
            }),
        });
        const data = await res.json();
        if (data.success && data.user) {
            localStorage.setItem('user_profile', JSON.stringify(data.user));
            onUserUpdate?.(data.user);
        }
        return data;
    };

    const handleWelcomeContinue = async () => {
        const trimmed = companyName.trim();
        if (!trimmed) return;
        setSaving(true);
        try {
            await saveProfile({ company_name: trimmed });
            setStep(1);
        } finally {
            setSaving(false);
        }
    };

    const handleGoalPick = (id) => {
        setGoal(id);
        localStorage.setItem('mm_onboard_goal', id);
        setStep(2);
    };

    const finishOnboarding = async (destination) => {
        setSaving(true);
        try {
            const data = await saveProfile({ onboarding_completed: true });
            markOnboardingDoneLocal();
            if (!data.success) {
                const fallback = { ...readProfile(), ...user, onboarding_completed: true };
                localStorage.setItem('user_profile', JSON.stringify(fallback));
                onUserUpdate?.(fallback);
            }
            onComplete?.();
            navigate(destination);
        } finally {
            setSaving(false);
        }
    };

    const handleSkipWhatsApp = () => {
        finishOnboarding(`/dashboard/employee/${goal}?from=onboard`);
    };

    const handleFinishAfterWa = () => {
        finishOnboarding(`/dashboard/employee/${goal}?from=onboard`);
    };

    const stopWaPolling = useCallback(() => {
        if (waPollRef.current) {
            clearInterval(waPollRef.current);
            waPollRef.current = null;
        }
    }, []);

    const pollWhatsAppStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/status`, {
                headers: authHeaders(),
            });
            const data = await res.json();
            if (!data.success) return;

            if (data.status === 'connected') {
                setWaConnected(true);
                setWaState('connected');
                setWaQR(null);
                setWaError('');
                stopWaPolling();
                return;
            }
            if (data.status === 'qr_ready' && data.qr) {
                setWaState('qr');
                setWaQR(data.qr);
                return;
            }
            if (data.status === 'initializing' || data.status === 'restoring') {
                setWaState('loading');
                return;
            }
            if (data.status === 'error' || data.status === 'auth_failed') {
                setWaState('error');
                setWaError(t('sessionError') || 'Connection failed.');
                stopWaPolling();
            }
        } catch {
            /* ignore transient poll errors */
        }
    }, [stopWaPolling, t]);

    const startWhatsAppLink = useCallback(async () => {
        setWaState('loading');
        setWaError('');
        setWaQR(null);
        try {
            const res = await fetch(`${API_URL}/api/whatsapp/connect`, {
                method: 'POST',
                headers: authHeaders(),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                setWaState('error');
                setWaError(data.message || t('waConnectFailed'));
                stopWaPolling();
            }
        } catch {
            setWaState('error');
            setWaError(t('waConnectFailed'));
            stopWaPolling();
        }
    }, [stopWaPolling, t]);

    const beginWhatsAppStep = useCallback(async () => {
        stopWaPolling();
        setWaState('checking');
        setWaError('');
        setWaQR(null);

        try {
            const intRes = await fetch(`${API_URL}/api/integrations`, {
                headers: authHeaders(),
            });
            const intData = await intRes.json();
            if (intData.success) {
                const already = (intData.integrations || []).some((i) => i.provider === 'whatsapp');
                if (already) {
                    setWaConnected(true);
                    setWaState('connected');
                    return;
                }
            }
        } catch {
            /* continue to connect */
        }

        await startWhatsAppLink();
        waPollRef.current = setInterval(() => {
            void pollWhatsAppStatus();
        }, 3000);
        void pollWhatsAppStatus();
    }, [pollWhatsAppStatus, startWhatsAppLink, stopWaPolling]);

    const retryWhatsAppLink = () => {
        void beginWhatsAppStep();
    };

    useEffect(() => {
        if (step !== 2) {
            stopWaPolling();
            if (step < 2) {
                setWaState('idle');
                setWaQR(null);
                setWaError('');
            }
            return undefined;
        }
        void beginWhatsAppStep();
        return () => stopWaPolling();
    }, [step, beginWhatsAppStep, stopWaPolling]);

    const progress = ((step + 1) / STEP_COUNT) * 100;
    const waBusy = waState === 'checking' || waState === 'loading';

    return (
        <div className="onboard-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
            <div className={`onboard-card animate-fade-in${step === 2 ? ' onboard-card--wide' : ''}`}>
                <div className="onboard-progress" aria-hidden>
                    <div className="onboard-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="onboard-step-label">
                    {t('onboardStepOf', { current: step + 1, total: STEP_COUNT })}
                </p>

                {step === 0 && (
                    <div className="onboard-panel">
                        <h1 id="onboard-title" className="onboard-title">{t('onboardWelcomeTitle')}</h1>
                        <p className="onboard-subtitle">{t('onboardWelcomeSubtitle')}</p>
                        <label className="onboard-field-label" htmlFor="onboard-company">
                            {t('onboardBusinessLabel')}
                        </label>
                        <input
                            id="onboard-company"
                            className="onboard-input"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={t('onboardBusinessPlaceholder')}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && companyName.trim() && handleWelcomeContinue()}
                        />
                        <button
                            type="button"
                            className="onboard-btn-primary"
                            disabled={!companyName.trim() || saving}
                            onClick={handleWelcomeContinue}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                            {t('onboardContinue')}
                            {!saving && <ChevronRight size={18} />}
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <div className="onboard-panel">
                        <h1 id="onboard-title" className="onboard-title">{t('onboardGoalTitle')}</h1>
                        <p className="onboard-subtitle">{t('onboardGoalSubtitle')}</p>
                        <div className="onboard-goals">
                            {GOALS.map((g) => {
                                const { Icon } = g;
                                const selected = goal === g.id;
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`onboard-goal${selected ? ' onboard-goal--selected' : ''}`}
                                        onClick={() => handleGoalPick(g.id)}
                                    >
                                        <span
                                            className="onboard-goal-icon"
                                            style={{ background: g.colorBg, color: g.color }}
                                        >
                                            <Icon size={22} />
                                        </span>
                                        <span className="onboard-goal-text">
                                            <span className="onboard-goal-name">{t(g.titleKey)}</span>
                                            <span className="onboard-goal-tag">{t(g.taglineKey)}</span>
                                        </span>
                                        <ChevronRight size={18} className="onboard-goal-arrow" />
                                    </button>
                                );
                            })}
                        </div>
                        <button type="button" className="onboard-link-back" onClick={() => setStep(0)}>
                            {t('onboardBack')}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboard-panel onboard-panel--center onboard-panel--wa">
                        {waState === 'connected' || waConnected ? (
                            <>
                                <div className="onboard-wa-icon onboard-wa-icon--success">
                                    <CheckCircle2 size={36} />
                                </div>
                                <h1 id="onboard-title" className="onboard-title">{t('onboardWaDoneTitle')}</h1>
                                <p className="onboard-subtitle">{t('onboardWaDoneSubtitle')}</p>
                                <button
                                    type="button"
                                    className="onboard-btn-primary"
                                    disabled={saving}
                                    onClick={handleFinishAfterWa}
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {t('onboardFinishSetup')}
                                    {!saving && <ChevronRight size={18} />}
                                </button>
                            </>
                        ) : waState === 'error' ? (
                            <>
                                <div className="onboard-wa-icon onboard-wa-icon--error">
                                    <AlertCircle size={32} />
                                </div>
                                <h1 id="onboard-title" className="onboard-title">{t('connFailed') || 'Connection failed'}</h1>
                                <p className="onboard-subtitle onboard-wa-error">{waError}</p>
                                <button type="button" className="onboard-btn-primary" onClick={retryWhatsAppLink}>
                                    <RefreshCw size={16} />
                                    {t('onboardRetry')}
                                </button>
                                <button
                                    type="button"
                                    className="onboard-btn-ghost"
                                    disabled={saving}
                                    onClick={handleSkipWhatsApp}
                                >
                                    {t('onboardSkipForNow')}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="onboard-wa-icon">
                                    <MessageSquare size={32} />
                                </div>
                                <h1 id="onboard-title" className="onboard-title">{t('onboardWaTitle')}</h1>
                                <p className="onboard-subtitle">{t('waScanInst')}</p>

                                {waState === 'qr' && waQR ? (
                                    <div className="onboard-qr-wrap">
                                        <img src={waQR} alt="" className="onboard-qr-img" />
                                    </div>
                                ) : (
                                    <div className="onboard-qr-placeholder" aria-hidden={!waBusy}>
                                        {waBusy && <Loader2 size={28} className="animate-spin onboard-wa-spinner" />}
                                    </div>
                                )}

                                <p className="onboard-wa-hint">
                                    <span className="onboard-wa-pulse" aria-hidden />
                                    {waState === 'qr' ? t('awaitingScan') : t('initEngine')}
                                </p>

                                <button
                                    type="button"
                                    className="onboard-btn-ghost"
                                    disabled={saving}
                                    onClick={handleSkipWhatsApp}
                                >
                                    {t('onboardSkipForNow')}
                                </button>
                            </>
                        )}
                        <button type="button" className="onboard-link-back" onClick={() => setStep(1)}>
                            {t('onboardBack')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
