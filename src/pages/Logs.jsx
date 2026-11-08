import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Activity, Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
    Mail, Phone, MessageSquare, Globe, ArrowRight, RotateCw, Filter
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { translateAutomationName, translateTriggerStep, translateChannelLabel, translateLogDetail } from '../utils/activityI18n';
import { parseActivityMetadata, getActivityFolderName, isActivityFolderLog } from '../utils/activityLogLinks';
import { Link } from 'react-router-dom';
import API_URL from '../config';
import './ListTable.css';

export default function Logs() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [retryingId, setRetryingId] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/activity-logs`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.logs)) {
                setLogs(data.logs);
            }
        } catch (e) {
            console.error('Failed to load activity logs:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getChannel = (log) => {
        const meta = parseActivityMetadata(log);
        if (meta.channel) return String(meta.channel).toLowerCase();
        const d = String(log.detail || '').toLowerCase();
        if (d.includes('whatsapp')) return 'whatsapp';
        if (d.includes('email') || d.includes('gmail')) return 'email';
        if (d.includes('sms')) return 'sms';
        if (d.includes('qr')) return 'qr';
        if (d.includes('form') || d.includes('web')) return 'web';
        return 'message';
    };

    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'whatsapp':
                return <Phone size={13} aria-hidden />;
            case 'email':
                return <Mail size={13} aria-hidden />;
            case 'sms':
                return <MessageSquare size={13} aria-hidden />;
            case 'web':
            case 'qr':
                return <Globe size={13} aria-hidden />;
            default:
                return <Activity size={13} aria-hidden />;
        }
    };

    const handleRetry = async (logId) => {
        setRetryingId(logId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/activity-logs/${logId}/retry`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                fetchLogs();
            }
        } catch (e) {
            console.error('Retry failed:', e);
        } finally {
            setRetryingId(null);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const ch = getChannel(log);
            const st = (log.status || '').toLowerCase();

            if (channelFilter && ch !== channelFilter.toLowerCase()) {
                return false;
            }
            if (statusFilter && st !== statusFilter.toLowerCase()) {
                return false;
            }
            if (search.trim()) {
                const s = search.toLowerCase();
                const matchName = (log.automation_name || '').toLowerCase().includes(s);
                const matchStep = (log.trigger_type || '').toLowerCase().includes(s);
                const matchDetail = (log.detail || '').toLowerCase().includes(s);
                return matchName || matchStep || matchDetail;
            }
            return true;
        });
    }, [logs, search, channelFilter, statusFilter]);

    return (
        <div className="activity-page">
            <div className="activity-card">
                <div className="activity-header">
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            {t('dashActivityTitle') || 'Activity Logs'}
                        </h1>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                            {t('dashActivitySub') || 'Audit log of automated messages, triggers, and employee actions.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem' }}
                        title="Refresh logs"
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t('refresh') || 'Refresh'}</span>
                    </button>
                </div>

                <div className="activity-filter-bar">
                    <div className="activity-search-container">
                        <Search
                            size={16}
                            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                        />
                        <input
                            type="text"
                            className="activity-search-input"
                            placeholder={t('searchPlaceholderLeads') || 'Search logs…'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="activity-filter-group">
                        <select
                            className="input-field"
                            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8125rem', borderRadius: '10px' }}
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                        >
                            <option value="">{t('allChannels') || 'All Channels'}</option>
                            <option value="email">{t('activityChannelEmail') || 'Email'}</option>
                            <option value="whatsapp">{t('activityChannelWhatsApp') || 'WhatsApp'}</option>
                            <option value="sms">{t('activityChannelSms') || 'SMS'}</option>
                            <option value="web">Web / Form</option>
                        </select>
                        <select
                            className="input-field"
                            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8125rem', borderRadius: '10px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('allStatuses') || 'All Statuses'}</option>
                            <option value="success">{t('activityFilterSuccess') || 'Success'}</option>
                            <option value="failed">{t('activityFilterFailed') || 'Failed'}</option>
                            <option value="attention">Attention</option>
                        </select>
                    </div>
                </div>

                <div className="activity-table-container">
                    {filteredLogs.length === 0 ? (
                        <div className="activity-empty">
                            <Activity size={36} />
                            <p style={{ fontWeight: 600 }}>{t('noActivityYet') || 'No activity records found'}</p>
                            <p style={{ fontSize: '0.8125rem' }}>{t('noActivitySub') || 'Try adjusting your search or filters'}</p>
                        </div>
                    ) : (
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>{t('activityColTime') || 'Time'}</th>
                                    <th>{t('activityColAction') || 'Automation / Action'}</th>
                                    <th>{t('activityColChannel') || 'Channel'}</th>
                                    <th>{t('activityColStatus') || 'Status'}</th>
                                    <th>{t('activityColMessageSent') || 'Detail'}</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log) => {
                                    const channel = getChannel(log);
                                    const statusNorm = (log.status || '').toLowerCase();
                                    const isSuccess = statusNorm === 'success';
                                    const isError = statusNorm === 'failed' || statusNorm === 'error';
                                    const isAttention = statusNorm === 'attention' || statusNorm === 'warning';
                                    const statusClass = isSuccess ? 'success' : isError ? 'error' : isAttention ? 'attention' : '';
                                    const timeStr = log.created_at ? new Date(log.created_at).toLocaleString() : '';
                                    const isFolderLog = isActivityFolderLog(log);
                                    const folderName = getActivityFolderName(log);

                                    return (
                                        <tr key={log.id} className="activity-row">
                                            <td>
                                                <div className="log-time">
                                                    <span className="log-time-relative" style={{ fontSize: '0.8125rem' }}>
                                                        {timeStr}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {translateAutomationName(t, log.automation_name)}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {translateTriggerStep(t, log.trigger_type)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="channel-badge">
                                                    {getChannelIcon(channel)}
                                                    <span>{translateChannelLabel(t, channel)}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`log-status-badge ${statusClass}`}>
                                                    {isSuccess && <CheckCircle2 size={12} />}
                                                    {isError && <XCircle size={12} />}
                                                    {isAttention && <AlertTriangle size={12} />}
                                                    <span>{log.status || 'Done'}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45 }}>
                                                    {translateLogDetail(t, log.detail) || log.detail || '—'}
                                                    {isFolderLog && folderName && (
                                                        <div style={{ marginTop: '0.25rem' }}>
                                                            <Link
                                                                to={`/dashboard/leads?folder=${encodeURIComponent(folderName)}`}
                                                                style={{ color: 'var(--accent-color)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                                                            >
                                                                <span>{folderName}</span>
                                                                <ArrowRight size={12} />
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {isError && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetry(log.id)}
                                                        disabled={retryingId === log.id}
                                                        className="btn-secondary"
                                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '8px' }}
                                                        title="Retry automation step"
                                                    >
                                                        <RotateCw size={12} className={retryingId === log.id ? 'spin' : ''} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

