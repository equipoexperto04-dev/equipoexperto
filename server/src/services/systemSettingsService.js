import pool from '../db/pool.js';

let cache = {};
let lastFetch = 0;
const CACHE_TTL_MS = 5000;

/**
 * Retrieve a system setting by key, cached briefly in memory.
 * @param {string} key
 * @param {string|null} defaultValue
 * @returns {Promise<string|null>}
 */
export async function getSystemSetting(key, defaultValue = null) {
    const now = Date.now();
    if (cache[key] !== undefined && now - lastFetch < CACHE_TTL_MS) {
        return cache[key];
    }

    try {
        const res = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
        const val = res.rows[0]?.value ?? defaultValue;
        cache[key] = val;
        lastFetch = now;
        return val;
    } catch {
        return defaultValue;
    }
}

/**
 * Set a system setting by key and immediately update cache.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<string>}
 */
export async function setSystemSetting(key, value) {
    const strVal = String(value);
    await pool.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, strVal]
    );
    cache[key] = strVal;
    lastFetch = Date.now();
    return strVal;
}
