import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

const BRANDS = [
    { id: 'visa', label: 'Visa' },
    { id: 'mastercard', label: 'Mastercard' },
    { id: 'amex', label: 'American Express' },
    { id: 'discover', label: 'Discover' },
    { id: 'diners', label: 'Diners Club' },
    { id: 'jcb', label: 'JCB' },
    { id: 'unionpay', label: 'UnionPay' },
];

const WALLETS = [
    { id: 'apple_pay', label: 'Apple Pay' },
    { id: 'google_pay', label: 'Google Pay' },
    { id: 'link', label: 'Link' },
];

function BrandMark({ id }) {
    switch (id) {
        case 'visa':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#1A1F71" />
                    <text x="24" y="21" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
                        VISA
                    </text>
                </svg>
            );
        case 'mastercard':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#252525" />
                    <circle cx="19" cy="16" r="8" fill="#EB001B" />
                    <circle cx="29" cy="16" r="8" fill="#F79E1B" fillOpacity="0.95" />
                </svg>
            );
        case 'amex':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#006FCF" />
                    <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif">
                        AMEX
                    </text>
                </svg>
            );
        case 'discover':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#F6F6F6" />
                    <text x="24" y="19" textAnchor="middle" fill="#231F20" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">
                        DISCOVER
                    </text>
                    <circle cx="36" cy="16" r="6" fill="#F47216" />
                </svg>
            );
        case 'diners':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#0079BE" />
                    <circle cx="24" cy="16" r="9" fill="none" stroke="#fff" strokeWidth="2" />
                    <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700" fontFamily="system-ui,sans-serif">
                        DINERS
                    </text>
                </svg>
            );
        case 'jcb':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#0B4EA2" />
                    <text x="24" y="21" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">
                        JCB
                    </text>
                </svg>
            );
        case 'unionpay':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#E21836" />
                    <text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700" fontFamily="system-ui,sans-serif">
                        UnionPay
                    </text>
                </svg>
            );
        case 'apple_pay':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#000" />
                    <text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="600" fontFamily="system-ui,sans-serif">
                         Pay
                    </text>
                </svg>
            );
        case 'google_pay':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#fff" stroke="#E2E8F0" />
                    <text x="24" y="20" textAnchor="middle" fill="#3C4043" fontSize="7" fontWeight="600" fontFamily="system-ui,sans-serif">
                        G Pay
                    </text>
                </svg>
            );
        case 'link':
            return (
                <svg viewBox="0 0 48 32" aria-hidden>
                    <rect width="48" height="32" rx="6" fill="#00D66F" />
                    <text x="24" y="21" textAnchor="middle" fill="#011E0F" fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">
                        link
                    </text>
                </svg>
            );
        default:
            return null;
    }
}

const AcceptedPaymentMethods = () => {
    const { t } = useTranslation();

    return (
        <section className="checkout-methods" aria-labelledby="checkout-methods-cards">
            <p id="checkout-methods-cards" className="checkout-methods-heading">{t('checkoutAcceptedCards')}</p>
            <ul className="checkout-methods-grid" aria-label={t('checkoutAcceptedCards')}>
                {BRANDS.map((brand) => (
                    <li key={brand.id} className="checkout-method-badge" title={brand.label}>
                        <BrandMark id={brand.id} />
                        <span className="sr-only">{brand.label}</span>
                    </li>
                ))}
            </ul>

            <p className="checkout-methods-heading checkout-methods-heading--wallets">{t('checkoutAcceptedWallets')}</p>
            <ul className="checkout-methods-grid checkout-methods-grid--wallets" aria-label={t('checkoutAcceptedWallets')}>
                {WALLETS.map((wallet) => (
                    <li key={wallet.id} className="checkout-method-badge" title={wallet.label}>
                        <BrandMark id={wallet.id} />
                        <span className="sr-only">{wallet.label}</span>
                    </li>
                ))}
            </ul>

            <p className="checkout-methods-note">{t('checkoutStripePowered')}</p>
        </section>
    );
};

export default AcceptedPaymentMethods;
