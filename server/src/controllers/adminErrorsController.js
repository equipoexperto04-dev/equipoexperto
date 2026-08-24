import { listErrorEvents, markErrorResolved, bulkResolveErrors, countOpenErrorEvents } from '../services/errorLogService.js';
import pool from '../db/pool.js';

export async function getErrors(req, res) {
    try {
        const { q, level, limit, offset, includeStale, includeResolved, dedupe, summary } = req.query || {};
        const openOnly = includeResolved !== 'true';
        const rows = await listErrorEvents({
            q,
            level: level && level !== 'all' ? level : null,
            limit: Number(limit) || 200,
            offset: Number(offset) || 0,
            openOnly,
            includeStale: includeStale === 'true',
            dedupe: dedupe !== 'false',
        });
        const payload = { success: true, errors: rows };
        if (summary === 'true') {
            payload.openCount = await countOpenErrorEvents();
        }
        return res.status(200).json(payload);
    } catch (e) {
        console.error('[AdminErrors] list failed:', e.message);
        return res.status(500).json({ success: false, message: 'Could not fetch errors' });
    }
}

export async function resolveError(req, res) {
    try {
        const { id } = req.params;
        const { resolved = true } = req.body || {};
        await markErrorResolved(id, Boolean(resolved));
        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('[AdminErrors] resolve failed:', e.message);
        return res.status(500).json({ success: false, message: 'Could not update error status' });
    }
}

/** POST /api/admin/errors/resolve-bulk — clear noise (optional ?code=EBADCSRFTOKEN) */
export async function resolveErrorsBulk(req, res) {
    try {
        const { code, allOpen } = req.body || {};
        const count = await bulkResolveErrors({
            code: code || null,
            onlyOpen: allOpen !== false,
        });
        return res.status(200).json({ success: true, resolved: count });
    } catch (e) {
        console.error('[AdminErrors] bulk resolve failed:', e.message);
        return res.status(500).json({ success: false, message: 'Could not bulk-update errors' });
    }
}

export async function getAdminUsers(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.status, 
                u.created_at, 
                u.plan, 
                u.trial_ends_at,
                COALESCE(
                    (SELECT 
                        (CASE WHEN is_active = true THEN 1 ELSE 0 END) + 
                        (CASE WHEN lead_capture_active = true THEN 1 ELSE 0 END)
                     FROM review_funnel_settings 
                     WHERE user_id = u.id), 0
                ) + 
                COALESCE(
                    (SELECT CASE WHEN is_active = true THEN 1 ELSE 0 END 
                     FROM lead_followup_settings 
                     WHERE user_id = u.id), 0
                ) AS active_recipes
             FROM users u
             ORDER BY u.created_at DESC
             LIMIT 200`
        );
        return res.status(200).json({ success: true, users: result.rows });
    } catch (e) {
        console.error('[AdminUsers] list failed:', e.message);
        return res.status(500).json({ success: false, message: 'Could not fetch users' });
    }
}

export async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { active } = req.body; // boolean
        const status = active ? 'active' : 'inactive';
        await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2',
            [status, id]
        );
        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('[AdminUsers] status update failed:', e.message);
        return res.status(500).json({ success: false, message: 'Could not update user status' });
    }
}
