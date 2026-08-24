import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, BookmarkPlus } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import {
    REVIEW_QUALIFY_TEMPLATE_KEYS,
    CAPTURE_QUALIFY_TEMPLATE_KEYS,
    QUALIFY_USER_TPL_STORAGE,
    MAX_USER_QUALIFY_TEMPLATES,
    addQuestionFromTemplate,
    removeQuestionAt,
    qualifyI18n,
} from '../constants/qualifyQuestionTemplates.js';

function makeRowId() {
    return `qrow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {object} props
 * @param {'review'|'capture'} props.jobId
 * @param {string} props.accent
 * @param {string[]} props.questions
 * @param {(next: string[]) => void} props.onChange
 * @param {string} [props.instructionKey]
 */
export default function QualifyQuestionsEditor({
    jobId,
    accent,
    questions,
    onChange,
    instructionKey,
}) {
    const { t, language } = useTranslation();
    const tr = (key) => qualifyI18n(t, language, key);
    const rowIdSeq = useRef(0);
    const [rowKeys, setRowKeys] = useState(() =>
        questions.map(() => `qrow-${++rowIdSeq.current}`),
    );
    const [customTemplateDraft, setCustomTemplateDraft] = useState('');
    const [userTemplates, setUserTemplates] = useState(() => {
        try {
            const raw = localStorage.getItem(QUALIFY_USER_TPL_STORAGE);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((x) => typeof x === 'string' && x.trim())
                .slice(0, MAX_USER_QUALIFY_TEMPLATES);
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(QUALIFY_USER_TPL_STORAGE, JSON.stringify(userTemplates));
    }, [userTemplates]);

    /* Keep stable keys when parent loads/saves a different question count */
    useEffect(() => {
        setRowKeys((prev) => {
            if (prev.length === questions.length) return prev;
            if (questions.length > prev.length) {
                const extra = Array.from(
                    { length: questions.length - prev.length },
                    () => `qrow-${++rowIdSeq.current}`,
                );
                return [...prev, ...extra];
            }
            return prev.slice(0, questions.length);
        });
    }, [questions.length]);

    const starterKeys =
        jobId === 'capture' ? CAPTURE_QUALIFY_TEMPLATE_KEYS : REVIEW_QUALIFY_TEMPLATE_KEYS;

    const availableStarter = starterKeys.filter((key) => {
        const text = tr(key).trim();
        return text && !questions.some((q) => q.trim() === text);
    });

    const availableUser = userTemplates.filter(
        (ut) => ut.trim() && !questions.some((q) => q.trim() === ut.trim())
    );

    const addFromTemplate = (text) => onChange(addQuestionFromTemplate(questions, text));

    const saveUserTemplate = () => {
        const s = customTemplateDraft.trim();
        if (
            !s ||
            userTemplates.length >= MAX_USER_QUALIFY_TEMPLATES ||
            userTemplates.some((x) => x.trim() === s)
        ) {
            return;
        }
        setUserTemplates((prev) => [...prev, s].slice(0, MAX_USER_QUALIFY_TEMPLATES));
        setCustomTemplateDraft('');
    };

    const filledCount = questions.filter((q) => q.trim()).length;

    return (
        <div className="wiz-questions-block" style={{ '--wiz-q-accent': accent }}>
            <p className="wiz-instruction">
                {t(instructionKey || (jobId === 'review' ? 'wizStep4InstructionReview' : 'cfgQualifyDesc'))}
            </p>
            <p className="wiz-instruction wiz-instruction--muted">{t('wizQualifyShortHelp')}</p>

            <section className="wiz-questions-card" aria-labelledby="wiz-your-questions-title">
                <div className="wiz-questions-card-head">
                    <h3 id="wiz-your-questions-title" className="wiz-questions-card-title">
                        {t('wizYourQuestionsTitle')}
                    </h3>
                    <span className="wiz-questions-count">
                        {filledCount}{' '}
                        {filledCount === 1 ? tr('wizQuestionSingular') : tr('wizQuestionPlural')}
                    </span>
                </div>

                <ul className="wiz-q-rows">
                    {questions.map((q, i) => (
                        <li key={rowKeys[i] ?? `qrow-fallback-${i}`} className="wiz-q-row">
                            <span className="wiz-q-num" aria-hidden>
                                {i + 1}
                            </span>
                            <input
                                type="text"
                                className="wiz-q-input input-field"
                                value={q}
                                onChange={(e) => {
                                    const next = [...questions];
                                    next[i] = e.target.value;
                                    onChange(next);
                                }}
                                placeholder={t('wizQualifyQuestionPlaceholder')}
                                aria-label={`${t('wizYourQuestionsTitle')} ${i + 1}`}
                            />
                            <button
                                type="button"
                                className="wiz-q-remove"
                                onClick={() => {
                                    setRowKeys((prev) => prev.filter((_, j) => j !== i));
                                    onChange(removeQuestionAt(questions, i));
                                }}
                                disabled={questions.length === 1 && !q.trim()}
                                aria-label={t('wizRemoveQuestion')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    className="wiz-q-add-btn wiz-q-add-btn--inline"
                    style={{ borderColor: `${accent}55`, color: accent }}
                    onClick={() => {
                        setRowKeys((prev) => [...prev, `qrow-${++rowIdSeq.current}`]);
                        onChange([...questions, '']);
                    }}
                >
                    <Plus size={16} /> {t('wizAddQuestion')}
                </button>
            </section>

            <section className="wiz-templates-panel" aria-labelledby="wiz-starter-templates-title">
                <h3 id="wiz-starter-templates-title" className="wiz-templates-panel-title">
                    {t('wizQualifyStarterTitle')}
                </h3>
                {availableStarter.length > 0 ? (
                    <div className="wiz-template-chips">
                        {availableStarter.map((key) => (
                            <button
                                key={key}
                                type="button"
                                className="wiz-template-chip"
                                onClick={() => addFromTemplate(tr(key))}
                            >
                                <Plus size={14} strokeWidth={2.5} aria-hidden />
                                <span>{tr(key)}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="wiz-templates-empty">{t('wizQualifyAllSuggestionsUsed')}</p>
                )}
            </section>

            <section className="wiz-templates-saved" aria-labelledby="wiz-saved-templates-title">
                <h3 id="wiz-saved-templates-title" className="wiz-templates-panel-title">
                    {t('wizQualifyMyTemplatesTitle')}
                </h3>
                <p className="wiz-templates-saved-desc">{t('wizQualifyMyTemplatesDesc')}</p>
                <div className="wiz-templates-save-row">
                    <input
                        type="text"
                        className="wiz-q-input input-field"
                        value={customTemplateDraft}
                        onChange={(e) => setCustomTemplateDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                saveUserTemplate();
                            }
                        }}
                        placeholder={t('wizQualifySaveTemplatePlaceholder')}
                    />
                    <button
                        type="button"
                        className="wiz-templates-save-btn"
                        style={{ background: accent }}
                        onClick={saveUserTemplate}
                        disabled={
                            !customTemplateDraft.trim() ||
                            userTemplates.length >= MAX_USER_QUALIFY_TEMPLATES
                        }
                    >
                        <BookmarkPlus size={16} />
                        {t('wizQualifySaveTemplateBtn')}
                    </button>
                </div>
                {availableUser.length > 0 && (
                    <div className="wiz-template-chips wiz-template-chips--saved">
                        {availableUser.map((ut) => (
                            <div key={ut} className="wiz-template-chip-wrap">
                                <button
                                    type="button"
                                    className="wiz-template-chip wiz-template-chip--saved"
                                    onClick={() => addFromTemplate(ut)}
                                >
                                    <Plus size={14} strokeWidth={2.5} aria-hidden />
                                    <span>{ut}</span>
                                </button>
                                <button
                                    type="button"
                                    className="wiz-template-chip-delete"
                                    onClick={() =>
                                        setUserTemplates((prev) => prev.filter((x) => x !== ut))
                                    }
                                    aria-label={t('wizQualifyRemoveSavedTpl')}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
