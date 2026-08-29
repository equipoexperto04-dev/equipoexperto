import React, { useState, useEffect } from 'react';
import {
    Star, Calendar, Mail, Phone,
    Search, Users, BarChart3, Clock,
    Download, RefreshCcw, Smile, Frown,
    CheckCircle2, MessageSquare, XCircle,
    PlusCircle, QrCode, ExternalLink, MessageCircle,
    Loader2, Sparkles, Copy, X, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';
import EmptyState from '../components/EmptyState';
import './Feedback.css';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';

const Feedback = () => {
    const { t, language, tWithFallback } = useTranslation();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [loadError, setLoadError] = useState('');
    const showRefreshLoading = useDelayedLoading(isRefreshing);
    const showExportLoading = useDelayedLoading(isExporting);

    const fetchData = async () => {
        setIsRefreshing(true);
        setLoadError('');
        try {
            const token = localStorage.getItem('token');
            const [feedbackRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/feedback`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/feedback/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const feedbackData = await feedbackRes.json();
            const statsData = await statsRes.json();
            if (feedbackData.success) setFeedback(feedbackData.data);
            else setLoadError(t('feedbackLoadFailed'));
            if (statsData.success) setStats(statsData.data);
        } catch (err) {
            console.error('Failed to fetch feedback', err);
            setLoadError(t('feedbackLoadFailed'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredFeedback = feedback.filter(item => {
        const matchesSearch =
            (item.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.customer_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesRating = filterRating === 'all' || item.rating_overall === parseInt(filterRating);
        return matchesSearch && matchesRating;
    });

    const RatingBar = ({ label, count }) => (
        <div className="fb-rating-row">
            <span className="fb-rating-label">{label}</span>
            <div className="fb-rating-stars">
                {[1,2,3,4,5].map(s => (
                    <Star 
                        key={s} size={11}
                        fill={s <= count ? 'var(--accent-color)' : 'none'}
                        style={{ color: s <= count ? 'var(--accent-color)' : 'var(--border-color)' }}
                    />
                ))}
            </div>
            <span className="fb-rating-num">{count}/5</span>
        </div>
    );

    const positiveCount = stats ? (stats.rating_5 || 0) + (stats.rating_4 || 0) : 0;
    const positivePercent = feedback.length > 0 ? Math.round((positiveCount / feedback.length) * 100) : 0;
    const alertCount = stats ? (stats.rating_1 || 0) + (stats.rating_2 || 0) : 0;
    
    const handleActionOnNegative = (item) => {
        // Simple mock action: open WhatsApp with customer or pre-fill email
        if (item.customer_phone) {
            window.open(`https://wa.me/${item.customer_phone.replace(/\D/g, '')}`, '_blank');
        } else if (item.customer_email) {
            window.location.href = `mailto:${item.customer_email}?subject=Feedback Follow-up`;
        } else {
            alert(t('noContactAvailable'));
        }
    };

    /* ── AI / smart reply draft ── */
    const [draftModal, setDraftModal] = useState(null); // { item, draft, loading, copied }

    const openReplyDraft = async (item) => {
        setDraftModal({ item, draft: '', loading: true, copied: false });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/feedback/${item.id}/draft-reply?lang=${language}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDraftModal({ item, draft: data.success ? data.draft : '', loading: false, copied: false });
        } catch {
            setDraftModal({ item, draft: '', loading: false, copied: false, error: true });
        }
    };

    const closeReplyDraft = () => setDraftModal(null);

    const handleCopyDraft = async () => {
        if (!draftModal?.draft) return;
        try {
            await navigator.clipboard.writeText(draftModal.draft);
            setDraftModal((prev) => prev && { ...prev, copied: true });
        } catch {
            // clipboard unavailable — no-op
        }
    };

    const handleSendDraftEmail = () => {
        if (!draftModal) return;
        const { item, draft } = draftModal;
        if (!item.customer_email) return;
        const mailtoUrl = `mailto:${item.customer_email}?subject=${encodeURIComponent(t('feedbackReplySubject') || 'Re: your feedback')}&body=${encodeURIComponent(draft)}`;
        window.location.href = mailtoUrl;
    };

    const handleSendDraftWhatsApp = () => {
        if (!draftModal) return;
        const { item, draft } = draftModal;
        if (!item.customer_phone) return;
        window.open(`https://wa.me/${item.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(draft)}`, '_blank');
    };

    const handleExport = async () => {
        if (feedback.length === 0) return;
        setIsExporting(true);
        try {
        const headers = [
            t('csvName'), t('csvEmail'), t('csvServiceRating'), 
            t('csvProductRating'), t('csvOverallRating'), 
            t('csvComment'), t('csvContactRequested'), t('csvDate')
        ];
        const csvRows = [headers.join(',')];

        feedback.forEach(item => {
            csvRows.push([
                `"${item.customer_name || t('anonymous')}"`,
                `"${item.customer_email || t('noEmail')}"`,
                item.rating_service,
                item.rating_product,
                item.rating_overall,
                `"${(item.comment || '').replace(/"/g, '""')}"`,
                item.contact_requested ? t('yes') : t('no'),
                `"${new Date(item.created_at).toLocaleString()}"`
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="feedback-page">
            {/* PAGE HEADER */}
            <div className="fb-header">
                <div>
                    <button type="button" className="fb-back-link" onClick={() => navigate('/dashboard/employee-gallery')}>
                        ← {t('backToTeam')}
                    </button>
                    <h1 className="fb-title">{t('sidebarFeedback')}</h1>
                    <p className="fb-subtitle">{t('feedbackSubSimple')}</p>
                    <button type="button" className="fb-setup-link" onClick={() => navigate('/dashboard/config/review-funnel')}>
                        {t('reviewsBackToSetup')} →
                    </button>
                </div>
                <div className="fb-header-actions">
                    <button
                        onClick={fetchData}
                        className="btn-secondary fb-icon-btn"
                        title={t('refreshTooltip')}
                        disabled={isRefreshing}
                    >
                        {showRefreshLoading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCcw size={16} />}
                    </button>
                    <button 
                        onClick={handleExport} 
                        disabled={feedback.length === 0 || isExporting}
                        className={`btn-primary fb-export-btn ${feedback.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {showExportLoading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Download size={15} />}
                        {showExportLoading ? t('loading') : t('exportCSV')}
                    </button>
                </div>
            </div>

            {!isLoading && loadError ? (
                <EmptyState
                    icon={MessageSquare}
                    title={t('feedbackLoadFailed')}
                    description={loadError}
                    action={fetchData}
                    actionLabel={t('feedbackRetry')}
                />
            ) : null}

            {/* STATS GRID */}
            {!loadError && (
            <>
            <div className="fb-stats-grid">
                <div className="fb-stat-card">
                    <div className="fb-stat-icon fb-stat-icon--green">
                        <BarChart3 size={20} />
                    </div>
                    <div className="fb-stat-body">
                        <span className="fb-stat-label">{t('avgRating')}</span>
                        <span className="fb-stat-value">{stats?.avg_overall?.toFixed(1) || '—'}</span>
                        <span className="fb-stat-sub">{t('outOf5')}</span>
                    </div>
                </div>

                <div className="fb-stat-card">
                    <div className="fb-stat-icon fb-stat-icon--blue">
                        <Users size={20} />
                    </div>
                    <div className="fb-stat-body">
                        <span className="fb-stat-label">{t('totalResponses')}</span>
                        <span className="fb-stat-value">{feedback.length}</span>
                        <span className="fb-stat-sub">{t('feedbackSubmissions')}</span>
                    </div>
                </div>

                <div className="fb-stat-card">
                    <div className="fb-stat-icon fb-stat-icon--teal">
                        <Smile size={20} />
                    </div>
                    <div className="fb-stat-body">
                        <span className="fb-stat-label">{t('positiveRate')}</span>
                        <span className="fb-stat-value">{positivePercent}%</span>
                        <span className="fb-stat-sub">{t('fourFiveStars')}</span>
                    </div>
                </div>

                <div className="fb-stat-card">
                    <div className="fb-stat-icon fb-stat-icon--red">
                        <Frown size={20} />
                    </div>
                    <div className="fb-stat-body">
                        <span className="fb-stat-label">{t('needsAttention')}</span>
                        <span className="fb-stat-value">{alertCount}</span>
                        <span className="fb-stat-sub">{t('oneTwoStars')}</span>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTER */}
            <div className="fb-toolbar">
                <div className="fb-search-wrap relative">
                    <Search size={16} className="fb-search-icon" />
                    <input
                        type="text"
                        className="input-field fb-search-input pr-10"
                        placeholder={t('searchFeedback')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary/20 rounded-full transition-colors opacity-50"
                        >
                            <XCircle size={14} className="text-secondary" />
                        </button>
                    )}
                </div>
                <div className="fb-rating-filter">
                    {['all', '5', '4', '3', '2', '1'].map(r => (
                        <button
                            key={r}
                            className={`fb-filter-btn ${filterRating === r ? 'fb-filter-btn--active' : ''}`}
                            onClick={() => setFilterRating(r)}
                        >
                            {r === 'all' ? t('allReviews') : `${r} ★`}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="premium-card p-0 overflow-hidden">
                <div style={{ overflowX: 'auto' }}>
                    <table className="fb-table">
                        <thead>
                            <tr>
                                <th>{t('customerHeader')}</th>
                                <th>{t('serviceHeader')}</th>
                                <th>{t('productHeader')}</th>
                                <th>{t('overallHeader')}</th>
                                <th>{t('commentHeader')}</th>
                                <th>{t('contactHeader')}</th>
                                <th>{t('dateHeader')}</th>
                                <th className="text-right">{t('actionsHeader')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="fb-empty-cell">{t('loadingFeedback')}</td>
                                </tr>
                            ) : filteredFeedback.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="fb-empty-cell">
                                        <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.2, display: 'block' }} />
                                        {t('noFeedbackFound')}
                                    </td>
                                </tr>
                            ) : (
                                filteredFeedback.map(item => (
                                    <tr key={item.id} className="fb-row">
                                        {/* CUSTOMER */}
                                        <td>
                                            <div className="fb-customer">
                                                <div className="fb-avatar">
                                                    {item.customer_name ? item.customer_name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <div className="fb-customer-name">
                                                        {item.customer_name || t('anonymous')}
                                                    </div>
                                                    <div className="fb-customer-email">
                                                        <Mail size={9} />
                                                        {item.customer_email || t('noEmail')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* SERVICE */}
                                        <td>
                                            <div className="fb-inline-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={12}
                                                        fill={s <= item.rating_service ? 'var(--accent-color)' : 'none'}
                                                        style={{ color: s <= item.rating_service ? 'var(--accent-color)' : 'var(--border-color)' }}
                                                    />
                                                ))}
                                            </div>
                                        </td>

                                        {/* PRODUCT */}
                                        <td>
                                            <div className="fb-inline-stars">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={12}
                                                        fill={s <= item.rating_product ? 'var(--accent-color)' : 'none'}
                                                        style={{ color: s <= item.rating_product ? 'var(--accent-color)' : 'var(--border-color)' }}
                                                    />
                                                ))}
                                            </div>
                                        </td>

                                        {/* OVERALL */}
                                        <td>
                                            <div className="fb-overall">
                                                <div className="fb-inline-stars">
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} size={12}
                                                            fill={s <= item.rating_overall ? 'var(--accent-color)' : 'none'}
                                                            style={{ color: s <= item.rating_overall ? 'var(--accent-color)' : 'var(--border-color)' }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="fb-overall-bar">
                                                    <div className="fb-overall-fill" style={{ width: `${(item.rating_overall / 5) * 100}%` }} />
                                                </div>
                                            </div>
                                        </td>

                                        {/* COMMENT */}
                                        <td>
                                            <p className="fb-comment" title={item.comment || undefined}>
                                                {item.comment || <span style={{ opacity: 0.35, fontStyle: 'italic' }}>{t('noComment')}</span>}
                                            </p>
                                        </td>

                                        {/* CONTACT */}
                                        <td>
                                            {item.contact_requested ? (
                                                <span className="fb-badge fb-badge--urgent">
                                                    <Phone size={10} /> {t('requested')}
                                                </span>
                                            ) : (
                                                <span className="fb-badge fb-badge--none">
                                                    <CheckCircle2 size={10} /> {t('none')}
                                                </span>
                                            )}
                                        </td>

                                        {/* DATE */}
                                        <td>
                                            <div className="fb-date">
                                                <div className="fb-date-day">
                                                    <Calendar size={11} />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="fb-date-time">
                                                    <Clock size={9} />
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="text-right">
                                            <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                                {item.comment?.trim() && (
                                                    <button
                                                        onClick={() => openReplyDraft(item)}
                                                        className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors group relative"
                                                        title={tWithFallback('draftReply', 'Draft a reply')}
                                                    >
                                                        <Sparkles size={16} />
                                                        <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                                                            {tWithFallback('draftReply', 'Draft a reply')}
                                                        </span>
                                                    </button>
                                                )}
                                                {item.rating_overall <= 3 && (
                                                    <button
                                                        onClick={() => handleActionOnNegative(item)}
                                                        className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors group relative"
                                                        title={t('contactCustomer') || 'Contact customer'}
                                                    >
                                                        <MessageCircle size={16} />
                                                        <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                                                            {t('respondToFeedback') || 'Respond to Feedback'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* TABLE FOOTER */}
                {!isLoading && filteredFeedback.length > 0 && (
                    <div className="fb-table-footer">
                        <span>{t('showingNofM', { n: filteredFeedback.length, m: feedback.length })}</span>
                    </div>
                )}
            </div>
            </>
            )}

            {/* AI / SMART REPLY DRAFT MODAL */}
            {draftModal && (
                <div className="fb-draft-overlay" onClick={closeReplyDraft}>
                    <div className="fb-draft-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="fb-draft-header">
                            <span className="fb-draft-title">
                                <Sparkles size={16} /> {tWithFallback('draftReplyTitle', 'Reply draft')}
                            </span>
                            <button className="fb-draft-close" onClick={closeReplyDraft} aria-label={t('cancel')}>
                                <X size={18} />
                            </button>
                        </div>
                        <p className="fb-draft-sub">
                            {tWithFallback('draftReplySub', 'Auto-generated from this customer\'s rating and comment. Edit before sending.')}
                        </p>
                        {draftModal.loading ? (
                            <div className="fb-draft-loading">
                                <Loader2 size={18} className="animate-spin" />
                            </div>
                        ) : (
                            <textarea
                                className="fb-draft-textarea"
                                value={draftModal.draft}
                                onChange={(e) => setDraftModal((prev) => prev && { ...prev, draft: e.target.value, copied: false })}
                                rows={9}
                            />
                        )}
                        <div className="fb-draft-actions">
                            <button className="fb-draft-btn" onClick={handleCopyDraft} disabled={draftModal.loading}>
                                <Copy size={14} /> {draftModal.copied ? tWithFallback('copied', 'Copied!') : tWithFallback('copy', 'Copy')}
                            </button>
                            {draftModal.item.customer_email && (
                                <button className="fb-draft-btn" onClick={handleSendDraftEmail} disabled={draftModal.loading}>
                                    <Mail size={14} /> {tWithFallback('sendEmail', 'Send email')}
                                </button>
                            )}
                            {draftModal.item.customer_phone && (
                                <button className="fb-draft-btn" onClick={handleSendDraftWhatsApp} disabled={draftModal.loading}>
                                    <Send size={14} /> {tWithFallback('sendWhatsApp', 'Send WhatsApp')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feedback;
