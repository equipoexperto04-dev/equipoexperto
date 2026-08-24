import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Mail, User, MessageCircle, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import API_URL from '../config.js';
import { useTranslation } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import './PublicFunnel.css';

const PublicLeadForm = () => {
    const { t } = useTranslation();
    const publicLoadFailed = t('publicLoadFailed');
    const publicSubmitFailed = t('publicSubmitFailed');
    const iconStyle = {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#64748b',
        pointerEvents: 'none',
        zIndex: 1,
    };
    /* Icon 18px + gap — keeps placeholder/text clear of glyphs (translations / long placeholders) */
    const inputWithIconStyle = {
        paddingLeft: 'clamp(52px, 3.625rem, 4rem)',
        width: '100%',
        minHeight: '56px',
        boxSizing: 'border-box',
    };
    const { automation_id } = useParams();
    const [searchParams] = useSearchParams();
    const captureGroup = (searchParams.get('group') || searchParams.get('category') || '').trim();
    const [businessName, setBusinessName] = useState('Loading...');
    const [filteringQuestions, setFilteringQuestions] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        message: '',
        consent_given: false,
        marketing_consent: false
    });
    const [filteringResponses, setFilteringResponses] = useState({});

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_URL}/api/l/${automation_id}${window.location.search}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setBusinessName(data.data.business_name || 'Our Team');
                    const rawQs = data.data.filtering_questions || [];
                    const questions = Array.isArray(rawQs) ? rawQs.map(q => 
                        typeof q === 'object' && q !== null ? (q.label || q.question || q.text || '') : String(q)
                    ).filter(q => q && q.trim() !== "") : [];
                    
                    setFilteringQuestions(questions);

                    // Initialize responses
                    const initial = {};
                    questions.forEach(q => {
                        initial[q] = "";
                    });
                    setFilteringResponses(initial);
                } else {
                    setBusinessName('Our Team');
                }
            } catch (err) {
                console.error('[PublicLeadForm] Error:', err);
                setBusinessName('Our Team');
                setErrorMsg(publicLoadFailed);
            }
        };

        fetchConfig();
    }, [automation_id, publicLoadFailed]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!formData.consent_given) {
            setErrorMsg(t('publicLeadConsentError'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setErrorMsg(t('publicLeadEmailError'));
            return;
        }

        if (formData.phone.length < 10) {
            setErrorMsg(t('publicLeadPhoneError'));
            return;
        }

        setLoading(true);

        try {
            const source = searchParams.get('source') || '';

            const res = await fetch(`${API_URL}/api/l/${automation_id}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    filtering_responses: filteringResponses,
                    ...(captureGroup ? { lead_group: captureGroup } : {}),
                    source,
                })
            });

            const data = await res.json();

            if (data.status === 'success' || data.success) {
                setSuccessMsg(t('publicLeadSuccess'));
                setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    message: '',
                    consent_given: false,
                    marketing_consent: false
                }); // clear form
                setFilteringResponses({});
            } else {
                setErrorMsg(data.message || publicSubmitFailed);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg(publicSubmitFailed);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFilterChange = (q, val) => {
        setFilteringResponses({
            ...filteringResponses,
            [q]: val
        });
    };

    const displayName = businessName && businessName !== 'Loading...' && businessName !== 'Business Not Found' && businessName !== 'Our Team'
        ? businessName : '';

    return (
        <div
            className="public-funnel-page"
            style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                position: 'relative',
            }}
        >
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <LanguageToggle />
            </div>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {displayName && (
                        <p
                            style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#64748b',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {displayName}
                        </p>
                    )}
                    <h2 className="public-funnel-title">{t('publicLeadTitle')}</h2>
                    <p className="public-funnel-subtitle">{t('publicLeadSubtitle')}</p>
                </div>

                <div className="public-funnel-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    {successMsg ? (
                        <div key="success-container" style={{ textAlign: 'center', padding: '2rem 1rem' }} className="animate-fade-in">
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                margin: '0 auto 1.5rem',
                                animation: 'scale-in 0.5s ease-out'
                            }}>
                                <CheckCircle2 size={48} style={{ color: '#22c55e' }} />
                            </div>
                            <h3 className="public-funnel-title" style={{ marginBottom: '0.75rem' }}>{t('publicLeadSentTitle')}</h3>
                            <p className="public-funnel-subtitle" style={{ lineHeight: '1.6' }}>{successMsg}</p>
                            <button 
                                onClick={() => setSuccessMsg('')}
                                style={{ 
                                    marginTop: '2rem', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#0369a1', 
                                    fontWeight: 700, 
                                    fontSize: '0.875rem', 
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                {t('publicLeadSendAnother')}
                            </button>
                        </div>
                    ) : (
                        <form key="lead-form" onSubmit={handleSubmit} className="animate-fade-in">
                            {errorMsg && (
                                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                    {errorMsg}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="public-funnel-label">{t('publicLeadFullName')}</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={iconStyle} />
                                    <input
                                        type="text"
                                        name="full_name"
                                        className="input-field"
                                        placeholder={t('publicLeadFullNamePlaceholder')}
                                        style={inputWithIconStyle}
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="public-funnel-label">{t('publicLeadEmail')}</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={iconStyle} />
                                    <input
                                        type="email"
                                        name="email"
                                        className="input-field"
                                        placeholder={t('publicLeadEmailPlaceholder')}
                                        style={inputWithIconStyle}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="public-funnel-label">{t('publicLeadPhone')}</label>
                                <PhoneInput
                                    country={'pk'}
                                    value={formData.phone}
                                    onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                                    inputProps={{ name: 'phone', required: true, id: 'lead-phone' }}
                                    enableSearch={true}
                                    searchPlaceholder={t('publicLeadSearchCountry')}
                                    containerStyle={{ width: '100%' }}
                                    inputStyle={{
                                        width: '100%',
                                        height: '56px',
                                        fontSize: '1rem',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        color: '#0f172a',
                                        paddingLeft: 'clamp(56px, 3.65rem, 4.25rem)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    buttonStyle={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRight: 'none',
                                        borderRadius: '12px 0 0 12px',
                                        paddingLeft: '10px',
                                    }}
                                    dropdownStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        width: '280px',
                                        zIndex: 9999,
                                        color: '#0f172a',
                                    }}
                                />
                            </div>

                            {/* Dynamic Filtering Questions */}
                            {filteringQuestions.map((q, idx) => (
                                <div key={idx} style={{ marginBottom: '1.25rem' }}>
                                    <label className="public-funnel-label">{q}</label>
                                    <div style={{ position: 'relative' }}>
                                        <ChevronRight size={18} style={{ ...iconStyle, color: '#0369a1' }} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder={t('publicLeadAnswerPlaceholder')}
                                            style={inputWithIconStyle}
                                            value={filteringResponses[q] || ""}
                                            onChange={(e) => handleFilterChange(q, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="public-funnel-label">{t('publicLeadMessage')}</label>
                                <div style={{ position: 'relative' }}>
                                    <MessageCircle size={18} style={{ ...iconStyle, top: '22px', transform: 'none' }} />
                                    <textarea
                                        name="message"
                                        className="input-field"
                                        placeholder={t('publicLeadMessagePlaceholder')}
                                        style={{
                                            ...inputWithIconStyle,
                                            minHeight: '110px',
                                            resize: 'vertical',
                                            paddingTop: '16px',
                                        }}
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Consent */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="public-funnel-muted" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="consent_given"
                                        checked={formData.consent_given}
                                        onChange={handleChange}
                                        style={{ marginTop: '2px', accentColor: '#0369a1', width: '15px', height: '15px', flexShrink: 0 }}
                                        required
                                    />
                                    <span>{t('publicLeadConsent')} <span style={{ color: '#ef4444' }}>*</span></span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#0369a1', color: '#fff', border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minHeight: '52px', letterSpacing: '0.02em', transition: 'all 0.15s' }}
                                disabled={loading}
                            >
                                {loading ? t('publicLeadSending') : t('publicLeadSubmit')}
                                {!loading && <Send size={16} />}
                            </button>

                            <p className="public-funnel-footnote">{t('publicLeadPrivacy')}</p>
                        </form>
                    )}
                </div>

                <p className="public-funnel-powered">{t('poweredByEquipo')}</p>
            </div>
        </div>
    );
};

export default PublicLeadForm;
