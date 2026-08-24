import React from 'react';
import { ArrowLeft, FileText, Scroll, UserCheck, ShieldOff, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#0a0b10', minHeight: '100vh', color: '#fff', padding: '4rem 2rem' }}>
            <SEO
                title="Terms of Service | Equipo Experto"
                description="Read the terms and conditions for using Equipo Experto's automated review, lead capture, and follow-up employees."
                path="/terms"
            />
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <header style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '1rem', color: '#3b82f6', marginBottom: '1.5rem' }}>
                        <Scroll size={32} />
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.05em', marginBottom: '1rem' }}>Terms of Service</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Last updated: March 21, 2026</p>
                </header>

                <section className="terms-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>1. Agreement to Terms</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        By accessing or using the Equipo Experto platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
                    </p>
                </section>

                <section className="terms-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>2. Use of Services</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        Our services are provided "as is" and "as available". You agree to use our services in compliance with all applicable laws and regulations. You are responsible for all activity that occurs under your account.
                    </p>
                </section>

                <section className="terms-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>3. User Accounts</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
                    </p>
                </section>

                <section className="terms-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>4. Intellectual Property</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        The service and its original content, features, and functionality are and will remain the exclusive property of Equipo Experto and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Equipo Experto.
                    </p>
                </section>

                <section className="terms-section" style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '2rem', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>5. Limitation of Liability</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        In no event shall Equipo Experto, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>
                </section>

                <section className="terms-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>6. Termination</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </section>

                <footer style={{ marginTop: '6rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600' }}>&copy; 2026 Equipo Experto Engine. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default TermsOfService;
