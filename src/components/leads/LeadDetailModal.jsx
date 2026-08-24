import React, { useState, useEffect } from 'react';
import {
    X, Mail, Phone, MessageSquare, Edit2, Save,
    TrendingUp, Clock, Send, CheckCircle2, Loader2, History,
} from 'lucide-react';
import WhatsAppIcon from '../WhatsAppIcon.jsx';
import EmailComposerModal from './EmailComposerModal.jsx';
import { useTranslation } from '../../context/LanguageContext';
import {
    getLeadScore,
    getLeadScoreTier,
    isHotLead,
    getLeadDisplayName,
    getLeadCompanyLabel,
    getWhatsAppChatUrl,
    getTelUrl,
    getMailtoUrl,
    openExternalUrl,
} from '../../utils/leadContactActions.js';
import API_URL from '../../config.js';

const LeadDetailModal = ({
    lead,
    onClose,
    onUpdate,
    folderNameOptions = [],
    defaultLeadGroup,
    folderMessage = '',
    onTriggerFollowup,
    sendingFollowup = false,
    onFetchTimeline,
}) => {
    const { t, tWithFallback, formatRelativeTime } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedStatus, setEditedStatus] = useState(lead?.lead_status || 'New');
    const [editedGroup, setEditedGroup] = useState(lead?.lead_group || defaultLeadGroup);
    const [localNotes, setLocalNotes] = useState(lead?.notes || '');
    const [timeline, setTimeline] = useState([]);
    const [timelineLoading, setTimelineLoading] = useState(true);
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [messagePreview, setMessagePreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(true);
    const [previewError, setPreviewError] = useState(false);

    useEffect(() => {
        setEditedStatus(lead?.lead_status || 'New');
        setEditedGroup(lead?.lead_group || defaultLeadGroup);
        setLocalNotes(lead?.notes || '');
        setIsEditing(false);
    }, [lead, defaultLeadGroup]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setTimelineLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/leads/${lead.id}/timeline`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!cancelled && data.success) setTimeline(data.timeline || []);
            } catch {
                if (!cancelled) setTimeline([]);
            } finally {
                if (!cancelled) setTimelineLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [lead.id]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setPreviewLoading(true);
            setPreviewError(false);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/leads/${lead.id}/preview-message`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.success) {
                    setMessagePreview(data);
                } else {
                    setPreviewError(true);
                }
            } catch {
                if (!cancelled) setPreviewError(true);
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [lead.id]);

    const score = getLeadScore(lead);
    const scoreTier = getLeadScoreTier(score);
    const displayName = getLeadDisplayName(lead, t('importedLead'));

    const persist = (payload) => {
        onUpdate(lead.id, payload);
    };

    const handleSave = () => {
        persist({
            lead_status: editedStatus,
            lead_group: editedGroup,
        });
        setIsEditing(false);
    };

    const handleNotesBlur = () => {
        if (localNotes !== (lead.notes || '')) {
            persist({ notes: localNotes });
        }
    };

    const waText = folderMessage?.trim() || '';
    const openWhatsApp = () => {
        const url = getWhatsAppChatUrl(lead.phone, waText);
        if (!openExternalUrl(url)) showToastMissing(t('leadActionNoPhone'));
    };

    const openCall = () => {
        const url = getTelUrl(lead.phone);
        if (!url) {
            showToastMissing(t('leadActionNoPhone'));
            return;
        }
        window.location.href = url;
    };

    const openEmail = () => {
        if (!lead.email) {
            showToastMissing(t('leadActionNoEmail'));
            return;
        }
        setShowEmailComposer(true);
    };

    const showToastMissing = (msg) => {
        window.dispatchEvent(new CustomEvent('leads:toast', { detail: { message: msg, type: 'error' } }));
    };

    const getActivityIcon = (type) => {
        if (type === 'email') return <Mail size={16} />;
        if (type === 'call' || type === 'whatsapp') return <Phone size={16} />;
        if (type === 'note') return <MessageSquare size={16} />;
        return <Clock size={16} />;
    };

    const statusOptions = [
        { value: 'New', label: t('statusNew') },
        { value: 'Contacted', label: t('statusContacted') },
        { value: 'Closed', label: t('statusClosed') },
    ];

    const groupOptions = [...new Set([
        ...folderNameOptions,
        editedGroup,
        lead.lead_group,
        defaultLeadGroup,
        'Captured',
        'Reviews',
    ].filter(Boolean))].sort();

    return (
        <div className="lead-detail-overlay" onClick={onClose} role="presentation">
            <div
                className="lead-detail-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="lead-detail-title"
            >
                {/* ... rest of modal ... */}
                <div className="lead-detail-header">
                    <div className="lead-detail-header-main">
                        <div className="lead-detail-avatar-lg">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 id="lead-detail-title" className="lead-detail-title">
                                {displayName}
                                {isHotLead(lead) && (
                                    <span className="lead-hot-badge" title={tWithFallback('hotLeadTooltip', 'High intent — reach out fast')}>
                                        🔥 {tWithFallback('hotLeadBadge', 'Hot')}
                                    </span>
                                )}
                            </h2>
                            <p className="lead-detail-sub">{getLeadCompanyLabel(lead)}</p>
                        </div>
                    </div>
                    <button type="button" className="lead-detail-close" onClick={onClose} aria-label={t('cancel')}>
                        <X size={22} />
                    </button>
                </div>

                <div className="lead-detail-body">
                    <div className="lead-detail-main">
                        <section className="lead-detail-card">
                            <div className="lead-detail-card-head">
                                <h3>{t('leadInfoSection')}</h3>
                                {!isEditing ? (
                                    <button type="button" className="btn-secondary lead-detail-edit-btn" onClick={() => setIsEditing(true)}>
                                        <Edit2 size={14} /> {t('editLead')}
                                    </button>
                                ) : (
                                    <div className="lead-detail-edit-actions">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => {
                                                setEditedStatus(lead.lead_status || 'New');
                                                setEditedGroup(lead.lead_group || defaultLeadGroup);
                                                setIsEditing(false);
                                            }}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button type="button" className="btn-primary lead-detail-edit-btn" onClick={handleSave}>
                                            <Save size={14} /> {t('save')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="lead-detail-fields">
                                <div className="lead-detail-field lead-detail-field--readonly">
                                    <span>{t('nameHeader')}</span>
                                    <p className="lead-detail-value">{displayName}</p>
                                </div>
                                <div className="lead-detail-field lead-detail-field--readonly">
                                    <span>{t('emailLabel')}</span>
                                    {lead.email ? (
                                        <button type="button" className="lead-detail-link" onClick={openEmail}>
                                            {lead.email}
                                        </button>
                                    ) : (
                                        <p className="lead-detail-muted">—</p>
                                    )}
                                </div>
                                <div className="lead-detail-field lead-detail-field--readonly">
                                    <span>{t('phoneLabel')}</span>
                                    {lead.phone ? (
                                        <button type="button" className="lead-detail-link" onClick={openCall}>
                                            {lead.phone}
                                        </button>
                                    ) : (
                                        <p className="lead-detail-muted">—</p>
                                    )}
                                </div>
                                <label className="lead-detail-field">
                                    <span>{t('leadGroupLabel')}</span>
                                    <select
                                        className="input-field"
                                        value={isEditing ? editedGroup : (lead.lead_group || defaultLeadGroup)}
                                        disabled={!isEditing}
                                        onChange={(e) => setEditedGroup(e.target.value)}
                                    >
                                        {groupOptions.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="lead-detail-field">
                                    <span>{t('statusHeader')}</span>
                                    <select
                                        className="input-field"
                                        value={isEditing ? editedStatus : (lead.lead_status || 'New')}
                                        disabled={!isEditing}
                                        onChange={(e) => setEditedStatus(e.target.value)}
                                    >
                                        {statusOptions.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="lead-detail-field lead-detail-score-field">
                                    <span><TrendingUp size={14} /> {t('leadScoreLabel')}</span>
                                    <div className="lead-score-inline">
                                        <span className={`lead-score-num lead-score-num--${scoreTier}`}>{score}</span>
                                        <div className="lead-score-bar">
                                            <div className={`lead-score-fill lead-score-fill--${scoreTier}`} style={{ width: `${score}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="lead-detail-card">
                            <div className="lead-detail-card-head">
                                <h3>{t('leadTimeline')}</h3>
                                {onFetchTimeline && (
                                    <button type="button" className="btn-secondary lead-detail-edit-btn" onClick={() => onFetchTimeline(lead.id)}>
                                        <History size={14} /> {t('leadTimelineExpand')}
                                    </button>
                                )}
                            </div>
                            {timelineLoading ? (
                                <p className="lead-detail-muted">{t('loadingLeads')}</p>
                            ) : timeline.length === 0 ? (
                                <p className="lead-detail-muted">{t('noEventsYet')}</p>
                            ) : (
                                <ul className="lead-detail-timeline">
                                    {timeline.map((event, i) => (
                                        <li key={`${event.timestamp}-${i}`} className="lead-detail-timeline-item">
                                            <div className="lead-detail-timeline-icon">
                                                {getActivityIcon(event.type)}
                                            </div>
                                            <div>
                                                <p className="lead-detail-timeline-title">{event.title}</p>
                                                {event.description && (
                                                    <p className="lead-detail-timeline-desc">{event.description}</p>
                                                )}
                                                <p className="lead-detail-timeline-time">
                                                    {formatRelativeTime(event.timestamp)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="lead-detail-card">
                            <h3 className="mb-3">{t('notesLabel')}</h3>
                            <textarea
                                className="input-field min-h-[100px]"
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                onBlur={handleNotesBlur}
                                placeholder={t('notesPlaceholder')}
                            />
                        </section>
                    </div>

                    <aside className="lead-detail-aside">
                        <section className="lead-detail-card">
                            <h3 className="mb-4">{t('leadQuickActions')}</h3>
                            <div className="lead-quick-actions">
                                <button type="button" className="lead-quick-btn" onClick={openWhatsApp} disabled={!lead.phone}>
                                    <WhatsAppIcon size={18} />
                                    {t('leadActionWhatsApp')}
                                </button>
                                <button type="button" className="lead-quick-btn" onClick={openCall} disabled={!lead.phone}>
                                    <Phone size={18} />
                                    {t('leadActionCall')}
                                </button>
                                <button type="button" className="lead-quick-btn" onClick={openEmail} disabled={!lead.email}>
                                    <Mail size={18} />
                                    {t('leadActionEmail')}
                                </button>
                                <button
                                    type="button"
                                    className="lead-quick-btn lead-quick-btn--primary"
                                    disabled={sendingFollowup || lead.lead_status === 'Contacted'}
                                    onClick={() => onTriggerFollowup?.(lead.id)}
                                >
                                    {sendingFollowup ? (
                                        <><Loader2 size={18} className="animate-spin" /> {t('sending')}</>
                                    ) : lead.lead_status === 'Contacted' ? (
                                        <><CheckCircle2 size={18} /> {t('followupSent')}</>
                                    ) : (
                                        <><Send size={18} /> {t('triggerFollowupAuto')}</>
                                    )}
                                </button>
                            </div>
                        </section>

                        <section className="lead-detail-card">
                            <h3 className="mb-4">{t('leadNextMessageTitle')}</h3>
                            {previewLoading ? (
                                <p className="lead-detail-muted">{t('loadingActivity')}</p>
                            ) : previewError ? (
                                <p className="lead-detail-muted">{t('leadPreviewError')}</p>
                            ) : (
                                <>
                                    <div className="lead-message-preview-meta">
                                        {messagePreview?.channels?.whatsapp && (
                                            <span className="lead-message-channel-badge">
                                                <WhatsAppIcon size={13} /> {t('leadActionWhatsApp')}
                                            </span>
                                        )}
                                        {messagePreview?.channels?.email && (
                                            <span className="lead-message-channel-badge">
                                                <Mail size={13} /> {t('leadActionEmail')}
                                            </span>
                                        )}
                                        {!messagePreview?.channels?.whatsapp && !messagePreview?.channels?.email && (
                                            <span className="lead-message-channel-badge lead-message-channel-badge--muted">
                                                {t('leadNoContactInfo')}
                                            </span>
                                        )}
                                        {messagePreview?.sequenceStep && (
                                            <span className="lead-message-step-badge">
                                                {t('leadFollowupStepBadge', {
                                                    current: messagePreview.sequenceStep.index + 1,
                                                    total: messagePreview.sequenceStep.total,
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="lead-message-preview-bubble">
                                        {messagePreview?.preview}
                                    </div>
                                    {!messagePreview?.followupActive && (
                                        <p className="lead-message-preview-note">{t('leadFollowupOffNote')}</p>
                                    )}
                                    {lead.lead_status === 'Closed' && (
                                        <p className="lead-message-preview-note">{t('leadClosedNote')}</p>
                                    )}
                                </>
                            )}
                        </section>

                        <section className="lead-detail-card">
                            <h3 className="mb-4">{t('leadDetailsMeta')}</h3>
                            <dl className="lead-meta-list">
                                <div>
                                    <dt>{t('allSources')}</dt>
                                    <dd>{lead.source || '—'}</dd>
                                </div>
                                <div>
                                    <dt>{t('statusHeader')}</dt>
                                    <dd>
                                        <span className={`lead-status-chip lead-status-chip--${(lead.lead_status || 'new').toLowerCase()}`}>
                                            {lead.lead_status === 'Contacted' ? t('statusContacted') : lead.lead_status === 'Closed' ? t('statusClosed') : t('statusNew')}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t('capturedHeader')}</dt>
                                    <dd>{lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</dd>
                                </div>
                                <div>
                                    <dt>{t('consentLabel')}</dt>
                                    <dd>{lead.consent_given ? t('yes') : t('no')}</dd>
                                </div>
                            </dl>
                        </section>
                    </aside>
                </div>
            </div>

            {/* Email Composer — rendered outside the panel so it stacks on top */}
            {showEmailComposer && (
                <EmailComposerModal
                    leadId={lead.id}
                    to={lead.email}
                    recipientName={displayName}
                    onClose={() => setShowEmailComposer(false)}
                    onSend={() => {
                        // Modal auto-closes; parent just shows a toast
                        showToastMissing(t('leadEmailSent'));
                    }}
                />
            )}
        </div>
    );
};

export default LeadDetailModal;
