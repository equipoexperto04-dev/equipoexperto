import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/LanguageContext';
import './Auth.css';
import {
    loginWithFirebase,
    mapFirebaseAuthError,
    shouldUseFirebaseEmailPassword,
} from '../utils/firebaseAuth.js';
import API_URL from '../config.js';
import { parseJsonResponse } from '../utils/parseJsonResponse.js';
import { getPostAuthPath } from '../utils/sessionAuth.js';
import { openGoogleOAuthPopup } from '../utils/googleOAuthRedirect.js';
import { persistAppSession } from '../utils/sessionClient.js';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const loginWithBackend = async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({ email, password })
        });
        const data = await parseJsonResponse(res);
        if (!data.success) {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = shouldUseFirebaseEmailPassword
                ? await loginWithFirebase(email, password)
                : await loginWithBackend();
            persistAppSession(data);
            const redirect = searchParams.get('redirect');
            const safeRedirect =
                redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null;
            navigate(safeRedirect || getPostAuthPath(data.user, { authFlow: 'signin' }));
        } catch (err) {
            setError(mapFirebaseAuthError(err, 'Login failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams.get('session') === 'expired') {
            setError(t('loginSessionExpired'));
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams, t]);

    useEffect(() => {
        if (searchParams.get('google') === 'alreadyRegistered') {
            setError(
                t('accountAlreadyRegistered') ||
                    'This Google account is already registered. Sign in below or use email.'
            );
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams, t]);

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const { access_token } = await openGoogleOAuthPopup('login');
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ access_token }),
            });
            const data = await parseJsonResponse(res);

            if (!data.success) {
                setError(data.message || 'Google sign-in failed.');
                return;
            }

            persistAppSession(data);
            navigate(getPostAuthPath(data.user, { authFlow: 'signin' }), { replace: true });
        } catch (err) {
            const msg = err?.message || 'Google sign-in failed.';
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
                {/* Border Beam */}
                <div className="border-beam"></div>

                <div className="shadcn-auth-header">
                    <img src="/equipoexperto.jpg" alt="Logo" className="auth-logo-img" style={{ margin: '0 auto 1.25rem auto', display: 'block', height: '40px', width: 'auto' }} />
                    <h2 className="shadcn-auth-title">{t('welcomeBack')}</h2>
                    <p className="shadcn-auth-description">{t('accessDashboard')}</p>
                </div>

                {error && (
                    <div className="bg-danger/5 text-danger border border-danger/20 p-4 rounded-xl text-xs font-bold text-center mb-6 uppercase tracking-wider w-full">
                        {error}
                    </div>
                )}

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

                <form onSubmit={handleLogin} className="auth-form mt-4">
                    <div className="flex flex-col gap-1.5 w-full">
                        <label className="shadcn-auth-label" htmlFor="email">{t('workEmail')}</label>
                        <input
                            id="email"
                            type="email"
                            className="shadcn-auth-input"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full mt-2">
                        <div className="flex justify-between items-center w-full">
                            <label className="shadcn-auth-label" htmlFor="password">{t('password')}</label>
                            <Link to="/forgot-password" className="text-[10px] text-accent font-bold uppercase tracking-widest hover:underline">{t('forgotPassword')}</Link>
                        </div>
                        <div className="password-wrapper w-full">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="shadcn-auth-input w-full !pr-10"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Footer buttons inside the form */}
                    <div className="shadcn-auth-footer mt-6">
                        <button
                            type="button"
                            className="shadcn-btn-outline"
                            onClick={() => navigate('/register')}
                        >
                            {t('registerLabel') || 'Register'}
                        </button>
                        <button
                            type="submit"
                            className="shadcn-btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="wizard-spinner" style={{ marginRight: 8 }} /> {t('processing') || 'Processing...'}</>
                            ) : (
                                t('signIn') || 'Login'
                            )}
                        </button>
                    </div>
                </form>
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

export default Login;
