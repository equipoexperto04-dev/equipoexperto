
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Star, CheckCircle2, AlertCircle, RefreshCw, Send, MessageSquare, ShieldCheck, User, Mail, Phone, ExternalLink, X } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import API_URL from '../config.js';
import { useTranslation } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { parseFilteringQuestions } from '../utils/onboarding.js';

const PublicFeedback = () => {
    const { t, language } = useTranslation();
    const publicLoadFailed = t('publicLoadFailed');
    const publicSubmitFailed = t('publicSubmitFailed');
    const publicRetry = t('publicRetry');
    const { automation_id } = useParams();
    const { pathname } = useLocation();
    const funnelKind = pathname.startsWith('/f/') ? 'f' : 'r';
    const [businessName, setBusinessName] = useState('');
    const [filteringQuestions, setFilteringQuestions] = useState([]);
    const [filteringResponses, setFilteringResponses] = useState({});
    const [status, setStatus] = useState('loading');
    const [responseMessage, setResponseMessage] = useState('');
    const [googleUrl, setGoogleUrl] = useState('');
    const [redirectCountdown, setRedirectCountdown] = useState(10);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    
    // Ratings
    const [ratingService, setRatingService] = useState(0);
    const [ratingProduct, setRatingProduct] = useState(0);
    const [ratingOverall, setRatingOverall] = useState(0);
    
    const [comment, setComment] = useState('');
    const [contactRequested] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        let interval;
        if (status === 'done_redirecting' && redirectCountdown > 0) {
            interval = setInterval(() => {
                setRedirectCountdown(prev => prev - 1);
            }, 1000);
        } else if (status === 'done_redirecting' && redirectCountdown === 0) {
            window.location.href = googleUrl;
        }
        return () => clearInterval(interval);
    }, [status, redirectCountdown, googleUrl]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/api/${funnelKind}/${automation_id}${window.location.search}`);
                const data = await res.json();
                if (data.success) {
                    setBusinessName(data.data.business_name || 'Our Valued Partner');
                    const questions = parseFilteringQuestions(data.data.filtering_questions);
                    setFilteringQuestions(questions);
                    const initial = {};
                    questions.forEach((q) => {
                        initial[q] = '';
                    });
                    setFilteringResponses(initial);
                    setStatus('ready');
                } else {
                    setStatus('error');
                    setResponseMessage(publicLoadFailed);
                }
            } catch {
                setStatus('error');
                setResponseMessage(publicLoadFailed);
            }
        };
        fetchDetails();
    }, [automation_id, funnelKind, publicLoadFailed]);

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        
        if (ratingService === 0 || ratingProduct === 0 || ratingOverall === 0) {
            showToast(t('publicFeedbackRatingError'));
            return;
        }

        if (!customerInfo.name || !customerInfo.email) {
            showToast(t('publicFeedbackContactError'));
            return;
        }

        for (const q of filteringQuestions) {
            if (!String(filteringResponses[q] || '').trim()) {
                showToast(t('publicLeadAnswerRequired') || 'Please answer all questions.');
                return;
            }
        }

        setStatus('submitting');
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const source = urlParams.get('source') || '';

            // Corrected endpoint from routes update
            const res = await fetch(`${API_URL}/api/f/${automation_id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating_service: ratingService, rating_product: ratingProduct, rating_overall: ratingOverall,
                    comment, contact_requested: contactRequested,
                    customer_name: customerInfo.name, customer_email: customerInfo.email, customer_phone: customerInfo.phone,
                    filtering_responses: filteringResponses,
                    ui_language: language || 'en',
                    source,
                })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('done');
                setResponseMessage(data.message);
                if (data.action === 'suggest_google') {
                    // We'll handle the countdown in the return section or locally here
                    setStatus('done_redirecting');
                    setGoogleUrl(data.google_url);
                }
            } else {
                setStatus('ready');
                showToast(data.message || publicSubmitFailed);
            }
        } catch {
            setStatus('ready');
            showToast(publicSubmitFailed);
        }
    };

    const StarRating = ({ value, onChange }) => (
        <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s} type="button"
                    onClick={() => onChange(s)}
                    style={{
                        background: 'none', border: 'none', padding: '0', cursor: 'pointer',
                        color: value >= s ? '#3b82f6' : '#334155', transition: 'all 0.2s ease',
                        filter: value >= s ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))' : 'none'
                    }}
                >
                    <Star size={28} fill={value >= s ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );

    const Toast = () => (
        <div style={{
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: '#1e293b', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            padding: '1rem 1.5rem', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', gap: '12px', minWidth: '320px',
            animation: 'fadeInDown 0.4s ease-out'
        }}>
            {toast.type === 'error' ? <AlertCircle style={{ color: '#ef4444' }} /> : <CheckCircle2 style={{ color: '#3b82f6' }} />}
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
            </button>
        </div>
    );

    if (status === 'loading') return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b10' }}>
            <RefreshCw size={48} className="animate-spin" style={{ color: '#3b82f6' }} />
        </div>
    );

    if (status === 'error') return (
        <div className="survey-container">
            <div className="survey-card text-center" style={{ maxWidth: '400px' }}>
                <AlertCircle size={64} style={{ color: '#ef4444', marginBottom: '1.5rem', margin: '0 auto' }} />
                <h1 className="survey-title">{t('publicErrorTitle')}</h1>
                <p className="survey-subtitle">{responseMessage}</p>
                <button onClick={() => window.location.reload()} className="submit-btn mt-8" style={{ background: '#374151' }}>{publicRetry}</button>
            </div>
        </div>
    );

    if (status === 'done_redirecting') return (
        <div className="survey-container">
            <div key="redirect-state" className="survey-card text-center">
                <span><CheckCircle2 size={64} style={{ color: '#3b82f6', marginBottom: '1.5rem', margin: '0 auto' }} /></span>
                <h1 className="survey-title">{t('publicThankYou')}</h1>
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', textAlign: 'center' }}>{responseMessage || t('publicFeedbackReceived')}</p>
                    <p style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: '700', marginTop: '1rem' }}>
                        {t('publicRedirectingGoogle', { n: redirectCountdown })}
                    </p>
                    <a 
                        href={googleUrl} 
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '1.25rem 2.5rem', background: '#3b82f6', color: '#fff',
                            borderRadius: '1rem', fontWeight: '800', textDecoration: 'none', width: '100%',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                            marginTop: '2rem'
                        }}
                    >
                        <Star size={20} fill="#fff" /> {t('publicLeaveGoogleReview')}
                    </a>
                </div>
                <div className="survey-footer">{t('poweredByEquipo')}</div>
            </div>
        </div>
    );

    if (status === 'done') return (
        <div className="survey-container">
            <div key="redirect-state" className="survey-card text-center">
                <span><CheckCircle2 size={64} style={{ color: '#3b82f6', marginBottom: '1.5rem', margin: '0 auto' }} /></span>
                <h1 className="survey-title">{t('publicThankYou')}</h1>
                <div style={{ marginBottom: '2rem' }}>{typeof responseMessage === 'string' ? <p className="survey-subtitle">{responseMessage}</p> : responseMessage}</div>
                <div className="survey-footer">{t('poweredByEquipo')}</div>
            </div>
        </div>
    );

    return (
        <div className="survey-container" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 5 }}>
                <LanguageToggle />
            </div>
            {toast.show && <Toast />}
            
            <style>
                {`
                    @keyframes fadeInDown {
                        from { opacity: 0; transform: translate(-50%, -20px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
                    }
                `}
            </style>

            <div className="survey-card">
                <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="survey-icon-wrapper" style={{ margin: '0 auto 1.5rem auto' }}>
                        <MessageSquare size={32} />
                    </div>
                    <h1 className="survey-title">{t('publicFeedbackTitle')}</h1>
                    <p className="survey-subtitle">{t('publicFeedbackSubtitle', { business: businessName })}</p>
                </header>

                <form onSubmit={submitFeedback}>
                    {filteringQuestions.length > 0 && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                {t('publicSurveyQuestions') || 'A few quick questions'}
                            </label>
                            {filteringQuestions.map((q, idx) => (
                                <div key={idx} style={{ marginBottom: idx < filteringQuestions.length - 1 ? '1rem' : 0 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                                        {q}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={filteringResponses[q] || ''}
                                        onChange={(e) =>
                                            setFilteringResponses((prev) => ({ ...prev, [q]: e.target.value }))
                                        }
                                        style={{
                                            width: '100%',
                                            background: '#0a0b10',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '0.75rem',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                        }}
                                        placeholder={t('publicLeadAnswerPlaceholder')}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="rating-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="rating-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t('publicServiceQuality')}</span>
                            <StarRating value={ratingService} onChange={setRatingService} />
                        </div>
                        <div className="rating-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t('publicProductQuality')}</span>
                            <StarRating value={ratingProduct} onChange={setRatingProduct} />
                        </div>
                        <div className="rating-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t('publicOverallExperience')}</span>
                            <StarRating value={ratingOverall} onChange={setRatingOverall} />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>{t('publicTellUsMore')}</label>
                        <textarea 
                            style={{
                                width: '100%', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '1rem', padding: '1.25rem', color: '#fff', minHeight: '120px',
                                fontSize: '0.95rem', resize: 'none'
                            }}
                            placeholder={t('publicVisitPlaceholder')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    {ratingOverall > 0 && (
                        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                                <ShieldCheck size={18} /> {t('publicContactDetails')}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input 
                                        style={{ width: '100%', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1rem 1rem 3rem', borderRadius: '0.75rem', color: '#fff' }}
                                        placeholder={t('publicLeadFullName')} value={customerInfo.name} onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})} required 
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                    <input 
                                        style={{ width: '100%', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1rem 1rem 3rem', borderRadius: '0.75rem', color: '#fff' }}
                                        type="email" placeholder={t('publicLeadEmail')} value={customerInfo.email} onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})} required 
                                    />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <PhoneInput
                                        country={'pk'}
                                        value={customerInfo.phone}
                                        onChange={(phone) => setCustomerInfo({...customerInfo, phone})}
                                        inputProps={{ name: 'phone', id: 'feedback-phone' }}
                                        enableSearch={true}
                                        searchPlaceholder={t('publicLeadSearchCountry')}
                                        containerStyle={{ width: '100%' }}
                                        inputStyle={{
                                            width: '100%',
                                            height: '48px',
                                            fontSize: '0.95rem',
                                            backgroundColor: '#0a0b10',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.75rem',
                                            color: '#fff',
                                            paddingLeft: '48px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        buttonStyle={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderRadius: '0.75rem 0 0 0.75rem',
                                            paddingLeft: '8px'
                                        }}
                                        dropdownStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.75rem',
                                            color: '#fff',
                                            zIndex: 9999
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        style={{
                            width: '100%', marginTop: '2.5rem', padding: '1.25rem', borderRadius: '1.25rem',
                            background: '#3b82f6', color: '#fff', border: 'none', fontWeight: '900',
                            fontSize: '1rem', letterSpacing: '0.1em', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            opacity: (status === 'submitting') ? 0.6 : 1,
                            boxShadow: '0 15px 30px -10px rgba(59, 130, 246, 0.4)'
                        }}
                    >
                        {status === 'submitting' ? <RefreshCw className="animate-spin" size={24} /> : (
                            <>
                                {t('publicSubmitFeedback')} <Send size={20} />
                            </>
                        )}
                    </button>
                </form>

                <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '0.7rem', color: '#4b5563', fontWeight: '700', letterSpacing: '0.2em' }}>{t('poweredByEquipo')}</p>
                </footer>
            </div>
        </div>
    );
};

export default PublicFeedback;
