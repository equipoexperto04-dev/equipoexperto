import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';
import DashboardSkeleton from '../components/DashboardSkeleton.jsx';
import { useTranslation } from '../context/LanguageContext';
import { usePlanEntitlements, turningOnWouldExceedSlotLimit } from '../context/PlanEntitlementsContext';
import './Dashboard.css';
import API_URL from '../config.js';
import { EMPLOYEES } from '../constants/employees.js';
import AdminErrorsPanel from '../components/AdminErrorsPanel.jsx';

/* ── Metric display atom ── */
const MetricItem = ({ value, label, accentColor }) => (
  <div className="dash-metric-item">
    <span className="dash-metric-value" style={accentColor ? { color: accentColor } : {}}>
      {value}
    </span>
    <span className="dash-metric-label">{label}</span>
  </div>
);

/* ── Per-employee metric sections ── */
const ReviewMetrics = ({ stats, t }) => {
  const qr = stats?.qr || {};
  const list = stats?.list || {};
  return (
    <div className="dash-metrics-body">
      <div className="dash-metrics-group">
        <span className="dash-metrics-group-title">{t('dashEmpQR')}</span>
        <div className="dash-metrics-row">
          <MetricItem value={qr.scans ?? 0} label={t('dashEmpQRScans')} />
          <MetricItem value={qr.answers ?? 0} label={t('dashEmpQRAnswers')} />
          <MetricItem
            value={qr.reviews ?? 0}
            label={t('dashEmpQRReviews')}
            accentColor={(qr.reviews ?? 0) > 0 ? '#16a34a' : undefined}
          />
        </div>
      </div>
      <div className="dash-metrics-group">
        <span className="dash-metrics-group-title">{t('dashEmpList')}</span>
        <div className="dash-metrics-row">
          <MetricItem value={list.sent ?? 0} label={t('dashEmpListSent')} />
          <MetricItem
            value={list.bounces ?? 0}
            label={t('dashEmpListBounced')}
            accentColor={(list.bounces ?? 0) > 0 ? '#d97706' : undefined}
          />
          <MetricItem value={list.answers ?? 0} label={t('dashEmpListAnswers')} />
          <MetricItem
            value={list.reviews ?? 0}
            label={t('dashEmpListReviews')}
            accentColor={(list.reviews ?? 0) > 0 ? '#16a34a' : undefined}
          />
          <MetricItem
            value={list.unsatisfied_alerts ?? 0}
            label={t('dashEmpListAlerts')}
            accentColor={(list.unsatisfied_alerts ?? 0) > 0 ? '#dc2626' : undefined}
          />
        </div>
      </div>
    </div>
  );
};

const CaptureMetrics = ({ stats, t }) => (
  <div className="dash-metrics-body">
    <div className="dash-metrics-group">
      <span className="dash-metrics-group-title">{t('dashEmpForm')}</span>
      <div className="dash-metrics-row">
        <MetricItem
          value={stats?.completed ?? 0}
          label={t('dashEmpFormFilled')}
          accentColor={(stats?.completed ?? 0) > 0 ? '#16a34a' : undefined}
        />
        <MetricItem
          value={stats?.abandoned ?? 0}
          label={t('dashEmpFormAbandoned')}
          accentColor={(stats?.abandoned ?? 0) > 0 ? '#d97706' : undefined}
        />
        <MetricItem
          value={stats?.high_priority ?? 0}
          label={t('dashEmpHighPriority')}
          accentColor={(stats?.high_priority ?? 0) > 0 ? '#dc2626' : undefined}
        />
      </div>
    </div>
  </div>
);

const FollowupMetrics = ({ stats, t }) => (
  <div className="dash-metrics-body">
    <div className="dash-metrics-group">
      <span className="dash-metrics-group-title">{t('dashEmpFollowupSection')}</span>
      <div className="dash-metrics-row">
        <MetricItem
          value={stats?.contacts ?? 0}
          label={t('dashEmpContacts')}
          accentColor={(stats?.contacts ?? 0) > 0 ? '#3b82f6' : undefined}
        />
        <MetricItem value={stats?.sent ?? 0} label={t('dashEmpSent')} />
        <MetricItem
          value={stats?.replied ?? 0}
          label={t('dashEmpReplied')}
          accentColor={(stats?.replied ?? 0) > 0 ? '#16a34a' : undefined}
        />
      </div>
      {(stats?.contacts ?? 0) > 0 && (stats?.sent ?? 0) > 0 && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {t('dashEmpFollowupNote', { emails: stats.sent, contacts: stats.contacts })}
        </p>
      )}
    </div>
  </div>
);

/* ── Today's snapshot row — only renders cards that have real activity ── */
const DashTodaySnapshot = ({ activityStats, configured, t }) => {
  const cards = [];

  if (configured.leadCapture) {
    const v = activityStats.leadCapture?.sent_today ?? 0;
    if (v > 0) cards.push({ key: 'capture', value: v, label: t('dashTodayNewContacts'), color: '#3b82f6' });
  }
  if (configured.reviewFunnel) {
    const v = activityStats.reviewFunnel?.sent_today ?? 0;
    if (v > 0) cards.push({ key: 'review', value: v, label: t('dashTodayReviewActivity'), color: '#f59e0b' });
  }
  if (configured.leadFollowUp) {
    const v = activityStats.leadFollowUp?.sent_today ?? 0;
    if (v > 0) cards.push({ key: 'followup', value: v, label: t('dashTodayFollowups'), color: '#8b5cf6' });
  }

  if (!cards.length) return null;

  return (
    <div className="dash-stats-row" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
      {cards.map((c) => (
        <div className="dash-stat-card" key={c.key}>
          <span className="dash-stat-label">{c.label}</span>
          <span className="dash-stat-value" style={{ color: c.color }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── ROI / value snapshot — translates automation activity into $ + hours saved ── */
// Conservative, clearly-labeled estimates so the numbers stay defensible:
const ROI_VALUE_PER_LEAD = 20;       // avg cost-per-lead via paid ads, replaced by an organic capture
const ROI_VALUE_PER_REVIEW = 50;     // marketing value of one new public 5-star review for a local biz
const ROI_MIN_PER_FOLLOWUP = 3;      // minutes saved per automated follow-up message
const ROI_MIN_PER_REVIEW_REQUEST = 2; // minutes saved per automated review request
const ROI_MIN_PER_LEAD = 1;          // minutes saved per lead auto-captured & auto-replied
const ROI_HOURLY_RATE = 25;          // $ value of an hour of owner/staff time

const DashROISnapshot = ({ activityStats, configured, t, language }) => {
  const captureStats = activityStats.leadCapture?.detailed_stats || {};
  const followupStats = activityStats.leadFollowUp?.detailed_stats || {};
  const reviewStats = activityStats.reviewFunnel?.detailed_stats || {};

  const leadsCaptured = configured.leadCapture ? (captureStats.completed ?? 0) : 0;
  const followupsSent = configured.leadFollowUp ? (followupStats.sent ?? 0) : 0;
  const reviewsCollected = configured.reviewFunnel
    ? ((reviewStats.list?.reviews ?? 0) + (reviewStats.qr?.reviews ?? 0))
    : 0;
  const reviewRequestsSent = configured.reviewFunnel ? (reviewStats.list?.sent ?? 0) : 0;

  const totalActivity = leadsCaptured + followupsSent + reviewsCollected + reviewRequestsSent;
  if (totalActivity === 0) return null;

  const minutesSaved =
    leadsCaptured * ROI_MIN_PER_LEAD +
    followupsSent * ROI_MIN_PER_FOLLOWUP +
    reviewRequestsSent * ROI_MIN_PER_REVIEW_REQUEST;
  const hoursSaved = minutesSaved / 60;

  const dollarValue =
    leadsCaptured * ROI_VALUE_PER_LEAD +
    reviewsCollected * ROI_VALUE_PER_REVIEW +
    hoursSaved * ROI_HOURLY_RATE;

  const fmtMoney = (n) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
  const fmtHours = (n) => new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(n);

  return (
    <div className="dash-roi-card">
      <div className="dash-roi-header">
        <span className="dash-roi-title">{t('dashRoiTitle')}</span>
        <span className="dash-roi-sub">{t('dashRoiSubtitle')}</span>
      </div>
      <div className="dash-roi-main">
        <div className="dash-roi-headline">
          <span className="dash-roi-headline-value">{fmtMoney(dollarValue)}</span>
          <span className="dash-roi-headline-label">{t('dashRoiValueLabel')}</span>
        </div>
        <div className="dash-roi-headline">
          <span className="dash-roi-headline-value">{fmtHours(hoursSaved)}h</span>
          <span className="dash-roi-headline-label">{t('dashRoiTimeLabel')}</span>
        </div>
      </div>
      <div className="dash-roi-breakdown">
        {leadsCaptured > 0 && (
          <span className="dash-roi-chip">{t('dashRoiLeadsChip', { count: leadsCaptured })}</span>
        )}
        {reviewsCollected > 0 && (
          <span className="dash-roi-chip">{t('dashRoiReviewsChip', { count: reviewsCollected })}</span>
        )}
        {followupsSent > 0 && (
          <span className="dash-roi-chip">{t('dashRoiFollowupsChip', { count: followupsSent })}</span>
        )}
      </div>
      <p className="dash-roi-disclaimer">{t('dashRoiDisclaimer')}</p>
    </div>
  );
};

/* ── Main Dashboard ── */
const Dashboard = () => {
  const { t, language, formatRelativeTime } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entitlements, billing, dashSnapshot, refresh, loading: statsLoading } = usePlanEntitlements();

  const [recipes, setRecipes] = useState({ reviewFunnel: false, leadCapture: false, leadFollowUp: false });
  const [configured, setConfigured] = useState({ reviewFunnel: false, leadCapture: false, leadFollowUp: false });
  const [lastTriggers, setLastTriggers] = useState({ reviewFunnel: null, leadCapture: null, leadFollowUp: null });
  const [confirmFire, setConfirmFire] = useState(null);
  const [firing, setFiring] = useState(null);
  const [activityStats, setActivityStats] = useState({});

  useEffect(() => {
    if (!dashSnapshot) return;
    if (dashSnapshot.recipes) setRecipes(dashSnapshot.recipes);
    if (dashSnapshot.configured) setConfigured(dashSnapshot.configured);
    if (dashSnapshot.lastTriggers) setLastTriggers(dashSnapshot.lastTriggers);
  }, [dashSnapshot]);

  useEffect(() => {
    const interval = setInterval(() => refresh(), 60000);
    const onRefocus = () => refresh();
    window.addEventListener('focus', onRefocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onRefocus); };
  }, [refresh]);

  /* Fetch per-employee activity metrics */
  const fetchActivity = useCallback(async () => {
    const toFetch = [
      configured.reviewFunnel  && { key: 'reviewFunnel',  param: 'review'   },
      configured.leadCapture   && { key: 'leadCapture',   param: 'capture'  },
      configured.leadFollowUp  && { key: 'leadFollowUp',  param: 'followup' },
    ].filter(Boolean);
    if (!toFetch.length) return;

    const token = localStorage.getItem('token');
    const results = await Promise.all(
      toFetch.map(async ({ key, param }) => {
        try {
          const res = await fetch(`${API_URL}/api/stats/activity?employee=${param}`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return { key, data: null };
          const data = await res.json();
          return { key, data: data.success ? data : null };
        } catch {
          return { key, data: null };
        }
      })
    );
    const stats = {};
    results.forEach(({ key, data }) => { if (data) stats[key] = data; });
    setActivityStats(stats);
  }, [configured]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const toggleRecipe = async (key) => {
    const newState = !recipes[key];
    const maxEmp = Number(entitlements.max_employees) || 1;
    if (turningOnWouldExceedSlotLimit(recipes, key, maxEmp, newState)) {
      toast(t('planEmployeeLimitReached', { max: maxEmp }), 'warning');
      return;
    }
    setRecipes(prev => ({ ...prev, [key]: newState }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/config/toggle`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe: key, is_active: newState }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (!res.ok) {
        setRecipes(prev => ({ ...prev, [key]: !newState }));
        if (data.code === 'EMPLOYEE_PLAN_LIMIT') {
          toast(t('planEmployeeLimitReached', { max: data.max_employees ?? maxEmp }), 'warning');
        } else {
          toast(t('automationUpdateError'), 'error');
        }
        return;
      }
      const emp = EMPLOYEES.find(e => e.key === key);
      const title = emp ? t(emp.shortKey) : key;
      toast(newState ? t('toastActivated', { title }) : t('toastPaused', { title }), newState ? 'success' : 'info');
      refresh();
    } catch {
      toast(t('automationUpdateError'), 'error');
      setRecipes(prev => ({ ...prev, [key]: !newState }));
    }
  };

  const handleFire = async (key) => {
    setFiring(key);
    setConfirmFire(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/config/automation`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe: key }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      setConfigured(prev => ({ ...prev, [key]: false }));
      setRecipes(prev => ({ ...prev, [key]: false }));
      const emp = EMPLOYEES.find(e => e.key === key);
      const title = emp ? t(emp.shortKey) : key;
      toast(t('toastRemoved', { title }), 'info');
      refresh();
    } catch {
      toast(t('automationUpdateError'), 'error');
    } finally {
      setFiring(null);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user_profile') || '{}'); } catch { return {}; }
  })();
  const isAdmin = storedUser?.is_admin === true;
  const userName = storedUser?.company_name || storedUser?.name || 'there';

  const trialActive = billing?.trial_active === true;
  const trialEndIso = billing?.trial_ends_at;
  const trialDaysLeft =
    trialActive && trialEndIso
      ? Math.max(0, Math.ceil((new Date(trialEndIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  const hasAnyConfiguredRecipe = Object.values(configured).some(Boolean);
  const activeCount = Object.entries(recipes).filter(([k, v]) => v && configured[k]).length;

  if (statsLoading && dashSnapshot === null) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page">

      {/* Trial Banner */}
      {trialActive && (
        <div className="trial-banner">
          <div className="trial-banner-content">
            <span className="trial-badge">{t('freeTrial')}</span>
            <span className="trial-text">
              {trialDaysLeft} {trialDaysLeft === 1 ? t('dayLeft') : t('daysLeft')} · {t('upgradeToContinue')}
            </span>
          </div>
          <Link to="/dashboard/settings" className="trial-upgrade-btn">{t('upgradeNow')}</Link>
        </div>
      )}

      {isAdmin && <AdminErrorsPanel />}

      {/* Greeting */}
      <div className="dash-greeting">
        <h1 className="dash-greeting-title">{getGreeting()}, {userName}!</h1>
        <p className="dash-greeting-sub">{t('dashSubtitle')}</p>
      </div>

      {/* Status pill */}
      {hasAnyConfiguredRecipe && (
        <div className={`dash-status-pill ${activeCount > 0 ? 'running' : 'paused'}`}>
          <span className="dash-status-dot" />
          {activeCount > 0
            ? `${activeCount} ${activeCount > 1 ? t('automationsRunningPlural') : t('automationsRunning')}`
            : t('allAutomationsPaused')}
        </div>
      )}

      {/* Today's snapshot */}
      {hasAnyConfiguredRecipe && (
        <DashTodaySnapshot activityStats={activityStats} configured={configured} t={t} />
      )}

      {/* ROI / value snapshot */}
      {hasAnyConfiguredRecipe && (
        <DashROISnapshot activityStats={activityStats} configured={configured} t={t} language={language} />
      )}

      {/* ── First-time setup (no employees configured) ── */}
      {!hasAnyConfiguredRecipe ? (
        <div className="dash-onboarding-card">
          <div className="dash-onboarding-header">
            <div className="dash-onboarding-icon" aria-hidden="true">👋</div>
            <div>
              <h3 className="dash-onboarding-title">{t('welcomeSetupTitle')}</h3>
              <p className="dash-onboarding-desc">{t('welcomeSetupDesc')}</p>
            </div>
          </div>

          <div className="dash-onboarding-steps">
            {/* Step 1: the one and only action right now */}
            <div
              className="dash-onboarding-step dash-onboarding-step--active"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/dashboard/employee-gallery')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard/employee-gallery'); }}
            >
              <div className="dash-onboarding-step-num dash-onboarding-step-num--active">1</div>
              <div className="dash-onboarding-step-body">
                <p className="dash-onboarding-step-title">{t('dashStep1Title')}</p>
                <p className="dash-onboarding-step-desc">{t('dashStep1Desc')}</p>
              </div>
              <ArrowRight size={18} className="dash-onboarding-step-arrow" aria-hidden="true" />
            </div>

            {/* Step 2 & 3: previews of what's covered while hiring — not separate actions */}
            <div className="dash-onboarding-step dash-onboarding-step--preview">
              <div className="dash-onboarding-step-num">2</div>
              <div className="dash-onboarding-step-body">
                <p className="dash-onboarding-step-title">{t('dashStep2Title')}</p>
                <p className="dash-onboarding-step-desc">{t('dashStep2Desc')}</p>
              </div>
            </div>

            <div className="dash-onboarding-step dash-onboarding-step--preview">
              <div className="dash-onboarding-step-num">3</div>
              <div className="dash-onboarding-step-body">
                <p className="dash-onboarding-step-title">{t('dashStep3Title')}</p>
                <p className="dash-onboarding-step-desc">{t('dashStep3Desc')}</p>
              </div>
            </div>
            <p className="dash-onboarding-note">{t('dashStepsPreviewNote')}</p>
          </div>

          <button className="dash-empty-btn dash-onboarding-cta" onClick={() => navigate('/dashboard/employee-gallery')}>
            {t('hireFirstEmployeeBtn')}
          </button>
        </div>

      ) : (
        /* ── Per-employee report cards ── */
        <section className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">{t('yourEmployees')}</h2>
            <Link to="/dashboard/employee-gallery" className="dash-section-link">{t('manageAll')}</Link>
          </div>

          {activeCount > 0 && (
            <div className="dash-working-hint">
              <span className="dash-working-dot" />
              <span>{t('employeesWatchingHint')}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {EMPLOYEES.map(emp => {
              if (!configured[emp.key]) return null;
              const isOn = recipes[emp.key];
              const last = lastTriggers[emp.key];
              const stats = activityStats[emp.key]?.detailed_stats || {};
              const empTitle = t(emp.shortKey);

              return (
                <div key={emp.key} className="dash-emp-report" style={{ '--emp-color': emp.color, '--emp-color-bg': emp.colorBg }}>

                  {/* Card header */}
                  <div className="dash-emp-report-header">
                    <div className="dash-emp-report-identity">
                      <div className="dash-emp-report-icon">
                        <emp.Icon size={17} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <span className="dash-emp-report-name">{empTitle}</span>
                        {last && (
                          <span className="dash-emp-report-last">
                            {t('lastAction')}: {formatRelativeTime(last)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="dash-emp-report-controls">
                      <span className={`dash-recipe-badge ${isOn ? 'dash-recipe-badge--on' : 'dash-recipe-badge--off'}`}>
                        <span className="dash-recipe-badge-dot" />
                        {isOn ? t('statusActive') : t('statusPausedLabel')}
                      </span>
                      <button className="dash-recipe-configure" onClick={() => navigate(emp.configPath)}>
                        {t('editSetup')}
                      </button>
                      <button
                        className="dash-recipe-fire"
                        onClick={() => setConfirmFire(emp.key)}
                        disabled={firing === emp.key}
                        title={t('removeEmployee')}
                        aria-label={t('removeEmployee')}
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="dash-toggle-wrap">
                        <span className="dash-toggle-state-label" aria-live="polite">{isOn ? t('dashToggleOn') : t('dashToggleOff')}</span>
                        <button
                          className={`dash-toggle ${isOn ? 'dash-toggle--on' : 'dash-toggle--off'}`}
                          onClick={() => toggleRecipe(emp.key)}
                          aria-label={isOn ? t('dashPauseEmployee', { title: empTitle }) : t('dashActivateEmployee', { title: empTitle })}
                        >
                          <span className="dash-toggle-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  {emp.key === 'reviewFunnel' && <ReviewMetrics stats={stats} t={t} />}
                  {emp.key === 'leadCapture'  && <CaptureMetrics stats={stats} t={t} />}
                  {emp.key === 'leadFollowUp' && <FollowupMetrics stats={stats} t={t} />}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fire confirmation modal */}
      {confirmFire && (() => {
        const emp = EMPLOYEES.find(e => e.key === confirmFire);
        if (!emp) return null;
        const empTitle = t(emp.shortKey);
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
            onClick={() => setConfirmFire(null)}
          >
            <div
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', maxWidth: '360px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'modal-pop 0.2s ease-out' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: emp.colorBg, marginBottom: '0.25rem' }}>
                <emp.Icon size={22} style={{ color: emp.color }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{t('letGoTitle', { title: empTitle })}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{t('letGoDesc')}</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
                <button onClick={() => setConfirmFire(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                  {t('cancelBtn')}
                </button>
                <button
                  onClick={() => handleFire(confirmFire)}
                  disabled={firing === confirmFire}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: firing === confirmFire ? 0.6 : 1 }}
                >
                  <Trash2 size={14} />
                  {firing === confirmFire ? t('removing') : t('letGo')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
