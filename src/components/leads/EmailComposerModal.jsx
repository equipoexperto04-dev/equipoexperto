import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    X, Send, Paperclip, Image as ImageIcon, Smile, Minimize2, Maximize2,
    Loader2, AlertCircle, CheckCircle2, File as FileIcon, XCircle,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import API_URL from '../../config.js';
import './EmailComposerModal.css';

// ── Emoji panel ────────────────────────────────────────────────────────────
const EMOJI_LIST = [
    '😀','😊','😄','😂','🤣','😍','🥰','😎','🤩','😏',
    '👍','👋','🙌','🤝','💪','✅','🎉','🎊','⭐','🔥',
    '❤️','💙','💚','💛','🧡','💜','🖤','🤍','💯','✨',
    '📧','📩','📨','📬','📭','📮','📝','📋','📌','🔗',
    '🏆','🎯','💡','🚀','⚡','🌟','💎','🎁','🤔','👀',
];

const EmojiPanel = ({ onSelect }) => (
    <div className="ecm-emoji-panel">
        {EMOJI_LIST.map((e) => (
            <button key={e} className="ecm-emoji-item" onClick={() => onSelect(e)} type="button">
                {e}
            </button>
        ))}
    </div>
);

// ── Attachment chip ────────────────────────────────────────────────────────
const AttachmentChip = ({ file, onRemove }) => (
    <div className="ecm-attach-chip">
        <FileIcon size={12} />
        <span className="ecm-attach-name">{file.name}</span>
        <span className="ecm-attach-size">({(file.size / 1024).toFixed(0)} KB)</span>
        <button type="button" className="ecm-attach-remove" onClick={() => onRemove(file)} aria-label="Remove attachment">
            <XCircle size={13} />
        </button>
    </div>
);

/**
 * EmailComposerModal
 * Props:
 *   leadId        – lead ID to call /api/leads/:id/send-email
 *   to            – recipient email address
 *   recipientName – display name of the recipient
 *   onClose       – called when the modal should be closed
 *   onSend        – optional callback after successful send (for parent toast / state)
 */
const EmailComposerModal = ({ leadId, to, recipientName, onClose, onSend }) => {
    const { t } = useTranslation();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState([]);   // File[]
    const [isMinimized, setIsMinimized] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPanelRef = useRef(null);

    // Close emoji panel when clicking outside
    useEffect(() => {
        if (!showEmoji) return;
        const handler = (e) => {
            if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showEmoji]);

    const insertEmoji = (emoji) => {
        const ta = textareaRef.current;
        if (!ta) { setBody((b) => b + emoji); return; }
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newBody = body.slice(0, start) + emoji + body.slice(end);
        setBody(newBody);
        // Restore cursor after emoji
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + emoji.length;
            ta.focus();
        });
        setShowEmoji(false);
    };

    const handleFiles = useCallback((files) => {
        const MAX_FILES = 5;
        const MAX_SIZE_MB = 10;
        const incoming = Array.from(files);
        const oversized = incoming.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
        if (oversized.length) {
            setError(`Files exceed ${MAX_SIZE_MB} MB limit: ${oversized.map((f) => f.name).join(', ')}`);
            return;
        }
        setAttachments((prev) => {
            const combined = [...prev, ...incoming];
            return combined.slice(0, MAX_FILES);
        });
        setError('');
    }, []);

    const removeAttachment = (file) => {
        setAttachments((prev) => prev.filter((f) => f !== file));
    };

    const applyTemplate = (tplSubject, tplBody) => {
        setSubject(tplSubject);
        setBody(tplBody);
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim() || sending) return;
        setError('');
        setSending(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('subject', subject.trim());
            formData.append('body', body.trim());
            attachments.forEach((f) => formData.append('files', f));

            const endpoint = leadId
                ? `${API_URL}/api/leads/${leadId}/send-email`
                : null;

            if (!endpoint) {
                // Fallback — no leadId; just call onSend (e.g. from LeadDetailModal before leadId was threaded)
                onSend?.({ to, subject: subject.trim(), body: body.trim() });
                setSent(true);
                setTimeout(onClose, 1200);
                return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || t('leadEmailFailed'));
            }

            setSent(true);
            onSend?.({ to, subject: subject.trim(), body: body.trim() });
            // Auto-close after brief success flash
            setTimeout(onClose, 1400);
        } catch (err) {
            setError(err.message || t('leadEmailFailed'));
        } finally {
            setSending(false);
        }
    };

    /* ── Minimised pill ──────────────────────────────────────── */
    if (isMinimized) {
        return (
            <div className="ecm-minimized-wrap">
                <button
                    className="ecm-minimized-pill"
                    onClick={() => setIsMinimized(false)}
                    type="button"
                >
                    <span className="ecm-minimized-dot" />
                    <span className="ecm-minimized-label">
                        New Message · {recipientName}
                    </span>
                    <Maximize2 size={14} />
                </button>
            </div>
        );
    }

    /* ── Full modal ──────────────────────────────────────────── */
    return (
        <div className="ecm-backdrop" onClick={onClose} role="presentation">
            <div
                className="ecm-panel"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Compose new email"
            >
                {/* Header */}
                <div className="ecm-header">
                    <h3 className="ecm-title">New Message</h3>
                    <div className="ecm-header-actions">
                        <button
                            className="ecm-icon-btn"
                            title="Minimize"
                            onClick={() => setIsMinimized(true)}
                            type="button"
                        >
                            <Minimize2 size={15} />
                        </button>
                        <button
                            className="ecm-icon-btn"
                            title="Close"
                            onClick={onClose}
                            type="button"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* To field */}
                <div className="ecm-field-row ecm-field-row--border">
                    <span className="ecm-field-label">To:</span>
                    <div className="ecm-recipient-chip">
                        {recipientName} &lt;{to}&gt;
                    </div>
                </div>

                {/* Subject field */}
                <div className="ecm-field-row ecm-field-row--border">
                    <span className="ecm-field-label">Subject:</span>
                    <input
                        className="ecm-subject-input"
                        placeholder="Enter subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                </div>

                {/* Body */}
                <div className="ecm-body-wrap">
                    <textarea
                        ref={textareaRef}
                        className="ecm-body-textarea"
                        placeholder="Compose your message…"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                </div>

                {/* Attachment chips */}
                {attachments.length > 0 && (
                    <div className="ecm-attachments">
                        {attachments.map((f, i) => (
                            <AttachmentChip key={`${f.name}-${i}`} file={f} onRemove={removeAttachment} />
                        ))}
                    </div>
                )}

                {/* Error / success feedback */}
                {error && (
                    <div className="ecm-feedback ecm-feedback--error">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}
                {sent && !error && (
                    <div className="ecm-feedback ecm-feedback--success">
                        <CheckCircle2 size={14} />
                        <span>{t('leadEmailSent')}</span>
                    </div>
                )}

                {/* Toolbar + send */}
                <div className="ecm-toolbar">
                    <div className="ecm-toolbar-left">
                        {/* File attachment */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="*/*"
                            style={{ display: 'none' }}
                            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                        />
                        <button
                            className="ecm-tool-btn"
                            title="Attach file"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={16} />
                        </button>

                        {/* Image attachment */}
                        <input
                            ref={imageInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                        />
                        <button
                            className="ecm-tool-btn"
                            title="Insert image"
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                        >
                            <ImageIcon size={16} />
                        </button>

                        {/* Emoji picker */}
                        <div className="ecm-emoji-wrap" ref={emojiPanelRef}>
                            <button
                                className={`ecm-tool-btn${showEmoji ? ' ecm-tool-btn--active' : ''}`}
                                title="Insert emoji"
                                type="button"
                                onClick={() => setShowEmoji((v) => !v)}
                            >
                                <Smile size={16} />
                            </button>
                            {showEmoji && <EmojiPanel onSelect={insertEmoji} />}
                        </div>
                    </div>

                    <div className="ecm-toolbar-right">
                        <button className="ecm-cancel-btn" onClick={onClose} type="button">
                            Cancel
                        </button>
                        <button
                            className="ecm-send-btn"
                            onClick={handleSend}
                            disabled={!subject.trim() || !body.trim() || sending || sent}
                            type="button"
                        >
                            {sending ? (
                                <><Loader2 size={14} className="ecm-spin" />{t('leadEmailSending') || 'Sending…'}</>
                            ) : sent ? (
                                <><CheckCircle2 size={14} />Sent!</>
                            ) : (
                                <><Send size={14} />Send</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick templates */}
                <div className="ecm-templates">
                    <p className="ecm-templates-label">Quick Templates:</p>
                    <div className="ecm-templates-row">
                        <button
                            className="ecm-tpl-btn"
                            type="button"
                            onClick={() =>
                                applyTemplate(
                                    'Following up on our conversation',
                                    `Hi ${recipientName},\n\nI wanted to follow up on our recent conversation. Do you have any questions I can help answer?\n\nBest regards`
                                )
                            }
                        >
                            Followup
                        </button>
                        <button
                            className="ecm-tpl-btn"
                            type="button"
                            onClick={() =>
                                applyTemplate(
                                    'Meeting Request',
                                    `Hi ${recipientName},\n\nI'd love to schedule a meeting to discuss how we can help. Are you available this week?\n\nBest regards`
                                )
                            }
                        >
                            Meeting Request
                        </button>
                        <button
                            className="ecm-tpl-btn"
                            type="button"
                            onClick={() =>
                                applyTemplate(
                                    'Thank you!',
                                    `Hi ${recipientName},\n\nThank you for your time and interest. I look forward to working with you!\n\nBest regards`
                                )
                            }
                        >
                            Thank You
                        </button>
                        <button
                            className="ecm-tpl-btn"
                            type="button"
                            onClick={() =>
                                applyTemplate(
                                    'Additional Information',
                                    `Hi ${recipientName},\n\nI wanted to share some additional information that might be helpful for your decision.\n\nBest regards`
                                )
                            }
                        >
                            Info Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;
