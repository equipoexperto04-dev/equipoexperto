import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Inline tooltip hint component.
 * Usage: <Tooltip text="Explain something helpful here" />
 */
const Tooltip = ({ text, children }) => {
    const [visible, setVisible] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children || (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    opacity: 0.6,
                    cursor: 'help',
                    transition: 'opacity 0.15s ease',
                }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                >
                    <HelpCircle size={14} />
                </span>
            )}
            {visible && (
                <span style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-card)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    padding: '0.5rem 0.875rem',
                    borderRadius: '10px',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '220px',
                    textAlign: 'center',
                    zIndex: 9000,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                    pointerEvents: 'none',
                    animation: 'tooltipFade 0.15s ease',
                }}>
                    {text}
                    {/* Arrow */}
                    <span style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid var(--text-primary)',
                    }} />
                </span>
            )}
            <style>{`@keyframes tooltipFade { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        </span>
    );
};

export default Tooltip;
