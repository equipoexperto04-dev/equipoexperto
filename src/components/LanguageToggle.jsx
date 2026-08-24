import React from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = ({ className = "" }) => {
    const { language, toggleLanguage } = useTranslation();

    return (
        <button 
            onClick={toggleLanguage}
            title={language === 'en' ? "Cambiar a Español" : "Switch to English"}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 group ${className}`}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em'
            }}
        >
            <Globe size={14} className="text-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center" style={{ gap: '4px' }}>
                <span style={{ 
                    opacity: language === 'en' ? 1 : 0.4,
                    color: language === 'en' ? 'inherit' : 'var(--text-secondary)'
                }}>EN</span>
                
                <span style={{ opacity: 0.2, margin: '0 2px' }}>/</span>
                
                <span style={{ 
                    opacity: language === 'es' ? 1 : 0.4,
                    color: language === 'es' ? 'inherit' : 'var(--text-secondary)'
                }}>ES</span>
            </div>
        </button>
    );
};

export default LanguageToggle;
