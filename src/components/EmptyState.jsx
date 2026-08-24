// src/components/EmptyState.jsx
import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action, actionLabel, secondAction, secondActionLabel }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '1rem'
  }}>
    {Icon && (
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--accent-light)', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={24} color="var(--accent-color)" />
      </div>
    )}
    <div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{description}</p>
      )}
    </div>
    <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      {action && actionLabel && (
        <button onClick={action} style={{
          background: 'var(--accent-color)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', padding: '0.625rem 1.25rem',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
          cursor: 'pointer', minHeight: '44px'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-color)'}
        >
          {actionLabel}
        </button>
      )}
      {secondAction && secondActionLabel && (
        <button onClick={secondAction} style={{
          background: 'transparent', color: 'var(--accent-color)',
          border: '1.5px solid var(--accent-color)',
          borderRadius: 'var(--radius-md)', padding: '0.625rem 1.25rem',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
          cursor: 'pointer', minHeight: '44px'
        }}>
          {secondActionLabel}
        </button>
      )}
    </div>
  </div>
);

export default EmptyState;
