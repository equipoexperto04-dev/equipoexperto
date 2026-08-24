/** Client-side JWT exp check — does not verify signature (server remains source of truth). */
export function isAccessTokenProbablyExpired(token) {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const json = atob(padded);
        const payload = JSON.parse(json);
        const expSec = typeof payload.exp === 'number' ? payload.exp : null;
        if (expSec === null) return false;
        return Date.now() / 1000 >= expSec - 30;
    } catch {
        return false;
    }
}

import { CHECKOUT_PRICE_KEYS } from '../constants/plans.js';

function readSelectedPlanCheckoutPath() {
    try {
        const raw = localStorage.getItem('selectedPlan');
        if (!raw) return null;
        const plan = JSON.parse(raw);
        if (plan?.planKey && CHECKOUT_PRICE_KEYS.includes(plan.planKey)) {
            return `/checkout/${plan.planKey}`;
        }
    } catch {
        /* ignore invalid JSON */
    }
    return null;
}

/**
 * Where to send the user after auth.
 * @param {object} user — API user object (is_admin, has_dashboard_access)
 * @param {{ authFlow?: 'signin'|'signup', planKey?: string, isNewUser?: boolean }} options
 */
export function getPostAuthPath(user, options = {}) {
    const authFlow =
        options.authFlow === 'signup' || options.isNewUser === true ? 'signup' : 'signin';

    // Returning users (including admins) go straight to the dashboard
    if (authFlow === 'signin') {
        return '/dashboard';
    }

    if (options.planKey && CHECKOUT_PRICE_KEYS.includes(options.planKey)) {
        return `/checkout/${options.planKey}`;
    }

    const fromStorage = readSelectedPlanCheckoutPath();
    if (fromStorage) return fromStorage;

    if (user?.has_dashboard_access === false) {
        return '/checkout/starter';
    }

    return '/dashboard?onboard=1';
}
