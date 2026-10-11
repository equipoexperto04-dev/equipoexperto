import React, { useState, useEffect } from 'react';
import { Users, Server, Activity, ShieldAlert, Loader2, LifeBuoy, CheckCircle2, Clock, AlertTriangle, Eye, Trash2, X, RefreshCw, CreditCard, Lock, ShieldCheck, Copy, Check, FlaskConical, Zap } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';
import { get, patch, del } from '../utils/api.js';
import { useToast } from '../components/Toast';
import './ListTable.css';

const AdminPanel = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('tickets'); // 'users' | 'tickets'
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userError, setUserError] = useState('');

    // Ticket State
    const [tickets, setTickets] = useState([]);
    const [ticketStats, setTicketStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminNotesInput, setAdminNotesInput] = useState('');
    const [forbidden, setForbidden] = useState(false);

    // Stripe Gateway State
    const [stripeSettings, setStripeSettings] = useState({
        mode: 'test',
        hasTestKey: false,
        hasLiveKey: false,
        testKeyMasked: '',
        liveKeyMasked: '',
        activeKeyMasked: '',
    });
    const [loadingStripe, setLoadingStripe] = useState(false);
    const [togglingStripe, setTogglingStripe] = useState(false);
    const [copiedCard, setCopiedCard] = useState(false);
    const [showLiveConfirmModal, setShowLiveConfirmModal] = useState(false);

    const fetchStripeSettings = async () => {
        setLoadingStripe(true);
        try {
            const data = await get('/api/admin/settings/stripe');
            if (data?.success) {
                setStripeSettings(data);
            }
        } catch (err) {
            toast(err.message || 'Failed to fetch Stripe gateway settings', 'error');
        } finally {
            setLoadingStripe(false);
        }
    };

    const handleSelectMode = (targetMode) => {
        if (targetMode === stripeSettings.mode) return;
        if (targetMode === 'live') {
            setShowLiveConfirmModal(true);
        } else {
            executeSwitchStripeMode('test');
        }
    };

    const handleToggleStripeMode = () => {
        if (stripeSettings.mode === 'test') {
            setShowLiveConfirmModal(true);
        } else {
            executeSwitchStripeMode('test');
        }
    };

    const executeSwitchStripeMode = async (targetMode) => {
        setShowLiveConfirmModal(false);
        setTogglingStripe(true);
        try {
            const data = await patch('/api/admin/settings/stripe', { mode: targetMode });
            if (data?.success) {
                setStripeSettings(prev => ({ ...prev, mode: data.mode }));
                toast(data.message || `Stripe switched to ${data.mode.toUpperCase()} mode successfully`, 'success');
                fetchStripeSettings();
            }
        } catch (err) {
            toast(err.message || 'Failed to switch Stripe mode', 'error');
        } finally {
            setTogglingStripe(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setUserError('');
        try {
            const data = await get('/api/admin/users');
            if (data?.success && Array.isArray(data.users)) {
                setUsers(data.users);
            } else {
                setUsers([]);
            }
        } catch (err) {
            if (err.status === 403) {
                setForbidden(true);
            } else {
                setUserError(err.message || 'Failed to fetch users');
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const data = await get(`/api/admin/tickets?status=${ticketFilter}`);
            if (data?.success) {
                setTickets(data.tickets || []);
                if (data.stats) setTicketStats(data.stats);
            }
        } catch (err) {
            if (err.status === 403) setForbidden(true);
            toast(err.message || 'Failed to fetch support tickets', 'error');
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchStripeSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'tickets') {
            fetchTickets();
        } else if (activeTab === 'payment') {
            fetchStripeSettings();
        }
    }, [activeTab, ticketFilter]);

    const handleToggleStatus = async (userId, currentStatus) => {
        const newActive = currentStatus !== 'active';
        try {
            await patch(`/api/admin/users/${userId}/status`, { active: newActive });
            setUsers(prev =>
                prev.map(u => (u.id === userId ? { ...u, status: newActive ? 'active' : 'inactive' } : u))
            );
            toast('User status updated successfully', 'success');
        } catch (err) {
            toast(err.message || 'Failed to update user status', 'error');
        }
    };

    const handleUpdateTicketStatus = async (ticketId, newStatus, notes) => {
        try {
            const data = await patch(`/api/admin/tickets/${ticketId}/status`, {
                status: newStatus,
                admin_notes: notes !== undefined ? notes : adminNotesInput
            });
            if (data?.success && data.ticket) {
                setTickets(prev => prev.map(t => (t.id === ticketId ? data.ticket : t)));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket(data.ticket);
                }
                toast(`Ticket #${ticketId} status updated to ${newStatus}`, 'success');
                fetchTickets();
            }
        } catch (err) {
            toast(err.message || 'Failed to update ticket status', 'error');
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm(`Are you sure you want to delete Ticket #${ticketId}?`)) return;
        try {
            await del(`/api/admin/tickets/${ticketId}`);
            setTickets(prev => prev.filter(t => t.id !== ticketId));
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
            toast(`Ticket #${ticketId} deleted`, 'info');
            fetchTickets();
        } catch (err) {
            toast(err.message || 'Failed to delete ticket', 'error');
        }
    };

    const totalUsers = users.length;
    const totalActiveRecipes = users.reduce((sum, u) => sum + (parseInt(u.active_recipes, 10) || 0), 0);

    if (forbidden) {
        return (
            <div className="page-container flex flex-column items-center justify-center py-12" style={{ padding: '0 1rem' }}>
                <ShieldAlert size={48} className="text-danger mb-4" />
                <h3 className="text-2xl font-bold mb-2">Access Denied</h3>
                <p className="text-secondary text-center">You must be logged in as an administrator to view this page.</p>
            </div>
        );
    }

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'urgent': return 'badge-error';
            case 'high': return 'badge-warning';
            case 'medium': return 'badge-accent';
            default: return 'badge-neutral';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'resolved': return 'badge-success';
            case 'in_progress': return 'badge-warning';
            case 'open': return 'badge-error';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="page-container" style={{ padding: '0 1rem', maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="mb-8" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Admin Control Panel</h2>
                    <p className="text-secondary text-base">Manage registered users, customer support issues, and system health.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('tickets')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                        <LifeBuoy size={18} />
                        <span>Customer Issues ({ticketStats.open})</span>
                    </button>
                    <button
                        className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('users')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                        <Users size={18} />
                        <span>User Directory ({totalUsers})</span>
                    </button>
                    <button
                        className={`btn ${activeTab === 'payment' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('payment')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                    >
                        <CreditCard size={18} />
                        <span>Payment Mode ({stripeSettings.mode === 'live' ? 'LIVE' : 'TEST'})</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: CUSTOMER ISSUES */}
            {activeTab === 'tickets' && (
                <>
                    <div className="stats-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Total Issues</p>
                                <h3 className="text-3xl font-extrabold mb-0">{loadingTickets ? '...' : ticketStats.total}</h3>
                            </div>
                            <div className="p-3 rounded-xl text-accent" style={{ background: 'var(--accent-light)' }}>
                                <LifeBuoy size={24} />
                            </div>
                        </div>

                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Open Tickets</p>
                                <h3 className="text-3xl font-extrabold mb-0" style={{ color: '#ef4444' }}>{loadingTickets ? '...' : ticketStats.open}</h3>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                            </div>
                        </div>

                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">In Progress</p>
                                <h3 className="text-3xl font-extrabold mb-0" style={{ color: '#f59e0b' }}>{loadingTickets ? '...' : ticketStats.in_progress}</h3>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <Clock size={24} />
                            </div>
                        </div>

                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Resolved</p>
                                <h3 className="text-3xl font-extrabold mb-0" style={{ color: '#10b981' }}>{loadingTickets ? '...' : ticketStats.resolved}</h3>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden" style={{ padding: 0, border: '1px solid var(--border-color)', width: '100%', maxWidth: '100%' }}>
                        <div className="p-6 border-b flex justify-between items-center" style={{ padding: '1.25rem 1.5rem', borderColor: 'var(--border-color)', borderBottomWidth: '1px', borderBottomStyle: 'solid', background: 'var(--bg-card)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-xl m-0 tracking-tight">Customer Issues & Support Inbox</h3>
                                {loadingTickets && <Loader2 className="animate-spin text-accent" size={18} />}
                            </div>

                            {/* Status Filter Buttons */}
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setTicketFilter(st)}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${ticketFilter === st ? 'bg-accent text-white' : 'bg-secondary/10 text-secondary'}`}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: ticketFilter === st ? 'var(--accent-color, #2563eb)' : 'var(--bg-secondary)',
                                            color: ticketFilter === st ? '#ffffff' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                                <button
                                    onClick={fetchTickets}
                                    className="p-2 text-secondary hover:text-primary rounded-lg"
                                    title="Refresh Tickets"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        {!loadingTickets && tickets.length === 0 && (
                            <div className="p-12 text-center text-secondary italic">
                                No customer support tickets found for status "{ticketFilter}".
                            </div>
                        )}

                        {tickets.length > 0 && (
                            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', display: 'block' }}>
                                <table className="custom-table w-100" style={{ minWidth: '920px', width: '100%' }}>
                                    <thead style={{ background: 'var(--bg-secondary)' }}>
                                        <tr>
                                            <th style={{ width: '60px' }}>ID</th>
                                            <th style={{ minWidth: '140px' }}>Customer Name</th>
                                            <th style={{ minWidth: '180px' }}>Email</th>
                                            <th style={{ minWidth: '220px' }}>Topic / Subject</th>
                                            <th style={{ width: '100px' }}>Priority</th>
                                            <th style={{ width: '140px' }}>Status</th>
                                            <th style={{ minWidth: '140px' }}>Submitted</th>
                                            <th className="text-right" style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map((ticket) => (
                                            <tr key={ticket.id}>
                                                <td className="font-bold">#{ticket.id}</td>
                                                <td className="font-bold">{ticket.name}</td>
                                                <td className="text-sm text-secondary">{ticket.email}</td>
                                                <td className="text-sm" style={{ maxWidth: '240px', wordBreak: 'break-word' }}>{ticket.subject}</td>
                                                <td>
                                                    <span className={`badge ${getPriorityBadgeClass(ticket.priority)}`}>
                                                        {ticket.priority || 'medium'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={ticket.status}
                                                        onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                                                        className="text-xs font-bold px-2 py-1 rounded"
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.375rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            border: '1px solid var(--border-color)',
                                                            background: 'var(--bg-card)',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                    >
                                                        <option value="open">OPEN</option>
                                                        <option value="in_progress">IN PROGRESS</option>
                                                        <option value="resolved">RESOLVED</option>
                                                    </select>
                                                </td>
                                                <td className="text-xs text-secondary">
                                                    {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="text-right" style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                                                        <button
                                                            onClick={() => { setSelectedTicket(ticket); setAdminNotesInput(ticket.admin_notes || ''); }}
                                                            className="btn btn-ghost p-1 text-accent"
                                                            title="View Full Issue Details"
                                                            style={{ padding: '0.375rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTicket(ticket.id)}
                                                            className="btn btn-ghost p-1 text-danger"
                                                            title="Delete Ticket"
                                                            style={{ padding: '0.375rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', color: '#ef4444', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: USER DIRECTORY */}
            {activeTab === 'users' && (
                <>
                    <div className="stats-grid mb-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-card stat-card flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-semibold mb-1 uppercase tracking-wider">Total Users</p>
                                <h3 className="text-4xl font-extrabold mb-0">{loadingUsers ? '...' : totalUsers}</h3>
                            </div>
                            <div className="stat-icon-wrapper text-accent p-4 rounded-2xl" style={{ background: 'var(--accent-light)' }}>
                                <Users size={28} />
                            </div>
                        </div>
                        <div className="glass-card stat-card flex items-center justify-between">
                            <div>
                                <p className="text-secondary text-sm font-semibold mb-1 uppercase tracking-wider">Active Recipes</p>
                                <h3 className="text-4xl font-extrabold mb-0">{loadingUsers ? '...' : totalActiveRecipes}</h3>
                            </div>
                            <div className="stat-icon-wrapper p-4 rounded-2xl" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                                <Server size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card animate-fade-in overflow-hidden" style={{ padding: 0, border: '1px solid var(--border-color)' }}>
                        <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px', borderBottomStyle: 'solid', background: 'var(--bg-card)' }}>
                            <h3 className="font-bold text-xl m-0 tracking-tight">User Directory</h3>
                            {loadingUsers && <Loader2 className="animate-spin text-accent" size={20} />}
                        </div>

                        {userError && (
                            <div className="p-8 text-center text-danger">
                                <p className="m-0 font-medium">{userError}</p>
                            </div>
                        )}

                        {!loadingUsers && !userError && users.length === 0 && (
                            <div className="p-8 text-center text-secondary italic">
                                No registered users found.
                            </div>
                        )}

                        {(users.length > 0) && (
                            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto', display: 'block' }}>
                                <table className="custom-table w-100" style={{ minWidth: '750px', width: '100%' }}>
                                    <thead style={{ background: 'var(--bg-secondary)' }}>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Onboarding Support</th>
                                            <th>Active Recipes</th>
                                            <th>Account Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id}>
                                                <td className="font-bold">{u.name || 'Anonymous User'}</td>
                                                <td className="text-sm text-secondary">{u.email}</td>
                                                <td>
                                                    <span className={`badge ${u.role === 'admin' ? 'badge-error' : 'badge-neutral'}`}>
                                                        {u.role || 'user'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {u.selected_onboarding_support ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                            color: '#10b981',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: 700
                                                        }}>
                                                            <CheckCircle2 size={12} /> VIP Onboarding
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Standard</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Activity size={14} className="text-accent" />
                                                        <span className="font-bold">{u.active_recipes || 0}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <ToggleSwitch
                                                        checked={u.status === 'active'}
                                                        onChange={() => handleToggleStatus(u.id, u.status)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 3: PAYMENT GATEWAY (STRIPE TEST / LIVE MODE) */}
            {activeTab === 'payment' && (
                <>
                    {/* Top Stats Overview */}
                    <div className="stats-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Gateway Status</p>
                                <h3 className="text-2xl font-extrabold mb-0" style={{ color: stripeSettings.mode === 'live' ? '#10b981' : '#f59e0b' }}>
                                    {stripeSettings.mode === 'live' ? 'LIVE MODE' : 'TEST MODE'}
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: stripeSettings.mode === 'live' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: stripeSettings.mode === 'live' ? '#10b981' : '#f59e0b' }}>
                                <CreditCard size={24} />
                            </div>
                        </div>

                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Test Key (Sandbox)</p>
                                <h4 className="text-lg font-bold mb-0" style={{ fontFamily: 'monospace' }}>
                                    {stripeSettings.testKeyMasked || (stripeSettings.hasTestKey ? 'Configured' : 'Missing')}
                                </h4>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: stripeSettings.hasTestKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: stripeSettings.hasTestKey ? '#10b981' : '#ef4444' }}>
                                {stripeSettings.hasTestKey ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                            </div>
                        </div>

                        <div className="glass-card stat-card flex items-center justify-between" style={{ padding: '1.25rem' }}>
                            <div>
                                <p className="text-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Live Key (Production)</p>
                                <h4 className="text-lg font-bold mb-0" style={{ fontFamily: 'monospace' }}>
                                    {stripeSettings.liveKeyMasked || (stripeSettings.hasLiveKey ? 'Configured' : 'Missing')}
                                </h4>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: stripeSettings.hasLiveKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: stripeSettings.hasLiveKey ? '#10b981' : '#ef4444' }}>
                                {stripeSettings.hasLiveKey ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                            </div>
                        </div>
                    </div>

                    {/* Segmented Mode Selector Card */}
                    <div className="glass-card mb-8 animate-fade-in" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '1rem', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 className="text-xl font-bold m-0" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                    <span>Payment Gateway Mode</span>
                                </h3>
                                <p className="text-secondary text-sm m-0" style={{ marginTop: '0.375rem' }}>
                                    Select which Stripe environment your application processes checkouts with:
                                </p>
                            </div>

                            {/* Unambiguous Segmented Buttons */}
                            <div
                                style={{
                                    display: 'inline-flex',
                                    padding: '0.375rem',
                                    borderRadius: '0.875rem',
                                    background: 'var(--bg-primary, #0f172a)',
                                    border: '1px solid var(--border-color)',
                                    gap: '0.5rem',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                                }}
                            >
                                {/* TEST MODE BUTTON */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectMode('test')}
                                    disabled={togglingStripe}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '0.625rem',
                                        border: stripeSettings.mode === 'test' ? '1px solid #f59e0b' : '1px solid transparent',
                                        background: stripeSettings.mode === 'test' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                                        color: stripeSettings.mode === 'test' ? '#ffffff' : 'var(--text-secondary)',
                                        fontWeight: stripeSettings.mode === 'test' ? 800 : 600,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: stripeSettings.mode === 'test' ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
                                    }}
                                >
                                    <FlaskConical size={18} />
                                    <span>Test Mode (Sandbox)</span>
                                    {stripeSettings.mode === 'test' && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            ACTIVE
                                        </span>
                                    )}
                                </button>

                                {/* LIVE MODE BUTTON */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectMode('live')}
                                    disabled={togglingStripe}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '0.625rem',
                                        border: stripeSettings.mode === 'live' ? '1px solid #10b981' : '1px solid transparent',
                                        background: stripeSettings.mode === 'live' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                        color: stripeSettings.mode === 'live' ? '#ffffff' : 'var(--text-secondary)',
                                        fontWeight: stripeSettings.mode === 'live' ? 800 : 600,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: stripeSettings.mode === 'live' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                                    }}
                                >
                                    <Zap size={18} />
                                    <span>Live Mode (Real Payments)</span>
                                    {stripeSettings.mode === 'live' && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            ACTIVE
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Unmistakable Status Banner */}
                        <div
                            style={{
                                padding: '1.125rem 1.25rem',
                                borderRadius: '0.75rem',
                                background: stripeSettings.mode === 'live' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                border: stripeSettings.mode === 'live' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: stripeSettings.mode === 'live' ? '#10b981' : '#f59e0b',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: stripeSettings.mode === 'live' ? '0 0 12px rgba(16, 185, 129, 0.4)' : '0 0 12px rgba(245, 158, 11, 0.4)',
                                    }}
                                >
                                    {stripeSettings.mode === 'live' ? <Zap size={20} /> : <FlaskConical size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: stripeSettings.mode === 'live' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>
                                            {stripeSettings.mode === 'live'
                                                ? 'CURRENT STATUS: LIVE PRODUCTION MODE IS ACTIVE'
                                                : 'CURRENT STATUS: SANDBOX TEST MODE IS ACTIVE'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: '1.4' }}>
                                        {stripeSettings.mode === 'live'
                                            ? 'Real credit cards will be billed actual funds in EUR (€). All checkouts go directly to your live Stripe account.'
                                            : 'Safe sandbox environment. Test cards (e.g. 4242 4242 4242 4242) are accepted. Zero actual charges.'}
                                    </div>
                                </div>
                            </div>

                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '0.5rem',
                                    background: stripeSettings.mode === 'live' ? '#10b981' : '#f59e0b',
                                    color: '#ffffff',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {stripeSettings.mode === 'live' ? 'READY FOR REAL CUSTOMERS' : 'SAFE FOR TESTING'}
                            </span>
                        </div>

                        {togglingStripe && (
                            <div className="flex items-center gap-2 text-xs text-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Switching payment gateway mode...</span>
                            </div>
                        )}
                    </div>

                    {/* Information & Sandbox Helper Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Test Card Quick Info */}
                        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <ShieldCheck size={20} className="text-accent" />
                                <h4 className="text-base font-bold m-0">Sandbox Test Card</h4>
                            </div>
                            <p className="text-secondary text-xs mb-3">
                                Use Stripe's official standard testing card during checkout while in Test Mode:
                            </p>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    fontFamily: 'monospace',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    marginBottom: '0.75rem',
                                }}
                            >
                                <span>4242 4242 4242 4242</span>
                                <button
                                    className="btn btn-ghost"
                                    style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                                    onClick={() => {
                                        navigator.clipboard.writeText('4242424242424242');
                                        setCopiedCard(true);
                                        setTimeout(() => setCopiedCard(false), 2000);
                                    }}
                                >
                                    {copiedCard ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                    <span>{copiedCard ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                <span><strong>Expiry:</strong> Any future date (e.g. 12/28)</span>
                                <span><strong>CVC:</strong> Any 3 digits (e.g. 123)</span>
                                <span><strong>ZIP:</strong> Any valid ZIP (e.g. 28001)</span>
                            </div>
                        </div>

                        {/* Important Stripe Notice */}
                        <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
                                <AlertTriangle size={20} />
                                <h4 className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>Important Considerations</h4>
                            </div>
                            <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                                <li className="mb-2">
                                    <strong>Customer Isolation:</strong> Test subscriptions created in Test Mode exist strictly in the Stripe Sandbox and cannot be charged in Live Mode.
                                </li>
                                <li className="mb-2">
                                    <strong>Auto-Provisioning:</strong> The server automatically creates Starter, Growth, and Pro subscription products and prices on Stripe for whichever mode is active.
                                </li>
                                <li>
                                    <strong>Going Live:</strong> When testing is concluded and you switch the toggle to Live Mode, new customer checkouts will automatically charge real cards in Euros.
                                </li>
                            </ul>
                        </div>
                    </div>
                </>
            )}

            {/* DETAIL MODAL FOR CUSTOMER ISSUE */}
            {selectedTicket && (
                <div className="support-modal-backdrop" onClick={() => setSelectedTicket(null)}>
                    <div className="support-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="support-modal-header">
                            <h3 className="support-modal-title">
                                <LifeBuoy size={20} className="text-accent" />
                                Customer Issue #{selectedTicket.id}
                            </h3>
                            <button className="support-modal-close" onClick={() => setSelectedTicket(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="support-modal-body">
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 className="font-bold text-lg m-0">{selectedTicket.subject}</h4>
                                    <span className={`badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                                        {selectedTicket.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-xs text-secondary mb-4 flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                                    <span><strong>Customer:</strong> {selectedTicket.name} ({selectedTicket.email})</span>
                                    <span><strong>Source:</strong> {selectedTicket.source}</span>
                                    <span><strong>Date:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary/10 mb-4" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <p className="text-xs font-semibold text-secondary uppercase mb-1" style={{ margin: '0 0 0.5rem' }}>Customer Message:</p>
                                <p className="text-sm whitespace-pre-wrap m-0" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Admin Notes & Resolution Plan</label>
                                <textarea
                                    className="support-form-textarea"
                                    rows="3"
                                    placeholder="Type internal notes regarding this ticket..."
                                    value={adminNotesInput}
                                    onChange={(e) => setAdminNotesInput(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-between items-center pt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress', adminNotesInput)}
                                        className="btn btn-warning text-xs font-bold"
                                        style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#f59e0b', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                                    >
                                        Mark In Progress
                                    </button>
                                    <button
                                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved', adminNotesInput)}
                                        className="btn btn-success text-xs font-bold"
                                        style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#10b981', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                                    >
                                        Mark Resolved
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, selectedTicket.status, adminNotesInput)}
                                    className="btn btn-primary text-xs font-bold"
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--accent-color, #2563eb)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                                >
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* IN-UI CONFIRMATION MODAL FOR ACTIVATING STRIPE LIVE MODE */}
            {showLiveConfirmModal && (
                <div
                    className="support-modal-backdrop animate-fade-in"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem',
                    }}
                    onClick={() => setShowLiveConfirmModal(false)}
                >
                    <div
                        className="support-modal-card animate-scale-up"
                        style={{
                            maxWidth: '480px',
                            width: '100%',
                            background: 'var(--bg-primary, #1e293b)',
                            borderRadius: '1rem',
                            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div
                                    style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#f59e0b',
                                    }}
                                >
                                    <AlertTriangle size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        Activate Stripe Live Mode?
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                                        Production Payment Switch
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLiveConfirmModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: '0.375rem',
                                }}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.925rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                                Real payments will be processed and customer credit cards will be billed actual funds in <strong>Euros (€)</strong>.
                            </p>

                            <div
                                style={{
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.625rem',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    marginBottom: '1.25rem',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                                    <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                                        <strong>Note:</strong> Subscriptions and customer accounts created in <em>Test Mode</em> will not be recognized in <em>Live Mode</em>.
                                    </p>
                                </div>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Do you want to switch to <strong>LIVE MODE</strong> now?
                            </p>
                        </div>

                        <div
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'var(--bg-secondary, rgba(0, 0, 0, 0.2))',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setShowLiveConfirmModal(false)}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.2))',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={togglingStripe}
                                onClick={() => executeSwitchStripeMode('live')}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                }}
                            >
                                {togglingStripe ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Switching...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />
                                        <span>OK, Switch to Live Mode</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
