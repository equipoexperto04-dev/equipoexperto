import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Crown,
    Loader2,
    Lock,
    Rocket,
    ShieldCheck,
    Sun,
    Moon,
    Zap,
} from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import AcceptedPaymentMethods from '../components/checkout/AcceptedPaymentMethods';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import { CHECKOUT_PRICE_KEYS, selectedPlanFromPriceKey } from '../constants/plans';
import { startStripeCheckout } from '../utils/stripeCheckout';
import { resolveStripeError } from '../utils/stripeErrors';
import {
    AUTH_SESSION_CHANGED_EVENT,
    fetchCurrentUserProfile,
    readCachedUserProfile,
} from '../utils/sessionClient.js';
import './Auth.css';
import './Checkout.css';

const PLAN_FEATURES = {
    starter: ['plan1Employee', 'waIncluded50', 'standardLeadCap', 'basicAnalytics'],
    growth: ['plan2Employees', 'waIncludedHigh', 'advancedLeadScoring', 'prioritySupport'],
    pro: ['plan3Employees', 'waIncludedUnlim', 'fullLeadHub', 'whiteLabelReports'],
};

function PlanIcon({ planKey }) {
    switch (planKey) {
        case 'growth':
            return <Rocket className="text-accent" size={28} aria-hidden />;
        case 'pro':
            return <Crown className="text-yellow-500" size={28} aria-hidden />;
        default:
            return <Zap className="text-secondary" size={28} aria-hidden />;
    }
}

const Checkout = () => {
    const { planKey } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { toast } = useToast();

    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [errorCode, setErrorCode] = useState('');
    const [checkoutDetailError, setCheckoutDetailError] = useState('');

    const isValidPlan = CHECKOUT_PRICE_KEYS.includes(planKey);
    const plan = useMemo(
        () => (isValidPlan ? selectedPlanFromPriceKey(planKey, t) : null),
        [isValidPlan, planKey, t],
    );

    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(readCachedUserProfile()));
    const [authResolved, setAuthResolved] = useState(() => Boolean(readCachedUserProfile()));
    const fromSettings = searchParams.get('from') === 'settings';
    const backHref = fromSettings ? '/dashboard/settings?tab=billing' : '/#pricing';

    useEffect(() => {
        let cancelled = false;
        const sync = async () => {
            const cached = readCachedUserProfile();
            if (!cancelled && cached) setIsAuthenticated(true);
            const user = await fetchCurrentUserProfile();
            if (cancelled) return;
            setIsAuthenticated(Boolean(user || cached));
            setAuthResolved(true);
        };
        void sync();
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
        return () => {
            cancelled = true;
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
        };
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (searchParams.get('cancelled') === '1') {
            toast(t('checkoutCancelledToast'), 'warning');
            const next = new URLSearchParams(searchParams);
            next.delete('cancelled');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams, t, toast]);

    useEffect(() => {
        if (plan) {
            localStorage.setItem('selectedPlan', JSON.stringify(plan));
        }
    }, [plan]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const errorMessage = checkoutDetailError || (errorCode ? resolveStripeError(errorCode, language) : '');

    const handlePay = async () => {
        setErrorCode('');
        setCheckoutDetailError('');
        if (!plan?.planKey) {
            setErrorCode('payment_plan_missing');
            return;
        }

        if (!isAuthenticated) {
            navigate(`/register?plan=${encodeURIComponent(plan.planKey)}`);
            return;
        }

        setIsRedirecting(true);
        const result = await startStripeCheckout(plan.planKey, {
            cancelContext: fromSettings ? 'settings' : undefined,
        });
        if (!result.ok) {
            setErrorCode(result.code || 'stripe_checkout_failed');
            if (result.message) {
                setCheckoutDetailError(result.message);
            }
            setIsRedirecting(false);
        }
    };

    if (!isValidPlan || !plan) {
        return (
            <div className="auth-container">
                <div className="checkout-page checkout-invalid">
                    <h1>{t('paymentPlanMissing')}</h1>
                    <p>{t('checkoutInvalidPlan')}</p>
                    <Link
                        to="/#pricing"
                        className="checkout-primary-btn"
                        style={{ display: 'inline-flex', width: 'auto', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
                    >
                        {t('checkoutViewPlans')}
                    </Link>
                </div>
            </div>
        );
    }

    const features = (PLAN_FEATURES[plan.planKey] || []).map((key) => t(key));

    return (
        <div className="auth-container">
            <div className="checkout-topbar">
                <Link to={backHref} className="checkout-back">
                    <ArrowLeft size={18} aria-hidden />
                    {fromSettings ? t('checkoutBackBilling') : t('checkoutBackPricing')}
                </Link>
                <span className="checkout-brand">Equipo Experto</span>
                <div className="auth-controls" style={{ display: 'flex', gap: '0.5rem' }}>
                    <LanguageToggle />
                    <button
                        type="button"
                        className="auth-theme-toggle"
                        onClick={toggleTheme}
                        aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                </div>
            </div>

            <main className="checkout-page" id="checkout-main">
                <div className="checkout-grid">
                    <aside className="checkout-panel checkout-summary" aria-labelledby="checkout-summary-title">
                        <p className="checkout-summary-label">{t('checkoutOrderSummary')}</p>
                        <div className="checkout-plan-header">
                            <div className="checkout-plan-icon">
                                <PlanIcon planKey={plan.planKey} />
                            </div>
                            <div>
                                <h1 id="checkout-summary-title" className="checkout-plan-name">
                                    {plan.name}
                                </h1>
                                <p className="checkout-plan-price">
                                    {plan.price}
                                    <span className="checkout-plan-period">{plan.period}</span>
                                </p>
                            </div>
                        </div>

                        <ul className="checkout-features">
                            {features.map((feature) => (
                                <li key={feature} className="checkout-feature">
                                    <Check size={16} aria-hidden />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="checkout-guarantee">
                            <ShieldCheck size={20} className="text-green-600" aria-hidden />
                            <p>{t('moneyBackTerms')}</p>
                        </div>
                    </aside>

                    <section className="checkout-panel checkout-payment" aria-labelledby="checkout-payment-title">
                        <h2 id="checkout-payment-title" className="checkout-payment-title">
                            {t('checkoutPaymentTitle')}
                        </h2>
                        <p className="checkout-payment-sub">{t('checkoutPaymentSub')}</p>

                        <div className="checkout-trial-notice" role="note">
                            <p className="checkout-trial-lead">{t('checkoutTrialNoCharge')}</p>
                            <p>{t('checkoutTrialAfter30')}</p>
                            <p className="checkout-trial-muted">
                                {t('checkoutTrialSecure')}{' '}
                                <Link to="/privacy">{t('privacyPolicy')}</Link>
                            </p>
                            <p className="checkout-trial-muted">{t('checkoutTrialComms')}</p>
                        </div>

                        <div className="checkout-secure-banner">
                            <Lock size={18} className="text-green-600" aria-hidden />
                            <span>{t('stripeSecureNotice')}</span>
                        </div>

                        {errorMessage && (
                            <p className="checkout-error" role="alert">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="button"
                            className="checkout-primary-btn"
                            onClick={() => void handlePay()}
                            disabled={isRedirecting}
                        >
                            {isRedirecting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" aria-hidden />
                                    {t('stripeRedirecting')}
                                </>
                            ) : (
                                <>{isAuthenticated ? t('stripePayButton') : t('stripeRegisterToPay')}</>
                            )}
                        </button>

                        {!isAuthenticated && authResolved && (
                            <p className="checkout-auth-hint">
                                {t('alreadyAccount')}{' '}
                                <Link to={`/login?redirect=${encodeURIComponent(`/checkout/${plan.planKey}`)}`}>
                                    {t('signIn')}
                                </Link>
                            </p>
                        )}

                        <p className="checkout-terms">{t('checkoutLegalNotice')}</p>

                        <AcceptedPaymentMethods />
                    </section>
                </div>
            </main>

            <style>{`
                .animate-spin { animation: checkout-spin 1s linear infinite; }
                @keyframes checkout-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) {
                    .animate-spin { animation: none; }
                }
            `}</style>
        </div>
    );
};

export default Checkout;
