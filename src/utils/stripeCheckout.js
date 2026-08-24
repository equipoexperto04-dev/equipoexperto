import API_URL from '../config.js';

async function stripeAuthFetch(path, options = {}) {
    try {
        const res = await fetch(`${API_URL}/api/stripe/${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });
        if (res.status === 401) {
            return { ok: false, code: 'login_required', data: null };
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
            return {
                ok: false,
                code: data.code || 'stripe_checkout_failed',
                message: data.message || null,
                data,
            };
        }
        return { ok: true, code: null, data };
    } catch {
        return { ok: false, code: 'network_error', data: null };
    }
}

/**
 * Starts Stripe Checkout for the given price key. Requires a valid JWT in localStorage.
 * @returns {{ ok: true }} | {{ ok: false, code: string }}
 */
export async function startStripeCheckout(priceKey, options = {}) {
    const result = await stripeAuthFetch('create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
            priceKey,
            ...(options.cancelContext ? { cancelContext: options.cancelContext } : {}),
        }),
    });
    if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
    }
    if (result.data?.url) {
        window.location.href = result.data.url;
        return { ok: true };
    }
    return { ok: false, code: 'stripe_checkout_failed' };
}

/**
 * Opens Stripe Customer Portal (cancel, update card, invoices).
 * @returns {{ ok: true }} | {{ ok: false, code: string }}
 */
export async function startStripePortal() {
    const result = await stripeAuthFetch('create-portal-session', { method: 'POST', body: '{}' });
    if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
    }
    if (result.data?.url) {
        window.location.href = result.data.url;
        return { ok: true };
    }
    return { ok: false, code: 'stripe_portal_failed' };
}

/**
 * @returns {Promise<{ configured: boolean, canManagePortal: boolean, hasStripeSubscription: boolean } | null>}
 */
export async function fetchStripeBillingStatus() {
    const result = await stripeAuthFetch('billing-status', { method: 'GET' });
    if (!result.ok || !result.data) {
        return null;
    }
    return {
        configured: !!result.data.configured,
        canManagePortal: !!result.data.canManagePortal,
        hasStripeSubscription: !!result.data.hasStripeSubscription,
    };
}
