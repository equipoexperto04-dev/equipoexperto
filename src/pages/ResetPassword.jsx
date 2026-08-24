import React, { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import './Auth.css';
import API_URL from '../config.js';
import { parseJsonResponse } from '../utils/parseJsonResponse.js';
import {
    mapFirebaseAuthError,
    resetPasswordWithFirebase,
    verifyFirebaseResetCode,
} from '../utils/firebaseAuth.js';

const ResetPassword = () => {
    const { t } = useTranslation();
    const { token: routeToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mode = searchParams.get('mode');
    const actionCode = searchParams.get('oobCode');
    const token = routeToken || searchParams.get('token');
    const usingFirebaseReset = mode === 'resetPassword' && !!actionCode;

    React.useEffect(() => {
        const checkToken = async () => {
            try {
                if (usingFirebaseReset) {
                    await verifyFirebaseResetCode(actionCode);
                    setIsVerified(true);
                } else if (!token) {
                    setError('This reset link is invalid or incomplete.');
                } else {
                    const res = await fetch(`${API_URL}/auth/verify-reset-token/${encodeURIComponent(token)}`, {
                        signal: AbortSignal.timeout(15000),
                    });
                    const data = await parseJsonResponse(res);
                    if (data.success) {
                        setIsVerified(true);
                    } else {
                        setError(data.message || 'This reset link is invalid or has expired.');
                    }
                }
            } catch (err) {
                setError(
                    usingFirebaseReset
                        ? mapFirebaseAuthError(err, 'Could not verify reset link.')
                        : 'Could not verify reset token. Please check your connection.'
                );
            } finally {
                setVerifying(false);
            }
        };
        checkToken();
    }, [token, usingFirebaseReset, actionCode]);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            if (usingFirebaseReset) {
                await resetPasswordWithFirebase(actionCode, password);
            } else {
                const res = await fetch(`${API_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000),
                    body: JSON.stringify({ token, newPassword: password })
                });
                const data = await parseJsonResponse(res);

                if (!data.success) {
                    setError(data.message || 'Error occurred');
                    setLoading(false);
                    return;
                }
            }

            setSuccess('Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (err) {
            setError(
                usingFirebaseReset
                    ? mapFirebaseAuthError(err, 'Could not reset password.')
                    : 'Network error. Please try again.'
            );
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-card animate-fade-in">
                <div className="auth-header text-center mb-6">
                    <div className="logo-icon mx-auto mb-4" style={{ display: 'flex', justifyContent: 'center' }}>
                        <img src="/equipoexperto.jpg" alt="Equipo Experto Logo" className="auth-logo-img" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{t('setNewPassword')}</h1>
                    <p className="text-secondary text-sm">{t('createSecurePassword')}</p>
                </div>

                {verifying ? (
                    <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-secondary">Verifying your reset link...</p>
                    </div>
                ) : !isVerified ? (
                    <div className="text-center">
                        <div className="text-danger bg-danger/10 p-4 rounded-md text-sm mb-6">
                            {error}
                        </div>
                        <Link to="/forgot-password" size="sm" className="text-accent font-medium hover:underline">
                            Request a new reset link
                        </Link>
                    </div>
                ) : !success ? (
                    <form onSubmit={handleReset} className="flex-col gap-4">
                        {error && (
                            <div className="text-danger bg-danger/10 p-3 rounded-md text-sm text-center mb-4">
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label" htmlFor="password">{t('newPassword')}</label>
                            <div className="input-relative-wrapper" style={{ position: 'relative' }}>
                                <Lock size={16} className="input-icon-left" style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-secondary)' }} />
                                <input
                                    id="password"
                                    type="password"
                                    className="input-field"
                                    style={{ paddingLeft: '38px' }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group mt-4">
                            <label className="input-label" htmlFor="confirmPassword">{t('confirmPassword')}</label>
                            <div className="input-relative-wrapper" style={{ position: 'relative' }}>
                                <Lock size={16} className="input-icon-left" style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-secondary)' }} />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="input-field"
                                    style={{ paddingLeft: '38px' }}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary mt-6" disabled={loading}>
                            {loading ? 'Updating Password...' : <><span className="mr-2">{t('resetPassword')}</span> <ArrowRight size={16} /></>}
                        </button>
                    </form>
                ) : (
                    <div className="success-message text-center">
                        <div className="mb-6 p-4 rounded-md flex flex-col items-center gap-2" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                            <CheckCircle2 size={32} />
                            <span className="font-bold">{success}</span>
                        </div>
                        <p className="text-sm text-secondary">Redirecting you to login...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
