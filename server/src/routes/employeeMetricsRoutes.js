import express from 'express';
import { getEmployeeMetricsSummary, logQrScan } from '../controllers/employeeMetricsController.js';
import authenticateToken from '../middleware/authenticate.js';

const router = express.Router();

// Private authenticated routes
router.get('/summary', authenticateToken, getEmployeeMetricsSummary);

// Public route for QR scan logging
router.post('/public/qr-scan', logQrScan);

export default router;
