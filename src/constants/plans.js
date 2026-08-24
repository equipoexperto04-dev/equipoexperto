/**
 * Stripe checkout price keys and EUR display (UI).
 * DB plan ids: starter → free, growth → Growth, pro → Pro (see server auth updatePlan).
 */
export const CHECKOUT_PRICE_KEYS = ['starter', 'growth', 'pro'];

export const dbPlanIdFromPriceKey = (priceKey) => {
    if (priceKey === 'starter') return 'free';
    if (priceKey === 'growth') return 'Growth';
    if (priceKey === 'pro') return 'Pro';
    return null;
};

/**
 * @param {'starter'|'growth'|'pro'} priceKey
 * @param {(k: string) => string} t
 */
export function selectedPlanFromPriceKey(priceKey, t) {
    const meta = {
        starter: { amount: '39', nameKey: 'starterPlan' },
        growth: { amount: '69', nameKey: 'growthPlan' },
        pro: { amount: '119', nameKey: 'proPlan' },
    };
    const m = meta[priceKey];
    if (!m) return null;
    return {
        planKey: priceKey,
        dbPlanId: dbPlanIdFromPriceKey(priceKey),
        name: t(m.nameKey),
        price: `€${m.amount}`,
        period: t('mo'),
    };
}
