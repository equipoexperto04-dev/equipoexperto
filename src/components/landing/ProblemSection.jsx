import React, { useState } from 'react';
import { UserX, Clock, MessageSquareOff, ClipboardX, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const ProblemSection = () => {
    const { t } = useTranslation();
    const [isAutomated, setIsAutomated] = useState(false);

    return (
        <section className="problem-section" id="problem" style={{ background: 'var(--bg-secondary)', padding: '100px 0' }}>
            <div className="landing-container">
                <div className="problem-grid" style={{ alignItems: 'center' }}>
                    <div style={{ paddingRight: '40px' }}>
                        <p className="section-eyebrow" style={{ textAlign: 'left' }}>{t('efficiencyGap')}</p>
                        <h2 className="problem-title" style={{ marginBottom: '32px' }}>
                            {isAutomated ? t('automationAdvantage') : t('manualCost')}
                        </h2>

                        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {!isAutomated ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--danger)', flexShrink: 0 }}><UserX size={24} /></div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('missedFollowUp')}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--danger)', flexShrink: 0 }}><Clock size={24} /></div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('delayedResponse')}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--danger)', flexShrink: 0 }}><MessageSquareOff size={24} /></div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('forgotReviews')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--success)', flexShrink: 0 }}><Zap size={24} /></div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('instantEngage')}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--success)', flexShrink: 0 }}><CheckCircle2 size={24} /></div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('autoReviewLinks')}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ color: 'var(--success)', flexShrink: 0 }}><Clock size={24} /></div>
                                            <p style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '1.05rem', lineHeight: '1.6' }}>{t('saveHours')}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsAutomated(!isAutomated)}
                            className={isAutomated ? "hero-btn-secondary" : "hero-btn-primary"}
                            style={{
                                marginTop: '40px',
                                padding: '14px 28px',
                                fontSize: '15px'
                            }}
                        >
                            {isAutomated ? t('backToManual') : t('seeFix')} <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className={`manual-chaos-card ${isAutomated ? 'is-automated' : ''}`}>
                        <div className="chaos-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: '800', color: isAutomated ? 'var(--success)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {isAutomated ? t('autoStatus') : t('manualStruggle')}
                            </h3>
                            {isAutomated && <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>{t('systemActive')}</span>}
                        </div>

                        <div style={{ position: 'relative', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {!isAutomated ? (
                                <>
                                    <div className="chaos-note" style={{ top: '0', left: '0', animationDelay: '0s' }}>
                                        {t('chaosSarah')}
                                    </div>
                                    <div className="chaos-note urgent" style={{ top: '35%', right: '0', animationDelay: '0.5s' }}>
                                        {t('chaosMissedCall')}
                                    </div>
                                    <div className="chaos-note" style={{ bottom: '5%', left: '10%', animationDelay: '1.2s' }}>
                                        {t('chaosCheckReviews')}
                                    </div>
                                    <div style={{ opacity: 0.1, transform: 'scale(1.2)' }}>
                                        <ClipboardX size={120} color="var(--text-secondary)" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="automated-bar" style={{ top: '0', left: '0', animationDelay: '0.1s' }}>
                                        <span className="success-badge-float">{t('autoHandled')}</span>
                                        {t('autoRepliedCount')}
                                    </div>
                                    <div className="automated-bar" style={{ top: '35%', right: '0', animationDelay: '0.3s' }}>
                                        <span className="success-badge-float">{t('autoSent')}</span>
                                        {t('autoReviewCount')}
                                    </div>
                                    <div className="automated-bar" style={{ bottom: '5%', left: '10%', animationDelay: '0.5s' }}>
                                        <span className="success-badge-float">{t('autoSync')}</span>
                                        {t('autoCRMUpdate')}
                                    </div>
                                    <div style={{ opacity: 0.1, transform: 'scale(1.2)' }}>
                                        <CheckCircle2 size={120} color="var(--success)" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
