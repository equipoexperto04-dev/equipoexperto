/**
 * Google Sign-In — implicit OAuth in a popup (opener completes session via postMessage +
 * localStorage fallback when window.opener is stripped e.g. Brave COOP).
 */

const STORAGE_STATE = 'google_oauth_state';
const STORAGE_MODE = 'google_oauth_mode'; // 'login' | 'register'
/** Set on opener while popup OAuth is in flight */
const POPUP_WAIT_KEY = 'google_oauth_popup_waiting';

const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const POPUP_POLL_MS = 250;
const POPUP_CLOSE_GRACE_MS = 350;
const POPUP_TIMEOUT_MS = 120_000;

/** Suffix on OAuth `state` — callback knows to never navigate inside this window */
export const POPUP_STATE_SUFFIX = '|popup';

/** postMessage type from /oauth/google-return popup → opener */
export const GOOGLE_OAUTH_POPUP_MSG = 'montsea-google-oauth';

/**
 * Pop-up writes here; opener listens (storage event) if postMessage is unavailable.
 * Same-origin only; cleared after read.
 */
export const GOOGLE_OAUTH_BROADCAST_KEY = 'montsea_google_oauth_broadcast_v1';

/** Redirect URI sent to Google — must match an Authorized redirect URI in Google Cloud Console. */
export function getGoogleOAuthRedirectUri() {
    const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI;
    if (typeof fromEnv === 'string' && fromEnv.trim()) {
        return fromEnv.trim().replace(/\/+$/, '');
    }
    const origin = window.location.origin.replace(/\/+$/, '');
    return `${origin}/oauth/google-return`;
}

function buildGoogleAuthorizeUrl(mode) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (typeof clientId !== 'string' || !clientId.trim()) {
        return null;
    }

    const state = `${crypto.randomUUID()}${POPUP_STATE_SUFFIX}`;
    localStorage.setItem(STORAGE_STATE, state);
    localStorage.setItem(STORAGE_MODE, mode === 'register' ? 'register' : 'login');

    const redirectUri = getGoogleOAuthRedirectUri();
    const qs = new URLSearchParams({
        client_id: clientId.trim(),
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid profile email',
        state,
        include_granted_scopes: 'true',
        prompt: 'select_account',
    });

    return `${GOOGLE_AUTHORIZE}?${qs.toString()}`;
}

function parseBroadcastPayload(ev) {
    if (ev.key !== GOOGLE_OAUTH_BROADCAST_KEY || !ev.newValue) return null;
    try {
        return JSON.parse(ev.newValue);
    } catch {
        return null;
    }
}

/** Cross-origin navigation can throw when reading popup.closed (Brave, Chrome COOP, etc.). */
function isPopupClosed(popup) {
    try {
        return !popup || popup.closed;
    } catch (e) {
        // If security blocks reading .closed, the window is still open on another origin
        return false;
    }
}

function rejectPopupClosed(finish, reject) {
    localStorage.removeItem(STORAGE_STATE);
    localStorage.removeItem(STORAGE_MODE);
    finish(reject, new Error('Sign-in window was closed.'));
}

/**
 * Opens Google OAuth in a centered popup. Resolves with { access_token, mode }.
 */
export function openGoogleOAuthPopup(mode = 'login') {
    try {
        localStorage.removeItem(GOOGLE_OAUTH_BROADCAST_KEY);
    } catch {
        /* ignore */
    }

    const url = buildGoogleAuthorizeUrl(mode);
    if (!url) {
        console.error('[Google OAuth] VITE_GOOGLE_CLIENT_ID is not set');
        return Promise.reject(new Error('Google sign-in is not configured.'));
    }

    const w = 520;
    const h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const features = [
        `popup=yes`,
        `width=${w}`,
        `height=${h}`,
        `left=${Math.max(0, Math.floor(left))}`,
        `top=${Math.max(0, Math.floor(top))}`,
        'scrollbars=yes',
        'resizable=yes',
    ].join(',');

    const popup = window.open(url, 'google_oauth', features);

    if (!popup || isPopupClosed(popup)) {
        localStorage.removeItem(STORAGE_STATE);
        localStorage.removeItem(STORAGE_MODE);
        return Promise.reject(
            new Error('Could not open sign-in window. Allow popups for this site and try again.')
        );
    }
    popup.focus();
    sessionStorage.setItem(POPUP_WAIT_KEY, '1');

    return new Promise((resolve, reject) => {
        let settled = false;
        let closeGraceTimer;

        const cleanup = () => {
            window.removeEventListener('message', onMessage);
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', onWindowFocus);
            clearInterval(pollClosed);
            clearTimeout(closeGraceTimer);
            clearTimeout(absoluteTimeout);
            sessionStorage.removeItem(POPUP_WAIT_KEY);
        };

        const finish = (fn, arg) => {
            if (settled) return;
            settled = true;
            cleanup();
            try {
                localStorage.removeItem(GOOGLE_OAUTH_BROADCAST_KEY);
            } catch {
                /* ignore */
            }
            fn(arg);
        };

        const scheduleClosedReject = () => {
            if (settled || !sessionStorage.getItem(POPUP_WAIT_KEY)) return;
            clearTimeout(closeGraceTimer);
            closeGraceTimer = setTimeout(() => {
                if (settled || !isPopupClosed(popup)) return;
                rejectPopupClosed(finish, reject);
            }, POPUP_CLOSE_GRACE_MS);
        };

        const handlePopupPayload = (d) => {
            if (!d || d.type !== GOOGLE_OAUTH_POPUP_MSG) return;
            if (settled) return;

            localStorage.removeItem(STORAGE_STATE);
            localStorage.removeItem(STORAGE_MODE);

            if (d.error) {
                finish(reject, new Error(d.error));
                return;
            }
            if (d.access_token) {
                finish(resolve, {
                    access_token: d.access_token,
                    mode: d.mode === 'register' ? 'register' : 'login',
                });
            }
        };

        const onMessage = (ev) => {
            if (ev.origin !== window.location.origin) return;
            handlePopupPayload(ev.data);
        };

        const onStorage = (ev) => {
            const d = parseBroadcastPayload(ev);
            if (d) handlePopupPayload(d);
        };

        const onWindowFocus = () => {
            if (settled || !sessionStorage.getItem(POPUP_WAIT_KEY)) return;
            if (isPopupClosed(popup)) {
                scheduleClosedReject();
            }
        };

        const pollClosed = setInterval(() => {
            if (!isPopupClosed(popup)) return;
            scheduleClosedReject();
        }, POPUP_POLL_MS);

        const absoluteTimeout = setTimeout(() => {
            if (settled) return;
            try {
                popup.close();
            } catch {
                /* ignore */
            }
            localStorage.removeItem(STORAGE_STATE);
            localStorage.removeItem(STORAGE_MODE);
            finish(reject, new Error('Sign-in timed out. Please try again.'));
        }, POPUP_TIMEOUT_MS);

        window.addEventListener('message', onMessage);
        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', onWindowFocus);
    });
}
