import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Loader2, ShieldAlert, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { get } from '../utils/api.js';
import './AdminErrorsPanel.css';

export default function AdminErrorsPanel() {
    const { t } = useTranslation();
    const [openCount, setOpenCount] = useState(0);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setForbidden(false);
        try {
            const data = await get('/api/admin/errors?summary=true&limit=5');
            setPreview(data.errors || []);
            setOpenCount(data.openCount ?? (data.errors?.length || 0));
        } catch (e) {
            if (e.status === 403) {
                setForbidden(true);
                return;
            }
            setPreview([]);
            setOpenCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!modalOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setModalOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [modalOpen]);

    const openModal = () => {
        setModalOpen(true);
        load();
    };

    if (forbidden) return null;

    return (
        <>
            <div className="admin-errors-trigger-wrap">
                <button
                    type="button"
                    className="admin-errors-trigger"
                    onClick={openModal}
                    aria-haspopup="dialog"
                    aria-expanded={modalOpen}
                >
                    <ShieldAlert size={16} aria-hidden className="admin-errors-trigger-icon" />
                    <span>{t('adminErrorsTitle')}</span>
                    {!loading && openCount > 0 && (
                        <span className="admin-errors-trigger-badge" aria-label={`${openCount} unresolved`}>
                            {openCount}
                        </span>
                    )}
                </button>
            </div>

            {modalOpen && (
                <div
                    className="admin-errors-modal-overlay"
                    role="presentation"
                    onClick={() => setModalOpen(false)}
                >
                    <section
                        className="admin-errors-modal"
                        role="dialog"
                        aria-labelledby="admin-errors-panel-title"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-errors-panel-head">
                            <div className="admin-errors-panel-title-wrap">
                                <ShieldAlert size={18} aria-hidden className="admin-errors-panel-icon" />
                                <div>
                                    <h2 id="admin-errors-panel-title" className="admin-errors-panel-title">
                                        {t('adminErrorsTitle')}
                                    </h2>
                                    <p className="admin-errors-panel-sub">{t('adminErrorsSub')}</p>
                                </div>
                            </div>
                            <div className="admin-errors-modal-actions">
                                <Link
                                    to="/dashboard/admin/errors"
                                    className="admin-errors-panel-link"
                                    onClick={() => setModalOpen(false)}
                                >
                                    {t('viewFullAudit')}
                                    <ChevronRight size={14} aria-hidden />
                                </Link>
                                <button
                                    type="button"
                                    className="admin-errors-modal-close"
                                    onClick={() => setModalOpen(false)}
                                    aria-label={t('cancel') || 'Close'}
                                >
                                    <X size={18} aria-hidden />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-errors-panel-loading" aria-busy="true">
                                <Loader2 size={18} className="animate-spin" aria-hidden />
                            </div>
                        ) : openCount === 0 ? (
                            <p className="admin-errors-panel-ok">{t('adminErrorsEmptyTitle')}</p>
                        ) : (
                            <>
                                <p className="admin-errors-panel-count">
                                    <span className="admin-errors-panel-count-num">{openCount}</span>
                                    {t('adminErrorsOpen')}
                                </p>
                                <ul className="admin-errors-panel-list">
                                    {preview.map((row) => (
                                        <li key={row.id} className="admin-errors-panel-item">
                                            <AlertTriangle size={14} aria-hidden />
                                            <span className="admin-errors-panel-msg">
                                                {row.message || row.code || 'Error'}
                                                {row.occurrence_count > 1 ? (
                                                    <span className="admin-errors-panel-badge">
                                                        ×{row.occurrence_count}
                                                    </span>
                                                ) : null}
                                            </span>
                                            {row.route ? (
                                                <span className="admin-errors-panel-route">
                                                    {row.method} {row.route}
                                                </span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
