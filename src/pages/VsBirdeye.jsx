import React from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const Row = ({ label, equipo, birdeye }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 700, color: '#fff' }}>{label}</div>
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Check size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} /> {equipo}
        </div>
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <X size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} /> {birdeye}
        </div>
    </div>
);

const VsBirdeye = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: '#0a0b10', minHeight: '100vh', color: '#fff', padding: '4rem 2rem' }}>
            <SEO
                title="Equipo Experto vs Birdeye — Pricing & Features Compared"
                description="Compare Equipo Experto and Birdeye on pricing, contracts, setup time, and review/lead automation. See which fits a small, single-location business best."
                path="/vs-birdeye"
            />
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '2rem', padding: 0 }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <header style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.75rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '1rem', lineHeight: 1.15 }}>
                        Equipo Experto vs Birdeye
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.7 }}>
                        Both platforms help businesses collect reviews and respond to leads faster. Birdeye is built
                        for multi-location enterprises with large teams. Equipo Experto is built for small,
                        single-location businesses that want the same automation — review requests, lead capture,
                        and follow-up — without enterprise pricing or long contracts.
                    </p>
                </header>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#3b82f6' }}>
                        Side-by-side comparison
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', padding: '0 0 1rem', borderBottom: '2px solid rgba(255,255,255,0.15)', fontWeight: 800 }}>
                        <div></div>
                        <div style={{ color: '#3b82f6' }}>Equipo Experto</div>
                        <div style={{ color: '#fff' }}>Birdeye</div>
                    </div>

                    <Row
                        label="Starting price"
                        equipo="$29–$49/mo, single flat plan"
                        birdeye="Custom quotes, often $250–$300+/mo"
                    />
                    <Row
                        label="Contract length"
                        equipo="Month-to-month, cancel anytime"
                        birdeye="Annual contracts typical"
                    />
                    <Row
                        label="Setup time"
                        equipo="Self-serve, live same day"
                        birdeye="Sales call + onboarding required"
                    />
                    <Row
                        label="Best for"
                        equipo="Single-location small businesses"
                        birdeye="Multi-location enterprise teams"
                    />
                    <Row
                        label="Review request automation"
                        equipo="QR code + bulk list, automatic follow-up"
                        birdeye="Yes, part of broader suite"
                    />
                    <Row
                        label="Lead capture & scoring"
                        equipo="Web/WhatsApp questionnaire with priority alerts"
                        birdeye="Limited / add-on"
                    />
                    <Row
                        label="Follow-up automation"
                        equipo="Automatic emails until lead replies"
                        birdeye="Available via add-on modules"
                    />
                    <Row
                        label="Weekly performance summary"
                        equipo="Included for every automation"
                        birdeye="Reporting dashboards, added complexity"
                    />

                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                        Pricing and features reflect publicly available information and may change. Verify current
                        plans directly with each provider before deciding.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#3b82f6' }}>
                        Why small businesses choose Equipo Experto
                    </h2>
                    <ul style={{ color: '#94a3b8', lineHeight: 1.9, paddingLeft: '1.25rem' }}>
                        <li>No sales calls or annual contracts — sign up and go live the same day.</li>
                        <li>One flat price covers review requests, lead capture, and follow-up automation.</li>
                        <li>Built for single-location businesses, not bloated with enterprise-only features you'll never use.</li>
                        <li>Weekly summary emails show exactly what each automation did — no dashboard required.</li>
                    </ul>
                </section>

                <section style={{ textAlign: 'center', padding: '3rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '1rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
                        Try Equipo Experto free
                    </h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                        No credit card required. Set up your first automation in minutes.
                    </p>
                    <button
                        onClick={() => { window.location.href = '/register'; }}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.875rem 2rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                    >
                        Get Started
                    </button>
                </section>
            </div>
        </div>
    );
};

export default VsBirdeye;
