import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Settings, Activity, LogOut,
    User, ChevronDown, Bell, ChevronRight, Link2,
    Zap, Users, ShieldAlert, ShoppingBag, SquareCheck, Circle,
    MessageSquare, Gauge, Newspaper, Star,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import LanguageToggle from '../components/LanguageToggle';
import SetupProgressBanner from '../components/SetupProgressBanner';
import OnboardingFlow from '../components/OnboardingFlow';
import { useTranslation } from '../context/LanguageContext';
import { PlanEntitlementsProvider } from '../context/PlanEntitlementsContext';
import { useToast } from '../components/Toast';
import SupportFloatingWidget from '../components/SupportFloatingWidget';
import './DashboardLayout.css';
import API_URL from '../config.js';
import { hasCompletedOnboarding } from '../utils/onboarding.js';
import { cacheUserProfile, clearClientSession, readCachedUserProfile } from '../utils/sessionClient.js';

const DashboardLayout = () => {
    const { t, formatRelativeTime } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [recipeStatus, setRecipeStatus] = useState({
        leadFollowUp: false,
        leadCapture: false,
        reviewFunnel: false,
    });
    const [recipeConfigured, setRecipeConfigured] = useState({
        leadFollowUp: false,
        leadCapture: false,
        reviewFunnel: false,
    });

    useEffect(() => {
        const handleNotifPopup = (e) => {
            const { count, message } = e.detail || { count: 1 };
            const bell = document.querySelector('.header-icon-btn');
            if (!bell) return;

            const line =
                typeof message === 'string' && message.trim()
                    ? message
                    : t('messageSent', { count });

            const popup = document.createElement('div');
            popup.className = 'notif-pop-hint';

            const content = document.createElement('div');
            content.className = 'notif-pop-content';

            const dot = document.createElement('span');
            dot.className = 'notif-pop-dot';

            const textSpan = document.createElement('span');
            textSpan.textContent = line;

            content.append(dot, textSpan);

            const arrow = document.createElement('div');
            arrow.className = 'notif-pop-arrow';

            popup.append(content, arrow);
            document.body.appendChild(popup);

            const rect = bell.getBoundingClientRect();

            popup.style.position = 'fixed';
            popup.style.top = `${rect.bottom + 15}px`;
            popup.style.right = `${window.innerWidth - rect.right - 10}px`;
            popup.style.zIndex = '9999';

            const nd = bell.querySelector('.notification-dot');
            if (nd) nd.style.display = 'block';

            setTimeout(() => {
                popup.classList.add('fade-out');
                setTimeout(() => popup.remove(), 500);
            }, 4000);
        };

        window.addEventListener('showNotifPopup', handleNotifPopup);

        return () => {
            window.removeEventListener('showNotifPopup', handleNotifPopup);
        };
    }, []);

    // Stable helper for active navigation states
    const isActive = (path) => location.pathname === path;

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [user, setUser] = useState(() => {
        return readCachedUserProfile();
    });
    const profileRef = useRef(null);
    const notificationRef = useRef(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!user || hasCompletedOnboarding(user)) {
            setShowOnboarding(false);
            return;
        }
        const blocked =
            location.pathname.startsWith('/dashboard/create-automation') ||
            location.pathname.startsWith('/dashboard/integrations') ||
            location.pathname.startsWith('/dashboard/employee');
        if (blocked) {
            setShowOnboarding(false);
            return;
        }
        setShowOnboarding(true);
    }, [user, location.pathname, location.search]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // 2. Fetch Fresh User Profile (Smart Fetch - skip if just logged in)
        const fetchProfile = async () => {
            const lastFetch = localStorage.getItem('last_profile_sync');
            const now = Date.now();

            // Use cached profile for 30 min — unless billing/admin flags missing or onboarding not finished
            if (
                user &&
                Object.prototype.hasOwnProperty.call(user, 'is_admin') &&
                Object.prototype.hasOwnProperty.call(user, 'has_dashboard_access') &&
                hasCompletedOnboarding(user) &&
                lastFetch &&
                now - parseInt(lastFetch, 10) < 1800000
            ) {
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/profile`, {
                    credentials: 'include',
                });

                // Only force-logout on 401 Unauthorized — never on 5xx server errors
                if (res.status === 401) {
                    clearClientSession();
                    navigate('/login');
                    return;
                }

                // Any non-2xx that isn't 401: keep the user logged in using cached data
                if (!res.ok) return;

                const data = await res.json();
                if (data.success && data.user) {
                    setUser(data.user);
                    cacheUserProfile(data.user);
                }
                // If data.success is false but status was 200, don't auto-logout —
                // ambiguous server response; cached data is still valid.
            } catch {
                // Network error — keep user logged in with cached data
            }
        };
        fetchProfile();

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [navigate]);

    useEffect(() => {
        const fetchRecipeStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/stats`, {
                    credentials: 'include',
                });
                if (!res.ok) return;
                const data = await res.json();
                if (data?.success && data?.recipes) {
                    setRecipeStatus({
                        leadFollowUp: !!data.recipes.leadFollowUp,
                        leadCapture: !!data.recipes.leadCapture,
                        reviewFunnel: !!data.recipes.reviewFunnel,
                    });
                    setRecipeConfigured({
                        leadFollowUp: !!data.configured?.leadFollowUp,
                        leadCapture: !!data.configured?.leadCapture,
                        reviewFunnel: !!data.configured?.reviewFunnel,
                    });
                }
            } catch {
                /* no-op */
            }
        };
        fetchRecipeStatus();

        const onFocus = () => fetchRecipeStatus();
        const onRefresh = () => fetchRecipeStatus();
        const interval = setInterval(fetchRecipeStatus, 45000);

        window.addEventListener('focus', onFocus);
        window.addEventListener('entitlements:refresh', onRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('entitlements:refresh', onRefresh);
        };
    }, [location.pathname]);

    useEffect(() => {
        const lastSeenKey = 'activity_failed_seen_at';
        const pollFailed = async () => {
            try {
                const res = await fetch(`${API_URL}/api/activity-logs`, {
                    credentials: 'include',
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!data.success || !Array.isArray(data.logs)) return;

                const failed = data.logs.filter((l) => l.status === 'Failed');
                if (failed.length === 0) return;

                const newest = failed[0]?.created_at;
                if (!newest) return;

                const lastSeen = localStorage.getItem(lastSeenKey);
                if (!lastSeen || new Date(newest) > new Date(lastSeen)) {
                    toast(t('automationFailureToast'), 'error', 8000);
                    localStorage.setItem(lastSeenKey, newest);
                    const dot = document.querySelector('.notification-dot');
                    if (dot) dot.style.display = 'block';
                }
            } catch {
                /* noop */
            }
        };

        pollFailed();
        const interval = setInterval(pollFailed, 90000);
        return () => clearInterval(interval);
    }, [toast, t]);

    const fetchNotifications = async () => {
        if (loadingNotifications) return;
        setLoadingNotifications(true);
        try {
            const res = await fetch(`${API_URL}/api/activity-logs`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.logs.slice(0, 5)); // Just top 5
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const toggleNotifications = () => {
        if (!isNotificationsOpen) {
            fetchNotifications();
            // Clear the badge when user views notifications
            const dot = document.querySelector('.notification-dot');
            if (dot) dot.style.display = 'none';
        }
        setIsNotificationsOpen(!isNotificationsOpen);
        setIsProfileOpen(false);
    };

    const handleLogout = () => {
        fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        }).catch(() => {});
        const keysToClear = [
            'token',
            'user_profile',
            'last_profile_sync',
            'glowLeads',
            'marketplaceActiveJobId',
            'onboardingStep',
            'onboardingAnswers',
            'welcomeOnboardingSeen',
            'mm_show_onboarding',
            'mm_onboarding_done',
            'mm_onboard_goal',
            'trial_end',
        ];
        keysToClear.forEach((k) => {
            try {
                localStorage.removeItem(k);
            } catch {
                /* ignore */
            }
        });
        clearClientSession();
        navigate('/login');
    };

    const getPageTitle = () => {
        const path = location.pathname;

        if (path === '/dashboard/employee-gallery') return t('titleEmployeeGallery');
        if (path === '/dashboard/translations-editor') return t('titleTranslationsEditor');
        if (path === '/dashboard') return t('titleOverview');
        if (path === '/dashboard/employee') return t('titleEmployee');
        if (path.startsWith('/dashboard/employee/')) return t('titleSetup');
        if (path === '/dashboard/automations') return t('titleEmployeeGallery');
        if (path === '/dashboard/create-automation') return t('titleSetup');
        if (path === '/dashboard/integrations') return t('titleIntegrations');
        if (path === '/dashboard/admin/errors') return t('titleAdminErrors');
        if (path === '/dashboard/admin/users') return 'User Directory';
        if (path === '/dashboard/leads') return t('titleContacts');
        if (path === '/dashboard/feedback') return t('titleReviews');
        if (path === '/dashboard/marketplace') return t('titleMarketplace');
        if (path === '/dashboard/settings' || path === '/dashboard/profile') return t('titleSettings');
        if (path === '/dashboard/config/review-funnel') return t('empReviewShort');
        if (path === '/dashboard/config/lead-capture') return t('empLeadShort');
        if (path === '/dashboard/config/lead-followup') return t('empFollowShort');
        if (path === '/dashboard/optimization') return t('sidebarOptimization');
        if (path === '/dashboard/content-reviews') return t('sidebarContentReviews');
        if (path === '/dashboard/review-booster') return t('sidebarReviewBooster');

        return t('titleOverview');
    };

    return (
        <PlanEntitlementsProvider>
        <div className="layout-container">
            {/* ─── SIDEBAR ─── */}
            <aside id="dashboard-sidebar" className="sidebar">
                <div className="sidebar-header" onClick={() => {
                    navigate('/dashboard');
                }}>
                    <img 
                        src="/equipoexperto.jpg" 
                        alt="Equipo Experto Logo" 
                        className="sidebar-logo-img" 
                        loading="eager"
                        fetchPriority="high"
                    />
                    <span className="logo-text">{t('appTitle')}</span>
                </div>

                <nav className="sidebar-nav" aria-label={t('sidebarNavAria')}>
                    {user?.is_admin && (
                        <div className="nav-group">
                            <span className="nav-label">System Admin</span>
                            <Link
                                to="/dashboard/admin/users"
                                className={`nav-item ${isActive('/dashboard/admin/users') ? 'active' : ''}`}
                            >
                                <Users size={18} aria-hidden />
                                <span>User Directory</span>
                            </Link>
                            <Link
                                to="/dashboard/admin/errors"
                                className={`nav-item ${isActive('/dashboard/admin/errors') ? 'active' : ''}`}
                            >
                                <ShieldAlert size={18} aria-hidden />
                                <span>System Errors</span>
                            </Link>
                        </div>
                    )}

                    <div className="nav-group">
                        <span className="nav-label">{t('sidebarNavDaily')}</span>
                        <Link
                            to="/dashboard"
                            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                        >
                            <LayoutDashboard size={18} aria-hidden />
                            <span>{t('titleOverview')}</span>
                        </Link>
                        <Link
                            to="/dashboard/leads"
                            className={`nav-item ${isActive('/dashboard/leads') ? 'active' : ''}`}
                        >
                            <Users size={18} aria-hidden />
                            <span>{t('titleContacts')}</span>
                        </Link>
                        <Link
                            to="/dashboard/employee-gallery"
                            className={`nav-item ${
                                isActive('/dashboard/employee-gallery') ||
                                location.pathname.startsWith('/dashboard/automations') ||
                                location.pathname.startsWith('/dashboard/employee/') ||
                                location.pathname.startsWith('/dashboard/config/') ||
                                location.pathname.startsWith('/dashboard/create-automation')
                                    ? 'active'
                                    : ''
                            }`}
                        >
                            <Zap size={18} aria-hidden />
                            <span>{t('sidebarEmployees')}</span>
                        </Link>
                        {recipeConfigured.reviewFunnel && (
                            <Link
                                to="/dashboard/feedback"
                                className={`nav-item ${isActive('/dashboard/feedback') ? 'active' : ''}`}
                            >
                                <MessageSquare size={18} aria-hidden />
                                <span>{t('sidebarFeedback')}</span>
                            </Link>
                        )}
                    </div>

                    <div className="nav-group">
                        <span className="nav-label">{t('sidebarNavAgents')}</span>
                        <Link
                            to="/dashboard/config/lead-followup"
                            className={`nav-item ${
                                isActive('/dashboard/config/lead-followup') ? 'active' : ''
                            }`}
                        >
                            <SquareCheck size={18} aria-hidden />
                            <span>{t('sidebarFollowUpAgent')}</span>
                            <span className={`nav-status-pill ${recipeConfigured.leadFollowUp && recipeStatus.leadFollowUp ? 'active' : ''}`}>
                                {recipeConfigured.leadFollowUp && recipeStatus.leadFollowUp ? t('sidebarAgentActive') : t('sidebarAgentInactive')}
                            </span>
                        </Link>
                        <Link
                            to="/dashboard/config/lead-capture"
                            className={`nav-item nav-item--sub ${
                                isActive('/dashboard/config/lead-capture') ? 'active' : ''
                            }`}
                        >
                            <Circle size={12} aria-hidden />
                            <span>{t('sidebarLeadsAgent')}</span>
                            <span className={`nav-status-pill ${recipeConfigured.leadCapture && recipeStatus.leadCapture ? 'active' : ''}`}>
                                {recipeConfigured.leadCapture && recipeStatus.leadCapture ? t('sidebarAgentActive') : t('sidebarAgentInactive')}
                            </span>
                        </Link>
                        <Link
                            to="/dashboard/config/review-funnel"
                            className={`nav-item nav-item--sub ${
                                isActive('/dashboard/config/review-funnel') ? 'active' : ''
                            }`}
                        >
                            <Circle size={12} aria-hidden />
                            <span>{t('sidebarReviewsAgent')}</span>
                            <span className={`nav-status-pill ${recipeConfigured.reviewFunnel && recipeStatus.reviewFunnel ? 'active' : ''}`}>
                                {recipeConfigured.reviewFunnel && recipeStatus.reviewFunnel ? t('sidebarAgentActive') : t('sidebarAgentInactive')}
                            </span>
                        </Link>
                    </div>

                    <div className="nav-group">
                        <span className="nav-label">{t('sidebarNavGBP')}</span>
                        <Link
                            to="/dashboard/optimization"
                            className={`nav-item ${isActive('/dashboard/optimization') ? 'active' : ''}`}
                        >
                            <Gauge size={18} aria-hidden />
                            <span>{t('sidebarOptimization')}</span>
                        </Link>
                        <Link
                            to="/dashboard/content-reviews"
                            className={`nav-item ${isActive('/dashboard/content-reviews') ? 'active' : ''}`}
                        >
                            <Newspaper size={18} aria-hidden />
                            <span>{t('sidebarContentReviews')}</span>
                        </Link>
                        <Link
                            to="/dashboard/review-booster"
                            className={`nav-item ${isActive('/dashboard/review-booster') ? 'active' : ''}`}
                        >
                            <Star size={18} aria-hidden />
                            <span>{t('sidebarReviewBooster')}</span>
                        </Link>
                    </div>

                    <div className="nav-group">
                        <span className="nav-label">{t('sidebarNavSettingsGroup')}</span>
                        <Link
                            to="/dashboard/integrations"
                            className={`nav-item ${isActive('/dashboard/integrations') ? 'active' : ''}`}
                        >
                            <Link2 size={18} aria-hidden />
                            <span>{t('sidebarIntegrations')}</span>
                        </Link>
                        <Link
                            to="/dashboard/settings"
                            className={`nav-item ${
                                location.pathname.startsWith('/dashboard/settings') ||
                                location.pathname.startsWith('/dashboard/profile')
                                    ? 'active'
                                    : ''
                            }`}
                        >
                            <Settings size={18} aria-hidden />
                            <span>{t('sidebarSettings')}</span>
                        </Link>
                        <Link
                            to="/dashboard/marketplace"
                            className={`nav-item ${isActive('/dashboard/marketplace') ? 'active' : ''}`}
                        >
                            <ShoppingBag size={18} aria-hidden />
                            <span>{t('sidebarMarketplace')}</span>
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span>{t('navSignOut')}</span>
                    </button>
                </div>
            </aside>

            {/* ─── MAIN ─── */}
            <main className="main-area">
                <header className="top-header">
                    <div className="top-header-left">
                        <h1 className="header-title">{getPageTitle()}</h1>
                    </div>

                    <div className="header-actions">
                        <LanguageToggle className="mr-2" />
                        <ThemeToggle />

                        <div className="profile-menu-container" ref={notificationRef}>
                            <button
                                className={`header-icon-btn ${isNotificationsOpen ? 'is-open' : ''}`}
                                onClick={toggleNotifications}
                                aria-label={t('notifications')}
                                aria-expanded={isNotificationsOpen}
                            >
                                <Bell size={18} />
                                <span className="notification-dot"></span>
                            </button>

                            {isNotificationsOpen && (
                                <div className="notification-dropdown">
                                    <div className="dropdown-header">
                                        <h4 className="m-0">{t('recentActivity')}</h4>
                                        <span className="badge badge-success">{t('recentBadge')}</span>
                                    </div>
                                    <div className="dropdown-scroll-area">
                                        {loadingNotifications ? (
                                            <div className="dropdown-placeholder">{t('loadingActivity')}</div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((log) => (
                                                <div key={log.id} className="notification-item">
                                                    <div className="notification-item-header">
                                                        <span className="notification-label">{log.automation_name || log.trigger_type}</span>
                                                        <span className="notification-time">
                                                            {formatRelativeTime(log.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="notification-detail">{log.detail}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="dropdown-placeholder">{t('noActivity')}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="profile-menu-container" ref={profileRef}>
                            <button
                                className={`profile-trigger ${isProfileOpen ? 'is-open' : ''}`}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                aria-label={t('accountMenu')}
                                aria-expanded={isProfileOpen}
                            >
                                <div className="profile-avatar">{user ? (user.company_name || user.name || 'U').charAt(0).toUpperCase() : 'U'}</div>
                                <div className="profile-info">
                                    <span className="profile-name" title={user ? (user.company_name || user.name || user.email) : undefined}>
                                        {user ? (user.company_name || user.name || user.email) : t('loading')}
                                        {user?.is_admin && <span className="admin-badge">Admin</span>}
                                    </span>
                                    <span className="profile-role" style={{ textTransform: 'capitalize' }}>{user?.role || ''}</span>
                                </div>
                                <ChevronDown size={14} className={`profile-chevron ${isProfileOpen ? 'is-open' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-user-section">
                                        <p className="dropdown-user-name">
                                            {user ? (user.company_name || user.name || user.email) : t('loading')}
                                            {user?.is_admin && <span className="admin-badge">Admin</span>}
                                        </p>
                                        <p className="dropdown-user-email">{user?.email || ''}</p>
                                    </div>
                                    <div className="dropdown-menu-section">
                                        <Link
                                            to="/dashboard/settings"
                                            className="dropdown-menu-item"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <User size={16} className="item-icon" />
                                            <span>{t('navAccountSettings')}</span>
                                        </Link>
                                    </div>
                                    <hr className="dropdown-divider" />
                                    <div className="dropdown-menu-section">
                                        <button onClick={handleLogout} className="dropdown-menu-item dropdown-menu-item--danger">
                                            <LogOut size={16} className="item-icon" />
                                            <span>{t('navSignOut')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="content-wrapper">
                    <SetupProgressBanner
                        recipeConfigured={recipeConfigured}
                        recipeStatus={recipeStatus}
                    />
                    <Outlet context={{ user, setUser }} />
                </div>
            </main>
            <BottomNav />
            {showOnboarding && (
                <OnboardingFlow
                    user={user}
                    onComplete={() => setShowOnboarding(false)}
                    onUserUpdate={(u) => setUser(u)}
                />
            )}
            <SupportFloatingWidget />
        </div>
        </PlanEntitlementsProvider>
    );
};

export default DashboardLayout;
