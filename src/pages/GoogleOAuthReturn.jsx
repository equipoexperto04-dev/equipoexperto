import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config.js';
import { parseJsonResponse } from '../utils/parseJsonResponse.js';
import { getPostAuthPath } from '../utils/sessionAuth.js';
import { persistAppSession } from '../utils/sessionClient.js';
import {
    GOOGLE_OAUTH_POPUP_MSG,
    GOOGLE_OAUTH_BROADCAST_KEY,
    POPUP_STATE_SUFFIX,
} from '../utils/googleOAuthRedirect.js';
import './Auth.css';

const STORAGE_STATE = 'google_oauth_state';
const STORAGE_MODE = 'google_oauth_mode';

function readOAuthStorage(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function clearOAuthStorage() {
    [localStorage, sessionStorage].forEach((store) => {
        store.removeItem(STORAGE_STATE);
        store.removeItem(STORAGE_MODE);
    });
}

function isPopupOAuthState(state) {
    return typeof state === 'string' && state.endsWith(POPUP_STATE_SUFFIX);
}

function broadcastToOpener(payload) {
    try {
        localStorage.setItem(GOOGLE_OAUTH_BROADCAST_KEY, JSON.stringify(payload));
    } catch {
        /* ignore */
    }
}

function notifyOpenerOAuthError(msg) {
    const payload = { type: GOOGLE_OAUTH_POPUP_MSG, error: msg };
    if (window.opener && !window.opener.closed) {
        try {
            window.opener.postMessage(payload, window.location.origin);
        } catch {
            /* Brave / COOP may block opener */
        }
    }
    broadcastToOpener(payload);
}

function notifyOpenerOAuthSuccess(access_token, mode) {
    const payload = {
        type: GOOGLE_OAUTH_POPUP_MSG,
        access_token,
        mode: mode === 'register' ? 'register' : 'login',
    };
    if (window.opener && !window.opener.closed) {
        try {
            window.opener.postMessage(payload, window.location.origin);
        } catch {
            /* ignore */
        }
    }
    broadcastToOpener(payload);
}

function closePopupSoon() {
    clearOAuthStorage();
    setTimeout(() => {
        try {
            window.close();
        } catch {
            /* ignore */
        }
    }, 80);
}

/**
 * OAuth2 implicit-grant return: popup → postMessage + localStorage, then close;
 * same-tab flow only when state is not a popup flow.
 */
export default function GoogleOAuthReturn() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('working');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
        const params = new URLSearchParams(hash);
        const err = params.get('error');
        const errDesc = params.get('error_description');
        const returnedState = params.get('state');
        const storedState = readOAuthStorage(STORAGE_STATE);
        const popupFlow =
            isPopupOAuthState(returnedState) ||
            isPopupOAuthState(storedState) ||
            window.name === 'google_oauth';
        const access_token = params.get('access_token');
        const expected = readOAuthStorage(STORAGE_STATE);
        const mode = readOAuthStorage(STORAGE_MODE) || 'login';

        const clearFragment = () => {
            const path = window.location.pathname + window.location.search;
            window.history.replaceState(null, '', path || '/oauth/google-return');
        };

        /** Popup: never navigate inside this window — always hand off to opener and close. */
        if (popupFlow) {
            clearFragment();

            if (err) {
                const msg = errDesc?.replace(/\+/g, ' ') || err;
                notifyOpenerOAuthError(msg);
                closePopupSoon();
                return;
            }

            if (!access_token) {
                notifyOpenerOAuthError('Sign-in was cancelled or incomplete. Please try again.');
                closePopupSoon();
                return;
            }

            if (returnedState && expected && returnedState !== expected) {
                notifyOpenerOAuthError('Sign-in could not be verified. Please try again.');
                closePopupSoon();
                return;
            }

            notifyOpenerOAuthSuccess(access_token, mode);
            closePopupSoon();
            return;
        }

        if (err) {
            clearFragment();
            setStatus('error');
            setMessage(errDesc?.replace(/\+/g, ' ') || err);
            setTimeout(() => navigate('/login', { replace: true }), 2500);
            return;
        }

        if (!access_token) {
            clearFragment();
            clearOAuthStorage();
            navigate('/login', { replace: true });
            return;
        }

        if (returnedState && expected && returnedState !== expected) {
            clearFragment();
            clearOAuthStorage();
            setStatus('error');
            setMessage('Sign-in could not be verified. Please try again.');
            setTimeout(() => navigate('/login', { replace: true }), 2500);
            return;
        }

        clearFragment();
        clearOAuthStorage();

        (async () => {
            try {
                const res = await fetch(`${API_URL}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ access_token }),
                });
                const data = await parseJsonResponse(res);

                if (!data.success) {
                    setStatus('error');
                    setMessage(data.message || 'Google sign-in failed.');
                    setTimeout(() => navigate(mode === 'register' ? '/register' : '/login', { replace: true }), 2500);
                    return;
                }

                persistAppSession(data);
                if (data.user && data.isNewUser) {
                    const trialEnd = new Date();
                    trialEnd.setDate(trialEnd.getDate() + 14);
                    localStorage.setItem('trial_end', trialEnd.toISOString());
                    localStorage.setItem('mm_show_onboarding', '1');
                }
                navigate(
                    getPostAuthPath(data.user, {
                        authFlow: data.isNewUser ? 'signup' : 'signin',
                        isNewUser: !!data.isNewUser,
                    }),
                    { replace: true }
                );
            } catch {
                setStatus('error');
                setMessage('Network error. Please try again.');
                setTimeout(() => navigate('/login', { replace: true }), 2500);
            }
        })();
    }, [navigate]);

    const isPopup = typeof window !== 'undefined' && window.name === 'google_oauth';

    return (
        <div className="auth-container" style={{ minHeight: '50vh', justifyContent: 'center' }}>
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {status === 'working' && (
                    <>
                        <p style={{ margin: 0, fontWeight: 700 }}>
                            {isPopup ? 'Completing sign-in…' : 'Signing you in…'}
                        </p>
                        <p className="auth-subtitle" style={{ marginTop: '0.75rem' }}>
                            {isPopup ? 'You can close this window if it does not close automatically.' : 'Please wait.'}
                        </p>
                    </>
                )}
                {status === 'error' && message && (
                    <>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--danger)' }}>{message}</p>
                        <p className="auth-subtitle" style={{ marginTop: '0.75rem' }}>
                            <Link to="/login" className="text-accent">Back to login</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
