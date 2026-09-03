import React, { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2, AlertCircle, Loader2, LifeBuoy } from 'lucide-react';
import API_URL from '../config.js';
import './SupportFloatingWidget.css';

const SupportFloatingWidget = ({ isOpenExternal, onCloseExternal }) => {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General Question',
        priority: 'medium',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const isOpen = Boolean(isOpenExternal || isOpenInternal);
    const handleClose = () => {
        if (onCloseExternal) onCloseExternal();
        setIsOpenInternal(false);
        setStatus('idle');
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const nameTrimmed = formData.name.trim();
        const emailTrimmed = formData.email.trim();
        const messageTrimmed = formData.message.trim();

        if (!nameTrimmed || !emailTrimmed || !messageTrimmed) {
            setStatus('error');
            setErrorMessage('Please fill in your name, email, and message.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/support/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameTrimmed,
                    email: emailTrimmed,
                    subject: formData.subject,
                    priority: formData.priority,
                    message: messageTrimmed,
                    source: 'customer_widget'
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: 'General Question', priority: 'medium', message: '' });
            } else {
                setStatus('error');
                setErrorMessage(data.message || 'Failed to submit support issue.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('Network connection error. Please try again.');
        }
    };

    return (
        <>
            {/* Floating FAB Button */}
            {!isOpen && (
                <button
                    className="support-widget-fab"
                    onClick={() => setIsOpenInternal(true)}
                    title="Customer Support"
                    aria-label="Open Customer Support"
                >
                    <LifeBuoy size={20} />
                    <span>Support</span>
                </button>
            )}

            {/* Support Ticket Modal */}
            {isOpen && (
                <div className="support-modal-backdrop" onClick={handleClose}>
                    <div className="support-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="support-modal-header">
                            <h3 className="support-modal-title">
                                <LifeBuoy size={20} className="text-accent" />
                                Customer Support & Help
                            </h3>
                            <button className="support-modal-close" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="support-modal-body">
                            {status === 'success' ? (
                                <div className="text-center py-6">
                                    <CheckCircle2 size={48} className="text-success mx-auto mb-3" style={{ color: '#22c55e' }} />
                                    <h4 className="font-bold text-xl mb-2">Issue Submitted!</h4>
                                    <p className="text-secondary text-sm mb-6">
                                        Your support ticket has been received and logged in our system. Our admin team will review it shortly.
                                    </p>
                                    <button className="support-submit-btn" onClick={handleClose}>
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-danger/10 text-danger text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                            <AlertCircle size={16} />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div className="support-form-group" style={{ marginBottom: 0 }}>
                                            <label>Your Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="support-form-input"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="support-form-group" style={{ marginBottom: 0 }}>
                                            <label>Your Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="support-form-input"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div className="support-form-group">
                                            <label>Topic / Category</label>
                                            <select
                                                name="subject"
                                                className="support-form-select"
                                                value={formData.subject}
                                                onChange={handleChange}
                                            >
                                                <option value="General Question">General Question</option>
                                                <option value="Billing & Subscription">Billing & Subscription</option>
                                                <option value="Technical Issue / Bug">Technical Issue / Bug</option>
                                                <option value="Feature Request">Feature Request</option>
                                            </select>
                                        </div>
                                        <div className="support-form-group">
                                            <label>Priority Level</label>
                                            <select
                                                name="priority"
                                                className="support-form-select"
                                                value={formData.priority}
                                                onChange={handleChange}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="support-form-group">
                                        <label>Describe your issue or question *</label>
                                        <textarea
                                            name="message"
                                            rows="4"
                                            className="support-form-textarea"
                                            placeholder="Provide details about your question or the issue you are facing..."
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="support-submit-btn"
                                        disabled={status === 'loading'}
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Submitting Issue...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                <span>Submit Issue to Support</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SupportFloatingWidget;
