import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, title, message, onClose, primaryActionText, onPrimaryAction, secondaryActionText, onSecondaryAction }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="success-modal animate-scale-in"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-modal-title"
                aria-describedby="success-modal-message"
            >
                <div className="success-icon-wrap">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 id="success-modal-title" className="text-3xl font-black tracking-tighter mb-2">{title || "Saved successfully"}</h2>
                <p id="success-modal-message" className="text-secondary font-medium mb-8">{message || "Your changes have been saved."}</p>
                
                <div className="flex flex-col gap-3 w-full">
                    {onPrimaryAction && (
                        <button 
                            type="button"
                            onClick={onPrimaryAction}
                            className="btn-primary py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-accent/20"
                        >
                            {primaryActionText || "Continue"}
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={onSecondaryAction || onClose}
                        className="text-secondary font-bold text-xs uppercase tracking-widest py-2 hover:text-primary transition-colors"
                    >
                        {secondaryActionText || "View Automation"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SuccessModal;
