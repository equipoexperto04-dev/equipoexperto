import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import API_URL from '../config.js';
import { AUTH_SESSION_CHANGED_EVENT, clearClientSession } from '../utils/sessionClient.js';

/**
 * Safe defaults before /api/stats resolves — conservative so we do not flash “unlocked” UI.
 */
export const CONSERVATIVE_ENTITLEMENTS = {
    plan: 'free',
    product_tier: 'starter',
    trial_active: true,
    marketplace_scout_included: false,
    runs_limit: 0,
    max_employees: 1,
    max_followup_sequence_steps: null,
    classified_marketplace_bulk: false,
    apollo_b2b_search: false,
    apollo_enrich: false,
};

const PlanEntitlementsContext = createContext(null);

/**
 * Billing slots consumed (matches server `countActiveEmployeesFromRows`):
 * review + capture share one row → at most one slot from that bundle.
 */
export function countActiveAutomationSlots(recipes) {
    if (!recipes) return 0;
    const reviewCaptureOn =
        !!(recipes.reviewFunnel || recipes.leadCapture);
    const followOn = !!recipes.leadFollowUp;
    return (reviewCaptureOn ? 1 : 0) + (followOn ? 1 : 0);
}

/** User is turning an automation ON (`nextActive === true`) and it was OFF — would that exceed the plan cap? */
export function turningOnWouldExceedSlotLimit(recipes, recipeKey, maxEmployees, nextActive) {
    if (!nextActive) return false;
    if (recipes?.[recipeKey]) return false;
    const max = Math.max(1, Number(maxEmployees) || 1);
    const projected = countActiveAutomationSlots({
        ...(recipes || {}),
        [recipeKey]: true,
    });
    return projected > max;
}

export function PlanEntitlementsProvider({ children }) {
    const [loading, setLoading] = useState(true);
    const [billing, setBilling] = useState(null);
    const [serverEntitlements, setServerEntitlements] = useState(null);
    /** Single /api/stats slice for dashboard UI (avoids duplicate fetches). */
    const [dashSnapshot, setDashSnapshot] = useState(null);
    const dashSnapshotRef = useRef(null);
    dashSnapshotRef.current = dashSnapshot;

    const load = useCallback(async () => {
        /** Only block UI on first hydrate; background refresh keeps the dashboard visible. */
        if (dashSnapshotRef.current === null) {
            setLoading(true);
        }
        try {
            const res = await fetch(`${API_URL}/api/stats`, {
                credentials: 'include',
            });
            if (res.status === 401) {
                clearClientSession();
                setBilling(null);
                setServerEntitlements(null);
                setDashSnapshot(null);
                return;
            }
            const data = await res.json();
            if (data.success && data.billing?.entitlements) {
                setBilling(data.billing);
                setServerEntitlements(data.billing.entitlements);
            } else {
                setBilling(data.billing || null);
                setServerEntitlements(null);
            }
            if (data.success) {
                setDashSnapshot({
                    stats: data.stats ?? null,
                    recipes: data.recipes ?? null,
                    configured: data.configured ?? null,
                    lastTriggers: data.lastTriggers ?? null,
                    pipeline: data.pipeline ?? null,
                    employeeIntroDone: data.employeeIntroDone ?? null,
                });
                if (!data.billing?.trial_active) {
                    try {
                        localStorage.removeItem('trial_end');
                    } catch {
                        /* ignore */
                    }
                }
            } else {
                setDashSnapshot(null);
            }
        } catch {
            setBilling(null);
            setServerEntitlements(null);
            setDashSnapshot(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const onRefresh = () => load();
        window.addEventListener('entitlements:refresh', onRefresh);
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onRefresh);
        return () => {
            window.removeEventListener('entitlements:refresh', onRefresh);
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onRefresh);
        };
    }, [load]);

    const value = useMemo(
        () => ({
            loading,
            billing,
            entitlements: serverEntitlements ?? CONSERVATIVE_ENTITLEMENTS,
            hasServerSnapshot: Boolean(serverEntitlements),
            dashSnapshot,
            refresh: load,
        }),
        [loading, billing, serverEntitlements, dashSnapshot, load]
    );

    return <PlanEntitlementsContext.Provider value={value}>{children}</PlanEntitlementsContext.Provider>;
}

export function usePlanEntitlements() {
    const ctx = useContext(PlanEntitlementsContext);
    if (!ctx) {
        throw new Error('usePlanEntitlements must be used inside PlanEntitlementsProvider');
    }
    return ctx;
}
