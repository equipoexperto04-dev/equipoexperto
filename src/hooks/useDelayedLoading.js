import { useEffect, useRef, useState } from 'react';

/**
 * Shows loading UI only after `delayMs` (default 1s) so fast requests never flash a spinner.
 * @param {boolean} busy - true while an async action is in flight
 * @param {number} [delayMs=1000]
 * @returns {boolean} showLoading
 */
export function useDelayedLoading(busy, delayMs = 1000) {
    const [showLoading, setShowLoading] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (!busy) {
            setShowLoading(false);
            return undefined;
        }
        timerRef.current = setTimeout(() => setShowLoading(true), delayMs);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [busy, delayMs]);

    return showLoading;
}

/**
 * Wrap an async function: returns [run, busy, showLoading].
 */
export function useDelayedAsyncAction(asyncFn, delayMs = 1000) {
    const [busy, setBusy] = useState(false);
    const showLoading = useDelayedLoading(busy, delayMs);

    const run = async (...args) => {
        setBusy(true);
        try {
            return await asyncFn(...args);
        } finally {
            setBusy(false);
        }
    };

    return [run, busy, showLoading];
}
