import API_URL from '../config.js';

let installed = false;

function apiOrigin() {
    try {
        return new URL(API_URL).origin;
    } catch {
        return null;
    }
}

/**
 * Wrap global fetch once so API requests to API_URL always carry credentials
 * and attach Bearer token fallback from localStorage if present.
 */
export function installFetchAccessTokenRenewal() {
    if (installed || typeof window === 'undefined') return;
    installed = true;

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
            if (!urlStr) return await nativeFetch(input, init);

            let reqOrigin = null;
            try {
                reqOrigin = new URL(urlStr, window.location.origin).origin;
            } catch {
                return await nativeFetch(input, init);
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

            const token = localStorage.getItem('token');
            if (token && !mergedHeaders.has('Authorization') && !mergedHeaders.has('authorization')) {
                mergedHeaders.set('Authorization', `Bearer ${token}`);
            }

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
