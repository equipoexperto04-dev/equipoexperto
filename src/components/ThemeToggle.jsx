import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle-btn ${className}`}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
                color: theme === 'light' ? 'var(--text-secondary)' : '#fcd34d',
                transition: 'background-color 0.2s, color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
            {theme === 'light' ? (
                <Moon size={22} />
            ) : (
                <Sun size={22} />
            )}
        </button>
    );
};

export default ThemeToggle;
