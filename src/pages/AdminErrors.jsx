import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Copy,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import { get, patch, post } from '../utils/api.js';
import './AdminErrors.css';

const LEVEL_FILTERS = ['all', 'error', 'warn'];

function levelClass(level) {
    const l = String(level || 'error').toLowerCase();
    return l === 'warn' || l === 'warning' ? 'admin-errors-level--warn' : 'admin-errors-level--error';
}

export default function AdminErrors() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        setForbidden(false);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim());
            if (levelFilter !== 'all') params.set('level', levelFilter);

            const data = await get(`/api/admin/errors?${params.toString()}`);
            setRows(data.errors || []);
        } catch (e) {
            if (e.status === 403) {
                setForbidden(true);
                setRows([]);
                return;
            }
            setLoadError(e.message || 'Failed to load');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [q, levelFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const openRows = useMemo(() => rows.filter((r) => !r.resolved), [rows]);

    const stats = useMemo(() => {
        const open = openRows.length;
        return { total: rows.length, open, resolved: rows.length - open };
    }, [rows, openRows]);

    async function markResolved(id, resolved = true) {
        try {
            await patch(`/api/admin/errors/${id}`, { resolved });
            load();
        } catch {
            toast('Could not update error', 'error');
        }
    }

    async function clearAllOpen() {
        try {
            const data = await post('/api/admin/errors/resolve-bulk', { allOpen: true });
            toast(`Marked ${data.resolved ?? 0} resolved`, 'success');
            load();
        } catch {
            toast('Could not clear errors', 'error');
        }
    }

    async function copyStack(text) {
        try {
            await navigator.clipboard.writeText(text || '');
            toast(t('adminErrorsCopied'), 'success');
        } catch {
            toast('Copy failed', 'error');
        }
    }

    return (
        <div className="admin-errors-page">
            <header className="admin-errors-header">
                <h1>{t('adminErrorsTitle')}</h1>
                <p>{t('adminErrorsSub')}</p>
            </header>

            {!forbidden && !loadError && (
                <div className="admin-errors-stats">
                    <div className="admin-errors-stat">
                        <div className="admin-errors-stat-label">{t('adminErrorsTotal')}</div>
                        <div className="admin-errors-stat-value">{stats.total}</div>
                    </div>
                    <div className="admin-errors-stat">
                        <div className="admin-errors-stat-label">{t('adminErrorsOpen')}</div>
                        <div
                            className={`admin-errors-stat-value ${stats.open > 0 ? 'admin-errors-stat-value--warn' : ''}`}
                        >
                            {stats.open}
                        </div>
                    </div>
                    <div className="admin-errors-stat">
                        <div className="admin-errors-stat-label">{t('adminErrorsResolved')}</div>
                        <div className="admin-errors-stat-value admin-errors-stat-value--ok">
                            {stats.resolved}
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-errors-card">
                <div className="admin-errors-toolbar">
                    <div className="admin-errors-search-wrap">
                        <Search size={16} aria-hidden />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && load()}
                            placeholder={t('adminErrorsSearch')}
                            disabled={forbidden}
                        />
                    </div>
                    <div className="admin-errors-filters">
                        {LEVEL_FILTERS.map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                className={`admin-errors-filter-btn ${levelFilter === lvl ? 'is-active' : ''}`}
                                onClick={() => setLevelFilter(lvl)}
                                disabled={forbidden}
                            >
                                {lvl === 'all' ? 'All' : lvl}
                            </button>
                        ))}
                    </div>
                    {stats.open > 0 && (
                        <button
                            type="button"
                            className="admin-errors-clear-btn"
                            onClick={() => clearAllOpen()}
                            disabled={loading || forbidden}
                        >
                            {t('adminErrorsClearAll')}
                        </button>
                    )}
                    <button
                        type="button"
                        className="admin-errors-refresh-btn"
                        onClick={() => load()}
                        disabled={loading || forbidden}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" aria-hidden />
                        ) : (
                            <RefreshCw size={16} aria-hidden />
                        )}
                        {t('adminErrorsRefresh')}
                    </button>
                </div>

                <div className="admin-errors-list">
                    {loading && (
                        <div className="admin-errors-loading">
                            <Loader2 size={20} className="animate-spin" aria-hidden />
                            Loading…
                        </div>
                    )}

                    {!loading && forbidden && (
                        <div className="admin-errors-state admin-errors-state--forbidden">
                            <div className="admin-errors-state-icon">
                                <ShieldAlert size={28} aria-hidden />
                            </div>
                            <h2>{t('adminErrorsForbiddenTitle')}</h2>
                            <p>{t('adminErrorsForbiddenBody')}</p>
                            <code>ADMIN_EMAILS=your@email.com</code>
                        </div>
                    )}

                    {!loading && loadError && !forbidden && (
                        <div className="admin-errors-state">
                            <div className="admin-errors-state-icon">
                                <AlertTriangle size={28} aria-hidden />
                            </div>
                            <h2>{loadError}</h2>
                        </div>
                    )}

                    {!loading && !forbidden && !loadError && openRows.length === 0 && (
                        <div className="admin-errors-state">
                            <div className="admin-errors-state-icon">
                                <ShieldCheck size={28} aria-hidden />
                            </div>
                            <h2>{t('adminErrorsEmptyTitle')}</h2>
                            <p>{t('adminErrorsEmptyBody')}</p>
                        </div>
                    )}

                    {!loading &&
                        !forbidden &&
                        !loadError &&
                        openRows.map((r) => {
                            const expanded = expandedId === r.id;
                            return (
                                <article key={r.id} className="admin-errors-row">
                                    <div
                                        className={`admin-errors-row-main ${expanded ? 'is-expanded' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            setExpandedId((prev) => (prev === r.id ? null : r.id))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setExpandedId((prev) =>
                                                    prev === r.id ? null : r.id,
                                                );
                                            }
                                        }}
                                    >
                                        <span
                                            className={`admin-errors-level ${levelClass(r.level)}`}
                                        >
                                            {expanded ? (
                                                <ChevronDown size={12} aria-hidden />
                                            ) : (
                                                <ChevronRight size={12} aria-hidden />
                                            )}
                                            {r.level || 'error'}
                                        </span>
                                        <div className="admin-errors-body">
                                            <p className="admin-errors-message">
                                                {r.message}
                                                {r.occurrence_count > 1 && (
                                                    <span className="admin-errors-occurrence-badge">
                                                        ×{r.occurrence_count}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="admin-errors-meta">
                                                {r.method && r.route && (
                                                    <span>
                                                        <code>
                                                            {r.method} {r.route}
                                                        </code>
                                                    </span>
                                                )}
                                                {r.code && <span>Code: {r.code}</span>}
                                                {r.user_id && (
                                                    <span>User: {String(r.user_id).slice(0, 8)}…</span>
                                                )}
                                            </div>
                                        </div>
                                        <time className="admin-errors-time" dateTime={r.created_at}>
                                            {new Date(r.created_at).toLocaleString()}
                                        </time>
                                        <div
                                            className="admin-errors-actions"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {r.resolved && (
                                                <span className="admin-errors-badge-resolved">
                                                    Resolved
                                                </span>
                                            )}
                                            {!r.resolved ? (
                                                <button
                                                    type="button"
                                                    className="admin-errors-action-btn admin-errors-action-btn--primary"
                                                    onClick={() => markResolved(r.id, true)}
                                                >
                                                    {t('adminErrorsMarkResolved')}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="admin-errors-action-btn"
                                                    onClick={() => markResolved(r.id, false)}
                                                >
                                                    {t('adminErrorsReopen')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {expanded && r.stack && (
                                        <div className="admin-errors-detail">
                                            <div className="admin-errors-detail-header">
                                                <span>{t('adminErrorsStack')}</span>
                                                <button
                                                    type="button"
                                                    className="admin-errors-action-btn"
                                                    onClick={() => copyStack(r.stack)}
                                                >
                                                    <Copy size={12} aria-hidden /> {t('adminErrorsCopy')}
                                                </button>
                                            </div>
                                            <pre className="admin-errors-stack">{r.stack}</pre>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                </div>
            </div>

            <style>{`
                .animate-spin { animation: admin-spin 1s linear infinite; }
                @keyframes admin-spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
