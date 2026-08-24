import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/LanguageContext';
import './Auth.css';
import API_URL from '../config.js';
import { parseJsonResponse } from '../utils/parseJsonResponse.js';
import { getPostAuthPath } from '../utils/sessionAuth.js';
import { openGoogleOAuthPopup } from '../utils/googleOAuthRedirect.js';
import { selectedPlanFromPriceKey } from '../constants/plans.js';
import {
    mapFirebaseAuthError,
    registerWithFirebase,
    shouldRequireEmailVerification,
    shouldUseFirebaseEmailPassword,
} from '../utils/firebaseAuth.js';
import { persistAppSession } from '../utils/sessionClient.js';

const Register = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const navigate = useNavigate();

    const [selectedPlan, setSelectedPlan] = useState(() => {
        const plan = localStorage.getItem('selectedPlan');
        return plan ? JSON.parse(plan) : null;
    });

    useEffect(() => {
        const fromUrl = searchParams.get('plan');
        if (fromUrl && ['starter', 'growth', 'pro'].includes(fromUrl)) {
            const preset = selectedPlanFromPriceKey(fromUrl, t);
            if (preset) {
                setSelectedPlan(preset);
                localStorage.setItem('selectedPlan', JSON.stringify(preset));
            }
        }
    }, [searchParams, t]);

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const trialEndFormatted = trialEndDate.toLocaleDateString();

    useEffect(() => () => setGoogleLoading(false), []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        email: '',
        password: ''
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resending, setResending] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.toLowerCase().trim());
    };

    const completeSignup = (data) => {
        persistAppSession(data);

        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 30);
        localStorage.setItem('trial_end', trialEnd.toISOString());
        localStorage.setItem('mm_show_onboarding', '1');

        navigate(getPostAuthPath(data.user, { authFlow: 'signup', isNewUser: true }));
    };

    const registerWithBackend = async (otpCode = '') => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
                name: formData.full_name.trim(),
                company_name: formData.company_name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                otp: otpCode,
            })
        });
        const data = await parseJsonResponse(res);
        if (!data.success) {
            throw new Error(data.message || 'Registration failed');
        }
        return data;
    };

    const handleRequestOTP = async (e, isResend = false) => {
        if (e) e.preventDefault();
        setError('');

        if (!isValidEmail(formData.email)) {
            setError(t('registerGmailHint'));
            return;
        }

        if (formData.password.length < 8) {
            setError(t('passwordMinHint'));
            return;
        }

        if (isResend) setResending(true);
        else setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ email: formData.email.trim() })
            });
            const data = await parseJsonResponse(res);
            if (data.success) {
                setStep(2);
                if (isResend) {
                    setError(t('newCodeSent') || 'A new code has been sent.');
                }
                return;
            }
            throw new Error(data.message || 'Failed to send code.');
        } catch (err) {
            setError(mapFirebaseAuthError(err, t('networkError')));
        } finally {
            setLoading(false);
            setResending(false);
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await registerWithBackend(otp.trim());
            completeSignup(data);
        } catch (err) {
            setError(mapFirebaseAuthError(err, t('registerVerifyFailed') || 'Registration failed.'));
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValidEmail(formData.email)) {
            setError(t('registerGmailHint'));
            return;
        }

        if (formData.password.length < 8) {
            setError(t('passwordMinHint'));
            return;
        }

        setLoading(true);

        try {
            if (shouldUseFirebaseEmailPassword) {
                const data = await registerWithFirebase({
                    name: formData.full_name.trim(),
                    companyName: formData.company_name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                });
                completeSignup(data);
                return;
            }

            if (shouldRequireEmailVerification) {
                await handleRequestOTP();
                return;
            }

            const data = await registerWithBackend();
            completeSignup(data);
            return;
        } catch (err) {
            setError(mapFirebaseAuthError(err, t('registerVerifyFailed') || 'Registration failed.'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const { access_token, mode } = await openGoogleOAuthPopup('register');
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ access_token }),
            });
            const data = await parseJsonResponse(res);

            if (!data.success) {
                setError(data.message || 'Google sign-up failed.');
                return;
            }

            persistAppSession(data);

            if (data.user && data.isNewUser) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 30);
                localStorage.setItem('trial_end', trialEnd.toISOString());
                localStorage.setItem('mm_show_onboarding', '1');
            }

            navigate(
                getPostAuthPath(data.user, {
                    authFlow: data.isNewUser ? 'signup' : 'signin',
                    isNewUser: !!data.isNewUser,
                }),
                { replace: true }
            );
        } catch (err) {
            const msg = err?.message || 'Google sign-up failed.';
            if (msg !== 'Sign-in window was closed.') {
                setError(msg);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-nav">
                <Link to="/" className="auth-back-link" aria-label={t('backToLanding')}>
                    <ArrowLeft size={16} aria-hidden />
                    <span className="auth-back-text">{t('backToLanding')}</span>
                </Link>
                <div className="auth-nav-right flex items-center gap-4 md:gap-6">
                    <div className="auth-nav-brand flex items-center gap-2 min-w-0">
                        <img src="/equipoexperto.jpg" alt="" className="navbar-logo-img shrink-0" style={{ height: '32px', width: 'auto' }} />
                        <span className="auth-nav-title">{t('appTitle')}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <LanguageToggle />
                        <button className="auth-theme-toggle" onClick={toggleTheme}>
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="shadcn-auth-card animate-fade-in">
                <div className="border-beam"></div>

                <div className="shadcn-auth-header">
                    <img src="/equipoexperto.jpg" alt="Logo" className="auth-logo-img" style={{ margin: '0 auto 1.25rem auto', display: 'block', height: '40px', width: 'auto' }} />
                    <h2 className="shadcn-auth-title">{t('scaleSuccess')}</h2>
                    <p className="shadcn-auth-description">{t('joinNetwork')}</p>
                </div>

                {error && (
                    <div className="bg-danger/5 text-danger border border-danger/20 p-4 rounded-xl text-xs font-bold text-center mb-6 uppercase tracking-wider w-full">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <>
                        <div className="google-btn-wrapper mt-2 mb-4 w-full">
                            <button
                                type="button"
                                onClick={() => void handleGoogleSignIn()}
                                className="google-custom-btn w-full"
                                disabled={googleLoading || loading}
                                style={{ borderRadius: '0.5rem', padding: '10px 16px', fontSize: '13px' }}
                            >
                                {googleLoading && (
                                    <span className="wizard-spinner" style={{ marginRight: 8 }} aria-hidden />
                                )}
                                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.245 44 30 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                                </svg>
                                {googleLoading ? (t('processing') || 'Processing...') : t('googleContinue')}
                            </button>
                        </div>

                        <div className="auth-divider my-2">
                            <span>{t('orUseEmail')}</span>
                        </div>
                    </>
                )}

                {step === 1 ? (
                <form onSubmit={handleRegister} className="auth-form mt-4">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="shadcn-auth-label" htmlFor="full_name">{t('fullName')}</label>
                        <input id="full_name" type="text" className="shadcn-auth-input" placeholder="Johnathan Doe" value={formData.full_name} onChange={handleChange} required />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full mt-2">
                        <label className="shadcn-auth-label" htmlFor="company_name">{t('companyName')}</label>
                        <input id="company_name" type="text" className="shadcn-auth-input" placeholder="Acme Corp" value={formData.company_name} onChange={handleChange} required />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full mt-2">
                        <label className="shadcn-auth-label" htmlFor="email">{t('workEmail')}</label>
                        <input id="email" type="email" className="shadcn-auth-input" placeholder="name@company.com" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full mt-2">
                        <div className="flex justify-between items-center w-full">
                            <label className="shadcn-auth-label" htmlFor="password">{t('password')}</label>
                            <span className="text-[10px] opacity-40 font-bold mb-1">{t('passwordMinHint')}</span>
                        </div>
                        <div className="password-wrapper w-full">
                            <input id="password" type={showPassword ? 'text' : 'password'} className="shadcn-auth-input w-full !pr-10" placeholder="••••••••••••" value={formData.password} onChange={handleChange} required minLength="8" />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[11px] text-secondary/70 font-semibold mt-1" style={{ textAlign: 'left' }}>
                            {shouldRequireEmailVerification
                                ? t('registerGmailHint')
                                : (t('registerAccessHint') || 'Use a valid work email address for your account.')}
                        </p>
                    </div>

                    {selectedPlan && (
                        <div className="selected-plan-banner my-2">
                            <div className="plan-info">
                                <span className="plan-label">{t('selectedPlan')}:</span>
                                <span className="plan-name">{selectedPlan.name}</span>
                                <span className="plan-price">{selectedPlan.price}{selectedPlan.period}</span>
                            </div>
                            <button
                                type="button"
                                className="change-plan-btn"
                                onClick={() => {
                                    localStorage.removeItem('selectedPlan');
                                    setSelectedPlan(null);
                                    window.location.href = '/#pricing';
                                }}
                            >
                                {t('changePlan') || 'Change'}
                            </button>
                        </div>
                    )}

                    <div className="trial-hint mx-auto mt-2" style={{ textAlign: 'center' }}>
                        {selectedPlan
                            ? `${t('trialUntil')} ${trialEndFormatted} · ${t('moneyBackTerms')}`
                            : t('registerAccessHint')}
                    </div>

                    <div className="shadcn-auth-footer mt-6">
                        <button
                            type="button"
                            className="shadcn-btn-outline"
                            onClick={() => navigate('/login')}
                        >
                            {t('signIn') || 'Sign In'}
                        </button>
                        <button
                            type="submit"
                            className="shadcn-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="wizard-spinner" style={{ marginRight: 8 }} /> {t('processing') || 'Processing...'}</>
                            ) : (
                                t('startFreeTrial') || 'Start Trial'
                            )}
                        </button>
                    </div>
                </form>
                ) : (
                <form onSubmit={handleVerifyAndRegister} className="auth-form mt-4">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="shadcn-auth-label" htmlFor="otp">{t('otpCode') || 'Verification code'}</label>
                        <input
                            id="otp"
                            type="text"
                            className="shadcn-auth-input"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                        <button
                            type="button"
                            className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline mx-auto"
                            onClick={() => void handleRequestOTP(null, true)}
                            disabled={loading || resending}
                        >
                            {resending ? 'Sending...' : "Didn't get the code? Resend"}
                        </button>
                    </div>

                    <div className="shadcn-auth-footer mt-6">
                        <button
                            type="button"
                            className="shadcn-btn-outline"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            {t('back') || 'Back'}
                        </button>
                        <button
                            type="submit"
                            className="shadcn-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="wizard-spinner" style={{ marginRight: 8 }} /> {t('verifying') || 'Verifying...'}</>
                            ) : (
                                t('verify') || 'Verify'
                            )}
                        </button>
                    </div>
                </form>
                )}
            </div>

            <div className="auth-bottom-links">
                <div>© 2024 {t('appTitle')}. {t('tagline')}.</div>
                <div>
                    <Link to="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link>
                    <Link to="/terms" className="hover:text-white transition-colors">{t('termsOfService')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
