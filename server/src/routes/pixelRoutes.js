import express from 'express';
import { getPixelSettings, updatePixelSettings, getPublicPixels } from '../controllers/pixelSettingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/settings', authenticateToken, getPixelSettings);
router.put('/settings', authenticateToken, updatePixelSettings);
router.get('/public/:userId', getPublicPixels);

export default router;
