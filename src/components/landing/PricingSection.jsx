import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Rocket, Crown } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const PricingSection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const plans = [
        {
            planKey: 'starter',
            name: t('starterPlan'),
            amount: '39',
            period: t('mo'),
            description: t('starterDesc'),
            features: [
                t('plan1Employee'),
                t('waIncluded50'),
                t('standardLeadCap'),
                t('basicAnalytics'),
                t('communitySupport'),
            ],
            cta: t('subscribeStarter'),
            icon: <Zap className="text-secondary" size={24} />,
            highlight: false,
        },
        {
            planKey: 'growth',
            name: t('growthPlan'),
            amount: '69',
            period: t('mo'),
            description: t('growthDesc'),
            features: [
                t('plan2Employees'),
                t('waIncludedHigh'),
                t('advancedLeadScoring'),
                t('emailNotifications'),
                t('prioritySupport'),
            ],
            cta: t('subscribeGrowth'),
            icon: <Rocket className="text-accent" size={24} />,
            highlight: true,
        },
        {
            planKey: 'pro',
            name: t('proPlan'),
            amount: '119',
            period: t('mo'),
            description: t('proDesc'),
            features: [
                t('plan3Employees'),
                t('waIncludedUnlim'),
                t('fullLeadHub'),
                t('whiteLabelReports'),
                t('strategyCall'),
            ],
            cta: t('subscribePro'),
            icon: <Crown className="text-yellow-500" size={24} />,
            highlight: false,
        },
    ];

    return (
        <section id="pricing" className="pricing-section-v3" style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
            <div className="landing-container">
                <div className="pricing-header-v3">
                    <h2 className="pricing-title-v3">{t('pricingTitle')}</h2>
                    <p className="pricing-subtitle-v3">{t('pricingSub')}</p>
                </div>

                <div className="pricing-grid-v3">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`price-card-v3 ${plan.highlight ? 'price-card--active' : ''}`}
                        >
                            {plan.highlight && (
                                <div className="price-badge-v3">{t('mostPopular')}</div>
                            )}

                            <div className="price-top-v3">
                                <h3 className="price-name-v3">{plan.name}</h3>
                                <div className="price-value-v3">
                                    <span className="p-symbol">€</span>
                                    <span className="p-amount">{plan.amount}</span>
                                    <span className="p-period">{plan.period}</span>
                                </div>
                                <p className="price-description-v3">{plan.description}</p>
                            </div>

                            <div className="price-features-v3">
                                {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="p-feature-item">
                                        <Check size={16} className="p-check-icon" aria-hidden />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className={`price-btn-v3 ${plan.highlight ? 'price-btn--primary' : 'price-btn--secondary'}`}
                                onClick={() => navigate(`/checkout/${plan.planKey}`)}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .pricing-section-v3 { background: var(--bg-primary); }
                .pricing-header-v3 { text-align: center; margin-bottom: 80px; }
                .pricing-title-v3 {
                    font-size: clamp(2.5rem, 5vw, 4rem);
                    font-weight: 900;
                    color: var(--text-primary);
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.04em;
                }
                .pricing-subtitle-v3 {
                    color: var(--text-secondary);
                    font-size: 1.25rem;
                    opacity: 0.8;
                }
                .pricing-grid-v3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2.5rem;
                    align-items: stretch;
                }
                .price-card-v3 {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 2rem;
                    padding: 3rem 2.5rem;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .price-card--active {
                    border: 2px solid var(--accent-color);
                    transform: scale(1.02);
                    z-index: 10;
                    box-shadow: 0 40px 80px rgba(34, 197, 94, 0.1);
                }
                .price-badge-v3 {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--accent-color);
                    color: #fff;
                    padding: 4px 14px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.05em;
                }
                .price-name-v3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: 1.5rem;
                }
                .price-value-v3 {
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                    margin-bottom: 1.5rem;
                    color: var(--accent-color);
                }
                .p-symbol { font-size: 2rem; font-weight: 800; }
                .p-amount { font-size: 4rem; font-weight: 900; letter-spacing: -0.03em; }
                .p-period { font-size: 1.125rem; font-weight: 700; opacity: 0.6; color: var(--text-secondary); }
                .price-description-v3 {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    margin-bottom: 2.5rem;
                    line-height: 1.6;
                }
                .price-features-v3 {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    margin-bottom: 3rem;
                }
                .p-feature-item {
                    display: flex;
                    align-items: start;
                    gap: 1rem;
                    font-size: 0.9375rem;
                    color: var(--text-primary);
                    font-weight: 600;
                }
                .p-check-icon { color: var(--accent-color); flex-shrink: 0; margin-top: 3px; }
                .price-btn-v3 {
                    width: 100%;
                    padding: 1.25rem;
                    border-radius: 1rem;
                    font-weight: 800;
                    font-size: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .price-btn--primary {
                    background: var(--accent-color);
                    color: #fff;
                    border: none;
                    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);
                }
                .price-btn--primary:hover {
                    background: #2563eb;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(34, 197, 94, 0.3);
                }
                .price-btn--secondary {
                    background: transparent;
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }
                .price-btn--secondary:hover {
                    background: var(--bg-secondary);
                    border-color: var(--text-primary);
                }
                @media (max-width: 991px) {
                    .pricing-grid-v3 { grid-template-columns: 1fr; gap: 2rem; }
                    .price-card--active { transform: none; }
                }
            `}} />
        </section>
    );
};

export default PricingSection;
