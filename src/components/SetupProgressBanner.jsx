import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Zap, CheckCircle2, AlertTriangle, X, ChevronRight,
    Mail, MessageSquare, Users, Play, Sparkles,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';
import './SetupProgressBanner.css';

const DONE_KEY   = 'spb_done_at';
const DONE_GRACE = 3 * 24 * 60 * 60 * 1000;

function buildSteps(recipeConfigured, recipeStatus, integrations, healthIssues, t) {
    const hasConfigured = recipeConfigured.leadFollowUp || recipeConfigured.leadCapture || recipeConfigured.reviewFunnel;
    const hasActive     = recipeStatus.leadFollowUp     || recipeStatus.leadCapture     || recipeStatus.reviewFunnel;

    const gmailConnected = integrations.some(i => i.provider === 'google');
    const waConnected    = integrations.some(i => i.provider === 'whatsapp');
    const gmailIssue     = healthIssues.some(i => i.code === 'gmail_disconnected' || i.code === 'email_send_blocked');
    const waIssue        = healthIssues.some(i => i.code === 'whatsapp_disconnected');

    const gmailState = gmailConnected && !gmailIssue ? 'done' : gmailConnected && gmailIssue ? 'warning' : 'pending';
    const waState    = waConnected    && !waIssue    ? 'done' : waIssue                       ? 'warning' : 'pending';

    return [
        {
            id: 'employee', Icon: Users,
            label: t('setupStep1Label'),
            mobilDesc: t('setupStep1Desc'),
            state: hasConfigured ? 'done' : 'pending',
            to: '/dashboard/employee-gallery',
            cta: t('setupStep1Cta'),
        },
        {
            id: 'gmail', Icon: Mail,
            label: t('setupStep2Label'),
            mobilDesc: gmailState === 'warning' ? t('setupStep2WarnDesc') : t('setupStep2Desc'),
            state: gmailState,
            to: '/dashboard/integrations',
            cta: gmailState === 'warning' ? t('setupStep2WarnCta') : t('setupStep2Cta'),
        },
        {
            id: 'whatsapp', Icon: MessageSquare,
            label: t('setupStep3Label'),
            mobilDesc: waState === 'warning' ? t('setupStep3WarnDesc') : t('setupStep3Desc'),
            state: waState,
            to: '/dashboard/integrations',
            cta: waState === 'warning' ? t('setupStep3WarnCta') : t('setupStep3Cta'),
        },
        {
            id: 'activate', Icon: Play,
            label: t('setupStep4Label'),
            mobilDesc: t('setupStep4Desc'),
            state: hasActive ? 'done' : 'pending',
            to: '/dashboard/employee-gallery',
            cta: t('setupStep4Cta'),
        },
    ];
}

export default function SetupProgressBanner({ recipeConfigured = {}, recipeStatus = {} }) {
    const { t } = useTranslation();
    const [healthIssues, setHealthIssues] = useState([]);
    const [integrations, setIntegrations] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        const doneAt = localStorage.getItem(DONE_KEY);
        return !!(doneAt && Date.now() - parseInt(doneAt) > DONE_GRACE);
    });
    const [ready, setReady] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [hRes, iRes] = await Promise.all([
                fetch(`${API_URL}/api/integrations/health`, { credentials: 'include' }),
                fetch(`${API_URL}/api/integrations`,        { credentials: 'include' }),
            ]);
            if (hRes.ok) { const d = await hRes.json(); if (d.success) setHealthIssues(d.issues ?? []); }
            if (iRes.ok) { const d = await iRes.json(); if (d.success) setIntegrations(d.integrations ?? []); }
        } catch { /* silent */ }
        finally { setReady(true); }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 60_000);
        const onFocus   = () => fetchData();
        const onRefresh = () => fetchData();
        window.addEventListener('focus', onFocus);
        window.addEventListener('entitlements:refresh', onRefresh);
        return () => {
            clearInterval(id);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('entitlements:refresh', onRefresh);
        };
    }, [fetchData]);

    if (dismissed || !ready) return null;

    const steps     = buildSteps(recipeConfigured, recipeStatus, integrations, healthIssues, t);
    const doneCount = steps.filter(s => s.state === 'done').length;
    const allDone   = doneCount === steps.length;
    const hasWarning = steps.some(s => s.state === 'warning');
    const nextStep  = steps.find(s => s.state !== 'done');

    if (allDone) {
        if (!localStorage.getItem(DONE_KEY)) localStorage.setItem(DONE_KEY, Date.now().toString());
        return null;
    }

    return (
        <>
            {/* ── Desktop: single flat row ── */}
            <div
                className={`spb${hasWarning ? ' spb--warn' : ''}`}
                role="complementary"
                aria-label={t('setupBannerAriaLabel')}
            >
                {/* Brand label */}
                <div className="spb-brand" aria-hidden>
                    <Zap size={12} />
                    <span>{t('setupBannerTitle')}</span>
                </div>

                <div className="spb-divider" aria-hidden />

                {/* Step track — all inline, single row */}
                <div className="spb-track" role="list">
                    {steps.map((step, i) => {
                        const { Icon, state, label, to, cta } = step;
                        const isDone = state === 'done';
                        const isWarn = state === 'warning';
                        const isNext = step === nextStep;
                        const isLast = i === steps.length - 1;

                        return (
                            <React.Fragment key={step.id}>
                                <div
                                    className={[
                                        'spb-step',
                                        isDone ? 'spb-step--done'   : '',
                                        isWarn ? 'spb-step--warn'   : '',
                                        isNext ? 'spb-step--next'   : '',
                                        !isDone && !isWarn && !isNext ? 'spb-step--locked' : '',
                                    ].filter(Boolean).join(' ')}
                                    role="listitem"
                                >
                                    {/* Node */}
                                    <div className="spb-node" aria-hidden>
                                        {isDone  ? <CheckCircle2 size={12} strokeWidth={2.5} /> :
                                         isWarn  ? <AlertTriangle size={11} strokeWidth={2.5} /> :
                                         <span className="spb-num">{i + 1}</span>}
                                    </div>

                                    {/* Icon + label */}
                                    <Icon size={12} className="spb-icon" aria-hidden />
                                    <span className="spb-label">{label}</span>

                                    {/* Inline CTA for active/warn step */}
                                    {(isNext || isWarn) && (
                                        <Link to={to} className="spb-cta" aria-label={cta}>
                                            {cta}
                                            <ChevronRight size={11} strokeWidth={2.5} />
                                        </Link>
                                    )}
                                </div>

                                {!isLast && (
                                    <div className={`spb-line${isDone ? ' spb-line--lit' : ''}`} aria-hidden />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Progress + dismiss */}
                <div className="spb-tail">
                    <span className="spb-count" aria-label={`${doneCount} of ${steps.length} steps complete`}>
                        {doneCount}/{steps.length}
                    </span>
                    <button className="spb-x" onClick={() => setDismissed(true)} aria-label={t('healthBannerDismiss')}>
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* ── Mobile: focused next-step card ── */}
            {nextStep && (
                <div className={`spb-mobile${hasWarning ? ' spb-mobile--warn' : ''}`} aria-label={t('setupBannerAriaLabel')}>
                    <div className="spb-mobile-badge" aria-hidden>
                        {steps.indexOf(nextStep) + 1}/{steps.length}
                    </div>
                    <div className="spb-mobile-body">
                        <span className="spb-mobile-label">{nextStep.label}</span>
                        <span className="spb-mobile-desc">{nextStep.mobilDesc}</span>
                    </div>
                    <Link to={nextStep.to} className="spb-mobile-cta">
                        {nextStep.cta}
                        <ChevronRight size={13} strokeWidth={2.5} />
                    </Link>
                    <button className="spb-x spb-mobile-x" onClick={() => setDismissed(true)} aria-label={t('healthBannerDismiss')}>
                        <X size={12} />
                    </button>
                </div>
            )}
        </>
    );
}
