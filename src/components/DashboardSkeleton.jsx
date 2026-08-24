import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import './DashboardSkeleton.css';

/**
 * Placeholder matching dashboard hero + stat row while /api/stats loads after login/register.
 */
export default function DashboardSkeleton() {
    const { t } = useTranslation();
    return (
        <div className="dashboard-page dash-skel-root" aria-busy="true" aria-live="polite">
            <div className="dash-greeting dash-skel-fade-in">
                <div className="dash-skel-line dash-skel-title" />
                <div className="dash-skel-line dash-skel-sub" />
                <p className="dash-skel-hint">{t('dashLoadingHint')}</p>
            </div>
            <div className="dash-stats-row">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="dash-stat-card dash-skel-card">
                        <div className="dash-skel-line dash-skel-stat-label" />
                        <div className="dash-skel-line dash-skel-stat-value" />
                        <div className="dash-skel-line dash-skel-stat-sub" />
                    </div>
                ))}
            </div>
            <div className="dash-skel-spinner-wrap">
                <div className="wa-loader dash-skel-spinner" aria-hidden />
            </div>
        </div>
    );
}
