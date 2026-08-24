import React from 'react';
import { Newspaper, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './GbpComingSoon.css';

export default function ContentReviews() {
    const { t } = useTranslation();

    return (
        <div className="dashboard-page animate-fade-in">
            <header className="gbp-page-header">
                <h1>{t('sidebarContentReviews')}</h1>
                <p>{t('contentReviewsSubtitle')}</p>
            </header>

            <div className="gbp-coming-soon-card">
                <div className="gbp-coming-soon-icon" aria-hidden="true">
                    <Newspaper size={28} />
                </div>
                <span className="gbp-coming-soon-badge">{t('gbpComingSoonBadge')}</span>
                <h2>{t('sidebarContentReviews')}</h2>
                <p>{t('contentReviewsComingSoonDesc')}</p>
                <ul className="gbp-feature-list">
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('contentReviewsFeature1')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('contentReviewsFeature2')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('contentReviewsFeature3')}</span></li>
                </ul>
            </div>
        </div>
    );
}
