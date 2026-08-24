/**
 * ═══════════════════════════════════════════════════════════════
 * CONFIG PAGE TEMPLATE — Master Pattern for Employee Config Pages
 * ═══════════════════════════════════════════════════════════════
 *
 * Usage:
 * 1. Copy this file and rename to YourEmployeeConfig.jsx
 * 2. Set the ACCENT color for your employee type
 * 3. Define your TABS array with icon, label, and sub-label
 * 4. Implement tab content panels
 * 5. Connect to your API endpoints
 *
 * Color Coding:
 * - LeadCapture:    #3b82f6 (Blue)
 * - ReviewFunnel:   #f59e0b (Orange)
 * - LeadFollowUp:   #8b5cf6 (Purple)
 * - Future employees: choose unique accent colors
 *
 * Required CSS: './Config.css' (v3 Precision Utility)
 * Required Translations: Add keys to LanguageContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Save, Loader2,
    // Add your specific icons here
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import SuccessModal from '../../components/SuccessModal';
import Tooltip from '../../components/Tooltip';
import './Config.css';
import API_URL from '../../config.js';

// ═══════════════════════════════════════════════════════════════
// 1. CONFIGURATION — Set per-employee values
// ═══════════════════════════════════════════════════════════════

const ACCENT = '#3b82f6'; // Change to your employee's accent color
const EMPLOYEE_ICON = null; // Your icon component
const EMPLOYEE_TITLE_KEY = 'empYourTitle'; // Translation key
const EMPLOYEE_DESC_KEY = 'cfgYourDesc';   // Translation key
const API_ENDPOINT = '/api/config/your-endpoint';
const CREATE_REDIRECT = '/dashboard/employee/yourgoal';

// ═══════════════════════════════════════════════════════════════
// 2. TAB DEFINITIONS — Define your tabs here
// ═══════════════════════════════════════════════════════════════

const TABS = [
    // { key: 'tab1', icon: <Icon size={15} />, label: t('cfgTab1'), sub: t('cfgTab1Sub') },
    // { key: 'tab2', icon: <Icon size={15} />, label: t('cfgTab2'), sub: t('cfgTab2Sub') },
];

// ═══════════════════════════════════════════════════════════════
// 3. MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const ConfigPageTemplate = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // ── Core State ──
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS[0]?.key || 'main');
    const [initialLoaded, setInitialLoaded] = useState(false);

    // ── Employee State ──
    const [isActive, setIsActive] = useState(false);
    const [settings, setSettings] = useState({
        // Your settings here
    });
    const [originalSettings, setOriginalSettings] = useState(null);

    // ── Load Config ──
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}${API_ENDPOINT}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 404) {
                    navigate(CREATE_REDIRECT, { replace: true });
                    return;
                }
                const data = res.ok ? await res.json() : { success: false };
                if (data.success && data.config) {
                    setIsActive(data.config.is_active === true);
                    const init = {
                        // Map your config fields here
                    };
                    setSettings(init);
                    setOriginalSettings(init);
                    setInitialLoaded(true);
                } else {
                    navigate(CREATE_REDIRECT, { replace: true });
                }
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    // ── Save Handler ──
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}${API_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...settings,
                    is_active: isActive,
                    // Add any additional fields
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setOriginalSettings({ ...settings });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Change Detection ──
    const hasChanges = initialLoaded &&
        JSON.stringify(settings) !== JSON.stringify(originalSettings);

    // ═══════════════════════════════════════════════════════════════
    // 4. RENDER — Consistent Layout Structure
    // ═══════════════════════════════════════════════════════════════

    return (
        <div
            className="dashboard-page cfg-page animate-fade-in"
            style={{
                '--cfg-accent': ACCENT,
                '--cfg-accent-bg': `${ACCENT}10`,
                '--cfg-accent-border': `${ACCENT}40`,
            }}
        >
            {/* ── HEADER ── */}
            <header className="cfg-header">
                <div className="cfg-header-left">
                    <button
                        onClick={() => navigate('/dashboard/employee-gallery')}
                        className="cfg-back-btn"
                        type="button"
                        aria-label={t('back') || 'Back'}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div
                        className="cfg-employee-avatar"
                        style={{ background: `${ACCENT}20` }}
                    >
                        {EMPLOYEE_ICON && <EMPLOYEE_ICON size={20} style={{ color: ACCENT }} />}
                    </div>

                    <div className="cfg-employee-info">
                        <h1 className="cfg-employee-name">{t(EMPLOYEE_TITLE_KEY)}</h1>
                        <p className="cfg-employee-desc">{t(EMPLOYEE_DESC_KEY)}</p>
                    </div>
                </div>

                <div className="cfg-header-right">
                    {/* Status Badge */}
                    <div className={`cfg-status-badge ${isActive ? 'active' : ''}`}>
                        <div className={`cfg-status-dot ${isActive ? 'active' : 'idle'}`} />
                        {isActive ? t('statusWorking') : t('statusOffDuty')}
                    </div>

                    {/* Save Button (appears only when changes detected) */}
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="cfg-save-header-btn"
                        >
                            {isSaving ? (
                                <><Loader2 className="animate-spin" size={14} /><span>{t('saving')}</span></>
                            ) : (
                                <><Save size={14} /><span>{t('save')}</span></>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* ── MAIN LAYOUT: Two-Column Grid ── */}
            <div className="settings-grid-layout">

                {/* LEFT COLUMN: Tabs + Content */}
                <div className="flex flex-col gap-5">

                    {/* Tab Navigation */}
                    <div className="cfg-tabs-wrap">
                        <div className="cfg-tabs">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={`cfg-tab ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    <span className="cfg-tab-icon">{tab.icon}</span>
                                    <span className="cfg-tab-label">{tab.label}</span>
                                    <span className="cfg-tab-sub">{tab.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content Forms */}
                    <form onSubmit={handleSave} className="flex flex-col gap-5">

                        {/* Example Tab Panel */}
                        {activeTab === 'main' && (
                            <div className="cfg-panel">
                                <div className="cfg-section-head">
                                    {/* <Icon size={17} style={{ color: ACCENT }} /> */}
                                    <h3 className="cfg-section-title">{t('cfgSectionTitle')}</h3>
                                    <Tooltip text={t('cfgSectionTooltip')} />
                                </div>

                                <div className="cfg-field">
                                    <label className="cfg-label">{t('cfgFieldLabel')}</label>
                                    <input
                                        type="text"
                                        className="cfg-input no-icon"
                                        value={settings.exampleField || ''}
                                        onChange={e => setSettings(p => ({ ...p, exampleField: e.target.value }))}
                                    />
                                    <p className="cfg-hint">{t('cfgFieldHint')}</p>
                                </div>
                            </div>
                        )}

                        {/* Add more tab panels here... */}

                        {/* Save Button (bottom of form) */}
                        <button
                            type="submit"
                            className={`cfg-save-btn ${hasChanges ? 'has-changes' : 'no-changes'}`}
                            disabled={isSaving || !hasChanges}
                        >
                            {isSaving ? (
                                <><Loader2 className="animate-spin" size={18} /> {t('cfgSaving')}</>
                            ) : (
                                <><Save size={16} /> {t('cfgSaveChanges')}</>
                            )}
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: Sticky Sidebar */}
                <aside className="sticky-top flex flex-col gap-4">

                    {/* Quick Stats / Status Card */}
                    <div className="cfg-sidebar-card" style={{ borderTop: `3px solid ${ACCENT}` }}>
                        <div className="cfg-section-head" style={{ marginBottom: '1rem' }}>
                            {/* <Icon size={15} style={{ color: ACCENT }} /> */}
                            <h3 className="cfg-section-title" style={{ fontSize: '0.8rem' }}>
                                {t('cfgStatusTitle') || 'Status'}
                            </h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                <span className="text-sm font-medium">
                                    {isActive ? t('statusActive') : t('statusInactive')}
                                </span>
                            </div>
                            <p className="text-xs text-secondary/70">
                                {isActive
                                    ? t('cfgStatusActiveDesc')
                                    : t('cfgStatusInactiveDesc')}
                            </p>
                        </div>
                    </div>

                    {/* Add more sidebar cards as needed... */}

                </aside>
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={saved}
                onClose={() => setSaved(false)}
                title={t('cfgSettingsSaved') || 'Settings Saved'}
                message={t('cfgSettingsSavedMsg') || 'Your settings have been updated.'}
                primaryActionText={t('cfgBackToTeam') || 'Back to Team'}
                onPrimaryAction={() => navigate('/dashboard/employee-gallery')}
            />
        </div>
    );
};

export default ConfigPageTemplate;
