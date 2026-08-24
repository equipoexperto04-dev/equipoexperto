import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, ArrowUp } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import TrustSection from '../components/landing/TrustSection';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeatureSection from '../components/landing/FeatureSection';
import ComparisonSection from '../components/landing/ComparisonSection';
import FAQSection from '../components/landing/FAQSection';
import ContactSection from '../components/landing/ContactSection';
import PricingSection from '../components/landing/PricingSection';
import Footer from '../components/landing/Footer';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/LanguageContext';
import { useLandingContent } from '../context/LandingContentContext';
import { loadMetaPixel } from '../utils/loadMetaPixel.js';
import './LandingPage.css';

const LandingPage = () => {
    const { t, language } = useTranslation();
    const { landing, pick } = useLandingContent();
    const brand = (landing?.brandName && String(landing.brandName).trim()) || 'Equipo Experto';
    const finalCtaTitle = pick(landing?.finalCta?.title) || t('heroTitle');
    const finalCtaSub = pick(landing?.finalCta?.subtitle) || t('heroSub');
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'org-jsonld';
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Organization',
                    name: brand,
                    url: 'https://equipoexperto.com/',
                    logo: 'https://equipoexperto.com/equipoexperto.jpg',
                },
                {
                    '@type': 'SoftwareApplication',
                    name: brand,
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    url: 'https://equipoexperto.com/',
                    offers: {
                        '@type': 'AggregateOffer',
                        priceCurrency: 'USD',
                        lowPrice: '29',
                        highPrice: '49',
                    },
                },
            ],
        });
        document.head.appendChild(script);
        return () => script.remove();
    }, [brand]);

    useEffect(() => {
        loadMetaPixel();

        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            setShowBackToTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        // Setup intersection observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        // Select all sections to animate and initialize them as hidden if not already animated
        document.querySelectorAll('.landing-section, .landing-footer, .contact-section').forEach((el) => {
            el.classList.add('opacity-0-init');
            observer.observe(el);
        });

        return () => {
            window.removeEventListener('scroll', onScroll);
            observer.disconnect();
        };
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <div className="landing-page">
            <SEO
                title={`${brand} — ${t('heroSub')}`}
                description={t('heroSub')}
                path={language === 'es' ? '/es' : '/'}
                alternates={{ en: '/', es: '/es', 'x-default': '/' }}
            />
            {/* ─── NAVBAR ─── */}
            <header className={`landing-navbar ${scrolled ? 'navbar--scrolled' : 'navbar--top'}`}>
                <div className="navbar-inner">
                    <div className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/equipoexperto.jpg" alt={brand} className="navbar-logo-img" />
                        <span className="navbar-logo-text">{brand}</span>
                    </div>

                    <nav className="navbar-links">
                        <button className="navbar-link" onClick={() => scrollTo('problem')}>{t('whyUs')}</button>
                        <button className="navbar-link" onClick={() => scrollTo('how-it-works')}>{t('howItWorks')}</button>
                        <button className="navbar-link" onClick={() => scrollTo('features')}>{t('recipes')}</button>
                        <button className="navbar-link" onClick={() => scrollTo('pricing')}>{t('pricing')}</button>
                        <button className="navbar-link" onClick={() => scrollTo('faq')}>{t('faqLabel')}</button>
                        <button className="navbar-link" onClick={() => scrollTo('contact')}>{t('contact')}</button>
                    </nav>

                    <div className="navbar-actions">
                        <ThemeToggle className="mr-2" />
                        <LanguageToggle className="mr-4" />
                        <button className="navbar-login-btn" onClick={() => window.location.href = '/login'}>{t('logIn')}</button>
                        <button className="navbar-cta-btn" onClick={() => window.location.href = '/register'}>{t('startAutomating')}</button>
                    </div>

                    <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <button className="mobile-menu-link" onClick={() => scrollTo('problem')}>{t('whyUs')}</button>
                        <button className="mobile-menu-link" onClick={() => scrollTo('how-it-works')}>{t('howItWorks')}</button>
                        <button className="mobile-menu-link" onClick={() => scrollTo('features')}>{t('recipes')}</button>
                        <button className="mobile-menu-link" onClick={() => scrollTo('pricing')}>{t('pricing')}</button>
                        <button className="mobile-menu-link" onClick={() => scrollTo('faq')}>{t('faqLabel')}</button>
                        <button className="mobile-menu-link" onClick={() => scrollTo('contact')}>{t('contact')}</button>
                        <div className="mobile-menu-actions">
                            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => window.location.href = '/login'}>{t('logIn')}</button>
                            <button className="btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/register'}>{t('startAutomating')}</button>
                        </div>
                    </div>
                )}
            </header>

            {/* ─── PAGE SECTIONS ─── */}
            <main>
                <HeroSection />
                <TrustSection />
                <ProblemSection />
                <HowItWorksSection />
                <FeatureSection />
                <ComparisonSection />
                <PricingSection />
                <FAQSection />
                <ContactSection />

                {/* ─── FINAL CTA ─── */}
                <section className="cta-section" style={{ padding: '100px 0', background: 'var(--bg-primary)' }}>
                    <div className="landing-container">
                        <div className="cta-card">
                            <h2 className="cta-title">{finalCtaTitle}</h2>
                            <p className="cta-desc">{finalCtaSub}</p>
                            <div className="cta-buttons">
                                <button className="cta-btn-white" onClick={() => window.location.href = '/register'}>
                                    {t('startAutomating')}
                                </button>
                                <span className="cta-fine-print-v2">{t('noCreditCard')}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer scrollTo={scrollTo} />
            {showBackToTop && (
                <button 
                    className="back-to-top" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Back to Top"
                >
                    <ArrowUp size={20} />
                </button>
            )}
        </div>
    );
};

export default LandingPage;
