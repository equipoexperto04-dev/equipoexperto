import React from 'react';

const ToggleSwitch = ({ checked, onChange, disabled, ariaLabel }) => {
    const toggle = () => {
        if (!disabled && onChange) onChange(!checked);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
        }
    };

    return (
        <div
            className={`toggle-track ${checked ? 'active' : 'inactive'} ${disabled ? 'disabled' : ''}`}
            onClick={toggle}
            onKeyDown={handleKeyDown}
            style={{ opacity: disabled ? 0.5 : 1 }}
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
        >
            <div className="toggle-thumb" />
        </div>
    );
};

export default ToggleSwitch;
