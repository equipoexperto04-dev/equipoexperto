import React from 'react';
import { BookOpen, Upload, Power } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const HowItWorksSection = () => {
    const { t } = useTranslation();
    return (
        <section className="steps-section-v3" id="how-it-works">
            <div className="landing-container">
                <div className="steps-header-v3">
                    <div className="steps-header-left">
                        <h2 className="steps-title-v3">{t('speedHeading')}</h2>
                        <p className="steps-subtitle-v3">
                            {t('speedSub')}
                        </p>
                    </div>
                    <div className="steps-header-right">
                        <span className="steps-watermark">PROCESS</span>
                    </div>
                </div>

                <div className="steps-grid-v3">
                    {/* Step 1 */}
                    <div className="step-card-v3">
                        <span className="step-num-v3">01</span>
                        <div className="step-icon-box-v3">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="step-title-v3">{t('step1Title')}</h3>
                        <p className="step-desc-v3">
                            {t('step1Desc')}
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="step-card-v3">
                        <span className="step-num-v3">02</span>
                        <div className="step-icon-box-v3">
                            <Upload size={24} />
                        </div>
                        <h3 className="step-title-v3">{t('step2Title')}</h3>
                        <p className="step-desc-v3">
                            {t('step2Desc')}
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="step-card-v3">
                        <span className="step-num-v3">03</span>
                        <div className="step-icon-box-v3 active">
                            <Power size={24} />
                        </div>
                        <h3 className="step-title-v3">{t('step3Title')}</h3>
                        <p className="step-desc-v3">
                            {t('step3Desc')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
