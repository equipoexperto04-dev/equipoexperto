import React from 'react';
import { Check } from 'lucide-react';
import './EmployeeWizardStepper.css';

/**
 * Horizontal step indicator for the employee hire wizard.
 * @param {{ id: number, title: string, description?: string }[]} steps
 * @param {number} currentStep — 1-based
 * @param {string} [accentColor]
 */
export default function EmployeeWizardStepper({ steps, currentStep, accentColor = 'var(--accent-color)' }) {
    return (
        <div className="ew-stepper" role="list" aria-label="Setup progress">
            <div className="ew-stepper-track">
                {steps.map((s, index) => {
                    const stepNum = index + 1;
                    const done = currentStep > stepNum;
                    const active = currentStep === stepNum;
                    return (
                        <div key={s.id} className="ew-stepper-item" role="listitem">
                            <div className="ew-stepper-row">
                                {index > 0 && (
                                    <div
                                        className={`ew-stepper-line ${done || active ? 'is-filled' : ''}`}
                                        style={done || active ? { background: accentColor } : undefined}
                                    />
                                )}
                                <div
                                    className={`ew-stepper-dot ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
                                    style={
                                        done || active
                                            ? { background: accentColor, borderColor: accentColor }
                                            : undefined
                                    }
                                >
                                    {done ? <Check size={16} aria-hidden /> : <span>{stepNum}</span>}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`ew-stepper-line ${done ? 'is-filled' : ''}`}
                                        style={done ? { background: accentColor } : undefined}
                                    />
                                )}
                            </div>
                            <div className="ew-stepper-labels">
                                <p className={`ew-stepper-title ${active ? 'is-active' : ''}`}>{s.title}</p>
                                {s.description ? (
                                    <p className="ew-stepper-desc">{s.description}</p>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
