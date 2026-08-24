// src/components/SkeletonLoader.jsx
import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--muted) 25%, var(--bg-secondary) 50%, var(--muted) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s infinite',
  borderRadius: 'var(--radius-sm)',
};

if (typeof document !== 'undefined' && !document.getElementById('skeleton-keyframe')) {
  const style = document.createElement('style');
  style.id = 'skeleton-keyframe';
  style.textContent = `@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(style);
}

export const SkeletonLine = ({ width = '100%', height = 16, style = {} }) => (
  <div style={{ ...shimmerStyle, width, height, ...style }} />
);

export const SkeletonCard = ({ height = 80 }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem', height
  }}>
    <SkeletonLine width="60%" height={14} />
    <SkeletonLine width="40%" height={12} />
  </div>
);

export const SkeletonRow = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-color)'
  }}>
    <div style={{ ...shimmerStyle, width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <SkeletonLine width="45%" height={14} />
      <SkeletonLine width="30%" height={12} />
    </div>
    <SkeletonLine width={60} height={24} style={{ borderRadius: 'var(--radius-full)' }} />
  </div>
);
