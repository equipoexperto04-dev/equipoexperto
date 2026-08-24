import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Star, Users2, Zap, ArrowRight, Check, Power, Plus,
    MessageCircle, Mail
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './EmployeeGalleryDemo.css';

/**
 * EmployeeGalleryDemo — preview-only redesign of the gallery page.
 * Lives at /dashboard/employee-gallery-demo. Pure visuals (mock data).
 * Goal: caveman-simple. 3 employees as horizontal rows. Each row tells the
 *   whole story (name • what it does • status • channels • one CTA).
 * No emoji-heavy cards. No long product story HTML. No remove modal here.
 */

const MOCK_EMPLOYEES = [
    {
        id: 'capture',
        Icon: Users2,
        accent: '#3b82f6',
        titleKey: 'empLeadShort',
        taglineKey: 'empLeadTagline',
        configPath: '/dashboard/config/lead-capture',
        wizardPath: '/dashboard/employee/capture',
        // mock runtime values:
        configured: true,
        active: true,
        sentThisWeek: 24,
        channels: ['whatsapp', 'email'],
    },
    {
        id: 'review',
        Icon: Star,
        accent: '#f59e0b',
        titleKey: 'empReviewShort',
        taglineKey: 'empReviewTagline',
        configPath: '/dashboard/config/review-funnel',
        wizardPath: '/dashboard/employee/review',
        configured: true,
        active: false,
        sentThisWeek: 0,
        channels: ['whatsapp'],
    },
    {
        id: 'followup',
        Icon: Zap,
        accent: '#8b5cf6',
        titleKey: 'empFollowShort',
        taglineKey: 'empFollowTagline',
        configPath: '/dashboard/config/lead-followup',
        wizardPath: '/dashboard/employee/followup',
        configured: false,
        active: false,
        sentThisWeek: 0,
        channels: ['whatsapp', 'email'],
    },
];

const channelIcon = (c) => (c === 'email' ? Mail : MessageCircle);

const EmployeeGalleryDemo = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState(MOCK_EMPLOYEES);

    const toggle = (id) => {
        setEmployees((prev) =>
            prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
        );
    };

    const activeCount = employees.filter((e) => e.configured && e.active).length;
    const configuredCount = employees.filter((e) => e.configured).length;

    return (
        <div className="dashboard-page gallery-demo animate-fade-in">
            {/* Demo notice ribbon */}
            <div className="gallery-demo-ribbon">
                <Star size={12} />
                <span>Demo preview · not connected to real data</span>
                <Link to="/dashboard/employee-gallery" className="gallery-demo-ribbon-link">
                    See current page →
                </Link>
            </div>

            {/* Header */}
            <header className="gallery-demo-header">
                <div>
                    <h1 className="gallery-demo-title">Your team</h1>
                    <p className="gallery-demo-sub">
                        Three digital employees. Hire one, configure it, turn it on.
                    </p>
                </div>
                <div className="gallery-demo-stat-row">
                    <div className="gallery-demo-stat">
                        <span className="gallery-demo-stat-num">{activeCount}</span>
                        <span className="gallery-demo-stat-lbl">working</span>
                    </div>
                    <div className="gallery-demo-stat-divider" aria-hidden />
                    <div className="gallery-demo-stat">
                        <span className="gallery-demo-stat-num">{configuredCount}/3</span>
                        <span className="gallery-demo-stat-lbl">hired</span>
                    </div>
                </div>
            </header>

            {/* Rows */}
            <div className="gallery-demo-list">
                {employees.map((emp) => {
                    const Icon = emp.Icon;
                    const isHired = emp.configured;
                    const isWorking = emp.active;
                    return (
                        <article
                            key={emp.id}
                            className={`gallery-demo-row ${isWorking ? 'is-working' : ''}`}
                            style={{
                                '--row-accent': emp.accent,
                                '--row-accent-bg': `${emp.accent}10`,
                            }}
                        >
                            {/* Accent strip */}
                            <span className="gallery-demo-row-strip" aria-hidden />

                            {/* Icon */}
                            <div className="gallery-demo-row-icon" aria-hidden>
                                <Icon size={22} />
                            </div>

                            {/* Body */}
                            <div className="gallery-demo-row-body">
                                <div className="gallery-demo-row-titleline">
                                    <h2 className="gallery-demo-row-title">{t(emp.titleKey)}</h2>
                                    {isHired ? (
                                        <span
                                            className={`gallery-demo-status ${isWorking ? 'is-on' : 'is-off'}`}
                                        >
                                            <span className="gallery-demo-status-dot" />
                                            {isWorking ? 'Working' : 'Paused'}
                                        </span>
                                    ) : (
                                        <span className="gallery-demo-status is-new">Not hired</span>
                                    )}
                                </div>
                                <p className="gallery-demo-row-tagline">{t(emp.taglineKey)}</p>

                                {/* Channels + stats */}
                                <div className="gallery-demo-meta">
                                    <div className="gallery-demo-channels">
                                        {emp.channels.map((c) => {
                                            const ChIcon = channelIcon(c);
                                            return (
                                                <span key={c} className="gallery-demo-channel">
                                                    <ChIcon size={11} />
                                                    {c === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    {isHired && isWorking && (
                                        <span className="gallery-demo-msgs">
                                            <Check size={11} />
                                            {emp.sentThisWeek} sent this week
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="gallery-demo-row-actions">
                                {isHired ? (
                                    <>
                                        <button
                                            type="button"
                                            className={`gallery-demo-btn-toggle ${isWorking ? 'is-on' : ''}`}
                                            onClick={() => toggle(emp.id)}
                                            aria-label={isWorking ? 'Pause' : 'Start'}
                                        >
                                            <Power size={14} />
                                            {isWorking ? 'Pause' : 'Start'}
                                        </button>
                                        <Link
                                            to={emp.configPath}
                                            className="gallery-demo-btn-config"
                                        >
                                            Configure
                                            <ArrowRight size={13} />
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        to={emp.wizardPath}
                                        className="gallery-demo-btn-hire"
                                        style={{ background: emp.accent }}
                                    >
                                        <Plus size={14} />
                                        Hire
                                    </Link>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Footer help */}
            <footer className="gallery-demo-foot">
                <p>
                    Need a different employee? <Link to="/dashboard/marketplace">Browse marketplace →</Link>
                </p>
            </footer>
        </div>
    );
};

export default EmployeeGalleryDemo;
