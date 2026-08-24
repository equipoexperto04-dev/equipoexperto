import React from 'react';
import { ArrowLeft, Shield, Lock, Trash2, Eye, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#0a0b10', minHeight: '100vh', color: '#fff', padding: '4rem 2rem' }}>
            <SEO
                title="Privacy Policy | Equipo Experto"
                description="Learn how Equipo Experto collects, uses, and protects your data across our review, lead capture, and follow-up automations."
                path="/privacy"
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
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.05em', marginBottom: '1rem' }}>Privacy Policy</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Last updated: March 21, 2026</p>
                </header>

                <section className="policy-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>1. Introduction</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        Welcome to Equipo Experto. We respect your privacy and are committed to protecting your personal data.
                    </p>
                </section>

                <section className="policy-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>2. Data We Collect</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                    </p>
                    <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
                        <li><strong>Google/Facebook Data:</strong> If you choose to link your Google or Facebook account, we collect basic profile information and specific permissions granted to enable our automation services.</li>
                    </ul>
                </section>

                <section id="deletion" className="policy-section" style={{ marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Trash2 size={24} /> 3. User Data Deletion
                    </h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                        We provide users with full control over their data stored on our platform. 
                    </p>
                    <div style={{ background: '#0a0b10', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ color: '#fff', marginBottom: '1rem', fontWeight: '700' }}>Instructions for Data Deletion:</h4>
                        <ol style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
                            <li>Log in to your Equipo Experto dashboard.</li>
                            <li>Navigate to <strong>Settings</strong> {'>'} <strong>Account</strong>.</li>
                            <li>Click on <strong>"Delete My Account"</strong>.</li>
                            <li>Confirming this action will immediately remove your profile and all associated automation data from our active databases.</li>
                        </ol>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                            Alternatively, you can request data deletion by emailing us at <span style={{ color: '#3b82f6' }}>admin@equipoexperto.com</span> with the subject line "Data Deletion Request". We will process your request within 48 hours.
                        </p>
                    </div>
                </section>

                <section className="policy-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>4. Data Protection & Security</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        We implement robust security measures to protect your sensitive data:
                    </p>
                    <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li><strong>Encryption:</strong> All data is encrypted in transit using HTTPS/TLS and encrypted at rest in our secure database.</li>
                        <li><strong>Access Control:</strong> Only authorized personnel with need-to-know access can view user data. All access is logged and audited.</li>
                        <li><strong>OAuth Tokens:</strong> Gmail OAuth tokens are stored encrypted and are used only for sending user-configured emails. We never read inbox content.</li>
                        <li><strong>Regular Security Updates:</strong> We maintain up-to-date security patches and conduct regular security audits.</li>
                        <li><strong>GDPR Compliance:</strong> Users have full control over their data, including the right to access, modify, or delete their information.</li>
                    </ul>
                </section>

                <section className="policy-section" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>5. How We Use Your Data</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        We use your data only for the following purposes:
                    </p>
                    <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li>To provide and manage our automation services.</li>
                        <li>To process lead captures and sentiment analysis.</li>
                        <li>To notify you about changes to our service.</li>
                        <li>To provide customer support.</li>
                    </ul>
                </section>

                <section className="policy-section" style={{ marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: '#3b82f6' }}>6. Data Sharing, Transfer, and Disclosure</h2>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        We are committed to protecting your Google user data and only share it in limited circumstances:
                    </p>
                    <ul style={{ color: '#94a3b8', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li><strong>Third-Party Service Providers:</strong> We use trusted third-party services to operate our platform (e.g., database hosting, email delivery services). These providers have strict data protection agreements and only access data necessary to perform their services.</li>
                        <li><strong>Legal Requirements:</strong> We may disclose data if required by law, court order, or to protect our rights, property, or safety.</li>
                        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction. You will be notified of any such transfer.</li>
                        <li><strong>With Your Consent:</strong> We may share data with third parties when you explicitly consent to such sharing.</li>
                    </ul>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginTop: '1.5rem', marginBottom: '1rem' }}>
                        <strong>Important:</strong> We do NOT sell, rent, or trade your personal information to third parties for marketing purposes. We do NOT share your Google user data with any third parties except as described above.
                    </p>
                    <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '1rem' }}>
                        <strong>Google User Data:</strong> When you connect your Gmail account, we use OAuth tokens to send emails on your behalf. We do NOT share your Gmail data with any third parties. All email sending is performed directly through Google's Gmail API using your authorized OAuth tokens. Specifically, Equipo Experto's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>
                </section>

                <footer style={{ marginTop: '6rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '600' }}>&copy; 2026 Equipo Experto Engine. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
