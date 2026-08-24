import API_URL from '../config.js';
import { removeLegacyAuthToken } from './sessionClient.js';

let installed = false;

function apiOrigin() {
    try {
        return new URL(API_URL).origin;
    } catch {
        return null;
    }
}

/**
 * Wrap global fetch once so API requests always carry cookies and never send
 * browser-stored bearer tokens.
 */
export function installFetchAccessTokenRenewal() {
    if (installed || typeof window === 'undefined') return;
    installed = true;
    removeLegacyAuthToken();

    const origin = apiOrigin();
    const nativeFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
        try {
            const urlStr =
                typeof input === 'string'
                    ? input
                    : input instanceof Request
                      ? input.url
                      : '';
            if (!urlStr) return res;

            let reqOrigin = null;
            try {
                reqOrigin = new URL(urlStr, window.location.origin).origin;
            } catch {
                return res;
            }

            const matchesApi =
                (origin && reqOrigin === origin) ||
                (!origin && typeof API_URL === 'string' && urlStr.startsWith(API_URL));

            if (!matchesApi) {
                return await nativeFetch(input, init);
            }

            const mergedHeaders = new Headers(
                input instanceof Request ? input.headers : undefined
            );
            if (init?.headers) {
                new Headers(init.headers).forEach((value, key) => {
                    mergedHeaders.set(key, value);
                });
            }
            mergedHeaders.delete('Authorization');
            mergedHeaders.delete('authorization');

            const nextInit = {
                ...init,
                credentials: 'include',
                headers: mergedHeaders,
            };

            if (input instanceof Request) {
                return await nativeFetch(new Request(input, nextInit));
            }
            return await nativeFetch(input, nextInit);
        } catch {
            return await nativeFetch(input, init);
        }
    };
}
