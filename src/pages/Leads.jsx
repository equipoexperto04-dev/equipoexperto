import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    Users, Mail, Phone, Search,
    Download, Upload,
    CheckCircle2, XCircle, Send,
    Trash2, History, Square, CheckSquare,
    RefreshCw, Loader2, FolderOpen, ArrowLeft, ChevronRight,
    MoreVertical, Info,
} from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import LeadDetailModal from '../components/leads/LeadDetailModal.jsx';
import EmailComposerModal from '../components/leads/EmailComposerModal.jsx';
import {
    getLeadScore,
    getLeadScoreTier,
    isHotLead,
    getLeadDisplayName,
    getLeadCompanyLabel,
    getWhatsAppChatUrl,
    getTelUrl,
    getMailtoUrl,
    openExternalUrl,
    formatLeadTableDate,
} from '../utils/leadContactActions.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { DEFAULT_LEAD_GROUP } from '../constants/leadGroups.js';
import LeadFolderImportModal from '../components/LeadFolderImportModal.jsx';
import './Leads.css';
import API_URL from '../config.js';
import { SkeletonRow } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import CustomSelect from '../components/CustomSelect.jsx';
import { useDelayedLoading } from '../hooks/useDelayedLoading.js';

const Leads = () => {
    const { t, tWithFallback, language, formatRelativeTime } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        source: '',
        status: '',
        group: '',
        date: ''
    });
    const [folders, setFolders] = useState([]);
    const [foldersLoading, setFoldersLoading] = useState(true);
    const [activeFolder, setActiveFolder] = useState(null);
    const [folderMessage, setFolderMessage] = useState('');
    const [folderMessageSaving, setFolderMessageSaving] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
    const [isDeletingFolder, setIsDeletingFolder] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [selectedLead, setSelectedLead] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [sendingLeadId, setSendingLeadId] = useState(null);
    const [isBulkSending, setIsBulkSending] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [showTimeline, setShowTimeline] = useState(false);
    const [leadTimeline, setLeadTimeline] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [leadToDelete, setLead_to_delete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [emailComposerLead, setEmailComposerLead] = useState(null);

    const showFolderSaveLoading = useDelayedLoading(folderMessageSaving);
    const showBulkSendLoading = useDelayedLoading(isBulkSending);

    const showNotificationPopup = (count = 1, message = null) => {
        window.dispatchEvent(new CustomEvent('showNotifPopup', { 
            detail: { count, message } 
        }));
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const onLeadsToast = (e) => {
            if (e.detail?.message) showToast(e.detail.message, e.detail.type || 'error');
        };
        window.addEventListener('leads:toast', onLeadsToast);
        return () => window.removeEventListener('leads:toast', onLeadsToast);
    }, []);

    const handleSelectLead = (lead) => {
        setSelectedLead(lead || null);
    };

    const fetchFolders = async () => {
        setFoldersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setFolders(data.folders || []);
        } catch (e) {
            console.error('Failed to fetch folders:', e);
        } finally {
            setFoldersLoading(false);
        }
    };

    const searchTermRef = useRef(searchTerm);
    const filtersRef = useRef(filters);
    const importIdsRef = useRef(null);
    const fetchSeqRef = useRef(0);
    useEffect(() => {
        searchTermRef.current = searchTerm;
    }, [searchTerm]);
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    const openFolder = (folder) => {
        setActiveFolder(folder.name);
        setFolderMessage(folder.followup_message || '');
        setSearchTerm('');
        setFilters((f) => ({ ...f, group: folder.name, source: '', status: '' }));
        setSelectedLeads([]);
    };

    const closeFolder = () => {
        importIdsRef.current = null;
        setActiveFolder(null);
        setFolderMessage('');
        setSearchTerm('');
        setFilters((f) => ({ ...f, group: '', source: '', status: '' }));
        setLeads([]);
        setSelectedLeads([]);
        fetchFolders();
    };

    const confirmDeleteFolder = (folder, e) => {
        if (e) e.stopPropagation();
        setFolderToDelete(folder);
        setShowDeleteFolderModal(true);
    };

    const executeDeleteFolder = async () => {
        if (!folderToDelete) return;
        setIsDeletingFolder(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/folders/${encodeURIComponent(folderToDelete.name)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setFolders((prev) => prev.filter((f) => f.name !== folderToDelete.name));
                showToast(t('leadFolderDeleted', { name: folderToDelete.name }));
                setShowDeleteFolderModal(false);
                setFolderToDelete(null);
            } else {
                showToast(data.message || t('deleteFailed'), 'error');
            }
        } catch {
            showToast(t('deleteFailed'), 'error');
        } finally {
            setIsDeletingFolder(false);
        }
    };

    const saveFolderMessage = async () => {
        if (!activeFolder) return;
        setFolderMessageSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/folders/message`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: activeFolder, followup_message: folderMessage }),
            });
            const data = await res.json();
            if (data.success) showToast(t('leadFolderMessageSaved'), 'success');
        } catch {
            showToast(t('contactFormError'), 'error');
        } finally {
            setFolderMessageSaving(false);
        }
    };

    const fetchLeads = useCallback(async (isRefresh = false) => {
        const seq = ++fetchSeqRef.current;
        if (!isRefresh) {
            setLoading(true);
            setLoadError('');
        }
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                search: searchTermRef.current,
                ...filtersRef.current,
            });
            if (importIdsRef.current?.length) {
                queryParams.set('ids', importIdsRef.current.join(','));
            }
            const res = await fetch(`${API_URL}/api/leads?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (seq !== fetchSeqRef.current) return;
            if (!res.ok || !data.success) {
                throw new Error(data.message || t('leadsLoadFailed'));
            }
            setLeads(data.leads || []);
            setLoadError('');
        } catch (error) {
            if (seq !== fetchSeqRef.current) return;
            console.error('Failed to fetch leads:', error);
            if (!isRefresh) {
                setLoadError(t('leadsLoadFailed'));
                setLeads([]);
            }
        } finally {
            if (!isRefresh && seq === fetchSeqRef.current) setLoading(false);
        }
    }, [t]);

    // Debounced fetch when viewing a folder (search / filters change)
    useEffect(() => {
        if (!activeFolder) return undefined;
        const handler = setTimeout(() => fetchLeads(), 300);
        return () => clearTimeout(handler);
    }, [activeFolder, filters, searchTerm, fetchLeads]);

    useEffect(() => {
        if (activeFolder) return undefined;
        fetchFolders();
    }, [activeFolder]);

    /** Deep-link from Activity Log: /dashboard/leads?folder=Business&ids=1,2,3 */
    useEffect(() => {
        const folderParam = searchParams.get('folder')?.trim();
        if (!folderParam || foldersLoading) return;

        const idsParam = searchParams.get('ids');
        const parsedIds = idsParam
            ? idsParam
                  .split(',')
                  .map((v) => parseInt(v, 10))
                  .filter((n) => Number.isFinite(n) && n > 0)
            : [];
        importIdsRef.current = parsedIds.length > 0 ? parsedIds : null;

        const match = folders.find((f) => f.name === folderParam);
        const folder = match || {
            name: folderParam,
            followup_message: '',
            total: 0,
            new_count: 0,
            contacted_count: 0,
        };
        setActiveFolder(folder.name);
        setFolderMessage(folder.followup_message || '');
        setSearchTerm('');
        setFilters((f) => ({ ...f, group: folder.name, source: '', status: '' }));
        setSelectedLeads([]);
    }, [searchParams, folders, foldersLoading]);

    // Background refresh — must use refs so poll does not wipe active search/filters
    useEffect(() => {
        if (!activeFolder) return undefined;
        const interval = setInterval(() => fetchLeads(true), 10000);
        return () => clearInterval(interval);
    }, [activeFolder, fetchLeads]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedLeads = [...leads].sort((a, b) => {
        const key = sortConfig.key;
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        const pick = (row) => {
            const v = row[key];
            if (v == null || v === '') return null;
            if (key === 'created_at') return new Date(v).getTime();
            return String(v).toLowerCase();
        };
        const pa = pick(a);
        const pb = pick(b);
        if (pa == null && pb == null) {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (pa == null) return 1;
        if (pb == null) return -1;
        if (pa < pb) return -1 * dir;
        if (pa > pb) return 1 * dir;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    const filteredFolders = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return folders;
        return folders.filter((f) => f.name.toLowerCase().includes(q));
    }, [folders, searchTerm]);

    const folderStats = useMemo(() => {
        if (!activeFolder) return null;
        return {
            total: leads.length,
            new: leads.filter((l) => !l.lead_status || l.lead_status === 'New').length,
            contacted: leads.filter((l) => l.lead_status === 'Contacted').length,
            closed: leads.filter((l) => l.lead_status === 'Closed').length,
            replied: leads.filter((l) => l.lead_status === 'Replied').length,
        };
    }, [leads, activeFolder]);

    const openLeadWhatsApp = (lead, e) => {
        e?.stopPropagation();
        const url = getWhatsAppChatUrl(lead.phone, activeFolder && folderMessage?.trim() ? folderMessage.trim() : '');
        if (!openExternalUrl(url)) showToast(t('leadActionNoPhone'), 'error');
    };

    const openLeadCall = (lead, e) => {
        e?.stopPropagation();
        const url = getTelUrl(lead.phone);
        if (!url) {
            showToast(t('leadActionNoPhone'), 'error');
            return;
        }
        window.location.href = url;
    };

    const openLeadEmail = (lead, e) => {
        e?.stopPropagation();
        if (!lead.email) {
            showToast(t('leadActionNoEmail'), 'error');
            return;
        }
        setEmailComposerLead(lead);
    };

    const handleEmailSent = () => {
        showToast(t('leadEmailSent'), 'success');
        setEmailComposerLead(null);
    };

    const folderNameOptions = useMemo(
        () => [...new Set(folders.map((f) => f.name).filter(Boolean))].sort(),
        [folders]
    );

    const updateLead = async (id, payload) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                const updatedLead = data.lead || { ...leads.find(l => l.id === id), ...payload };
                setLeads(leads.map(l => l.id === id ? updatedLead : l));
                if (selectedLead?.id === id) {
                    setSelectedLead(updatedLead);
                }
            }
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    };

    const triggerFollowup = async (id) => {
        if (sendingLeadId) return; // Prevent multiple clicks
        setSendingLeadId(id);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/${id}/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: activeFolder && folderMessage?.trim() ? folderMessage.trim() : undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`${t('followupActivated')} (${data.provider || 'Gmail'})`);
                
                // Show floating notification pointing to bell icon
                showNotificationPopup(1);

                // Update local state immediately for better UX
                setLeads(prev => prev.map(l => l.id === id ? { ...l, lead_status: 'Contacted' } : l));
                if (selectedLead?.id === id) {
                    setSelectedLead(prev => ({ ...prev, lead_status: 'Contacted' }));
                }
            } else {
                showToast(data.message || t('followupFailed'), 'error');
            }
        } catch (error) {
            showToast(t('followupFailed'), 'error');
        } finally {
            setSendingLeadId(null);
        }
    };

    const triggerBulkFollowup = async (opts = {}) => {
        const { allInFolder = false } = opts;
        if (isBulkSending) return;
        if (!allInFolder && selectedLeads.length === 0) return;
        setIsBulkSending(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/trigger-bulk`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ids: allInFolder ? undefined : selectedLeads,
                    group: allInFolder ? activeFolder : undefined,
                    message: folderMessage?.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                const count = data.triggered || selectedLeads.length;
                showToast(`${count} follow-ups activated`);
                showNotificationPopup(count);

                // Update local state for all selected leads
                setLeads(prev => prev.map(l => 
                    selectedLeads.includes(l.id) ? { ...l, lead_status: 'Contacted' } : l
                ));
                setSelectedLeads([]);
            } else {
                showToast(data.message || t('followupFailed'), 'error');
            }
        } catch (error) {
            showToast(t('followupFailed'), 'error');
        } finally {
            setIsBulkSending(false);
        }
    };

    const handleImportSuccess = (data) => {
        const imported = data.imported ?? 0;
        let msg = t('importFolderSuccess', { count: imported, folder: data.folderName });
        if ((data.fileDups ?? 0) > 0 || (data.dbDups ?? 0) > 0) {
            msg += ` · ${data.fileDups ?? 0} dup · ${data.dbDups ?? 0} existing`;
        }
        showToast(msg, imported > 0 ? 'success' : 'info');
        if (imported > 0) {
            localStorage.setItem('glowLeads', 'true');
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('triggerLeadsGlow'));
        }
        fetchFolders();
        if (data.folderName) {
            openFolder({
                name: data.folderName,
                followup_message: data.followupMessage || '',
            });
        }
    };

    const getSourceLabel = (source) => {
        const s = (source || '').toLowerCase();
        if (s.includes('excel')) return t('excelUpload');
        if (s.includes('csv')) return t('csvUpload');
        if (s.includes('apify') || s.includes('marketplace')) return 'Marketplaces';
        if (s.includes('qr')) return t('qrSurvey');
        if (s.includes('public link') || s.includes('website')) return t('cfgSourceWeb');
        if (source) return t('importedLead');
        return '—';
    };

    const getSourceClass = (source) => {
        const s = (source || '').toLowerCase();
        if (s.includes('excel')) return 'lead-source--excel';
        if (s.includes('csv')) return 'lead-source--csv';
        if (s.includes('qr')) return 'lead-source--survey';
        return 'lead-source--import';
    };

    const downloadSample = () => {
        const headers = `${t('csvName')},${t('csvEmail')},${t('csvPhone')},${t('csvGroup')},${t('csvNotes')}`;
        const csvContent = `${headers}\n${t('csvSampleContent')}`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "lead_import_sample.csv";
        a.click();
    };

    const exportLeads = () => {
        const headers = [t('csvName'), t('csvEmail'), t('csvPhone'), t('csvGroup'), t('csvSource'), t('csvStatus'), t('csvDate'), t('csvNotes')];
        const csvRows = [headers.join(',')];
        
        leads.forEach(l => {
            csvRows.push([
                `"${l.full_name}"`,
                `"${l.email}"`,
                `"${l.phone}"`,
                `"${l.lead_group || DEFAULT_LEAD_GROUP}"`,
                `"${(l.source || '').replace(/apify/gi, 'Marketplaces')}"`,
                `"${l.lead_status}"`,
                `"${new Date(l.created_at).toLocaleString()}"`,
                `"${l.notes || ''}"`
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const deleteSelectedLeads = async () => {
        setLead_to_delete({ id: 'bulk', full_name: `${selectedLeads.length} leads` });
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            if (leadToDelete.id === 'bulk') {
                const res = await fetch(`${API_URL}/api/leads/bulk-delete`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ ids: selectedLeads })
                });
                const data = await res.json();
                if (data.success) {
                    setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
                    setSelectedLeads([]);
                    showToast(t('leadsDeletedBulk', { n: selectedLeads.length }));
                    setShowDeleteModal(false);
                    setLead_to_delete(null);
                }
            } else {
                const res = await fetch(`${API_URL}/api/leads/${leadToDelete.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setLeads(leads.filter(l => l.id !== leadToDelete.id));
                    showToast(t('leadDeleted'));
                    if (selectedLead?.id === leadToDelete.id) setSelectedLead(null);
                    setShowDeleteModal(false);
                    setLead_to_delete(null);
                }
            }
        } catch (error) {
            showToast(t('deleteFailed'), 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = (lead) => {
        setLead_to_delete(lead);
        setShowDeleteModal(true);
    };

    const fetchTimeline = async (leadId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/leads/${leadId}/timeline`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLeadTimeline(data.timeline);
                setShowTimeline(true);
            }
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
        }
    };

    const toggleLeadSelection = (id) => {
        setSelectedLeads(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l.id));
        }
    };

    const renderLeadStatusLabel = (status) => {
        if (status === 'Contacted') return t('statusContacted');
        if (status === 'Closed') return t('statusClosed');
        if (status === 'Replied') return t('statusReplied') || 'Replied';
        return t('statusNew');
    };

    const getScoreBreakdown = (lead) => {
        const factors = [`Base: 35`];
        if (lead.email?.trim()) factors.push('+15 email');
        if (lead.phone?.trim()) factors.push('+15 phone');
        if (lead.consent_given || lead.marketing_consent) factors.push('+10 consent');
        if (lead.lead_status === 'Contacted') factors.push('+15 contacted');
        if (lead.lead_status === 'Closed') factors.push('+20 closed');
        return factors.join(' · ');
    };

    const renderLeadRow = (lead) => {
        const score = getLeadScore(lead);
        const scoreTier = getLeadScoreTier(score);
        const displayName = getLeadDisplayName(lead, t('importedLead'));

        return (
            <tr
                key={lead.id}
                className={`lead-row lead-row--clickable ${selectedLeads.includes(lead.id) ? 'selected-row' : ''}`}
                onClick={() => handleSelectLead(lead)}
            >
                <td onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => toggleLeadSelection(lead.id)}
                        className={`${selectedLeads.includes(lead.id) ? 'text-accent' : 'text-secondary/30'} hover:text-accent transition-colors`}
                    >
                        {selectedLeads.includes(lead.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                </td>
                <td>
                    <div className="lead-name-cell">
                        <div className="lead-avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="lead-name-info">
                            <span className="lead-name-text">
                                {displayName}
                                {isHotLead(lead) && (
                                    <span className="lead-hot-badge" title={tWithFallback('hotLeadTooltip', 'High intent — reach out fast')}>
                                        🔥 {tWithFallback('hotLeadBadge', 'Hot')}
                                    </span>
                                )}
                            </span>
                            {lead.email && <p className="lead-email-sub">{lead.email}</p>}
                        </div>
                    </div>
                </td>
                <td>
                    <span className={`lead-source-badge ${getSourceClass(lead.source)}`}>
                        {getSourceLabel(lead.source) || '—'}
                    </span>
                </td>
                <td title={getScoreBreakdown(lead)}>
                    <div className="lead-score-cell">
                        <span className={`lead-score-num lead-score-num--${scoreTier}`}>{score}</span>
                        <div className="lead-score-bar">
                            <div className={`lead-score-fill lead-score-fill--${scoreTier}`} style={{ width: `${score}%` }} />
                        </div>
                    </div>
                </td>
                <td>
                    <span className={`lead-status-chip lead-status-chip--${(lead.lead_status || 'new').toLowerCase()}`}>
                        {renderLeadStatusLabel(lead.lead_status)}
                    </span>
                </td>
                <td>
                    <span className="lead-date">{formatLeadTableDate(lead.created_at, language === 'es' ? 'es' : 'en')}</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    <div className="lead-actions">
                        <button
                            type="button"
                            className="lead-action-quick"
                            title={t('leadActionWhatsApp')}
                            onClick={(e) => openLeadWhatsApp(lead, e)}
                            disabled={!lead.phone}
                        >
                            <WhatsAppIcon size={16} />
                        </button>
                        <button
                            type="button"
                            className="lead-action-quick"
                            title={t('leadActionEmail')}
                            onClick={(e) => openLeadEmail(lead, e)}
                            disabled={!lead.email}
                            aria-label={`Send email to ${getLeadDisplayName(lead, t('importedLead'))}`}
                        >
                            <Mail size={16} />
                        </button>
                        <button
                            type="button"
                            className="lead-action-quick"
                            title={t('leadActionCall')}
                            onClick={(e) => openLeadCall(lead, e)}
                            disabled={!lead.phone}
                        >
                            <Phone size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSelectLead(lead); }}
                            className="lead-action-quick"
                            title={t('editLead')}
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    const tableColSpan = 8;

    const tableBodyRows = loading
        ? [1, 2, 3, 4, 5].map((i) => (
            <tr key={i}><td colSpan={tableColSpan}><SkeletonRow /></td></tr>
        ))
        : sortedLeads.map(renderLeadRow);

    return (
        <div className="dashboard-page leads-page pb-20">
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        <CheckCircle2 size={18} /> {toast.message}
                    </div>
                </div>
            )}

            {/* Email Composer Modal */}
            {emailComposerLead && (
                <EmailComposerModal
                    leadId={emailComposerLead.id}
                    to={emailComposerLead.email}
                    recipientName={getLeadDisplayName(emailComposerLead, t('importedLead'))}
                    onClose={() => setEmailComposerLead(null)}
                    onSend={handleEmailSent}
                />
            )}

            {/* Lead Timeline Modal */}
            {showTimeline && (
                <div className="import-modal-overlay" onClick={() => setShowTimeline(false)}>
                    <div className="import-modal timeline-modal" onClick={e => e.stopPropagation()}>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                    <History className="text-accent" /> {t('leadTimeline')}
                                </h3>
                                <button onClick={() => setShowTimeline(false)} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                    <XCircle size={24} className="text-secondary" />
                                </button>
                            </div>
                            <div className="timeline-container relative pl-8 border-l-2 border-color/30 space-y-8">
                                {leadTimeline.length === 0 ? (
                                    <p className="text-secondary italic">{t('noEventsYet')}</p>
                                ) : leadTimeline.map((event, i) => (
                                    <div key={i} className="timeline-event relative">
                                        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-accent shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"></div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black uppercase tracking-widest text-accent">
                                                {formatRelativeTime(event.timestamp)}
                                            </span>
                                            <h4 className="font-bold text-lg">{event.title}</h4>
                                            <p className="text-secondary text-sm">{event.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="import-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="import-modal confirmation-modal" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">{t('confirmDeleteTitle')}</h3>
                            <p className="text-secondary mb-8">
                                {t('confirmDeleteMessage', { name: leadToDelete?.full_name })}
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn-secondary flex-1 py-3 font-black uppercase tracking-widest"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={executeDelete}
                                    disabled={isDeleting}
                                    className="btn-danger flex-1 py-3 font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    <span className="uppercase">{t('delete')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Folder Confirmation Modal */}
            {showDeleteFolderModal && (
                <div className="import-modal-overlay" onClick={() => setShowDeleteFolderModal(false)}>
                    <div className="import-modal confirmation-modal" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">{t('confirmDeleteFolderTitle')}</h3>
                            <p className="text-secondary mb-8">
                                {folderToDelete?.total > 0
                                    ? t('confirmDeleteFolderMessageWithLeads', { name: folderToDelete?.name, count: folderToDelete?.total, target: DEFAULT_LEAD_GROUP })
                                    : t('confirmDeleteFolderMessage', { name: folderToDelete?.name })}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteFolderModal(false)}
                                    className="btn-secondary flex-1 py-3 font-black uppercase tracking-widest"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={executeDeleteFolder}
                                    disabled={isDeletingFolder}
                                    className="btn-danger flex-1 py-3 font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {isDeletingFolder ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    <span className="uppercase">{t('delete')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
                <div>
                    {activeFolder ? (
                        <button type="button" onClick={closeFolder} className="lead-folder-back mb-2">
                            <ArrowLeft size={16} /> {t('leadFoldersBack')}
                        </button>
                    ) : null}
                    <h2 className="text-3xl font-black tracking-tighter mb-1">
                        {activeFolder || t('leadsUnifiedTitle')}
                    </h2>
                    <p className="text-secondary text-base font-medium">
                        {activeFolder ? t('leadFolderViewSub') : t('leadsFoldersSub')}
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {activeFolder && selectedLeads.length > 0 && (
                        <>
                            <button
                                onClick={() => triggerBulkFollowup()}
                                disabled={isBulkSending}
                                className="btn-secondary text-[11px] font-black uppercase tracking-widest px-6 flex items-center gap-2"
                            >
                                <Send size={18} /> ({selectedLeads.length})
                            </button>
                            <button onClick={deleteSelectedLeads} disabled={isDeleting} className="btn-danger text-[11px] font-black uppercase tracking-widest px-6 flex items-center gap-2">
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={18} />}
                                {t('deleteSelected')}
                            </button>
                        </>
                    )}
                    <button type="button" onClick={() => setShowImportModal(true)} className="btn-secondary text-[11px] font-black uppercase tracking-widest px-6">
                        <Upload size={18} /> {t('importExcelCSV')}
                    </button>
                </div>
            </header>

            {!activeFolder && (
                <div className="filter-bar p-4 rounded-2xl border border-color shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--bg-card)' }}>
                    <div className="search-input-wrapper leads-search-wrapper relative flex-1 min-w-[300px]">
                        <Search size={18} className="leads-search-icon" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder={t('leadFoldersSearch')}
                            className="input-field leads-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')} className="leads-search-clear">
                                <XCircle size={14} className="text-secondary" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!activeFolder && (
                <div className="lead-folders-grid mb-8">
                    {foldersLoading ? (
                        <p className="text-secondary font-medium">{t('loadingLeads')}</p>
                    ) : filteredFolders.length === 0 ? (
                        <EmptyState
                            icon={FolderOpen}
                            title={t('leadFoldersEmptyTitle')}
                            description={t('leadFoldersEmptyBody')}
                            actionLabel={t('importExcelCSV')}
                            action={() => setShowImportModal(true)}
                        />
                    ) : (
                        filteredFolders.map((folder) => (
                            <button
                                key={folder.name}
                                type="button"
                                className="lead-folder-card"
                                onClick={() => openFolder(folder)}
                            >
                                <div className="lead-folder-card-icon">
                                    <FolderOpen size={22} />
                                </div>
                                <div className="lead-folder-card-body">
                                    <span className="lead-folder-card-title">{folder.name}</span>
                                    <span className="lead-folder-card-count">
                                        {t('leadFolderContactCount', { count: folder.total })}
                                    </span>
                                     <span className="lead-folder-card-meta">
                                         {folder.new_count} {t('statusNew').toLowerCase()} · {folder.contacted_count} {t('statusContacted').toLowerCase()} · {folder.replied_count || 0} {(t('statusReplied') || 'Replied').toLowerCase()}
                                     </span>
                                </div>
                                {folder.name !== DEFAULT_LEAD_GROUP && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        className="lead-folder-card-delete"
                                        title={t('leadFolderDeleteAction')}
                                        aria-label={t('leadFolderDeleteAction', { name: folder.name })}
                                        onClick={(e) => confirmDeleteFolder(folder, e)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') confirmDeleteFolder(folder, e);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </span>
                                )}
                                <ChevronRight size={18} className="lead-folder-card-chevron" />
                            </button>
                        ))
                    )}
                </div>
            )}



            {activeFolder && (
            !loading && loadError ? (
                <EmptyState
                    icon={RefreshCw}
                    title={t('leadsLoadFailedTitle')}
                    description={loadError || t('leadsLoadFailed')}
                    actionLabel={t('leadsRetry')}
                    action={() => fetchLeads()}
                />
            ) : (
            <>
            {folderStats && (
                <div className="leads-stats-grid mb-6">
                    <div className="leads-stat-card">
                        <p className="leads-stat-label">{t('leadsStatsTotal')}</p>
                        <p className="leads-stat-value">{folderStats.total}</p>
                    </div>
                    <div className="leads-stat-card">
                        <p className="leads-stat-label">{t('leadsStatsNew')}</p>
                        <p className="leads-stat-value leads-stat-value--new">{folderStats.new}</p>
                    </div>
                    <div className="leads-stat-card">
                        <p className="leads-stat-label">{t('leadsStatsContacted')}</p>
                        <p className="leads-stat-value leads-stat-value--contacted">{folderStats.contacted}</p>
                    </div>
                    <div className="leads-stat-card">
                        <p className="leads-stat-label">{t('leadsStatsReplied') || 'Replied'}</p>
                        <p className="leads-stat-value leads-stat-value--replied">{folderStats.replied}</p>
                    </div>
                    <div className="leads-stat-card">
                        <p className="leads-stat-label">{t('leadsStatsClosed')}</p>
                        <p className="leads-stat-value leads-stat-value--closed">{folderStats.closed}</p>
                    </div>
                </div>
            )}
            <div className="table-container shadow-xl">
                <div className="leads-table-toolbar">
                    <div className="search-input-wrapper leads-search-wrapper relative flex-1 min-w-[240px]">
                        <Search size={18} className="leads-search-icon" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholderLeads')}
                            className="input-field leads-search-input leads-search-input--toolbar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button type="button" onClick={() => setSearchTerm('')} className="leads-search-clear">
                                <XCircle size={14} className="text-secondary" />
                            </button>
                        )}
                    </div>
                    <div className="leads-table-toolbar-filters">
                        <CustomSelect
                            name="source"
                            label={t('allSources')}
                            value={filters.source}
                            options={[
                                { label: t('allSources'), value: '' },
                                { label: t('qrSurvey'), value: 'QR Survey' },
                                { label: t('excelUpload'), value: 'Excel Upload' },
                                { label: t('csvUpload'), value: 'CSV Upload' },
                            ]}
                            onChange={(val) => setFilters({ ...filters, source: val })}
                        />
                        <CustomSelect
                            name="status"
                            label={t('allStatuses')}
                            value={filters.status}
                            options={[
                                { label: t('allStatuses'), value: '' },
                                { label: t('statusNew'), value: 'New' },
                                { label: t('statusContacted'), value: 'Contacted' },
                                { label: t('statusReplied') || 'Replied', value: 'Replied' },
                                { label: t('statusClosed'), value: 'Closed' },
                            ]}
                            onChange={(val) => setFilters({ ...filters, status: val })}
                        />
                        <button type="button" onClick={exportLeads} className="btn-secondary leads-export-btn">
                            <Download size={16} /> {t('exportList')}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="leads-table leads-table--modern">
                        <thead>
                            <tr>
                                <th className="w-10 leads-table-th">
                                    <button type="button" onClick={toggleAllSelection} className="text-secondary hover:text-accent transition-colors">
                                        {selectedLeads.length === leads.length && leads.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="leads-table-th" onClick={() => handleSort('full_name')}>{t('leadColumnHeader')}</th>
                                <th className="leads-table-th" onClick={() => handleSort('source')}>{t('sourceHeader')}</th>
                                <th className="leads-table-th">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        {t('leadScoreLabel')}
                                        <Info
                                            size={12}
                                            style={{ color: 'var(--text-secondary)', cursor: 'help', flexShrink: 0 }}
                                            title={t('leadScoreTooltip')}
                                        />
                                    </span>
                                </th>
                                <th className="leads-table-th" onClick={() => handleSort('lead_status')}>{t('statusHeader')}</th>
                                <th className="leads-table-th" onClick={() => handleSort('created_at')}>{t('createdHeader')}</th>
                                <th className="leads-table-th">{t('actionsHeader')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableBodyRows}
                            {!loading && sortedLeads.length === 0 && (
                                <tr>
                                    <td colSpan={tableColSpan} className="leads-table-empty-cell">
                                        {searchTerm || filters.source || filters.status
                                            ? t('leadsFilterEmpty')
                                            : t('noLeadsFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            ))}

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => handleSelectLead(null)}
                    onUpdate={updateLead}
                    folderNameOptions={folderNameOptions}
                    defaultLeadGroup={DEFAULT_LEAD_GROUP}
                    folderMessage={folderMessage}
                    onTriggerFollowup={triggerFollowup}
                    sendingFollowup={sendingLeadId === selectedLead.id}
                    onFetchTimeline={fetchTimeline}
                />
            )}

            <LeadFolderImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={handleImportSuccess}
                importSource="Excel Upload"
                skipCapture
                importPurpose="followup"
            />
        </div>
    );
};

export default Leads;
