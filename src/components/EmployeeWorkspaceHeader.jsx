import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './EmployeeWorkspaceHeader.css';

/**
 * Clear context bar: user always knows which employee they are configuring.
 */
export default function EmployeeWorkspaceHeader({
    Icon,
    title,
    subtitle,
    accent = '#3b82f6',
    accentBg = 'rgba(59,130,246,0.1)',
    statusLabel,
    statusActive = false,
    /** Full-width Automation Hub layout (config pages) */
    variant = 'default',
    children,
}) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isHub = variant === 'hub';

    return (
        <header className={`employee-workspace-header${isHub ? ' employee-workspace-header--hub' : ''}`}>
            <button
                type="button"
                className="employee-workspace-back"
                onClick={() => navigate('/dashboard/employee-gallery')}
            >
                <ArrowLeft size={16} aria-hidden />
                {t('backToTeam')}
            </button>

            <div className="employee-workspace-main">
                <div className="employee-workspace-icon" style={{ background: accentBg }}>
                    {Icon ? <Icon size={22} style={{ color: accent }} aria-hidden /> : null}
                </div>
                <div className="employee-workspace-copy">
                    {!isHub && <p className="employee-workspace-kicker">{t('youAreHere')}</p>}
                    <h1 className="employee-workspace-title">{title}</h1>
                    {subtitle ? <p className="employee-workspace-sub">{subtitle}</p> : null}
                </div>
                {statusLabel != null && (
                    <div className={`employee-workspace-status ${statusActive ? 'is-on' : ''}`}>
                        <span className="employee-workspace-status-dot" aria-hidden />
                        {statusLabel}
                    </div>
                )}
            </div>

            {children ? <div className="employee-workspace-actions">{children}</div> : null}
        </header>
    );
}
