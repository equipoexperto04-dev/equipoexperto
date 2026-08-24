import React, { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useLandingContent } from '../../context/LandingContentContext';

const HeroSection = () => {
    const { t } = useTranslation();
    const { landing, pick } = useLandingContent();
    const [mockupActive, setMockupActive] = useState(true);

    const h = landing?.hero;
    const m = landing?.heroMockup;

    const badge = pick(h?.badge) || t('heroWhoFor');
    const titleLine = pick(h?.titleSingle) || t('heroWhatIsIt');
    const subtitle = pick(h?.subtitle) || t('heroWhatItDoes');
    const primaryCta = pick(h?.primaryCta) || t('heroPrimaryCta');
    const howLink = pick(h?.secondaryCta) || t('heroHowItWorksLink');

    const mockTitle = pick(m?.dashboardTitle) || t('dashboardV2');
    const mockLead = pick(m?.smartLeadLabel) || t('smartLeadCapture');
    const mockStatus = pick(m?.activeStatus) || t('activeOnPortals');
    const mockWeekly = pick(m?.weeklyConversion) || t('weeklyConversion');
    const float1 = pick(m?.floatingCard1) || t('newLeadsFloating', { n: 12 });
    const float2 = pick(m?.floatingCard2) || t('followupSentFloating');

    return (
        <section className="landing-section hero-section" id="hero">
            <div className="hero-mesh-bg">
                <div className="hero-blob hero-blob--1"></div>
                <div className="hero-blob hero-blob--2"></div>
                <div className="hero-blob hero-blob--3"></div>
            </div>

            <div className="landing-container">
                <div className="hero-split-layout">
                    <div className="hero-text-content animate-fade-in">
                        <div className="hero-badge-v3">
                            <span className="badge-dot" aria-hidden /> {badge}
                        </div>

                        <h1 className="hero-title-v3" style={{ lineHeight: 1.12 }}>
                            {titleLine}
                        </h1>

                        <p className="hero-subtitle-v3">{subtitle}</p>

                        <div className="hero-actions-v3" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <button
                                type="button"
                                className="hero-btn-primary-v3"
                                onClick={() => { window.location.href = '/register'; }}
                            >
                                {primaryCta} <ArrowRight size={18} aria-hidden />
                            </button>
                            <button
                                type="button"
                                className="hero-inline-link"
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                {howLink}
                            </button>
                        </div>
                    </div>

                    <div className="hero-visual-content animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <div className="dashboard-perspective-wrapper">
                            <div className="dashboard-mockup-v2">
                                <div className="mockup-v2-header">
                                    <div className="mockup-v2-dots" aria-hidden>
                                        <span></span><span></span><span></span>
                                    </div>
                                    <div className="mockup-v2-title">{mockTitle}</div>
                                </div>
                                <div className="mockup-v2-body">
                                    <div className={`mockup-v2-card ${mockupActive ? 'active' : ''}`}>
                                        <div className="mockup-v2-icon">
                                            <Play size={20} fill={mockupActive ? 'currentColor' : 'none'} aria-hidden />
                                        </div>
                                        <div className="mockup-v2-info">
                                            <div className="mockup-v2-label">{mockLead}</div>
                                            <div className="mockup-v2-status">{mockStatus}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="mockup-v2-toggle"
                                            aria-pressed={mockupActive}
                                            aria-label={mockLead}
                                            onClick={() => setMockupActive(!mockupActive)}
                                        >
                                            <div className={`toggle-track ${mockupActive ? 'on' : 'off'}`}>
                                                <div className="toggle-thumb" />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="mockup-v2-trend">
                                        <div className="trend-header">
                                            <span>{mockWeekly}</span>
                                            <span className="trend-pct">+24%</span>
                                        </div>
                                        <div className="trend-graph" aria-hidden>
                                            <div className="graph-line"></div>
                                            <div className="graph-fill"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="floating-mini-card c1">{float1}</div>
                            <div className="floating-mini-card c2">{float2}</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hero-inline-link {
                    background: none;
                    border: none;
                    padding: 0.5rem 0;
                    font-size: 0.9375rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    min-height: 44px;
                }
                .hero-inline-link:hover {
                    color: var(--accent-color);
                }
            `}</style>
        </section>
    );
};

export default HeroSection;
