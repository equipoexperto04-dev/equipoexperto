import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { SkeletonLine } from './SkeletonLoader.jsx';
import { WizardSourceStepSkeleton } from './wizard/WizardSourceStep.jsx';
import './EmployeeWizardSkeleton.css';

export default function EmployeeWizardSkeleton() {
    const { t } = useTranslation();

    return (
        <div className="wiz-page wiz-page--loading" aria-busy="true" aria-live="polite">
            <div className="wiz-header">
                <div className="wiz-skel-line wiz-skel-back" />
                <div className="wiz-skel-line wiz-skel-badge" />
            </div>
            <div className="wiz-stepper-wrap wiz-stepper-wrap--skel">
                <div className="wiz-skel-stepper">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="wiz-skel-step">
                            <SkeletonLine width={28} height={28} style={{ borderRadius: '50%' }} />
                            <SkeletonLine width={64} height={10} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="wiz-panel">
                <div className="wiz-content">
                    <WizardSourceStepSkeleton />
                </div>
            </div>
            <p className="wiz-skel-hint">{t('loadingHistory')}</p>
        </div>
    );
}
