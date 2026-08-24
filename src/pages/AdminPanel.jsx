import React from 'react';
import { Users, Server, Activity, Settings2 } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';
import './ListTable.css';

const AdminPanel = () => {
    const users = [
        { id: 1, name: 'Alice Restaurant', email: 'owner@alice.com', role: 'User', active: true, recipes: 2 },
        { id: 2, name: 'Bob Services', email: 'bob@services.co', role: 'User', active: false, recipes: 0 },
        { id: 3, name: 'Charlie Agency', email: 'hi@agency.net', role: 'Admin', active: true, recipes: 3 },
    ];

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
                        <h3 className="text-4xl font-extrabold mb-0">124</h3>
                    </div>
                    <div className="stat-icon-wrapper text-accent p-4 rounded-2xl" style={{ background: 'var(--accent-light)' }}>
                        <Users size={28} />
                    </div>
                </div>
                <div className="glass-card stat-card flex items-center justify-between">
                    <div>
                        <p className="text-secondary text-sm font-semibold mb-1 uppercase tracking-wider">System Health</p>
                        <h3 className="text-4xl font-extrabold mb-0 text-success">100%</h3>
                    </div>
                    <div className="stat-icon-wrapper p-4 rounded-2xl" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                        <Server size={28} />
                    </div>
                </div>
            </div>

            <div className="glass-card animate-fade-in overflow-hidden" style={{ padding: 0, border: '1px solid var(--border-color)' }}>
                <div className="p-8 border-b" style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px', borderBottomStyle: 'solid', background: 'var(--bg-card)' }}>
                    <h3 className="font-bold text-xl m-0 tracking-tight">User Directory</h3>
                </div>

                <div className="table-responsive">
                    <table className="custom-table w-100">
                        <thead style={{ background: 'var(--bg-secondary)' }}>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Active Recipes</th>
                                <th>Account Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="font-bold">{user.name}</td>
                                    <td className="text-sm text-secondary">{user.email}</td>
                                    <td><span className="badge badge-neutral">{user.role}</span></td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <Activity size={14} className="text-accent" />
                                            <span className="font-bold">{user.recipes}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <ToggleSwitch checked={user.active} onChange={() => { }} />
                                    </td>
                                    <td>
                                        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                            <Settings2 size={16} /> Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
