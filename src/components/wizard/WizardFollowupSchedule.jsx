import React from 'react';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { canAddMoreFollowupSteps, followupScheduleStats } from '../../utils/followupWizard.js';
import './WizardFollowup.css';

/**
 * Better UX–style follow-up timeline: day 0 + any number of scheduled touchpoints.
 */
export default function WizardFollowupSchedule({
    steps,
    onDayChange,
    onAddStep,
    onRemoveStep,
    planMaxSteps = null,
    accentColor = 'var(--accent-color)',
}) {
    const { t } = useTranslation();
    const { totalDays, count, avgInterval } = followupScheduleStats(steps);

    const timelineRows = [
        { key: 'initial', label: t('wizFollowupInitialContact'), isFixed: true },
        ...(steps || []).map((step, index) => ({
            key: step.id,
            label: t('wizFollowupTouchpoint', { n: index + 1 }),
            isFixed: false,
            step,
        })),
    ];

    return (
        <div className="wiz-fu">
            <header className="wiz-fu-header">
                <h2 className="wiz-fu-title">{t('wizFollowupScheduleTitle')}</h2>
                <p className="wiz-fu-sub">{t('wizFollowupScheduleSub')}</p>
            </header>

            <div className="wiz-fu-card">
                <div className="wiz-fu-card-head">
                    <Calendar size={20} style={{ color: accentColor }} aria-hidden />
                    <h3>{t('wizFollowupTimeline')}</h3>
                </div>

                <div className="wiz-fu-timeline">
                    {timelineRows.map((row, index) => (
                        <div key={row.key} className="wiz-fu-timeline-row">
                            <div className="wiz-fu-timeline-rail">
                                <div
                                    className={`wiz-fu-timeline-dot${row.isFixed ? ' is-muted' : ' is-accent'}`}
                                    style={!row.isFixed ? { background: accentColor, borderColor: accentColor } : undefined}
                                >
                                    {index + 1}
                                </div>
                                {index < timelineRows.length - 1 && (
                                    <div className="wiz-fu-timeline-line" aria-hidden />
                                )}
                            </div>
                            <div className="wiz-fu-timeline-body">
                                <div className="wiz-fu-timeline-title-row">
                                    <h4>{row.label}</h4>
                                    {!row.isFixed && steps.length > 1 && (
                                        <button
                                            type="button"
                                            className="wiz-fu-remove-btn"
                                            onClick={() => onRemoveStep(row.step.id)}
                                            aria-label={t('wizFollowupRemoveStep')}
                                        >
                                            <Trash2 size={14} aria-hidden />
                                        </button>
                                    )}
                                </div>
                                {row.isFixed ? (
                                    <p className="wiz-fu-muted">{t('wizFollowupDayZero')}</p>
                                ) : (
                                    <div className="wiz-fu-delay-row">
                                        <input
                                            type="number"
                                            min={1}
                                            max={90}
                                            className="wiz-fu-day-input"
                                            value={row.step.days}
                                            onChange={(e) =>
                                                onDayChange(
                                                    row.step.id,
                                                    Math.min(90, Math.max(1, parseInt(e.target.value, 10) || 1)),
                                                )
                                            }
                                            aria-label={row.label}
                                        />
                                        <span className="wiz-fu-muted">{t('wizFollowupDaysAfter')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {onAddStep ? (
                    <>
                        <button
                            type="button"
                            className="wiz-fu-add-btn is-accent"
                            onClick={onAddStep}
                            disabled={!canAddMoreFollowupSteps(steps?.length ?? 0, planMaxSteps)}
                        >
                            <Plus size={18} aria-hidden />
                            {t('wizFollowupAddStep')}
                        </button>
                        {!canAddMoreFollowupSteps(steps?.length ?? 0, planMaxSteps) ? (
                            <p className="wiz-fu-plan-hint">
                                {t('planFollowupSequenceLimit', {
                                    max: planMaxSteps ?? steps?.length ?? 0,
                                })}
                            </p>
                        ) : null}
                    </>
                ) : null}
            </div>

            <div className="wiz-fu-stats">
                <div className="wiz-fu-stat">
                    <Clock size={16} style={{ color: accentColor }} aria-hidden />
                    <div>
                        <p className="wiz-fu-stat-label">{t('wizFollowupStatDuration')}</p>
                        <p className="wiz-fu-stat-value">{t('wizFollowupStatDays', { n: totalDays })}</p>
                    </div>
                </div>
                <div className="wiz-fu-stat">
                    <Calendar size={16} style={{ color: accentColor }} aria-hidden />
                    <div>
                        <p className="wiz-fu-stat-label">{t('wizFollowupStatPoints')}</p>
                        <p className="wiz-fu-stat-value">{t('wizFollowupStatMessagesCount', { n: count })}</p>
                    </div>
                </div>
                <div className="wiz-fu-stat">
                    <Clock size={16} style={{ color: accentColor }} aria-hidden />
                    <div>
                        <p className="wiz-fu-stat-label">{t('wizFollowupStatInterval')}</p>
                        <p className="wiz-fu-stat-value">{t('wizFollowupStatDays', { n: avgInterval })}</p>
                    </div>
                </div>
            </div>

            <p className="wiz-fu-tip">
                <strong>{t('wizFollowupBestPractice')}</strong> {t('wizFollowupBestPracticeBody')}
            </p>
        </div>
    );
}
