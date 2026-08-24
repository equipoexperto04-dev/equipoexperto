import React, { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import FollowupMessageTemplatePicker from './FollowupMessageTemplatePicker.jsx';
import './WizardFollowup.css';

const MESSAGE_HINT_KEYS = [
    'wizFollowupMsgHint1',
    'wizFollowupMsgHint2',
    'wizFollowupMsgHint3',
];

const MAX_CHARS = 500;

function hintForIndex(index, t) {
    const key = MESSAGE_HINT_KEYS[index];
    return key ? t(key) : t('wizFollowupMsgHintGeneric');
}

/**
 * Message cards for each follow-up touchpoint (synced with schedule steps).
 */
function getUserIdFromProfile() {
    try {
        const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
        return p.id ?? p.user_id ?? p.email ?? 'guest';
    } catch {
        return 'guest';
    }
}

export default function WizardFollowupMessages({
    steps,
    onMessageChange,
    onAddStep,
    onRemoveStep,
    canAdd = false,
    accentColor = 'var(--accent-color)',
    userId: userIdProp,
    /** Register textarea elements for cursor-aware variable insertion (config page). */
    onRegisterTextarea,
    /** Optional pills: [{ key: '{NAME}', label: 'Name' }, ...] */
    messageVariables,
    onInsertVariable,
    showHeader = true,
}) {
    const { t } = useTranslation();
    const userId = useMemo(() => userIdProp ?? getUserIdFromProfile(), [userIdProp]);

    return (
        <div className="wiz-fu">
            {showHeader ? (
                <header className="wiz-fu-header">
                    <h2 className="wiz-fu-title">{t('wizFollowupMessagesTitle')}</h2>
                    <p className="wiz-fu-sub">{t('wizFollowupMessagesSub')}</p>
                </header>
            ) : null}

            <div className="wiz-fu-messages">
                {(steps || []).length === 0 && (
                    <p className="wiz-fu-muted" style={{ marginBottom: '1rem' }}>
                        {t('wizFollowupAddStepHint')}
                    </p>
                )}
                {(steps || []).map((step, index) => {
                    const len = (step.text || '').length;
                    return (
                        <div key={step.id} className="wiz-fu-msg-card">
                            <div className="wiz-fu-msg-head">
                                <div
                                    className="wiz-fu-msg-badge"
                                    style={{ background: accentColor, borderColor: accentColor }}
                                >
                                    {step.sequence}
                                </div>
                                <div className="wiz-fu-msg-head-text">
                                    <h3>{t('wizFollowupTouchpoint', { n: index + 1 })}</h3>
                                    <p className="wiz-fu-muted">{hintForIndex(index, t)}</p>
                                </div>
                                <div className="wiz-fu-msg-head-actions">
                                    <FollowupMessageTemplatePicker
                                        userId={userId}
                                        stepId={step.id}
                                        currentText={step.text}
                                        onApply={onMessageChange}
                                        accentColor={accentColor}
                                    />
                                    {onRemoveStep && (steps?.length ?? 0) > 1 && (
                                        <button
                                            type="button"
                                            className="wiz-fu-remove-btn"
                                            onClick={() => onRemoveStep(step.id)}
                                            aria-label={t('wizFollowupRemoveStep')}
                                        >
                                            <Trash2 size={14} aria-hidden />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <textarea
                                ref={(el) => {
                                    if (onRegisterTextarea) onRegisterTextarea(step.id, el);
                                }}
                                className="wiz-fu-msg-textarea"
                                rows={6}
                                maxLength={MAX_CHARS}
                                placeholder={t('wizFollowupMsgPlaceholder')}
                                value={step.text}
                                onChange={(e) => onMessageChange(step.id, e.target.value)}
                            />
                            <div className="wiz-fu-msg-footer">
                                <div className="wiz-fu-msg-footer-start">
                                    <p className="wiz-fu-muted">{t('wizFollowupPersonalize')}</p>
                                    {messageVariables?.length > 0 && onInsertVariable ? (
                                        <div className="wiz-fu-var-pills">
                                            {messageVariables.map((v) => (
                                                <button
                                                    key={v.key}
                                                    type="button"
                                                    className="wiz-fu-var-pill"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // keep textarea focus & caret position
                                                        onInsertVariable(step.id, v.key);
                                                    }}
                                                >
                                                    {v.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <p className="wiz-fu-char">{t('wizFollowupCharCount', { n: len, max: MAX_CHARS })}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {onAddStep ? (
                <button
                    type="button"
                    className="wiz-fu-add-btn is-accent"
                    onClick={onAddStep}
                    disabled={!canAdd}
                >
                    <Plus size={18} aria-hidden />
                    {t('wizFollowupAddStep')}
                </button>
            ) : null}

            <p className="wiz-fu-tip">
                <strong>{t('wizFollowupTip')}</strong> {t('wizFollowupTipBody')}
            </p>
        </div>
    );
}
