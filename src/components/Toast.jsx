import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

const ICONS = {
    success: <CheckCircle2 size={16} />,
    error:   <XCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    info:    <Info size={16} />,
};

const COLORS = {
    success: { bg: 'var(--accent-color)',   text: '#fff' },
    error:   { bg: '#ef4444',               text: '#fff' },
    warning: { bg: '#6b7280',               text: '#fff' },
    info:    { bg: '#6366f1',               text: '#fff' },
};

let nextId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
        }
        return id;
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none',
            }}>
                {toasts.map(t => {
                    const color = COLORS[t.type] || COLORS.info;
                    return (
                        <div key={t.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1.25rem',
                            borderRadius: '14px',
                            backgroundColor: color.bg,
                            color: color.text,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            minWidth: '280px',
                            maxWidth: '400px',
                            pointerEvents: 'all',
                            animation: 'toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
                        }}>
                            <span style={{ flexShrink: 0 }}>{ICONS[t.type]}</span>
                            <span style={{ flex: 1 }}>{t.message}</span>
                            <button
                                onClick={() => dismiss(t.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 0, display: 'flex' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(40px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0)    scale(1);    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
