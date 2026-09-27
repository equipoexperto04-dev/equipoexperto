import pool from '../db/pool.js';

/**
 * GET /api/employee-metrics/summary
 * Returns aggregated employee-level metrics for reviews, lead scoring, and follow-ups.
 */
export const getEmployeeMetricsSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { employeeId, startDate, endDate } = req.query;

        let empFilterSql = '';
        let queryParams = [userId];

        if (employeeId) {
            queryParams.push(employeeId);
            empFilterSql = `AND employee_id = $${queryParams.length}`;
        }

        // 1. QR Scan Count
        const qrScansResult = await pool.query(
            `SELECT COUNT(*)::int AS total_scans 
             FROM qr_scan_logs 
             WHERE user_id = $1 ${empFilterSql}`,
            queryParams
        );

        // 2. Feedback / Review Metrics
        const feedbackMetricsResult = await pool.query(
            `SELECT 
                COUNT(*)::int AS total_answers,
                COUNT(CASE WHEN rating_overall >= 4 THEN 1 END)::int AS positive_reviews,
                COUNT(CASE WHEN rating_overall < 3 THEN 1 END)::int AS unsatisfied_alerts
             FROM feedback 
             WHERE user_id = $1 ${empFilterSql}`,
            queryParams
        );

        // 3. Email Dispatch & Bounce Metrics
        const emailDispatchResult = await pool.query(
            `SELECT 
                COUNT(*)::int AS emails_sent,
                COUNT(CASE WHEN status = 'bounced' OR bounced_at IS NOT NULL THEN 1 END)::int AS bounced_emails
             FROM email_dispatch_logs 
             WHERE user_id = $1 ${empFilterSql}`,
            queryParams
        );

        // 4. Lead Scoring & Questionnaire Metrics
        const leadMetricsResult = await pool.query(
            `SELECT 
                COUNT(*)::int AS total_leads,
                COUNT(CASE WHEN is_abandoned = true THEN 1 END)::int AS abandoned_questionnaires,
                COUNT(CASE WHEN lead_score_tier = 'hot' OR lead_score >= 80 THEN 1 END)::int AS high_priority_leads,
                COUNT(CASE WHEN source LIKE '%Meta%' OR source LIKE '%Excel%' THEN 1 END)::int AS meta_excel_leads
             FROM leads 
             WHERE user_id = $1 ${empFilterSql}`,
            queryParams
        );

        // 5. Follow-Up Metrics
        const followUpMetricsResult = await pool.query(
            `SELECT 
                COUNT(CASE WHEN followup_status = 'sent' OR followup_status = 'completed' THEN 1 END)::int AS followups_sent,
                COUNT(CASE WHEN followup_status = 'completed' THEN 1 END)::int AS followups_answered,
                COUNT(CASE WHEN followup_status = 'stalled' OR followup_status = 'stopped' THEN 1 END)::int AS followups_stopped
             FROM leads 
             WHERE user_id = $1 ${empFilterSql}`,
            queryParams
        );

        // 6. Aggregate per Employee List breakdown if employeeId is not specified
        let employeeBreakdown = [];
        if (!employeeId) {
            const breakdownQuery = await pool.query(
                `SELECT 
                    COALESCE(e.employee_id, 'unassigned') AS employee_id,
                    COUNT(DISTINCT q.id)::int AS qr_scans,
                    COUNT(DISTINCT f.id)::int AS total_feedback,
                    COUNT(DISTINCT l.id)::int AS total_leads,
                    COUNT(DISTINCT CASE WHEN l.is_abandoned = true THEN l.id END)::int AS abandoned_leads,
                    COUNT(DISTINCT CASE WHEN f.rating_overall < 3 THEN f.id END)::int AS unsatisfied_count
                 FROM (
                    SELECT employee_id FROM qr_scan_logs WHERE user_id = $1 AND employee_id IS NOT NULL
                    UNION
                    SELECT employee_id FROM feedback WHERE user_id = $1 AND employee_id IS NOT NULL
                    UNION
                    SELECT employee_id FROM leads WHERE user_id = $1 AND employee_id IS NOT NULL
                 ) e
                 LEFT JOIN qr_scan_logs q ON q.user_id = $1 AND q.employee_id = e.employee_id
                 LEFT JOIN feedback f ON f.user_id = $1 AND f.employee_id = e.employee_id
                 LEFT JOIN leads l ON l.user_id = $1 AND l.employee_id = e.employee_id
                 GROUP BY e.employee_id`,
                [userId]
            );
            employeeBreakdown = breakdownQuery.rows;
        }

        const totalScans = qrScansResult.rows[0]?.total_scans || 0;
        const feedbackStats = feedbackMetricsResult.rows[0] || {};
        const emailStats = emailDispatchResult.rows[0] || {};
        const leadStats = leadMetricsResult.rows[0] || {};
        const followupStats = followUpMetricsResult.rows[0] || {};

        return res.json({
            success: true,
            data: {
                employeeReviews: {
                    totalQrScans: totalScans,
                    totalAnswers: feedbackStats.total_answers || 0,
                    reviewsLeft: feedbackStats.positive_reviews || 0,
                    emailsSent: emailStats.emails_sent || 0,
                    emailsBounced: emailStats.bounced_emails || 0,
                    unsatisfiedAlertsSent: feedbackStats.unsatisfied_alerts || 0
                },
                employeeLeadScoring: {
                    completedQuestions: leadStats.total_leads || 0,
                    highPriorityAlertsSent: leadStats.high_priority_leads || 0,
                    abandonedQuestionnaires: leadStats.abandoned_questionnaires || 0,
                    metaExcelLeads: leadStats.meta_excel_leads || 0
                },
                employeeFollowUp: {
                    emailsSent: followupStats.followups_sent || 0,
                    peopleAnswered: followupStats.followups_answered || 0,
                    stoppedFollowupsDetected: followupStats.followups_stopped || 0
                },
                employeeBreakdown
            }
        });
    } catch (err) {
        console.error('Error fetching employee metrics summary:', err);
        return res.status(500).json({ success: false, message: 'Server error loading employee metrics' });
    }
};

/**
 * POST /api/public/qr-scan
 * Logs a QR scan event
 */
export const logQrScan = async (req, res) => {
    try {
        const { userId, employeeId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
        const userAgent = req.headers['user-agent'] || '';

        await pool.query(
            `INSERT INTO qr_scan_logs (user_id, employee_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4)`,
            [userId, employeeId || null, ipAddress, userAgent]
        );

        return res.json({ success: true, message: 'QR scan logged successfully' });
    } catch (err) {
        console.error('Error logging QR scan:', err);
        return res.status(500).json({ success: false, message: 'Failed to log QR scan' });
    }
};
