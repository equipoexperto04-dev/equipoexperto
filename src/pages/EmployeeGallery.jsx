import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Pause,
    Play,
    Sparkles,
    Trash2,
    Star,
    Users2,
    Zap,
    MessageCircle,
    Mail,
    Plus,
    MapPin,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useTranslation } from '../context/LanguageContext';
import { usePlanEntitlements, turningOnWouldExceedSlotLimit } from '../context/PlanEntitlementsContext';
import EmployeeUsePanel from '../components/EmployeeUsePanel.jsx';
import { fetchEmployeeUseAssets } from '../utils/employeeUseAssets.js';
import API_URL from '../config.js';
import './EmployeeGallery.css';

const CHANNEL_META = {
    whatsapp: { Icon: MessageCircle, labelKey: 'wizChannelWhatsapp' },
    email: { Icon: Mail, labelKey: 'galleryToolEmail' },
    gmb: { Icon: MapPin, labelKey: 'galleryToolGMB' },
};

const GALLERY_JOB_META = [
    {
        id: 'review',
        emoji: '⭐',
        Icon: Star,
        nameKey: 'empReviewName',
        taglineKey: 'empReviewTagline',
        titleKey: 'empReviewTitle',
        configKey: 'reviewFunnel',
        color: '#f59e0b',
        channels: ['whatsapp', 'gmb'],
        configPath: '/dashboard/config/review-funnel',
    },
    {
        id: 'capture',
        emoji: '👤',
        Icon: Users2,
        nameKey: 'empLeadName',
        taglineKey: 'empLeadTagline',
        titleKey: 'empLeadTitle',
        configKey: 'leadCapture',
        color: '#3b82f6',
        channels: ['whatsapp', 'email'],
        configPath: '/dashboard/config/lead-capture',
    },
    {
        id: 'followup',
        emoji: '🔄',
        Icon: Zap,
        nameKey: 'empFollowName',
        taglineKey: 'empFollowTagline',
        titleKey: 'empFollowTitle',
        configKey: 'leadFollowUp',
        color: '#8b5cf6',
        channels: ['whatsapp', 'email'],
        configPath: '/dashboard/config/lead-followup',
    },
];

const HIRE_SUCCESS_BODY_KEY = {
    review: 'wizSuccessReview',
    capture: 'wizSuccessCapture',
    followup: 'wizSuccessFollowup',
};

const EmployeeGallery = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { entitlements } = usePlanEntitlements();
    const [statuses, setStatuses] = useState({});
    const [configured, setConfigured] = useState({});
    const [toggling, setToggling] = useState(null);
    const [usePanelJob, setUsePanelJob] = useState(null);
    const [useAssets, setUseAssets] = useState(null);
    const [useLoading, setUseLoading] = useState(false);
    const [confirmRemoveJob, setConfirmRemoveJob] = useState(null);
    const [deleteRelatedData, setDeleteRelatedData] = useState(false);
    const [removingKey, setRemovingKey] = useState(null);
    const [highlightEmployeeId, setHighlightEmployeeId] = useState(null);

    const fetchStatuses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                if (data.recipes) setStatuses(data.recipes);
                if (data.configured) setConfigured(data.configured);
            }
        } catch {
            /* noop */
        }
    };

    useEffect(() => {
        fetchStatuses();
        const onFocus = () => fetchStatuses();
        window.addEventListener('focus', onFocus);
        window.addEventListener('entitlements:refresh', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('entitlements:refresh', onFocus);
        };
    }, []);

    useEffect(() => {
        const hiredId = location.state?.hiredEmployeeId;
        if (!hiredId) return;

        const jobMeta = GALLERY_JOB_META.find((j) => j.id === hiredId);
        let cancelled = false;

        (async () => {
            await fetchStatuses();
            if (cancelled) return;

            const bodyKey = HIRE_SUCCESS_BODY_KEY[hiredId];
            const body = bodyKey ? t(bodyKey) : '';
            const name = jobMeta ? t(jobMeta.nameKey) : '';
            const message =
                body && body !== bodyKey
                    ? body
                    : name
                      ? t('galleryEmployeeHired', { name })
                      : t('wizSuccessTitle');
            toast(message, 'success');
            setHighlightEmployeeId(hiredId);
            navigate(location.pathname, { replace: true, state: {} });
        })();

        return () => {
            cancelled = true;
        };
    }, [location.state?.hiredEmployeeId, location.pathname, navigate, t, toast]);

    useEffect(() => {
        if (!highlightEmployeeId) return undefined;
        const scrollTimer = requestAnimationFrame(() => {
            document
                .getElementById(`gallery-card-${highlightEmployeeId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        const clearTimer = setTimeout(() => setHighlightEmployeeId(null), 5000);
        return () => {
            cancelAnimationFrame(scrollTimer);
            clearTimeout(clearTimer);
        };
    }, [highlightEmployeeId, configured]);

    const summary = useMemo(() => {
        const hired = GALLERY_JOB_META.filter((j) => configured[j.configKey]).length;
        const working = GALLERY_JOB_META.filter((j) => statuses[j.configKey]).length;
        return { hired, working };
    }, [configured, statuses]);

    const handleToggle = async (job) => {
        const key = job.configKey;
        const newState = !statuses[key];
        const maxEmp = Number(entitlements.max_employees) || 1;

        if (turningOnWouldExceedSlotLimit(statuses, key, maxEmp, newState)) {
            toast(t('planEmployeeLimitReached', { max: maxEmp }), 'warning');
            return;
        }

        setToggling(key);
        setStatuses((prev) => ({ ...prev, [key]: newState }));
        const title = t(job.nameKey);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recipe: key, is_active: newState }),
            });
            let data = {};
            try {
                data = await res.json();
            } catch {
                /* non-JSON */
            }
            if (!res.ok) {
                setStatuses((prev) => ({ ...prev, [key]: !newState }));
                if (data.code === 'EMPLOYEE_PLAN_LIMIT') {
                    toast(t('planEmployeeLimitReached', { max: data.max_employees ?? maxEmp }), 'warning');
                } else {
                    toast(t('automationUpdateError'), 'error');
                }
                return;
            }
            toast(
                newState ? t('galleryToastNowActive', { title }) : t('galleryToastPaused', { title }),
                newState ? 'success' : 'info'
            );
        } catch {
            setStatuses((prev) => ({ ...prev, [key]: !newState }));
            toast(t('automationUpdateError'), 'error');
        } finally {
            setToggling(null);
        }
    };

    const openUsePanel = async (job) => {
        setUsePanelJob(job);
        setUseAssets(null);
        setUseLoading(true);
        try {
            const token = localStorage.getItem('token');
            const assets = await fetchEmployeeUseAssets(job.id, token);
            setUseAssets(assets);
        } catch {
            setUseAssets(null);
            toast(t('automationUpdateError'), 'error');
        } finally {
            setUseLoading(false);
        }
    };

    const closeUsePanel = () => {
        setUsePanelJob(null);
        setUseAssets(null);
        setUseLoading(false);
    };

    const deleteDataLabelKey = (configKey) =>
        configKey === 'reviewFunnel' ? 'fireDeleteReviews' : 'fireDeleteLeads';

    const handleRemoveEmployee = async (job) => {
        const key = job.configKey;
        const title = t(job.nameKey);
        setRemovingKey(key);
        setConfirmRemoveJob(null);
        const shouldDeleteData = deleteRelatedData;
        setDeleteRelatedData(false);
        if (usePanelJob?.id === job.id) closeUsePanel();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/config/automation`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ recipe: key, deleteRelatedData: shouldDeleteData }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                toast(data.message || t('removalFailed'), 'error');
                return;
            }
            setConfigured((prev) => ({ ...prev, [key]: false }));
            setStatuses((prev) => ({ ...prev, [key]: false }));
            toast(t('toastRemoved', { title }), 'info');
            try {
                window.dispatchEvent(new Event('entitlements:refresh'));
            } catch {
                /* noop */
            }
            fetchStatuses();
        } catch {
            toast(t('removalFailed'), 'error');
        } finally {
            setRemovingKey(null);
        }
    };

    return (
        <div className="gallery-page dashboard-page animate-fade-in">
            <header className="gallery-header">
                <div>
                    <h1 className="gallery-title">{t('galleryTitle')}</h1>
                    <p className="gallery-subtitle">{t('gallerySubtitle')}</p>
                </div>
                <div className="gallery-stat-row" aria-label={t('galleryTitle')}>
                    <div className="gallery-stat">
                        <span className="gallery-stat-num">{summary.working}</span>
                        <span className="gallery-stat-lbl">{t('galleryStatWorking')}</span>
                    </div>
                    <div className="gallery-stat-divider" aria-hidden />
                    <div className="gallery-stat">
                        <span className="gallery-stat-num">{summary.hired}/3</span>
                        <span className="gallery-stat-lbl">{t('galleryStatHired')}</span>
                    </div>
                </div>
            </header>

            <div className="gallery-grid">
                {GALLERY_JOB_META.map((job) => {
                    const JobIcon = job.Icon;
                    const isConfigured = configured[job.configKey];
                    const isActive = statuses[job.configKey];
                    const isWorking = isConfigured && isActive;

                    return (
                        <article
                            key={job.id}
                            id={`gallery-card-${job.id}`}
                            className={`gallery-card ${isWorking ? 'gallery-card--working' : ''} ${!isConfigured ? 'gallery-card--not-hired' : ''} ${highlightEmployeeId === job.id ? 'gallery-card--just-hired' : ''}`}
                            style={{
                                '--card-accent': job.color,
                                '--card-accent-bg': `${job.color}14`,
                            }}
                        >
                            <div className="gallery-card-head">
                                <div className="gallery-card-icon" aria-hidden>
                                    <JobIcon size={24} />
                                </div>
                                {isConfigured ? (
                                    <span
                                        className={`gallery-card-status ${isActive ? 'is-on' : 'is-off'}`}
                                    >
                                        <span className="gallery-card-status-dot" />
                                        {isActive ? t('galleryStatusActive') : t('galleryStatusPaused')}
                                    </span>
                                ) : (
                                    <span className="gallery-card-status is-new">
                                        {t('galleryStatusNotHired')}
                                    </span>
                                )}
                            </div>

                            <h2 className="gallery-card-name">{t(job.nameKey)}</h2>
                            <p className="gallery-card-tagline">{t(job.taglineKey)}</p>

                            <div className="gallery-card-channels">
                                {job.channels.map((channelId) => {
                                    const meta = CHANNEL_META[channelId];
                                    if (!meta) return null;
                                    const ChIcon = meta.Icon;
                                    return (
                                        <span key={channelId} className="gallery-card-channel">
                                            <ChIcon size={11} aria-hidden />
                                            {t(meta.labelKey)}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="gallery-card-actions">
                                {isConfigured ? (
                                    <>
                                        <button
                                            type="button"
                                            className={`gallery-btn-toggle ${isActive ? 'is-on' : ''}`}
                                            onClick={() => handleToggle(job)}
                                            disabled={toggling === job.configKey}
                                        >
                                            {isActive ? <Pause size={14} /> : <Play size={14} />}
                                            {isActive ? t('pauseEmployee') : t('startWorking')}
                                        </button>
                                        <button
                                            type="button"
                                            className="gallery-btn-use"
                                            onClick={() => openUsePanel(job)}
                                        >
                                            <Sparkles size={14} />
                                            {t('galleryUseEmployee')}
                                        </button>
                                        <Link
                                            to={job.configPath}
                                            className="gallery-btn-config"
                                        >
                                            {t('manageRole')}
                                            <ArrowRight size={13} />
                                        </Link>
                                        <button
                                            type="button"
                                            className="gallery-btn-remove"
                                            onClick={() => setConfirmRemoveJob(job)}
                                            disabled={removingKey === job.configKey}
                                            title={t('removeEmployee')}
                                        >
                                            <Trash2 size={14} />
                                            <span>{t('removeEmployee')}</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="gallery-btn-hire"
                                        onClick={() =>
                                            navigate(`/dashboard/employee/${job.id}`, {
                                                state: { freshHire: true },
                                            })
                                        }
                                    >
                                        <Plus size={14} />
                                        {t('hireForThisRole')}
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            <footer className="gallery-foot">
                <p>
                    {t('galleryMarketplaceHint')}{' '}
                    <Link to="/dashboard/marketplace">{t('sidebarMarketplace')} →</Link>
                </p>
            </footer>

            <EmployeeUsePanel
                open={!!usePanelJob}
                onClose={closeUsePanel}
                job={usePanelJob}
                assets={useAssets}
                loading={useLoading}
                accent={usePanelJob?.color}
            />

            {confirmRemoveJob && (
                <div
                    className="gallery-remove-overlay"
                    onClick={() => {
                        setConfirmRemoveJob(null);
                        setDeleteRelatedData(false);
                    }}
                    role="presentation"
                >
                    <div
                        className="gallery-remove-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gallery-remove-title"
                        onClick={(e) => e.stopPropagation()}
                        style={{ '--gallery-remove-accent': confirmRemoveJob.color }}
                    >
                        <span className="gallery-remove-emoji" aria-hidden>
                            {confirmRemoveJob.id === 'review' ? '⭐' : confirmRemoveJob.id === 'capture' ? '👤' : '🔄'}
                        </span>
                        <h3 id="gallery-remove-title" className="gallery-remove-title">
                            {t('letGoTitle', { title: t(confirmRemoveJob.nameKey) })}
                        </h3>
                        <p className="gallery-remove-desc">{t('letGoDesc')}</p>
                        <label className="gallery-remove-opt">
                            <input
                                type="checkbox"
                                checked={deleteRelatedData}
                                onChange={(e) => setDeleteRelatedData(e.target.checked)}
                            />
                            <span>{t(deleteDataLabelKey(confirmRemoveJob.configKey))}</span>
                        </label>
                        <div className="gallery-remove-actions">
                            <button
                                type="button"
                                className="gallery-remove-cancel"
                                onClick={() => {
                                    setConfirmRemoveJob(null);
                                    setDeleteRelatedData(false);
                                }}
                            >
                                {t('cancelBtn')}
                            </button>
                            <button
                                type="button"
                                className="gallery-remove-confirm"
                                onClick={() => handleRemoveEmployee(confirmRemoveJob)}
                                disabled={removingKey === confirmRemoveJob.configKey}
                            >
                                <Trash2 size={14} />
                                {removingKey === confirmRemoveJob.configKey
                                    ? t('removing')
                                    : t('letGo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeGallery;
