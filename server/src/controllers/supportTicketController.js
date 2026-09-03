import pool from '../db/pool.js';
import { sendContactFormNotification } from '../services/contactFormMailService.js';

/**
 * POST /api/support/tickets
 * Public or Authenticated customer submission of a support issue/ticket.
 */
export const createTicket = async (req, res) => {
    try {
        const { name, email, subject, message, priority, source } = req.body;
        const userId = req.user?.id || null;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message fields are required.'
            });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim();
        const cleanSubject = String(subject || 'Customer Support Request').trim();
        const cleanMessage = String(message).trim();
        const ticketPriority = ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
        const ticketSource = String(source || 'website').trim();

        // 1. Insert into database
        const query = `
            INSERT INTO support_tickets (user_id, name, email, subject, message, priority, source, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW(), NOW())
            RETURNING id, name, email, subject, message, status, priority, source, created_at;
        `;
        const result = await pool.query(query, [
            userId,
            cleanName,
            cleanEmail,
            cleanSubject,
            cleanMessage,
            ticketPriority,
            ticketSource
        ]);

        const ticket = result.rows[0];

        // 2. Dispatch email notification asynchronously (non-blocking)
        sendContactFormNotification({
            name: cleanName,
            email: cleanEmail,
            message: `[Ticket #${ticket.id}] (${ticketPriority.toUpperCase()})\nSubject: ${cleanSubject}\n\n${cleanMessage}`,
            source: `Customer Support (${ticketSource})`
        }).catch(err => {
            console.error('[createTicket] Email notification warning:', err.message);
        });

        return res.status(201).json({
            success: true,
            message: 'Support ticket submitted successfully. Our team will review it shortly.',
            ticket
        });
    } catch (err) {
        console.error('[createTicket] Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit support ticket. Please try again.'
        });
    }
};

/**
 * GET /api/admin/tickets
 * Admin-only view to retrieve all tickets and overall summary stats.
 */
export const getAdminTickets = async (req, res) => {
    try {
        const { status, search } = req.query;

        let baseQuery = `SELECT * FROM support_tickets`;
        const queryParams = [];
        const whereClauses = [];

        if (status && status !== 'all') {
            queryParams.push(status);
            whereClauses.push(`status = $${queryParams.length}`);
        }

        if (search && String(search).trim()) {
            queryParams.push(`%${String(search).trim()}%`);
            whereClauses.push(`(name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR subject ILIKE $${queryParams.length} OR message ILIKE $${queryParams.length})`);
        }

        if (whereClauses.length > 0) {
            baseQuery += ` WHERE ` + whereClauses.join(' AND ');
        }

        baseQuery += ` ORDER BY created_at DESC`;

        const [ticketsResult, statsResult] = await Promise.all([
            pool.query(baseQuery, queryParams),
            pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
                FROM support_tickets
            `)
        ]);

        const stats = {
            total: parseInt(statsResult.rows[0]?.total || 0, 10),
            open: parseInt(statsResult.rows[0]?.open || 0, 10),
            in_progress: parseInt(statsResult.rows[0]?.in_progress || 0, 10),
            resolved: parseInt(statsResult.rows[0]?.resolved || 0, 10)
        };

        return res.status(200).json({
            success: true,
            stats,
            tickets: ticketsResult.rows
        });
    } catch (err) {
        console.error('[getAdminTickets] Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch support tickets.'
        });
    }
};

/**
 * PATCH /api/admin/tickets/:id/status
 * Admin-only endpoint to update ticket status and admin notes.
 */
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, admin_notes } = req.body;

        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        const ticketStatus = validStatuses.includes(status) ? status : undefined;

        const updateQuery = `
            UPDATE support_tickets
            SET 
                status = COALESCE($1, status),
                priority = COALESCE($2, priority),
                admin_notes = COALESCE($3, admin_notes),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *;
        `;

        const result = await pool.query(updateQuery, [
            ticketStatus,
            priority || null,
            admin_notes !== undefined ? admin_notes : null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ticket updated successfully.',
            ticket: result.rows[0]
        });
    } catch (err) {
        console.error('[updateTicketStatus] Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to update ticket.'
        });
    }
};

/**
 * DELETE /api/admin/tickets/:id
 * Admin-only endpoint to delete a support ticket.
 */
export const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`DELETE FROM support_tickets WHERE id = $1 RETURNING id;`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Support ticket not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Ticket deleted successfully.'
        });
    } catch (err) {
        console.error('[deleteTicket] Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete ticket.'
        });
    }
};
