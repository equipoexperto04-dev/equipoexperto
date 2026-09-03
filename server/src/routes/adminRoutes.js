import express from 'express';
import authenticate from '../middleware/authenticate.js';
import requireAdmin from '../middleware/requireAdmin.js';
import { getErrors, resolveError, resolveErrorsBulk, getAdminUsers, updateUserStatus } from '../controllers/adminErrorsController.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/errors', getErrors);
router.post('/errors/resolve-bulk', express.json(), resolveErrorsBulk);
router.patch('/errors/:id', express.json(), resolveError);
router.get('/errors/test', (req, res) => { throw new Error('Test error capture'); });

router.get('/users', getAdminUsers);
router.patch('/users/:id/status', express.json(), updateUserStatus);

import { getAdminTickets, updateTicketStatus, deleteTicket } from '../controllers/supportTicketController.js';

router.get('/tickets', getAdminTickets);
router.patch('/tickets/:id/status', express.json(), updateTicketStatus);
router.delete('/tickets/:id', deleteTicket);

export default router;

