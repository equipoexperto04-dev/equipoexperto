import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    AUTH_SESSION_CHANGED_EVENT,
    fetchCurrentUserProfile,
    readCachedUserProfile,
} from '../utils/sessionClient.js';

const ProtectedRoute = () => {
    const [checking, setChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(readCachedUserProfile()));

    useEffect(() => {
        let cancelled = false;
        const sync = async () => {
            const cached = readCachedUserProfile();
            if (cached) {
                setIsAuthenticated(true);
            }
            const user = await fetchCurrentUserProfile();
            if (cancelled) return;
            setIsAuthenticated(Boolean(user || cached));
            setChecking(false);
        };
        void sync();
        const handleSync = () => { void sync(); };
        window.addEventListener('storage', handleSync);
        window.addEventListener('auth:token-changed', handleSync);
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSync);
        return () => {
            cancelled = true;
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('auth:token-changed', handleSync);
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSync);
        };
    }, []);

    if (checking) return null;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
