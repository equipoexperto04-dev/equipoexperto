// Central API — set VITE_API_URL on your frontend build (e.g. Cloudflare Pages).
const fromEnv = typeof import.meta.env.VITE_API_URL === 'string'
    ? import.meta.env.VITE_API_URL.trim()
    : '';

const DEV_DEFAULT = 'http://localhost:5000';
/** If VITE_API_URL is missing in production, relative URLs like /auth/login hit the static host and fail. */
const PROD_DEFAULT = 'https://api.equipoexperto.com';

const API_URL = fromEnv || (import.meta.env.DEV ? DEV_DEFAULT : PROD_DEFAULT);

if (!fromEnv && import.meta.env.PROD) {
    console.warn(
        '[config] VITE_API_URL is not set at build time; using default API base. Set VITE_API_URL on your host if the API is elsewhere.'
    );
}

export default API_URL;
