import { useState, useEffect, useCallback } from 'react';
import API_URL from '../config.js';

function employeeKeyFromLog(log) {
    const n = (log.automation_name || '').toLowerCase();
    const trigger = (log.trigger_type || '').toLowerCase();
    if (n.includes('review') || trigger.includes('review request')) return 'review';
    if (n.includes('capture') || n.includes('lead form')) return 'capture';
    if (n.includes('follow')) return 'followup';
    if (n.includes('import')) return 'capture';
    return null;
}

/**
 * Activity totals for employee config sidebar (Performance + last run).
 */
export function useEmployeeActivityStats(employeeKey) {
    const [stats, setStats] = useState({
        totalRuns: 0,
        successRate: 0,
        lastRun: null,
        loading: true,
    });

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/activity-logs`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!data.success) return;

            const logs = (data.logs || []).filter((log) => employeeKeyFromLog(log) === employeeKey);
            const total = logs.length;
            const success = logs.filter((l) => (l.status || '').toLowerCase() === 'success').length;
            const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

            let lastRun = null;
            for (const log of logs) {
                const ts = log.created_at || log.timestamp;
                if (!ts) continue;
                const d = new Date(ts);
                if (!lastRun || d > lastRun) lastRun = d;
            }

            setStats({ totalRuns: total, successRate, lastRun, loading: false });
        } catch (e) {
            console.error('[useEmployeeActivityStats]', e);
            setStats((s) => ({ ...s, loading: false }));
        }
    }, [employeeKey]);

    useEffect(() => {
        fetchStats();
        const onRefresh = () => fetchStats();
        window.addEventListener('activity:refresh', onRefresh);
        return () => window.removeEventListener('activity:refresh', onRefresh);
    }, [fetchStats]);

    return stats;
}
