import React, { useState, useEffect } from 'react';
import { Users, Server, Activity, ShieldAlert, Loader2, LifeBuoy, CheckCircle2, Clock, AlertTriangle, Eye, Trash2, X, RefreshCw } from 'lucide-react';
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
    }, []);

    useEffect(() => {
        if (activeTab === 'tickets') {
            fetchTickets();
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
        </div>
    );
};

export default AdminPanel;
