import { getSystemSetting, setSystemSetting } from '../services/systemSettingsService.js';

function maskKey(key) {
    if (!key || typeof key !== 'string') return null;
    if (key.length <= 12) return '***';
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export const getStripeSettings = async (req, res) => {
    try {
        const mode = await getSystemSetting('stripe_mode', process.env.STRIPE_MODE || 'test');

        const testKey = process.env.STRIPE_TEST_SECRET_KEY || (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? process.env.STRIPE_SECRET_KEY : null);
        const liveKey = process.env.STRIPE_LIVE_SECRET_KEY || (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? process.env.STRIPE_SECRET_KEY : null);

        const hasTestKey = Boolean(testKey);
        const hasLiveKey = Boolean(liveKey);

        const activeKey = mode === 'live' ? liveKey : testKey;

        return res.json({
            success: true,
            mode,
            hasTestKey,
            hasLiveKey,
            testKeyMasked: maskKey(testKey),
            liveKeyMasked: maskKey(liveKey),
            activeKeyMasked: maskKey(activeKey),
        });
    } catch (err) {
        console.error('[getStripeSettings]', err.message);
        return res.status(500).json({ success: false, message: 'Failed to retrieve Stripe settings.' });
    }
};

export const updateStripeMode = async (req, res) => {
    try {
        const { mode } = req.body || {};
        if (mode !== 'test' && mode !== 'live') {
            return res.status(400).json({
                success: false,
                message: "Invalid mode. Must be 'test' or 'live'.",
            });
        }

        if (mode === 'live') {
            const liveKey = process.env.STRIPE_LIVE_SECRET_KEY || (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? process.env.STRIPE_SECRET_KEY : null);
            if (!liveKey) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot switch to Live mode: STRIPE_LIVE_SECRET_KEY is not configured.",
                });
            }
        }

        await setSystemSetting('stripe_mode', mode);
        console.log(`[Admin] Stripe mode switched to: ${mode}`);

        return res.json({
            success: true,
            mode,
            message: `Stripe mode successfully switched to ${mode.toUpperCase()} mode.`,
        });
    } catch (err) {
        console.error('[updateStripeMode]', err.message);
        return res.status(500).json({ success: false, message: 'Failed to update Stripe mode.' });
    }
};
