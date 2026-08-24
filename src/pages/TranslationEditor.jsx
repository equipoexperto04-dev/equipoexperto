import React, { useState, useEffect } from 'react';
import { loadStaticTranslations } from '../i18n/loadStaticTranslations.js';
import { Save, Search, RefreshCw, Languages, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import API_URL from '../config';

const TranslationEditor = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [staticTranslations, setStaticTranslations] = useState({ en: {}, es: {} });
    const [dynamicTranslations, setDynamicTranslations] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [status, setStatus] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        loadStaticTranslations()
            .then(setStaticTranslations)
            .catch((err) => console.error('Failed to load locale files', err))
            .finally(() => fetchDynamic());
    }, []);

const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const fetchDynamic = async () => {
        try {
            const res = await fetch(`${API_URL}/api/translations`);
            const data = await res.json();
            if (data.success) {
                setDynamicTranslations(data.translations);
            }
        } catch (err) {
            console.error('Failed to fetch', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key, englishText, spanishText) => {
        setSaving(key);
        try {
            const res = await fetch(`${API_URL}/api/translations/update`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ key_name: key, english_text: englishText, spanish_text: spanishText })
            });
            const data = await res.json();
            if (data.success) {
                setDynamicTranslations(prev => ({ ...prev, [key]: spanishText }));
                showStatus('Word updated successfully!', 'success');
            } else {
                showStatus(data.message || 'Update failed', 'error');
            }
        } catch (err) {
            showStatus('Network error', 'error');
        } finally {
            setSaving(null);
        }
    };

    const showStatus = (message, type) => {
        setStatus({ show: true, message, type });
        setTimeout(() => setStatus({ ...status, show: false }), 3000);
    };

    const allKeys = Object.keys(staticTranslations.en);
    const filteredKeys = allKeys.filter(k => 
        k.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (staticTranslations.en[k] || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b10' }}>
            <RefreshCw className="animate-spin" size={48} style={{ color: '#3b82f6' }} />
        </div>
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', color: '#fff' }}>
            {status.show && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    background: '#1e293b', border: `1px solid ${status.type === 'error' ? '#ef4444' : '#3b82f6'}`,
                    padding: '1rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', animation: 'slideIn 0.3s ease-out'
                }}>
                    {status.type === 'error' ? <AlertCircle style={{ color: '#ef4444' }} /> : <CheckCircle2 style={{ color: '#3b82f6' }} />}
                    <span style={{ fontWeight: '600' }}>{status.message}</span>
                </div>
            )}

            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '8px' }}>
                        <Languages size={20} />
                        <span style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '0.75rem' }}>LANGUAGE ENGINE</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>Word Master</h1>
                    <p style={{ color: '#64748b', marginTop: '8px' }}>Customize platform terminology in real-time.</p>
                </div>

                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                        type="text" placeholder="Search keys or English text..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem', padding: '1rem 1rem 1rem 3.5rem', color: '#fff', fontSize: '0.95rem'
                        }}
                    />
                </div>
            </header>

            <div style={{ display: 'grid', gap: '12px' }}>
                {filteredKeys.map(key => (
                    <div key={key} style={{ 
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '1.25rem', padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                        alignItems: 'center', gap: '2rem', transition: 'all 0.2s ease',
                        hover: { background: 'rgba(255,255,255,0.04)' }
                    }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</span>
                            <div style={{ marginTop: '4px', color: '#64748b', fontSize: '0.9rem' }}>{staticTranslations.en[key]}</div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                defaultValue={dynamicTranslations[key] || staticTranslations.es[key] || ''}
                                placeholder="Enter Spanish translation..."
                                onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== (dynamicTranslations[key] || staticTranslations.es[key] || '')) {
                                        handleSave(key, staticTranslations.en[key], val);
                                    }
                                }}
                                style={{
                                    width: '100%', background: '#0a0b10', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <button 
                            style={{ 
                                background: saving === key ? '#1e293b' : '#3b82f6', 
                                border: 'none', color: '#fff', padding: '0.75rem', 
                                borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                            disabled={saving === key}
                        >
                            {saving === key ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default TranslationEditor;
