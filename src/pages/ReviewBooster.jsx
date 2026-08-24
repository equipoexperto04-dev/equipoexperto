import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './GbpComingSoon.css';

export default function ReviewBooster() {
    const { t } = useTranslation();

    return (
        <div className="dashboard-page animate-fade-in">
            <header className="gbp-page-header">
                <h1>{t('sidebarReviewBooster')}</h1>
                <p>{t('reviewBoosterSubtitle')}</p>
            </header>

            <div className="gbp-coming-soon-card">
                <div className="gbp-coming-soon-icon" aria-hidden="true">
                    <Star size={28} />
                </div>
                <span className="gbp-coming-soon-badge">{t('gbpComingSoonBadge')}</span>
                <h2>{t('sidebarReviewBooster')}</h2>
                <p>{t('reviewBoosterComingSoonDesc')}</p>
                <ul className="gbp-feature-list">
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('reviewBoosterFeature1')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('reviewBoosterFeature2')}</span></li>
                    <li><CheckCircle2 size={16} aria-hidden /><span>{t('reviewBoosterFeature3')}</span></li>
                </ul>

                <div className="gbp-existing-note">
                    <p>{t('reviewBoosterExistingNote')}</p>
                    <Link to="/dashboard/config/review-funnel" className="gbp-existing-link">
                        {t('reviewBoosterExistingLink')}
                        <ArrowRight size={16} aria-hidden />
                    </Link>
                </div>
            </div>
        </div>
    );
}
