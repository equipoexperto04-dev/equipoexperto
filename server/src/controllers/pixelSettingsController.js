import pool from '../db/pool.js';

/**
 * GET /api/settings/pixels
 * Fetch Facebook Pixel ID & ChatGPT pixel script for current tenant/user
 */
export const getPixelSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT facebook_pixel_id, chatgpt_pixel_script FROM users WHERE id = $1`,
            [userId]
        );

        const user = result.rows[0] || {};
        return res.json({
            success: true,
            data: {
                facebookPixelId: user.facebook_pixel_id || '',
                chatgptPixelScript: user.chatgpt_pixel_script || ''
            }
        });
    } catch (err) {
        console.error('Error fetching pixel settings:', err);
        return res.status(500).json({ success: false, message: 'Failed to load pixel settings' });
    }
};

/**
 * PUT /api/settings/pixels
 * Save Facebook Pixel ID & ChatGPT pixel script
 */
export const updatePixelSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { facebookPixelId, chatgptPixelScript } = req.body;

        await pool.query(
            `UPDATE users 
             SET facebook_pixel_id = $1, chatgpt_pixel_script = $2, updated_at = NOW()
             WHERE id = $3`,
            [facebookPixelId || '', chatgptPixelScript || '', userId]
        );

        return res.json({
            success: true,
            message: 'Pixel settings updated successfully'
        });
    } catch (err) {
        console.error('Error saving pixel settings:', err);
        return res.status(500).json({ success: false, message: 'Failed to update pixel settings' });
    }
};

/**
 * GET /api/public/pixels/:userId
 * Public endpoint to fetch active pixels for script injection on landing pages / funnels
 */
export const getPublicPixels = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT facebook_pixel_id, chatgpt_pixel_script FROM users WHERE id = $1`,
            [userId]
        );

        const user = result.rows[0] || {};
        return res.json({
            success: true,
            data: {
                facebookPixelId: user.facebook_pixel_id || '',
                chatgptPixelScript: user.chatgpt_pixel_script || ''
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to load public pixels' });
    }
};
