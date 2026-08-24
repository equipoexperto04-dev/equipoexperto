// src/pages/Automations.jsx — simple employee hub (Manus / Accio style)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus, Activity, Power, Trash2, ChevronRight, Users, Link2 } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import { useTranslation } from '../context/LanguageContext';
import { usePlanEntitlements, turningOnWouldExceedSlotLimit } from '../context/PlanEntitlementsContext';
import { EMPLOYEES } from '../constants/employees.js';
import './Automations.css';
import API_URL from '../config.js';

const Automations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { entitlements, dashSnapshot, refresh, loading: planStatsLoading } = usePlanEntitlements();

  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState({ reviewFunnel: false, leadCapture: false, leadFollowUp: false });
  const [configured, setConfigured] = useState({ reviewFunnel: false, leadCapture: false, leadFollowUp: false });
  const [toggling, setToggling] = useState(null);
  const [firing, setFiring] = useState(null);
  const [confirmFire, setConfirmFire] = useState(null);
  const [deleteRelatedData, setDeleteRelatedData] = useState(false);
  const failStatsOnceRef = useRef(false);

  useEffect(() => {
    if (!dashSnapshot) return;
    if (dashSnapshot.recipes) setRecipes(dashSnapshot.recipes);
    if (dashSnapshot.configured) setConfigured(dashSnapshot.configured);
    failStatsOnceRef.current = false;
    setLoading(false);
  }, [dashSnapshot]);

  useEffect(() => {
    if (!planStatsLoading && !dashSnapshot && !failStatsOnceRef.current) {
      failStatsOnceRef.current = true;
      toast(t('dashboardLoadError'), 'error');
      setLoading(false);
    }
  }, [planStatsLoading, dashSnapshot, toast, t]);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  const handleToggle = async (key, title) => {
    if (!configured[key]) return;
    const newState = !recipes[key];
    const maxEmp = Number(entitlements.max_employees) || 1;
    if (turningOnWouldExceedSlotLimit(recipes, key, maxEmp, newState)) {
      toast(t('planEmployeeLimitReached', { max: maxEmp }), 'warning');
      return;
    }
    setToggling(key);
    setRecipes((prev) => ({ ...prev, [key]: newState }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/config/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe: key, is_active: newState }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRecipes((prev) => ({ ...prev, [key]: !newState }));
        if (data.code === 'EMPLOYEE_PLAN_LIMIT') {
          toast(t('planEmployeeLimitReached', { max: data.max_employees ?? maxEmp }), 'warning');
        } else {
          toast(t('automationUpdateError'), 'error');
        }
        return;
      }
      toast(newState ? t('toastActivated', { title }) : t('toastPaused', { title }), newState ? 'success' : 'info');
      refresh();
    } catch {
      setRecipes((prev) => ({ ...prev, [key]: !newState }));
      toast(t('automationUpdateError'), 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleFire = async (key, title) => {
    setFiring(key);
    setConfirmFire(null);
    const shouldDeleteData = deleteRelatedData;
    setDeleteRelatedData(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/config/automation`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipe: key, deleteRelatedData: shouldDeleteData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast(data.message || t('removalFailed'), 'error');
        return;
      }
      setConfigured((prev) => ({ ...prev, [key]: false }));
      setRecipes((prev) => ({ ...prev, [key]: false }));
      toast(t('toastRemoved', { title }), 'info');
      await refresh();
    } catch {
      toast(t('removalFailed'), 'error');
    } finally {
      setFiring(null);
    }
  };

  const hiredCount = Object.values(configured).filter(Boolean).length;
  const activeCount = Object.values(recipes).filter(Boolean).length;

  return (
    <div className="employees-page employees-page--simple">
      <header className="employees-hero">
        <div>
          <h1 className="employees-title">{t('yourDigitalTeam')}</h1>
          <p className="employees-subtitle">{t('teamIntroSimple')}</p>
        </div>
        {hiredCount < EMPLOYEES.length && (
          <button type="button" className="hire-cta-btn" onClick={() => navigate('/dashboard/create-automation')}>
            <Plus size={16} />
            {t('hireEmployee')}
          </button>
        )}
      </header>

      <div className="employees-quick-links" role="navigation" aria-label={t('quickLinksAria')}>
        <Link to="/dashboard/leads" className="employees-quick-link">
          <Users size={18} />
          <span>{t('titleContacts')}</span>
          <ChevronRight size={16} />
        </Link>
        <Link to="/dashboard/integrations" className="employees-quick-link">
          <Link2 size={18} />
          <span>{t('titleIntegrations')}</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="employees-skeleton-stack">
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </div>
      ) : (
        <ol className="employees-simple-list">
          {EMPLOYEES.map((emp, index) => {
            const title = t(emp.titleKey);
            const short = t(emp.shortKey);
            const tagline = t(emp.taglineKey);
            const isHired = configured[emp.key];
            const isOn = recipes[emp.key];
            const Icon = emp.Icon;

            return (
              <li key={emp.key} className={`employee-simple-card ${isHired ? 'is-hired' : ''} ${isOn ? 'is-on' : ''}`}>
                <div className="employee-simple-step" aria-hidden>
                  {index + 1}
                </div>
                <div className="employee-simple-icon" style={{ background: emp.colorBg }}>
                  <Icon size={24} style={{ color: emp.color }} />
                </div>
                <div className="employee-simple-body">
                  <div className="employee-simple-top">
                    <h2 className="employee-simple-name">{short}</h2>
                    <span className={`employee-simple-pill ${!isHired ? 'pill-setup' : isOn ? 'pill-on' : 'pill-paused'}`}>
                      {!isHired ? t('badgeNotHiredYet') : isOn ? t('statusActive') : t('statusPausedLabel')}
                    </span>
                  </div>
                  <p className="employee-simple-title-full">{title}</p>
                  <p className="employee-simple-tagline">{tagline}</p>
                  {isHired && emp.key === 'reviewFunnel' && (
                    <Link to="/dashboard/feedback" className="employee-simple-inline-link">
                      {t('reviewsViewOpinions')} →
                    </Link>
                  )}
                  {isHired && !dashSnapshot?.employeeIntroDone?.[emp.key] && (
                    <p className="employee-simple-next">
                      <strong>{t('employeeNextStepLabel')}</strong> {t(emp.nextKey)}
                    </p>
                  )}
                </div>
                <div className="employee-simple-actions">
                  {isHired ? (
                    <>
                      <button
                        type="button"
                        className="employee-simple-primary"
                        onClick={() => navigate(emp.configPath)}
                      >
                        {t('employeeOpenSetup')}
                        <ChevronRight size={18} />
                      </button>
                      <button
                        type="button"
                        className={`employee-simple-toggle ${isOn ? 'on' : 'off'}`}
                        onClick={() => handleToggle(emp.key, title)}
                        disabled={toggling === emp.key}
                        aria-pressed={isOn}
                      >
                        <Power size={16} />
                        {isOn ? t('employeeTurnOff') : t('employeeTurnOn')}
                      </button>
                      <button
                        type="button"
                        className="employee-simple-remove"
                        onClick={() => setConfirmFire(emp.key)}
                        disabled={firing === emp.key}
                        aria-label={t('removeEmployee')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="employee-simple-primary employee-simple-primary--hire"
                      onClick={() => navigate(`/dashboard/create-automation?goal=${emp.goal}`)}
                    >
                      {t('hireThisEmployee')}
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!loading && hiredCount > 0 && (
        <p className="employees-footer-note">
          <Activity size={14} aria-hidden />
          {t('teamFooter', { active: activeCount, hired: hiredCount })}
        </p>
      )}

      {confirmFire && (() => {
        const emp = EMPLOYEES.find((e) => e.key === confirmFire);
        const empTitle = t(emp.titleKey);
        const dataLabel =
          confirmFire === 'reviewFunnel' ? t('fireDeleteReviews') : t('fireDeleteLeads');
        return (
          <div className="fire-modal-overlay" onClick={() => { setConfirmFire(null); setDeleteRelatedData(false); }}>
            <div className="fire-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="fire-modal-icon" style={{ background: emp?.colorBg }}>
                <emp.Icon size={22} style={{ color: emp?.color }} />
              </div>
              <h3 className="fire-modal-title">{t('letGoTitle', { title: empTitle })}</h3>
              <p className="fire-modal-desc">{t('letGoDesc')}</p>
              <label className="fire-modal-data-opt">
                <input
                  type="checkbox"
                  checked={deleteRelatedData}
                  onChange={(e) => setDeleteRelatedData(e.target.checked)}
                />
                <span>{dataLabel}</span>
              </label>
              <div className="fire-modal-actions">
                <button type="button" className="fire-modal-cancel" onClick={() => { setConfirmFire(null); setDeleteRelatedData(false); }}>
                  {t('cancelBtn')}
                </button>
                <button
                  type="button"
                  className="fire-modal-confirm"
                  onClick={() => handleFire(confirmFire, empTitle)}
                  disabled={firing === confirmFire}
                >
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

export default Automations;
