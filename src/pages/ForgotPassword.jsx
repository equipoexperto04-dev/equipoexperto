import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './Auth.css';
import API_URL from '../config.js';
import { parseJsonResponse } from '../utils/parseJsonResponse.js';
import {
    mapFirebaseAuthError,
    sendFirebasePasswordReset,
    shouldUseFirebaseEmailPassword,
} from '../utils/firebaseAuth.js';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (shouldUseFirebaseEmailPassword) {
                await sendFirebasePasswordReset(email.trim());
            } else {
                const res = await fetch(`${API_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(30000),
                    body: JSON.stringify({ email: email.trim() })
                });
                const data = await parseJsonResponse(res);
                if (!data.success) {
                    throw new Error(data.message || 'Could not send password reset email.');
                }
            }
            setSuccess('Password reset email sent. Check your inbox.');
        } catch (err) {
            setError(mapFirebaseAuthError(err, 'Could not send password reset email.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="shadcn-auth-card animate-fade-in">
                <div className="border-beam"></div>

                <div className="shadcn-auth-header">
                    <img src="/equipoexperto.jpg" alt="Logo" className="auth-logo-img" style={{ margin: '0 auto 1.25rem auto', display: 'block', height: '40px', width: 'auto' }} />
                    <h2 className="shadcn-auth-title">{t('resetPassword')}</h2>
                    <p className="shadcn-auth-description">{t('enterEmailContinue')}</p>
                </div>

                {success ? (
                    <div className="success-message text-left w-full mt-4">
                        <div className="mb-6 p-4 rounded-lg flex flex-col items-start gap-2" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                            <CheckCircle2 size={24} />
                            <span className="font-bold text-sm">{success}</span>
                        </div>
                        <p className="text-xs text-secondary">Use the link in that email to choose a new password.</p>
                        <div className="shadcn-auth-footer mt-6">
                            <button
                                type="button"
                                className="shadcn-btn-primary"
                                onClick={() => navigate('/login')}
                            >
                                {t('signIn') || 'Sign In'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyEmail} className="auth-form mt-4">
                        {error && (
                            <div className="bg-danger/5 text-danger border border-danger/20 p-4 rounded-xl text-xs font-bold text-center mb-6 uppercase tracking-wider w-full">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="shadcn-auth-label" htmlFor="email">{t('workEmail')}</label>
                            <input
                                id="email"
                                type="email"
                                className="shadcn-auth-input"
                                placeholder="hello@business.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="shadcn-auth-footer mt-6">
                            <button
                                type="button"
                                className="shadcn-btn-outline"
                                onClick={() => navigate('/login')}
                            >
                                {t('signIn') || 'Sign In'}
                            </button>
                            <button
                                type="submit"
                                className="shadcn-btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><span className="wizard-spinner" style={{ marginRight: 8 }} /> {t('processing') || 'Sending...'}</>
                                ) : (
                                    t('sendResetEmail') || 'Send reset email'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
