import React, { useState } from 'react';
import { Send, Mail, User, MessageCircle, CheckCircle2, Loader2, Compass } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import API_URL from '../../config.js';

const REFERRAL_OPTIONS = [
    { value: 'YouTube', labelKey: 'contactSourceYouTube', defaultLabel: 'YouTube' },
    { value: 'Instagram', labelKey: 'contactSourceInstagram', defaultLabel: 'Instagram' },
    { value: 'Twitter / X', labelKey: 'contactSourceTwitter', defaultLabel: 'Twitter / X' },
    { value: 'LinkedIn', labelKey: 'contactSourceLinkedIn', defaultLabel: 'LinkedIn' },
    { value: 'TikTok', labelKey: 'contactSourceTikTok', defaultLabel: 'TikTok' },
    { value: 'Facebook', labelKey: 'contactSourceFacebook', defaultLabel: 'Facebook' },
    { value: 'Google Search', labelKey: 'contactSourceGoogle', defaultLabel: 'Google Search' },
    { value: 'Friend / Word of Mouth', labelKey: 'contactSourceFriend', defaultLabel: 'Friend / Word of Mouth' },
    { value: 'Blog or Article', labelKey: 'contactSourceBlog', defaultLabel: 'Blog or Article' },
    { value: 'Other', labelKey: 'contactSourceOther', defaultLabel: 'Other' },
];

const ContactSection = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        hearAboutUs: '',
        otherSource: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const nameTrimmed = formData.name.trim();
        const emailTrimmed = formData.email.trim();
        const messageTrimmed = formData.message.trim();
        const hearAboutUsFinal = formData.hearAboutUs === 'Other'
            ? (formData.otherSource.trim() ? `Other: ${formData.otherSource.trim()}` : 'Other')
            : (formData.hearAboutUs || '');

        // Issue #7: Prevent space-only submissions
        if (!nameTrimmed || !emailTrimmed || !messageTrimmed) {
            setStatus('error');
            setErrorMessage(t('contactFormEmptySpaces') || 'Please fill in all fields with valid content.');
            return;
        }

        // Issue #6: Strict email validation requiring valid domain dot
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
            setStatus('error');
            setErrorMessage(t('contactSalesEmailInvalid') || 'Please enter a valid email address.');
            return;
        }

        // Issue #8: Prevent numeric-only or invalid character names
        if (/^\d+$/.test(nameTrimmed)) {
            setStatus('error');
            setErrorMessage(t('invalidNameFormat') || 'Name must contain letters.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/support/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameTrimmed,
                    email: emailTrimmed,
                    hearAboutUs: hearAboutUsFinal,
                    message: messageTrimmed
                }),
                signal: AbortSignal.timeout(30_000),
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setStatus('success');
                setFormData({ name: '', email: '', hearAboutUs: '', otherSource: '', message: '' });
            } else {
                setStatus('error');
                setErrorMessage(data.message || t('contactFormServerError'));
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage(t('contactFormError'));
        }
    };

    return (
        <section className="contact-section" id="contact">
            <div className="landing-container">
                <div className="contact-grid">
                    <div className="contact-info">
                        <p className="section-eyebrow">{t('contact')}</p>
                        <h2 className="section-title">{t('contactTitle')}</h2>
                        <p className="section-desc">
                            {t('contactSub')}
                        </p>

                        <div className="contact-features">
                            <div className="contact-feature-item">
                                <div className="cf-icon"><CheckCircle2 size={18} /></div>
                                <span>{t('contact247')}</span>
                            </div>
                            <div className="contact-feature-item">
                                <div className="cf-icon"><CheckCircle2 size={18} /></div>
                                <span>{t('contactFastResponse')}</span>
                            </div>
                            <div className="contact-feature-item">
                                <div className="cf-icon"><CheckCircle2 size={18} /></div>
                                <span>{t('contactDirectAccess')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="contact-card-v2">
                        {status === 'success' ? (
                            <div className="contact-success-state">
                                <div className="success-icon-bg">
                                    <CheckCircle2 size={40} className="text-success" />
                                </div>
                                <h3>{t('contactSuccess')}</h3>
                                <p>{t('contactSuccessDesc')}</p>
                                <button 
                                    className="btn-primary" 
                                    onClick={() => setStatus('idle')}
                                    style={{ marginTop: '20px' }}
                                >
                                    {t('contactSendAnother')}
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form-v2" onSubmit={handleSubmit}>
                                <div className="form-group-v2">
                                    <label><User size={14} /> {t('contactName')} <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        name="name"
                                        placeholder="John Doe"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="form-group-v2">
                                    <label><Mail size={14} /> {t('contactEmailLabel')} <span className="text-red-500">*</span></label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        placeholder="john@example.com"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="form-group-v2">
                                    <label><Compass size={14} /> {t('contactHearAboutUs') || 'How did you hear about us?'}</label>
                                    <select 
                                        name="hearAboutUs"
                                        value={formData.hearAboutUs}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                    >
                                        <option value="">{t('contactHearAboutUsPlaceholder') || 'Select an option...'}</option>
                                        {REFERRAL_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {t(opt.labelKey) || opt.defaultLabel}
                                            </option>
                                        ))}
                                    </select>
                                    {formData.hearAboutUs === 'Other' && (
                                        <input 
                                            type="text" 
                                            name="otherSource"
                                            placeholder={t('contactHearAboutUsOtherPlaceholder') || 'Please specify how you found us...'}
                                            value={formData.otherSource}
                                            onChange={handleChange}
                                            disabled={status === 'loading'}
                                            className="contact-other-input"
                                            autoFocus
                                        />
                                    )}
                                </div>

                                <div className="form-group-v2">
                                    <label><MessageCircle size={14} /> {t('contactMessage')} <span className="text-red-500">*</span></label>
                                    <textarea 
                                        name="message"
                                        placeholder={t('contactMessagePlaceholder')}
                                        rows="4"
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        disabled={status === 'loading'}
                                    ></textarea>
                                </div>

                                {status === 'error' && (
                                    <div className="form-error-msg">{errorMessage}</div>
                                )}

                                <button 
                                    type="submit" 
                                    className="contact-submit-btn"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 className="animate-spin" size={18} /> {t('contactSending')}</>
                                    ) : (
                                        <><Send size={18} /> {t('contactSend')}</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
