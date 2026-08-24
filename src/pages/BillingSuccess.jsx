import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import API_URL from '../config.js';
import { resolveStripeError } from '../utils/stripeErrors';
import { cacheUserProfile, persistAppSession, readCachedUserProfile } from '../utils/sessionClient.js';

const BillingSuccess = () => {
    const { t, language } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [state, setState] = useState({ loading: true, errorCode: null, paid: false });

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
            setState({ loading: false, errorCode: 'billing_missing_session', paid: false });
            return;
        }

        (async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                    }
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.success) {
                    setState({
                        loading: false,
                        errorCode: data.code || 'stripe_verify_failed',
                        paid: false,
                    });
                    return;
                }
                if (data.user) {
                    cacheUserProfile(data.user);
                }
                localStorage.removeItem('trial_end');
                persistAppSession({ user: data.user || readCachedUserProfile() });
                window.dispatchEvent(new CustomEvent('entitlements:refresh'));
                setState({ loading: false, errorCode: null, paid: !!data.paid });
                if (data.paid) {
                    localStorage.setItem('mm_show_onboarding', '1');
                    setTimeout(() => navigate('/dashboard?onboard=1'), 2200);
                }
            } catch {
                setState({ loading: false, errorCode: 'network_error', paid: false });
            }
        })();
    }, [searchParams, navigate, t]);

    const errorMessage = state.errorCode ? resolveStripeError(state.errorCode, language) : null;

    return (
        <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="auth-card animate-fade-in" style={{ maxWidth: 440, textAlign: 'center' }}>
                {state.loading && (
                    <>
                        <Loader2 className="animate-spin mx-auto mb-4" size={40} aria-hidden />
                        <p className="text-secondary font-semibold">{t('billingConfirming')}</p>
                    </>
                )}
                {!state.loading && errorMessage && (
                    <>
                        <AlertCircle className="mx-auto mb-4 text-amber-500" size={40} aria-hidden />
                        <h1 className="text-xl font-black text-white mb-2">{t('billingVerifyError')}</h1>
                        <p className="text-secondary text-sm mb-6">{errorMessage}</p>
                        <Link to="/dashboard/settings?tab=billing" className="text-accent font-bold underline">
                            {t('tabBilling')}
                        </Link>
                    </>
                )}
                {!state.loading && !errorMessage && state.paid && (
                    <>
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <CheckCircle2 className="text-emerald-500" size={40} aria-hidden />
                        </div>
                        <h1 className="text-xl font-black text-white mb-2">{t('billingSuccessTitle')}</h1>
                        <p className="text-secondary text-sm mb-4">{t('billingSuccessBody')}</p>
                        <p className="text-xs text-secondary/70">{t('billingRedirecting')}</p>
                    </>
                )}
                {!state.loading && !errorMessage && !state.paid && (
                    <>
                        <AlertCircle className="mx-auto mb-4 text-amber-500" size={40} aria-hidden />
                        <h1 className="text-xl font-black text-white mb-2">{t('billingPendingTitle')}</h1>
                        <p className="text-secondary text-sm mb-6">{t('billingPendingBody')}</p>
                        <Link to="/dashboard/settings?tab=billing" className="text-accent font-bold underline">
                            {t('tabBilling')}
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default BillingSuccess;
