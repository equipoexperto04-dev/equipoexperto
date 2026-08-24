import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CHECKOUT_PRICE_KEYS } from '../constants/plans.js';
import {
    AUTH_SESSION_CHANGED_EVENT,
    fetchCurrentUserProfile,
    readCachedUserProfile,
} from '../utils/sessionClient.js';

function readCachedUser() {
    try {
        const raw = localStorage.getItem('user_profile');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function checkoutRedirectPath() {
    try {
        const raw = localStorage.getItem('selectedPlan');
        if (raw) {
            const plan = JSON.parse(raw);
            if (plan?.planKey && CHECKOUT_PRICE_KEYS.includes(plan.planKey)) {
                return `/checkout/${plan.planKey}`;
            }
        }
    } catch {
        /* ignore */
    }
    return '/checkout/starter';
}

/**
 * Nested guard: authenticated users without a Stripe subscription are sent to checkout.
 */
const RequireSubscription = () => {
    const location = useLocation();
    const [user, setUser] = useState(readCachedUser);
    const [checking, setChecking] = useState(
        () => !Object.prototype.hasOwnProperty.call(readCachedUser() || {}, 'has_dashboard_access')
    );

    useEffect(() => {
        let cancelled = false;
        const sync = async () => {
            const cached = readCachedUserProfile();
            if (!cancelled && cached) setUser(cached);
            const fresh = await fetchCurrentUserProfile();
            if (!cancelled && fresh) setUser(fresh);
            if (!cancelled) setChecking(false);
        };
        void sync();
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, sync);

        return () => {
            cancelled = true;
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, sync);
        };
    }, []);

    if (checking) {
        return (
            <div
                className="dashboard-page flex items-center justify-center"
                style={{ minHeight: '40vh' }}
                aria-busy="true"
            >
                <p className="text-secondary font-semibold">Loading…</p>
            </div>
        );
    }

    if (user?.is_admin || user?.has_dashboard_access) {
        return <Outlet />;
    }

    return (
        <Navigate
            to={checkoutRedirectPath()}
            replace
            state={{ from: location.pathname }}
        />
    );
};

export default RequireSubscription;
