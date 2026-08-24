import React, { useState, useEffect } from 'react';
import {
    RefreshCw, CheckCircle2, AlertCircle,
    Building2, Car, Briefcase, Search, Filter,
    User, Trash2, Download, Trash,
    Phone, Mail, MapPin, Users, TrendingUp,
    Store, Star, Navigation, ExternalLink,
    ShoppingBag,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { get, post, del } from '../utils/api.js';
import { useTranslation } from '../context/LanguageContext';
import './Marketplace.css';

/** Stop polling background jobs after this duration so the UI never waits forever. */
const MARKETPLACE_JOB_POLL_MAX_MS = 20 * 60 * 1000;

/** Temporary: full discovery UI paused — show placeholder until launch. */
const MARKETPLACE_COMING_SOON =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_MARKETPLACE_COMING_SOON !== 'false';

// Business groups shown to non-technical users; API still receives stable ids/search queries.
const NICHE_GROUPS = [
    {
        labelKey: 'marketplaceNicheRealEstate',
        fallbackLabel: 'Real Estate',
        id: 'real_estate',
        descriptionKey: 'marketplaceNicheRealEstateDesc',
        fallbackDescription: 'Find agencies, brokers, and property managers.',
        icon: Building2,
        color: '#e63946',
        titles: ['Agents', 'Brokers', 'Property managers'],
        searchQuery: 'real estate agency',
    },
    {
        labelKey: 'marketplaceNicheCarSales',
        fallbackLabel: 'Car Dealerships',
        id: 'car_sales',
        descriptionKey: 'marketplaceNicheCarSalesDesc',
        fallbackDescription: 'Find dealership owners and automotive sales teams.',
        icon: Car,
        color: '#264653',
        titles: ['Dealers', 'Sales managers', 'Fleet teams'],
        searchQuery: 'car dealership',
    },
    {
        labelKey: 'marketplaceNicheHiring',
        fallbackLabel: 'Hiring & Recruitment',
        id: 'hr',
        descriptionKey: 'marketplaceNicheHiringDesc',
        fallbackDescription: 'Find recruiters and HR service businesses.',
        icon: Briefcase,
        color: '#e76f51',
        titles: ['Recruiters', 'HR teams', 'Agencies'],
        searchQuery: 'recruitment agency',
    },
    {
        labelKey: 'marketplaceNicheRetail',
        fallbackLabel: 'Retail Shops',
        id: 'second_hand',
        descriptionKey: 'marketplaceNicheRetailDesc',
        fallbackDescription: 'Find local stores and boutique owners.',
        icon: Store,
        color: '#00a9a5',
        titles: ['Store owners', 'Retail managers', 'Boutiques'],
        searchQuery: 'second hand store',
    },
];

export default function Marketplace() {
    const { t } = useTranslation();
    const { toast: showToast } = useToast();
    const [selectedNiches, setSelectedNiches] = useState([]);
    const [countrySearch, setCountrySearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [leads, setLeads] = useState([]);
    const [storedLeads, setStoredLeads] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('scout'); // 'scout' | 'stored'
    const [leadStats, setLeadStats] = useState({ total_found: 0, enriched: 0, saved: 0 });
    const [loadError, setLoadError] = useState('');
    const [searchError, setSearchError] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);
    const [cityPromptOpen, setCityPromptOpen] = useState(false);
    const [cityPromptValue, setCityPromptValue] = useState('');
    const [resolvingCity, setResolvingCity] = useState(false);
    const [activeJobId, setActiveJobId] = useState('');
    const [jobMessage, setJobMessage] = useState('');
    const [marketplaceUsage, setMarketplaceUsage] = useState(null);

    const fetchMarketplaceUsage = async () => {
        try {
            const data = await get('/api/apify/usage');
            if (data.success && data.usage) {
                setMarketplaceUsage(data.usage);
            }
        } catch (_) {
            /* non-blocking */
        }
    };

    useEffect(() => {
        if (MARKETPLACE_COMING_SOON) return;
        fetchStoredLeads();
        fetchMarketplaceUsage();
        const savedJobId = localStorage.getItem('marketplaceActiveJobId');
        if (savedJobId) {
            setActiveJobId(savedJobId);
            setLoading(true);
            setJobMessage('');
        }
    }, []);

    useEffect(() => {
        if (MARKETPLACE_COMING_SOON) return undefined;
        if (!activeJobId) {
            localStorage.removeItem('marketplaceActiveJobId');
            return undefined;
        }

        localStorage.setItem('marketplaceActiveJobId', activeJobId);

        let cancelled = false;
        const startedAt = Date.now();
        let pollTimer = null;
        const pollJob = async () => {
            if (Date.now() - startedAt > MARKETPLACE_JOB_POLL_MAX_MS) {
                if (pollTimer != null) {
                    window.clearInterval(pollTimer);
                    pollTimer = null;
                }
                if (!cancelled) {
                    const timeoutMsg = t('marketplaceJobTimeout');
                    setSearchError(timeoutMsg);
                    showToast(timeoutMsg, 'error');
                    setJobMessage('');
                    setActiveJobId('');
                    setLoading(false);
                }
                return;
            }
            try {
                const data = await get(`/api/apify/jobs/${activeJobId}`);
                if (cancelled) return;

                if (!cancelled && data.usage) {
                    setMarketplaceUsage(data.usage);
                }

                const status = data.job?.status;
                if (status === 'completed') {
                    const foundLeads = data.data?.leads || [];
                    const savedCount = data.data?.saved_count || 0;
                    const totalFound = data.data?.total_found || foundLeads.length;
                    setLeads(foundLeads);
                    setLeadStats({
                        total_found: totalFound,
                        enriched: foundLeads.filter(l => l.email).length,
                        saved: savedCount,
                    });
                    await fetchStoredLeads();
                    const doneMsg =
                        savedCount === 0 && totalFound > 0
                            ? t('marketplaceJobNoNewLeads', { found: totalFound })
                            : t('marketplaceJobCompleted', { count: savedCount });
                    setJobMessage(doneMsg);
                    showToast(doneMsg, savedCount === 0 && totalFound > 0 ? 'info' : 'success');
                    setActiveJobId('');
                    setLoading(false);
                    if (savedCount > 0) setViewMode('stored');
                    if (data.data?.save_failed) {
                        setSearchError(t('marketplaceSaveFailed'));
                    }
                } else if (status === 'failed') {
                    setSearchError(data.job?.error_message || t('marketplaceSearchFailed'));
                    showToast(t('marketplaceSearchFailed'), 'error');
                    setActiveJobId('');
                    setLoading(false);
                } else {
                    setJobMessage(t('marketplaceBackgroundSearching'));
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Marketplace job poll failed:', err);
                }
            }
        };

        pollJob();
        pollTimer = window.setInterval(pollJob, 5000);
        return () => {
            cancelled = true;
            if (pollTimer != null) window.clearInterval(pollTimer);
        };
    }, [activeJobId, showToast, t]);

    const safeParseNotes = (notes) => {
        if (!notes) return {};
        if (typeof notes === 'object') return notes;
        try {
            return JSON.parse(notes);
        } catch {
            return {};
        }
    };

    const translatedOrFallback = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    const nicheLabel = (niche) => translatedOrFallback(niche.labelKey, niche.fallbackLabel);
    const nicheDescription = (niche) => translatedOrFallback(niche.descriptionKey, niche.fallbackDescription);
    const isPlaceholderEmail = (email = '') => {
        const normalized = String(email || '').toLowerCase();
        return !normalized || normalized === 'pending@apify.local' || normalized.endsWith('@placeholder.com');
    };
    const getLeadContactState = (lead, notes = safeParseNotes(lead?.notes)) => {
        const email = lead?.email || lead?.seller_email || notes?.email || '';
        const phone = lead?.phone || lead?.seller_phone || notes?.phone || '';
        const website = lead?.website || lead?.url || notes?.website || notes?.url || notes?.contact_url || lead?.contact_url || '';
        const status = String(notes?.enrichment_status || lead?.enrichment_status || '').toLowerCase();
        const hasUsableContact = !isPlaceholderEmail(email) || Boolean(phone || website);
        return {
            email,
            phone,
            website,
            status,
            hasUsableContact,
            isReady: hasUsableContact || ['success', 'found', 'complete', 'completed'].includes(status),
        };
    };

    const fetchStoredLeads = async () => {
        setLoadError('');
        try {
            const data = await get('/api/marketplace/leads?limit=500');
            if (data.success) {
                setStoredLeads(data.leads || []);
            } else {
                setLoadError(data.message || t('marketplaceLoadFailed'));
            }
        } catch (err) {
            console.error('fetchStoredLeads failed:', err);
            setLoadError(t('marketplaceLoadFailed'));
        }
    };

    const handleNicheToggle = (id) => {
        setSelectedNiches(prev => 
            prev.includes(id) 
                ? prev.filter(n => n !== id)
                : [...prev, id]
        );
    };

    const startMarketplaceSearch = async (countryLabel) => {
        setLoading(true);
        setLeads([]);
        setSearchError('');
        setJobMessage(t('marketplaceBackgroundSearching'));
        setLeadStats({ total_found: 0, enriched: 0, saved: 0 });

        try {
            const selected = selectedNiches
                .map(nicheId => NICHE_GROUPS.find(n => n.id === nicheId))
                .filter(Boolean);
            const data = await post('/api/apify/scrape', {
                niches: selected.map(niche => niche.id),
                queries: selected.map(niche => niche.searchQuery),
                country: countryLabel,
                location: countryLabel,
                perPage: 20,
            });

            if (data.jobId) {
                setActiveJobId(data.jobId);
                setJobMessage(data.message || t('marketplaceBackgroundSearching'));
                showToast(t('marketplaceJobStarted'), 'success');
                if (data.usage) setMarketplaceUsage(data.usage);
            } else {
                setSearchError(t('marketplaceSearchFailed'));
                setLoading(false);
            }
        } catch (err) {
            console.error('Lead search error:', err);
            const payload = err.data || {};
            if (payload.usage) setMarketplaceUsage(payload.usage);

            if (err.message?.includes('already running') && err.jobId) {
                setActiveJobId(err.jobId);
                setJobMessage(t('marketplaceBackgroundSearching'));
                setLoading(true);
            } else {
                const msg =
                    typeof payload.error === 'string'
                        ? payload.error
                        : err.message || t('marketplaceSearchFailed');
                setSearchError(msg);
                showToast(msg, 'error');
                setLoading(false);
            }
        }
    };

    const handleScoutLeads = async () => {
        if (selectedNiches.length === 0) {
            showToast(t('marketplaceSelectOne'), 'error');
            return;
        }

        const typedCountry = countrySearch.trim();
        if (!typedCountry) {
            setCityPromptValue('');
            setCityPromptOpen(true);
            return;
        }

        await startMarketplaceSearch(typedCountry);
    };

    const reverseGeocodeCountry = async (latitude, longitude) => {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.address || {};
        return (address.country || '').trim();
    };

    const useCurrentCity = async () => {
        if (!navigator.geolocation) {
            setSearchError(t('marketplaceGeoUnsupported'));
            return;
        }

        setResolvingCity(true);
        setSearchError('');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const countryLabel = await reverseGeocodeCountry(position.coords.latitude, position.coords.longitude);
                    if (!countryLabel) {
                        setSearchError(t('marketplaceGeoFailed'));
                        return;
                    }
                    setCountrySearch(countryLabel);
                    setCityPromptOpen(false);
                    await startMarketplaceSearch(countryLabel);
                } catch (err) {
                    console.error('Country lookup failed:', err);
                    setSearchError(t('marketplaceGeoFailed'));
                } finally {
                    setResolvingCity(false);
                }
            },
            () => {
                setSearchError(t('marketplaceGeoFailed'));
                setResolvingCity(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    };

    const useTypedCityFromPrompt = async () => {
        const typed = cityPromptValue.trim();
        if (!typed) {
            setSearchError(t('marketplaceCountryRequired'));
            return;
        }
        setCountrySearch(typed);
        setCityPromptOpen(false);
        await startMarketplaceSearch(typed);
    };

    const getCategoryFromSource = (source) => {
        if (source?.includes('real_estate')) return 'real_estate';
        if (source?.includes('car_sales')) return 'car_sales';
        if (source?.includes('hr')) return 'hr';
        if (source?.includes('second_hand')) return 'second_hand';
        return 'general';
    };

    // Helper function to get week range label
    const getWeekLabel = (date) => {
        const now = new Date();
        const leadDate = new Date(date);
        const diffTime = now - leadDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) return 'This Week';
        if (diffDays < 14) return 'Last Week';
        if (diffDays < 21) return '2 Weeks Ago';
        if (diffDays < 28) return '3 Weeks Ago';
        return 'Older';
    };

    // Group stored leads by week
    const groupStoredLeadsByWeek = () => {
        const groups = {};
        filteredStoredLeads.forEach(lead => {
            const date = lead.fetchedAt || lead.K || lead.created_at || new Date();
            const weekLabel = getWeekLabel(date);
            if (!groups[weekLabel]) groups[weekLabel] = [];
            groups[weekLabel].push(lead);
        });
        // Order: This Week, Last Week, 2 Weeks Ago, 3 Weeks Ago, Older
        const order = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', 'Older'];
        return order.filter(key => groups[key]).map(key => ({ label: key, leads: groups[key] }));
    };

    // Download leads as CSV
    const downloadCSV = () => {
        const headers = ['ID', 'Source', 'First Name', 'Last Name', 'Title', 'Organization', 'Email', 'Phone', 'Website', 'Location', 'LinkedIn', 'Enrichment Status', 'Discovered At'];
        const rows = filteredStoredLeads.map(lead => {
            const notes = safeParseNotes(lead.notes);
            const contactState = getLeadContactState(lead, notes);
            return [
                lead.id || '',
                (lead.source || '').replace(/apify/gi, 'Marketplaces'),
                lead.full_name?.split(' ')[0] || '',
                lead.full_name?.split(' ').slice(1).join(' ') || '',
                notes?.title || '',
                notes?.organization || '',
                isPlaceholderEmail(contactState.email) ? '' : contactState.email,
                contactState.phone,
                contactState.website,
                notes?.location || '',
                notes?.linkedin || '',
                contactState.isReady ? 'ready' : 'checking',
                lead.created_at || '',
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `marketplace-leads-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        showToast(t('marketplaceCsvDownloaded'), 'success');
    };

    // Delete single lead
    const deleteLead = async (leadId) => {
        try {
            const data = await del(`/api/marketplace/leads/${leadId}`);
            if (data.success) {
                showToast(t('marketplaceDeleteLead'), 'success');
                fetchStoredLeads();
            } else {
                showToast(data.message || t('marketplaceSearchFailed'), 'error');
            }
        } catch (err) {
            console.error('Failed to delete lead:', err);
            showToast(t('marketplaceSearchFailed'), 'error');
        } finally {
            setPendingDelete(null);
        }
    };

    // Delete all leads
    const deleteAllLeads = async () => {
        try {
            const data = await del('/api/marketplace/leads');
            if (data.success) {
                showToast(`${data.deletedCount || 'All'} leads deleted`, 'success');
                fetchStoredLeads();
            } else {
                showToast(data.message || 'Failed to delete', 'error');
            }
        } catch (err) {
            console.error('Failed to delete all leads:', err);
            showToast('Failed to delete all leads', 'error');
        } finally {
            setPendingDelete(null);
        }
    };

    const renderLeadCard = (lead, isStored = false) => {
        const category = getCategoryFromSource(lead.source);
        const niche = NICHE_GROUPS.find(n => n.id === category) || NICHE_GROUPS[0];
        const Icon = niche?.icon || Building2;
        const color = niche?.color || '#6366f1';
        
        const notes = safeParseNotes(lead.notes);
        const contactState = getLeadContactState(lead, notes);
        const websiteUrl = contactState.website;
        const displayEmail = contactState.email;
        const displayPhone = contactState.phone;
        const isEnriched = contactState.isReady;

        return (
            <div key={lead.id} className="marketplace-card">
                <div className="marketplace-card-header" style={{ borderLeftColor: color }}>
                    <div className="marketplace-card-source">
                        <Icon size={16} style={{ color }} />
                        <span>{niche ? nicheLabel(niche) : lead.source}</span>
                    </div>
                    <span className="marketplace-card-time">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : t('recentBadge')}
                    </span>
                </div>

                <div className="marketplace-card-avatar">
                    <div className="marketplace-avatar-placeholder" style={{ background: `${color}20`, color }}>
                        {(lead.full_name?.[0] || '?').toUpperCase()}
                    </div>
                    {isEnriched && (
                        <div className="marketplace-verified-badge" title="Contact enriched">
                            <Star size={12} fill={color} />
                        </div>
                    )}
                </div>

                <div className="marketplace-card-body">
                    {/* Full Name */}
                    <h4 className="marketplace-card-title">
                        {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || t('marketplaceUnknownContact')}
                    </h4>
                    
                    {/* Title & Organization */}
                    {(notes?.title || notes?.organization) && (
                        <div className="marketplace-card-subtitle">
                            <User size={12} />
                            <span>
                                {notes?.title}
                                {notes?.title && notes?.organization && ' at '}
                                {notes?.organization && <strong>{notes?.organization}</strong>}
                            </span>
                        </div>
                    )}

                    {/* Location */}
                    {(notes?.location || lead.location) && (
                        <div className="marketplace-card-location">
                            <MapPin size={12} />
                            <span>{notes?.location || lead.location}</span>
                        </div>
                    )}

                    {/* Contact Info */}
                    {(!isPlaceholderEmail(displayEmail) || displayPhone || websiteUrl) && (
                        <div className="marketplace-contact-info">
                            {!isPlaceholderEmail(displayEmail) && (
                                <div className="marketplace-contact-row">
                                    <Mail size={13} />
                                    <a href={`mailto:${displayEmail}`} className="marketplace-contact-link">
                                        {displayEmail}
                                    </a>
                                </div>
                            )}
                            {displayPhone && (
                                <div className="marketplace-contact-row">
                                    <Phone size={13} />
                                    <a href={`tel:${displayPhone}`} className="marketplace-contact-link">
                                        {displayPhone}
                                    </a>
                                </div>
                            )}
                            {websiteUrl && (
                                <div className="marketplace-contact-row">
                                    <ExternalLink size={13} />
                                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="marketplace-contact-link">
                                        {t('marketplaceWebsiteUrl')}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!isStored && !isEnriched && (
                        <div className="marketplace-enrichment-pending">
                            <AlertCircle size={12} />
                            <span>{t('marketplaceContactChecking')}</span>
                        </div>
                    )}
                </div>

                <div className="marketplace-card-footer">
                    {notes?.linkedin && (
                        <a
                            href={notes.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="marketplace-card-link"
                        >
                            View LinkedIn
                        </a>
                    )}
                    {websiteUrl && (
                        <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="marketplace-card-link"
                        >
                            <ExternalLink size={12} />
                            {t('marketplaceOpenWebsite')}
                        </a>
                    )}
                    {isStored && (
                        <div className="marketplace-card-actions">
                            <span className="marketplace-stored-badge">
                                <CheckCircle2 size={12} />
                                {t('marketplaceSaved')}
                            </span>
                            <button 
                                className="marketplace-delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDelete({ type: 'single', leadId: lead.id });
                                }}
                                title={t('marketplaceDeleteLead')}
                                aria-label={t('marketplaceDeleteLead')}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const filteredStoredLeads = filterStatus === 'all'
        ? storedLeads
        : storedLeads.filter(lead => {
            const notes = safeParseNotes(lead.notes);
            const contactState = getLeadContactState(lead, notes);
            return filterStatus === 'success' ? contactState.isReady : !contactState.isReady;
        });

    if (MARKETPLACE_COMING_SOON) {
        return (
            <div className="marketplace-container marketplace-coming-soon-page">
                <div className="marketplace-coming-soon-card">
                    <div className="marketplace-coming-soon-icon-wrap" aria-hidden>
                        <ShoppingBag size={32} strokeWidth={1.75} />
                    </div>
                    <span className="marketplace-coming-soon-badge">{t('marketplaceComingSoonBadge')}</span>
                    <h1 className="marketplace-coming-soon-title">{t('marketplaceTitle')}</h1>
                    <p className="marketplace-coming-soon-desc">{t('marketplaceComingSoonDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="marketplace-container">
            {/* Header */}
            <div className="marketplace-header">
                <div className="marketplace-header-content">
                    <div className="marketplace-header-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h1>{t('marketplaceTitle')}</h1>
                        <p>{t('marketplaceSubtitle')}</p>
                    </div>
                </div>
                <div className="marketplace-view-toggle">
                    <button 
                        className={viewMode === 'scout' ? 'active' : ''}
                        onClick={() => setViewMode('scout')}
                    >
                        {t('marketplaceSearchTab')}
                    </button>
                    <button 
                        className={viewMode === 'stored' ? 'active' : ''}
                        onClick={() => setViewMode('stored')}
                    >
                        {t('marketplaceSavedTab', { count: storedLeads.length })}
                    </button>
                </div>
            </div>

            {viewMode === 'scout' ? (
                <>
                    {/* Niche Selection */}
                    <div className="marketplace-selection">
                        <div className="marketplace-selection-header">
                            <h3>{t('marketplaceSelectNiche')}</h3>
                            {selectedNiches.length > 0 && (
                                <button className="marketplace-clear-btn" onClick={() => setSelectedNiches([])}>
                                    {t('marketplaceClearSelection', { count: selectedNiches.length })}
                                </button>
                            )}
                        </div>
                        
                        <div className="marketplace-niches-grid">
                            {NICHE_GROUPS.map(niche => {
                                const selected = selectedNiches.includes(niche.id);
                                const Icon = niche.icon;
                                return (
                                    <button
                                        key={niche.id}
                                        className={`marketplace-niche-card ${selected ? 'selected' : ''}`}
                                        onClick={() => handleNicheToggle(niche.id)}
                                    >
                                        <div className="marketplace-niche-icon" style={{ background: `${niche.color}15`, color: niche.color }}>
                                            <Icon size={28} />
                                        </div>
                                        <h4 className="marketplace-niche-title">{nicheLabel(niche)}</h4>
                                        <p className="marketplace-niche-desc">{nicheDescription(niche)}</p>
                                        <div className="marketplace-niche-tags">
                                            {niche.titles.slice(0, 3).map((title, i) => (
                                                <span key={i} className="marketplace-niche-tag">{title}</span>
                                            ))}
                                            {niche.titles.length > 3 && (
                                                <span className="marketplace-niche-tag">+{niche.titles.length - 3}</span>
                                            )}
                                        </div>
                                        {selected && (
                                            <div className="marketplace-niche-selected">
                                                <CheckCircle2 size={20} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location Filter */}
                    <div className="marketplace-location-bar">
                        <MapPin size={16} />
                        <input
                            type="text"
                            placeholder={t('marketplaceCountryPlaceholder')}
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="marketplace-location-input"
                        />
                    </div>
                    <p className="marketplace-city-note">
                        {t('marketplaceCountryNote')}
                    </p>
                    {marketplaceUsage && (
                        <p
                            className={`marketplace-city-note marketplace-credits-note ${
                                marketplaceUsage.trial_active || !marketplaceUsage.marketplace_included
                                    ? 'marketplace-credits-warn'
                                    : ''
                            }`}
                            role="status"
                        >
                            {marketplaceUsage.trial_active || !marketplaceUsage.marketplace_included
                                ? t('marketplaceTrialNoCredits')
                                : t('marketplaceCreditsSummary', {
                                      remaining: marketplaceUsage.runs_remaining,
                                      limit: marketplaceUsage.runs_limit,
                                  })}
                        </p>
                    )}

                    {/* Scout Button */}
                    <div className="marketplace-action">
                        <button
                            className="marketplace-get-btn"
                            onClick={handleScoutLeads}
                            disabled={
                                loading ||
                                selectedNiches.length === 0 ||
                                (marketplaceUsage &&
                                    (!marketplaceUsage.marketplace_included ||
                                        marketplaceUsage.runs_remaining <= 0))
                            }
                        >
                            {loading ? (
                                <><RefreshCw size={18} className="spin" /> {t('marketplaceSearching')}</>
                            ) : (
                                <><Search size={18} /> {t('marketplaceSearchButton', { count: selectedNiches.length, plural: selectedNiches.length !== 1 ? 's' : '' })}</>
                            )}
                        </button>
                        {searchError && (
                            <div className="marketplace-error" role="alert">
                                <AlertCircle size={16} />
                                <span>{searchError}</span>
                            </div>
                        )}
                        {activeJobId && (
                            <div className="marketplace-job-status" role="status">
                                <RefreshCw size={16} className="spin" />
                                <span>{jobMessage || t('marketplaceBackgroundSearching')}</span>
                            </div>
                        )}
                    </div>

                    {/* Lead search stats */}
                    {leadStats.total_found > 0 && (
                        <div className="marketplace-stats">
                            <div className="marketplace-stat">
                                <Users size={16} />
                                <span>{leadStats.total_found} businesses</span>
                            </div>
                            <div className="marketplace-stat">
                                <Mail size={16} />
                                <span>{leadStats.enriched} with email</span>
                            </div>
                            <div className="marketplace-stat">
                                <Phone size={16} />
                                <span>{leadStats.saved} saved</span>
                            </div>
                        </div>
                    )}
                    {leads.length > 0 && (
                        <div className="marketplace-grid-results">
                            {leads.map(lead => renderLeadCard(lead, false))}
                        </div>
                    )}
                </>
            ) : (
                /* Stored Leads View */
                <div className="marketplace-stored-view">
                    {/* Action Bar */}
                    <div className="marketplace-action-bar">
                        <div className="marketplace-filter-bar">
                            <Filter size={16} />
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="all">{t('marketplaceAllLeads')}</option>
                                <option value="success">{t('marketplaceReadyContacts')}</option>
                                <option value="pending">{t('marketplaceCheckingContacts')}</option>
                            </select>
                        </div>
                        <div className="marketplace-action-buttons">
                            {filteredStoredLeads.length > 0 && (
                                <>
                                    <button className="marketplace-btn-secondary" onClick={downloadCSV}>
                                        <Download size={16} />
                                        {t('marketplaceExportCsv')}
                                    </button>
                                    <button className="marketplace-btn-danger" onClick={() => setPendingDelete({ type: 'all' })}>
                                        <Trash size={16} />
                                        {t('marketplaceDeleteAll')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {loadError && (
                        <div className="marketplace-error" role="alert">
                            <AlertCircle size={16} />
                            <span>{loadError}</span>
                            <button type="button" onClick={fetchStoredLeads}>{t('marketplaceRetry')}</button>
                        </div>
                    )}

                    {filteredStoredLeads.length > 0 ? (
                        <div className="marketplace-stored-groups">
                            {groupStoredLeadsByWeek().map(group => (
                                <div key={group.label} className="marketplace-week-group">
                                    <h3 className="marketplace-week-header">
                                        {group.label}
                                        <span className="marketplace-week-count">({group.leads.length} leads)</span>
                                    </h3>
                                    <div className="marketplace-grid-results">
                                        {group.leads.map(lead => renderLeadCard(lead, true))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="marketplace-empty">
                            <Users size={48} />
                            <p>{t('marketplaceNoSavedLeads')}</p>
                            <button onClick={() => setViewMode('scout')}>{t('marketplaceStartSearch')}</button>
                        </div>
                    )}
                </div>
            )}
            {pendingDelete && (
                <div className="modal-overlay" role="presentation" onClick={() => setPendingDelete(null)}>
                    <div
                        className="success-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="marketplace-delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="marketplace-delete-title">
                            {pendingDelete.type === 'all' ? t('marketplaceDeleteAllConfirm') : t('marketplaceDeleteLeadConfirm')}
                        </h2>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                type="button"
                                className="btn-primary py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm"
                                onClick={() => pendingDelete.type === 'all' ? deleteAllLeads() : deleteLead(pendingDelete.leadId)}
                            >
                                {t('marketplaceDeleteConfirm')}
                            </button>
                            <button
                                type="button"
                                className="text-secondary font-bold text-xs uppercase tracking-widest py-2"
                                onClick={() => setPendingDelete(null)}
                            >
                                {t('marketplaceDeleteCancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {cityPromptOpen && (
                <div className="modal-overlay" role="presentation" onClick={() => setCityPromptOpen(false)}>
                    <div
                        className="success-modal marketplace-city-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="marketplace-city-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="marketplace-city-title">{t('marketplaceCountryPromptTitle')}</h2>
                        <p>{t('marketplaceCountryPromptBody')}</p>
                        <div className="marketplace-city-input-wrap">
                            <MapPin size={16} />
                            <input
                                type="text"
                                value={cityPromptValue}
                                placeholder={t('marketplaceCountryPromptPlaceholder')}
                                onChange={(e) => setCityPromptValue(e.target.value)}
                            />
                        </div>
                        <div className="marketplace-city-actions">
                            <button
                                type="button"
                                className="btn-primary py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-sm"
                                onClick={useTypedCityFromPrompt}
                            >
                                <Search size={16} />
                                {t('marketplaceUseTypedCountry')}
                            </button>
                            <button
                                type="button"
                                className="marketplace-city-secondary"
                                onClick={useCurrentCity}
                                disabled={resolvingCity}
                            >
                                {resolvingCity ? <RefreshCw size={16} className="spin" /> : <Navigation size={16} />}
                                {resolvingCity ? t('marketplaceFindingCountry') : t('marketplaceUseCurrentCountry')}
                            </button>
                            <button
                                type="button"
                                className="text-secondary font-bold text-xs uppercase tracking-widest py-2"
                                onClick={() => setCityPromptOpen(false)}
                            >
                                {t('marketplaceDeleteCancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
