/** Parse activity_logs.metadata (object or JSON string). */
export function parseActivityMetadata(log) {
    let meta = log?.metadata;
    if (meta == null) return {};
    if (typeof meta === 'string') {
        try {
            meta = JSON.parse(meta);
        } catch {
            return {};
        }
    }
    return typeof meta === 'object' ? meta : {};
}

/** Folder name for import / batch logs — metadata first, then detail text. */
export function getActivityFolderName(log) {
    const meta = parseActivityMetadata(log);
    if (meta.folder && String(meta.folder).trim()) {
        return String(meta.folder).trim();
    }
    const detail = String(log?.detail || '');
    const added = detail.match(/(\d+)\s+contact(?:\(s\)|s)?\s+added to\s+(.+)$/i);
    if (added) return added[2].trim();
    const enAlt = detail.match(/added to\s+(.+)$/i);
    if (enAlt) return enAlt[1].trim();
    return null;
}

/** Lead IDs stored on import batch logs (exact records from that import). */
export function getActivityLeadIds(log) {
    const meta = parseActivityMetadata(log);
    if (!Array.isArray(meta.lead_ids)) return null;
    const ids = meta.lead_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
    return ids.length > 0 ? ids : null;
}

/** Whether this log should open the contacts list for a folder / import batch. */
export function isActivityFolderLog(log) {
    const folder = getActivityFolderName(log);
    if (!folder) return false;

    if (getActivityLeadIds(log)) return true;

    const trigger = String(log?.trigger_type || '').toLowerCase();
    const name = String(log?.automation_name || '').toLowerCase();
    const detail = String(log?.detail || '').toLowerCase();

    return (
        trigger.includes('contact import') ||
        trigger.includes('review request') ||
        name.includes('lead import') ||
        name.includes('review funnel') ||
        name.includes('lead capture') ||
        detail.includes('added to') ||
        /contact(?:\(s\)|s)?\s+added/.test(detail)
    );
}

export function getLeadsFolderPath(folderName, leadIds = null) {
    const folder = encodeURIComponent(folderName);
    const params = new URLSearchParams({ folder });
    if (leadIds?.length) {
        params.set('ids', leadIds.join(','));
    }
    return `/dashboard/leads?${params.toString()}`;
}
