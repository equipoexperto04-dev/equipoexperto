import React from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const ComparisonSection = () => {
    const { t } = useTranslation();
    return (
        <section className="compare-section" id="compare">
            <div className="landing-container">
                <div className="compare-v2 shadow-xl">
                    {/* Header Row */}
                    <div className="compare-header-row">
                        <div className="compare-header-cell compare-header-left">{t('compareFeature')}</div>
                        <div className="compare-header-cell compare-header-right">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            Equipo Experto
                        </div>
                    </div>

                    {/* Setup Experience */}
                    <div className="compare-row-v2">
                        <div className="compare-side-old">
                            <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>{t('setupExperience')}</span>
                            <span className="tag-red"><X size={16} /> {t('manualPainful')}</span>
                        </div>
                        <div className="compare-side-new">
                            <span className="tag-green"><Check size={16} /> {t('instantRecipes')}</span>
                        </div>
                    </div>

                    {/* Complexity */}
                    <div className="compare-row-v2">
                        <div className="compare-side-old">
                            <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>{t('complexity')}</span>
                            <span className="tag-red"><X size={16} /> {t('needsDeveloper')}</span>
                        </div>
                        <div className="compare-side-new">
                            <span className="tag-green"><Check size={16} /> {t('oneToggle')}</span>
                        </div>
                    </div>

                    {/* Monthly Cost */}
                    <div className="compare-row-v2">
                        <div className="compare-side-old">
                            <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>{t('monthlyCost')}</span>
                            <span className="tag-red"><X size={16} /> {t('consultantCost')}</span>
                        </div>
                        <div className="compare-side-new">
                            <span className="tag-green"><Check size={16} /> {t('flatAffordable')}</span>
                        </div>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <a href="/vs-birdeye" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'underline' }}>
                        See how we compare to Birdeye →
                    </a>
                </p>
            </div>
        </section>
    );
};

export default ComparisonSection;
