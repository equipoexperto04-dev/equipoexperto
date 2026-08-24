import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
    Save, CheckCircle2, Building2, Mail, Phone, Lock, Eye, EyeOff, Sparkles,
    ChevronRight, Bell, Zap, Crown, Info, FileText, History, Trash2, AlertTriangle,
    Loader2
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../components/Toast';
import './Settings.css';
import API_URL from '../config.js';
import { fetchStripeBillingStatus, startStripePortal } from '../utils/stripeCheckout.js';
import { resolveStripeError } from '../utils/stripeErrors.js';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';

const Settings = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const { user, setUser } = useOutletContext() || {};
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        phone: '',
        weekly_reports_enabled: true,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const [showSalesModal, setShowSalesModal] = useState(false);
    const [salesEmail, setSalesEmail] = useState('');
    const [salesSending, setSalesSending] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile');
    const [billingStripe, setBillingStripe] = useState({
        loading: true,
        configured: true,
        canManagePortal: false,
    });
    const [portalLoading, setPortalLoading] = useState(false);
    const showProfileLoading = useDelayedLoading(isLoading);
    const showPortalLoading = useDelayedLoading(portalLoading);
    const showDeleteLoading = useDelayedLoading(isDeleting);
    const showSalesLoading = useDelayedLoading(salesSending);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'billing', 'security', 'notifications', 'danger'].includes(tab)) {
            setActiveTab(tab);
            return;
        }
        const hash = (window.location.hash || '').replace('#', '');
        if (['profile', 'billing', 'security', 'notifications', 'danger'].includes(hash)) {
            setActiveTab(hash);
            const next = new URLSearchParams(searchParams);
            next.set('tab', hash);
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const status = await fetchStripeBillingStatus();
            if (cancelled) return;
            setBillingStripe({
                loading: false,
                configured: status?.configured ?? false,
                canManagePortal: status?.canManagePortal ?? false,
            });
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        const result = await startStripePortal();
        setPortalLoading(false);
        if (!result.ok) {
            toast(resolveStripeError(result.code, language), 'error');
        }
    };

    useEffect(() => {
        if (searchParams.get('checkout') === 'cancelled') {
            toast(t('checkoutCancelledToast'), 'warning');
            const next = new URLSearchParams(searchParams);
            next.delete('checkout');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams, toast, t]);

    const SETTINGS_TABS = [
        { id: 'profile', label: t('tabProfile') },
        { id: 'billing', label: t('tabBilling') },
        { id: 'security', label: t('tabSecurity') },
        { id: 'notifications', label: t('tabNotifications') },
        { id: 'danger', label: t('tabDangerZone') },
    ];

    const switchTab = (tabId) => {
        setActiveTab(tabId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', tabId);
        setSearchParams(next, { replace: true });
        document.querySelector('.content-wrapper')?.scrollTo({ top: 0, behavior: 'instant' });
    };

    useEffect(() => {
        document.querySelector('.content-wrapper')?.scrollTo({ top: 0, behavior: 'instant' });
    }, [activeTab]);

    const openSalesModal = () => {
        setSalesEmail((user?.email || formData.email || '').trim());
        setShowSalesModal(true);
    };

    const handleSalesSubmit = async (e) => {
        e.preventDefault();
        const email = salesEmail.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast(t('contactSalesEmailInvalid'), 'warning');
            return;
        }
        setSalesSending(true);
        try {
            const name = (user?.company_name || user?.name || formData.company_name || 'Dashboard user').slice(0, 200);
            const accountEmail = user?.email || formData.email || 'unknown';
            const message =
                `User has requested custom sales / enterprise plan (Settings → Billing).\nAccount email on file: ${accountEmail}\nPreferred contact email: ${email}`;
            const res = await fetch(`${API_URL}/api/support/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message, source: 'billing' })
            });
            const data = await res.json();
            if (!data.success) {
                toast(data.message || t('contactSalesError'), 'error');
                return;
            }
            toast(t('contactSalesThanks'), 'success');
            setShowSalesModal(false);
        } catch {
            toast(t('contactSalesError'), 'error');
        } finally {
            setSalesSending(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                company_name: user.company_name || user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                weekly_reports_enabled: user.weekly_reports_enabled ?? true
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const token = localStorage.getItem('token');

        // Bug 32: Validate phone number format before submitting
        if (formData.phone && !/^[+\d][\d\s\-().]{0,24}$/.test(formData.phone.trim())) {
            setError(t('invalidPhoneFormat') || 'Invalid phone number format. Use digits, spaces, +, - or parentheses only.');
            setIsLoading(false);
            return;
        }

        try {
            // Update Profile Info
            const profileRes = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    email: formData.email,
                    phone: formData.phone,
                    weekly_reports_enabled: formData.weekly_reports_enabled
                })
            });
            const profileData = await profileRes.json();

            if (!profileData.success) {
                setError(profileData.message);
                setIsLoading(false);
                return;
            }

            // Update user global context
            if (setUser) setUser(profileData.user);

            // Update Password if fields are filled
            if (formData.newPassword || formData.currentPassword) {
                if (formData.newPassword !== formData.confirmNewPassword) {
                    setError(t('passwordsDoNotMatch'));
                    setIsLoading(false);
                    return;
                }

                const passRes = await fetch(`${API_URL}/auth/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: formData.currentPassword,
                        newPassword: formData.newPassword
                    })
                });

                const passData = await passRes.json();
                if (!passData.success) {
                    setError(passData.message);
                    setIsLoading(false);
                    return;
                }

                // Clear password fields on success
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(t('networkError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            return;
        }
        
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Clear all local storage
                localStorage.clear();
                // Redirect to home page
                window.location.href = '/';
            } else {
                setError(data.message || t('deleteAccountFailed') || 'Failed to delete account');
            }
        } catch (err) {
            setError(t('networkError'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="settings-page">
            <header className="settings-page-header">
                <h1 className="settings-title">{t('settingsTitle')}</h1>
                <nav className="settings-anchors" aria-label="Settings sections">
                    {SETTINGS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`settings-anchor-btn ${activeTab === tab.id ? 'is-active' : ''}`}
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                            onClick={() => switchTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            <div className="settings-panel">
            {/* Profile section */}
            {activeTab === 'profile' && <section id="profile" className="settings-section">{(
                <form onSubmit={handleSave} className="settings-card">
                    <div>
                        <p className="settings-card-title">{t('settingsBusinessProfile')}</p>
                        <p className="settings-card-subtitle">{t('settingsBusinessProfileSub')}</p>
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">{t('settingsBusinessName')}</label>
                        <input className="settings-input" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Your business name" />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">{t('settingsEmailLabel')}</label>
                        <input className="settings-input" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">{t('settingsPhoneLabel')}</label>
                        <input className="settings-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="+34 600 000 000" />
                    </div>
                    {error && <div className="settings-error">{error}</div>}
                    {saved && <div className="settings-success"><CheckCircle2 size={14} /> {t('savedSuccessfully')}</div>}
                    <div>
                        <button type="submit" className="settings-btn settings-btn--primary" disabled={isLoading}>
                            {showProfileLoading ? <Loader2 size={16} className="spin" aria-hidden /> : <Save size={16} />}
                            {showProfileLoading ? t('settingsSaving') : t('settingsSaveChanges')}
                        </button>
                    </div>
                </form>
            )}</section>}

            {/* Billing section */}
            {activeTab === 'billing' && <section id="billing" className="settings-section">{(
                <div className="billing-section">
                    <div className="settings-card">
                        <div className="billing-current-plan">
                            <div>
                                <p className="settings-card-title">{t('billingCurrentTitle')}</p>
                                <p className="settings-card-subtitle">{t('billingCurrentSub')}</p>
                            </div>
                            <div className="billing-plan-badge">
                                {user?.plan || 'free'} · {t('billingPlanSuffix')}
                            </div>
                        </div>
                        {!billingStripe.loading && !billingStripe.configured && (
                            <p className="billing-stripe-hint" role="status">
                                {t('stripeNotConfigured')}
                            </p>
                        )}
                        {billingStripe.canManagePortal && (
                            <button
                                type="button"
                                className="billing-manage-portal-btn"
                                onClick={handleManageSubscription}
                                disabled={portalLoading}
                            >
                                {showPortalLoading ? <Loader2 size={16} className="spin" aria-hidden /> : null}
                                {showPortalLoading ? t('processing') : t('manageSubscription')}
                            </button>
                        )}
</div>

                    <div className="billing-plans-grid">
                        {[
                            {
                                id: 'free',
                                planKey: 'starter',
                                name: t('starterPlan'),
                                price: '€39',
                                features: [t('plan1Employee'), t('basicAnalytics'), t('communitySupport')],
                                icon: <Sparkles className="text-blue-500" />,
                            },
                            {
                                id: 'Growth',
                                planKey: 'growth',
                                name: t('growthPlan'),
                                price: '€69',
                                features: [t('plan2Employees'), t('advancedLeadScoring'), t('prioritySupport')],
                                icon: <Zap className="text-amber-500" />,
                            },
                            {
                                id: 'Pro',
                                planKey: 'pro',
                                name: t('proPlan'),
                                price: '€119',
                                features: [t('plan3Employees'), t('fullLeadHub'), t('strategyCall')],
                                icon: <Crown className="text-purple-500" />,
                            },
                        ].map((plan) => (
                            <div key={plan.id} className={`billing-plan-card ${user?.plan === plan.id ? 'active' : ''}`}>
                                <div className="billing-plan-header">
                                    <div className="billing-plan-icon-wrap">{plan.icon}</div>
                                    {user?.plan === plan.id && <span className="billing-active-label">{t('currentPlan')}</span>}
                                </div>
                                <h3 className="billing-plan-name">{plan.name}</h3>
                                <div className="billing-plan-price-wrap">
                                    <span className="billing-plan-price">{plan.price}</span>
                                    <span className="billing-plan-period">{t('mo')}</span>
                                </div>
                                <ul className="billing-plan-features">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="billing-feature-item">
                                            <CheckCircle2 size={14} className="text-green-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    className={`billing-plan-btn ${user?.plan === plan.id ? 'current' : 'upgrade'}`}
                                    onClick={() => {
                                        if (user?.plan !== plan.id) {
                                            navigate(`/checkout/${plan.planKey}?from=settings`);
                                        }
                                    }}
                                    disabled={user?.plan === plan.id}
                                >
                                    {user?.plan === plan.id ? t('currentPlan') : t('upgradePlanBtn')}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="settings-card">
                        <div className="billing-custom-banner">
                            <div className="billing-custom-icon"><Info size={20} className="text-accent" /></div>
                            <div className="billing-custom-content">
                                <p className="billing-custom-title">{t('billingEnterpriseHeadline')}</p>
                                <p className="billing-custom-desc">{t('billingEnterpriseSub')}</p>
                            </div>
                            <button type="button" className="billing-custom-btn" onClick={openSalesModal}>{t('contactSalesBtn')}</button>
                        </div>
                    </div>
                </div>
            )}</section>}

            {/* Security section */}
            {activeTab === 'security' && (
                <section id="security" className="settings-section">
                    {(!user?.password_hash || user?.auth_provider === 'google') ? (
                        <div className="settings-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)' }}>
                                <Lock size={20} className="text-accent" />
                            </div>
                            <p className="settings-card-title" style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {t('settingsGoogleLoginTitle', 'Google Authentication Active')}
                            </p>
                            <p className="settings-card-subtitle" style={{ maxWidth: '340px', margin: '0 auto', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {t('settingsGoogleLoginSub', 'Your account is securely managed via Google OAuth. Password changes are not applicable through this dashboard.')}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="settings-card">
                            <div>
                                <p className="settings-card-title">{t('settingsChangePassword')}</p>
                                <p className="settings-card-subtitle">{t('settingsChangePasswordSub')}</p>
                            </div>
                            <div className="settings-field">
                                <label className="settings-label">{t('settingsCurrentPassword')}</label>
                                <div className="settings-input-wrap">
                                    <input className="settings-input" name="currentPassword" type={showCurrent ? 'text' : 'password'} value={formData.currentPassword} onChange={handleChange} />
                                    <button type="button" className="settings-eye-btn" onClick={() => setShowCurrent(!showCurrent)}>
                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="settings-field">
                                <label className="settings-label">{t('settingsNewPassword')}</label>
                                <div className="settings-input-wrap">
                                    <input className="settings-input" name="newPassword" type={showNew ? 'text' : 'password'} value={formData.newPassword} onChange={handleChange} />
                                    <button type="button" className="settings-eye-btn" onClick={() => setShowNew(!showNew)}>
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="settings-field">
                                <label className="settings-label">{t('settingsConfirmNewPassword')}</label>
                                <input className="settings-input" name="confirmNewPassword" type="password" value={formData.confirmNewPassword} onChange={handleChange} />
                            </div>
                            {error && <div className="settings-error">{error}</div>}
                            {saved && <div className="settings-success"><CheckCircle2 size={14} /> {t('settingsPasswordUpdated')}</div>}
                            <div>
                                <button type="submit" className="settings-btn settings-btn--primary" disabled={isLoading}>
                                    {showProfileLoading ? <Loader2 size={16} className="spin" aria-hidden /> : null}
                                    {showProfileLoading ? t('settingsUpdating') : t('settingsUpdatePassword')}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            )}

            {/* Notifications section */}
            {activeTab === 'notifications' && <section id="notifications" className="settings-section">{(
                <div className="settings-card">
                    <div>
                        <p className="settings-card-title">{t('settingsNotifTitle')}</p>
                        <p className="settings-card-subtitle">{t('settingsNotifSub')}</p>
                    </div>
                    <div className="settings-toggle-row">
                        <div className="settings-toggle-info">
                            <span className="settings-toggle-label">{t('settingsWeeklyReports')}</span>
                            <span className="settings-toggle-desc">{t('settingsWeeklyReportsSub')}</span>
                        </div>
                        <button
                            type="button"
                            className={`settings-toggle-switch ${formData.weekly_reports_enabled ? 'on' : 'off'}`}
                            onClick={() => setFormData(prev => ({ ...prev, weekly_reports_enabled: !prev.weekly_reports_enabled }))}
                            aria-label="Toggle weekly reports"
                        >
                            <span className="settings-toggle-thumb" />
                        </button>
                    </div>
                    <div>
                        <button
                            className="settings-btn settings-btn--primary"
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {showProfileLoading ? <Loader2 size={16} className="spin" aria-hidden /> : null}
                            {showProfileLoading ? t('settingsSaving') : t('settingsSavePrefs')}
                        </button>
                    </div>
                    {saved && <div className="settings-success"><CheckCircle2 size={14} /> {t('settingsSaved') || 'Preferences saved!'}</div>}
                    {error && <div className="settings-error">{error}</div>}
                </div>
            )}</section>}

            {/* Danger section */}
            {activeTab === 'danger' && <section id="danger" className="settings-section">{(
                <div className="settings-danger-card">
                    <div className="settings-danger-text">
                        <span className="settings-danger-title">{t('settingsDangerTitle')}</span>
                        <span className="settings-danger-desc">{t('settingsDangerDesc')}</span>
                    </div>
                    <button className="settings-btn settings-btn--danger" onClick={() => setShowDeleteModal(true)}>
                        {t('settingsDeleteAccountBtn')}
                    </button>
                </div>
            )}</section>}
            </div>

            {/* Delete modal */}
            {showDeleteModal && (
                <div className="settings-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <p className="settings-modal-title">{t('settingsDangerTitle')}</p>
                        <p className="settings-modal-desc">{t('settingsDeleteModalDesc')}</p>
                        <input
                            className="settings-input"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            placeholder={t('settingsDeletePlaceholder')}
                            autoFocus
                        />
                        <div className="settings-modal-actions">
                            <button className="settings-btn--ghost" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</button>
                            <button
                                className="settings-btn settings-btn--danger"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            >
                                {showDeleteLoading ? <Loader2 size={16} className="spin" aria-hidden /> : null}
                                {showDeleteLoading ? t('deleting') : t('settingsDeletePermanently')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSalesModal && (
                <div className="settings-modal-overlay" onClick={() => !salesSending && setShowSalesModal(false)}>
                    <div className="settings-modal" role="dialog" aria-labelledby="contact-sales-title" onClick={(e) => e.stopPropagation()}>
                        <p id="contact-sales-title" className="settings-modal-title settings-modal-title--neutral">{t('contactSalesTitle')}</p>
                        <p className="settings-modal-desc">{t('contactSalesDesc')}</p>
                        <form onSubmit={handleSalesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="settings-field">
                                <label className="settings-label" htmlFor="sales-contact-email">{t('contactSalesEmailLabel')}</label>
                                <input
                                    id="sales-contact-email"
                                    type="email"
                                    className="settings-input"
                                    value={salesEmail}
                                    onChange={(e) => setSalesEmail(e.target.value)}
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    disabled={salesSending}
                                />
                            </div>
                            <div className="settings-modal-actions">
                                <button type="button" className="settings-btn--ghost" onClick={() => setShowSalesModal(false)} disabled={salesSending}>
                                    {t('cancel')}
                                </button>
                                <button type="submit" className="settings-btn settings-btn--primary" disabled={salesSending}>
                                    {showSalesLoading ? <Loader2 size={16} className="spin" aria-hidden /> : null}
                                    {showSalesLoading ? t('contactSalesSending') : t('contactSalesSend')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;
