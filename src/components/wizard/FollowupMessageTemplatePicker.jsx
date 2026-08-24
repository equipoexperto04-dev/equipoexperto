import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import {
    CREATE_TEMPLATE_ID,
    createCustomFollowupTemplate,
    listFollowupTemplateOptions,
    removeCustomFollowupTemplate,
    resolveFollowupTemplate,
} from '../../utils/followupMessageTemplates.js';
import './FollowupMessageTemplatePicker.css';

/**
 * Dropdown: 5 built-in templates + unlimited custom + create new.
 */
export default function FollowupMessageTemplatePicker({
    userId,
    stepId,
    currentText = '',
    onApply,
    accentColor = 'var(--accent-color)',
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newBody, setNewBody] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [customRevision, setCustomRevision] = useState(0);
    const wrapRef = useRef(null);

    const options = useMemo(
        () => listFollowupTemplateOptions(userId, t),
        [userId, t, customRevision],
    );

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const applyTemplate = (templateId) => {
        const tpl = resolveFollowupTemplate(userId, templateId);
        if (!tpl?.body) return;
        onApply(stepId, tpl.body);
        setSelectedId(templateId);
        setOpen(false);
        setCreating(false);
    };

    const handleCreate = () => {
        const created = createCustomFollowupTemplate(userId, {
            name: newName.trim() || undefined,
            body: newBody,
        });
        if (!created) return;
        setCustomRevision((n) => n + 1);
        applyTemplate(created.id);
        setNewName('');
        setNewBody('');
        setCreating(false);
    };

    const handleDeleteCustom = (e, templateId) => {
        e.stopPropagation();
        removeCustomFollowupTemplate(userId, templateId);
        setCustomRevision((n) => n + 1);
        if (selectedId === templateId) setSelectedId('');
        setOpen(false);
    };

    const selectedLabel =
        selectedId === CREATE_TEMPLATE_ID
            ? t('wizTplCreateNew')
            : options.find((o) => o.id === selectedId)?.label || t('wizTplSelectTemplate');

    return (
        <div className="fu-tpl-picker" ref={wrapRef}>
            <button
                type="button"
                className="fu-tpl-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="fu-tpl-trigger-label">{selectedLabel}</span>
                <ChevronDown size={16} className={`fu-tpl-chevron${open ? ' is-open' : ''}`} aria-hidden />
            </button>

            {open && (
                <div className="fu-tpl-menu" role="listbox">
                    <p className="fu-tpl-menu-title">{t('wizTplSelectTemplate')}</p>
                    {options.map((opt) => (
                        <div key={opt.id} className="fu-tpl-option-wrap">
                            <button
                                type="button"
                                role="option"
                                className={`fu-tpl-option${selectedId === opt.id ? ' is-selected' : ''}`}
                                onClick={() => applyTemplate(opt.id)}
                            >
                                <span className="fu-tpl-option-label">{opt.label}</span>
                                {opt.hint ? (
                                    <span className="fu-tpl-option-hint">{opt.hint}</span>
                                ) : null}
                            </button>
                            {!opt.builtin && (
                                <button
                                    type="button"
                                    className="fu-tpl-option-delete"
                                    onClick={(e) => handleDeleteCustom(e, opt.id)}
                                    aria-label={t('wizTplDeleteCustom')}
                                >
                                    <Trash2 size={14} aria-hidden />
                                </button>
                            )}
                        </div>
                    ))}

                    <div className="fu-tpl-divider" />

                    {!creating ? (
                        <button
                            type="button"
                            className="fu-tpl-create-row"
                            onClick={() => {
                                setCreating(true);
                                setNewName('');
                                setNewBody(currentText);
                            }}
                        >
                            <Plus size={16} aria-hidden />
                            <span>{t('wizTplCreateNew')}</span>
                        </button>
                    ) : (
                        <div className="fu-tpl-create-form">
                            <label className="fu-tpl-create-label">{t('wizTplNewName')}</label>
                            <input
                                type="text"
                                className="fu-tpl-create-input"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('wizTplNewNamePlaceholder')}
                            />
                            <label className="fu-tpl-create-label">{t('wizTplNewBody')}</label>
                            <textarea
                                className="fu-tpl-create-textarea"
                                rows={4}
                                value={newBody}
                                onChange={(e) => setNewBody(e.target.value)}
                                placeholder={t('wizFollowupMsgPlaceholder')}
                            />
                            <p className="fu-tpl-create-hint">{t('wizTplCreateHint')}</p>
                            <div className="fu-tpl-create-actions">
                                <button
                                    type="button"
                                    className="fu-tpl-btn-cancel"
                                    onClick={() => setCreating(false)}
                                >
                                    {t('echCancel')}
                                </button>
                                <button
                                    type="button"
                                    className="fu-tpl-btn-save"
                                    style={{ background: accentColor, borderColor: accentColor }}
                                    onClick={handleCreate}
                                    disabled={!newBody.trim()}
                                >
                                    {t('wizTplSaveTemplate')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
