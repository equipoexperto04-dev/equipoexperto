import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useLandingContent } from '../../context/LandingContentContext';

const Footer = ({ scrollTo }) => {
    const { t } = useTranslation();
    const { landing } = useLandingContent();
    const brand = (landing?.brandName && String(landing.brandName).trim()) || 'Equipo Experto';

    return (
        <footer className="landing-footer">
            <div className="landing-container">
                <div className="footer-inner">
                    <a 
                        href="#" 
                        className="navbar-logo" 
                        onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                    >
                        <img src="/equipoexperto.jpg" alt={`${brand}`} className="navbar-logo-img" />
                        <span className="navbar-logo-text" style={{ fontSize: '1.25rem' }}>{brand}</span>
                    </a>

                    <div className="footer-links">
                        <a 
                            href="#" 
                            className="footer-link"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollTo?.('problem');
                            }}
                        >
                            {t('about')}
                        </a>
                        <a 
                            href="#" 
                            className="footer-link"
                            onClick={(e) => {
                                e.preventDefault();
                                scrollTo?.('contact');
                            }}
                        >
                            {t('contact')}
                        </a>
                        <a href="/blog" className="footer-link">Blog</a>
                        <a href="/privacy" className="footer-link">{t('privacyPolicy')}</a>
                        <a href="/terms" className="footer-link">{t('termsOfService')}</a>
                    </div>

                    <p className="footer-copy">&copy; {new Date().getFullYear()} {brand}. {t('copyright')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
