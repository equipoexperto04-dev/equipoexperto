import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

/**
 * Accessible custom dropdown with theme-aware styling (native <select> option lists
 * cannot be styled reliably on dark backgrounds).
 */
export default function CustomSelect({
    label,
    value,
    options,
    onChange,
    name,
    variant = 'default',
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const rootRef = useRef(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const handleToggle = () => {
        if (!open && rootRef.current) {
            const rect = rootRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUp(spaceBelow < 180 && rect.top > spaceBelow);
        }
        setOpen((prev) => !prev);
    };

    const rootClass = [
        'custom-select',
        variant === 'compact' ? 'custom-select--compact' : '',
        open ? 'custom-select--open' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={rootClass} ref={rootRef}>
            <button
                type="button"
                className="select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                id={name ? `select-${name}` : undefined}
                onClick={handleToggle}
            >
                <span className="select-trigger-label">{selected?.label || label}</span>
                <ChevronDown size={14} className={`select-chevron ${open ? 'select-chevron--open' : ''}`} aria-hidden />
            </button>
            {open && (
                <ul className={`select-options${openUp ? ' select-options--up' : ''}`} role="listbox" aria-labelledby={name ? `select-${name}` : undefined}>
                    {options.map((opt) => {
                        const isActive = value === opt.value;
                        return (
                            <li key={opt.value || '__empty'} role="presentation">
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    className={`select-option ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
