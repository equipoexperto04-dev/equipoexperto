// src/components/BottomNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Settings } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './BottomNav.css';

const BottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'sidebarHome', exact: true },
    { to: '/dashboard/employee-gallery', icon: Zap, labelKey: 'sidebarEmployees', exact: false, alsoActive: ['/dashboard/employee/', '/dashboard/automations', '/dashboard/config/'] },
    { to: '/dashboard/leads', icon: Users, labelKey: 'sidebarLeads', exact: false },
    { to: '/dashboard/settings', icon: Settings, labelKey: 'sidebarSettings', exact: false, alsoActive: ['/dashboard/integrations', '/dashboard/marketplace'] },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey, exact, alsoActive = [] }) => {
        const active = exact
          ? pathname === to
          : pathname.startsWith(to) || alsoActive.some((p) => pathname.startsWith(p));
        const label = t(labelKey);
        return (
          <Link key={to} to={to} className={`bottom-nav-item ${active ? 'active' : ''}`} aria-label={label}>
            <Icon size={22} />
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
