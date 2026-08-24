import { translations } from '../context/LanguageContext.jsx';

/** Maps Stripe API error codes to LanguageContext translation keys. */
const STRIPE_ERROR_KEYS = {
    stripe_not_configured: 'stripeNotConfigured',
    stripe_price_ids_missing: 'stripePriceIdsMissing',
    stripe_price_invalid: 'stripePriceIdsMissing',
    stripe_key_invalid: 'stripeNotConfigured',
    stripe_db_schema: 'stripeNotConfigured',
    stripe_invalid_plan: 'stripeInvalidPlan',
    stripe_checkout_failed: 'stripeCheckoutFailed',
    checkout_failed: 'stripeCheckoutFailed',
    stripe_session_invalid: 'stripeSessionInvalid',
    stripe_session_forbidden: 'stripeSessionForbidden',
    stripe_user_not_found: 'stripeUserNotFound',
    stripe_verify_failed: 'billingVerifyError',
    stripe_no_customer: 'stripeNoCustomer',
    stripe_portal_failed: 'stripePortalFailed',
    login_required: 'checkoutLoginRequired',
    network_error: 'networkError',
    payment_plan_missing: 'paymentPlanMissing',
    billing_missing_session: 'billingMissingSession',
};

/**
 * Resolves Stripe errors from hardcoded locale strings (not DB overrides).
 * @param {string | undefined} code
 * @param {'en' | 'es'} language
 */
export function resolveStripeError(code, language = 'en') {
    const lang = language === 'es' ? 'es' : 'en';
    const key = STRIPE_ERROR_KEYS[code] || 'stripeCheckoutFailed';
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
