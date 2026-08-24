import React, { useState, useEffect } from 'react';
import { Users, Server, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';
import { get, patch } from '../utils/api.js';
import { useToast } from '../components/Toast';
import './ListTable.css';

const AdminPanel = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        setForbidden(false);
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
                setError(err.message || 'Failed to fetch users');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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

    // Calculate dynamic stats
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

    return (
        <div className="page-container" style={{ padding: '0 1rem' }}>
            <div className="mb-10">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Admin Dashboard</h2>
                <p className="text-secondary text-base">Manage users and global system performance.</p>
            </div>

            <div className="stats-grid mb-12">
                <div className="glass-card stat-card flex items-center justify-between">
                    <div>
                        <p className="text-secondary text-sm font-semibold mb-1 uppercase tracking-wider">Total Users</p>
                        <h3 className="text-4xl font-extrabold mb-0">{loading ? '...' : totalUsers}</h3>
                    </div>
                    <div className="stat-icon-wrapper text-accent p-4 rounded-2xl" style={{ background: 'var(--accent-light)' }}>
                        <Users size={28} />
                    </div>
                </div>
                <div className="glass-card stat-card flex items-center justify-between">
                    <div>
                        <p className="text-secondary text-sm font-semibold mb-1 uppercase tracking-wider">Active Recipes</p>
                        <h3 className="text-4xl font-extrabold mb-0">{loading ? '...' : totalActiveRecipes}</h3>
                    </div>
                    <div className="stat-icon-wrapper p-4 rounded-2xl" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                        <Server size={28} />
                    </div>
                </div>
            </div>

            <div className="glass-card animate-fade-in overflow-hidden" style={{ padding: 0, border: '1px solid var(--border-color)' }}>
                <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px', borderBottomStyle: 'solid', background: 'var(--bg-card)' }}>
                    <h3 className="font-bold text-xl m-0 tracking-tight">User Directory</h3>
                    {loading && <Loader2 className="animate-spin text-accent" size={20} />}
                </div>

                {error && (
                    <div className="p-8 text-center text-danger">
                        <p className="m-0 font-medium">{error}</p>
                    </div>
                )}

                {!loading && !error && users.length === 0 && (
                    <div className="p-8 text-center text-secondary italic">
                        No registered users found.
                    </div>
                )}

                {(users.length > 0) && (
                    <div className="table-responsive">
                        <table className="custom-table w-100">
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
        </div>
    );
};

export default AdminPanel;
