import React from 'react';
import { Gauge, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './GbpComingSoon.css';

export default function Optimization() {
    const { t } = useTranslation();

    return (
        <div className="dashboard-page animate-fade-in">
            <header className="gbp-page-header">
                <h1>{t('sidebarOptimization')}</h1>
                <p>{t('optimizationSubtitle')}</p>
            </header>

            <div className="gbp-coming-soon-card">
                <div className="gbp-coming-soon-icon" aria-hidden="true">
                    <Gauge size={28} />
                </div>
                <span className="gbp-coming-soon-badge">{t('gbpComingSoonBadge')}</span>
                <h2>{t('sidebarOptimization')}</h2>
                <p>{t('optimizationComingSoonDesc')}</p>
                <ul className="gbp-feature-list">
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('optimizationFeature1')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('optimizationFeature2')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('optimizationFeature3')}</span></li>
                </ul>
            </div>
        </div>
    );
}
