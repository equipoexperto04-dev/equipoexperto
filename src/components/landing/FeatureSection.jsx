import React from 'react';
import { Star, Bot, RefreshCw, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { createSanitizedHtml } from '../../utils/sanitizeHtml';

const CAPABILITIES = [
    {
        id: 'review',
        Icon: Star,
        iconClass: 'landing-cap-icon--review',
        titleKey: 'empReviewTitle',
        taglineKey: 'empReviewDesc',
        storyKey: 'productStoryReviewHtml',
        toolKeys: ['wizChannelWhatsapp', 'galleryToolGMB'],
    },
    {
        id: 'lead',
        Icon: Bot,
        iconClass: 'landing-cap-icon--lead',
        titleKey: 'empLeadTitle',
        taglineKey: 'empLeadDesc',
        storyKey: 'productStoryLeadHtml',
        toolKeys: ['wizChannelWhatsapp', 'galleryToolEmail'],
    },
    {
        id: 'follow',
        Icon: RefreshCw,
        iconClass: 'landing-cap-icon--follow',
        titleKey: 'empFollowTitle',
        taglineKey: 'empFollowDesc',
        storyKey: 'productStoryFollowHtml',
        toolKeys: ['wizChannelWhatsapp', 'galleryToolEmail'],
    },
];

const FeatureSection = () => {
    const { t } = useTranslation();

    return (
        <section className="features-section landing-section" id="features" aria-labelledby="features-heading">
            <div className="landing-container">
                <header className="landing-cap-header">
                    <p className="landing-cap-eyebrow">{t('landingCapabilitiesEyebrow')}</p>
                    <h2 id="features-heading" className="landing-cap-title">
                        {t('landingCapabilitiesTitle')}
                    </h2>
                    <p className="landing-cap-subtitle">{t('landingCapabilitiesSubtitle')}</p>
                </header>

                <div className="landing-cap-grid">
                    {CAPABILITIES.map((cap) => {
                        const { Icon } = cap;
                        return (
                            <article key={cap.id} className="landing-cap-card">
                                <div className="landing-cap-card-top">
                                    <div className={`landing-cap-icon ${cap.iconClass}`} aria-hidden>
                                        <Icon size={26} strokeWidth={2} />
                                    </div>
                                    <div className="landing-cap-tools">
                                        {cap.toolKeys.map((tk) => (
                                            <span key={tk} className="landing-cap-tool-tag">
                                                {t(tk)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="landing-cap-card-title">{t(cap.titleKey)}</h3>
                                <p className="landing-cap-card-tagline">{t(cap.taglineKey)}</p>

                                <div
                                    className="landing-cap-body landing-cap-body--html"
                                    dangerouslySetInnerHTML={createSanitizedHtml(t(cap.storyKey))}
                                />
                            </article>
                        );
                    })}
                </div>

                <div className="landing-cap-footer" style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <a
                        href="/dashboard/employee-gallery"
                        className="btn-secondary landing-cap-library-cta"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.85rem 1.75rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                        }}
                    >
                        <span>{t('viewLibrary') || 'View full library'}</span>
                        <ArrowRight size={18} />
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FeatureSection;
