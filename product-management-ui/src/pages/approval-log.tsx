import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { approvalLogService } from '../services/approval-log-service';
import type { ApprovalLogDto } from '../services/approval-log-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ApprovalLogPage: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    const [logs, setLogs] = useState<ApprovalLogDto[]>([]);
    const [loading, setLoading] = useState(true);

    const getNavItems = () => {
        if (userRole === 'Admin') {
            return [
                { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/admin') },
                { icon: '👥', label: 'Users Management', onClick: () => navigate('/admin/users') },
                { icon: '🏢', label: 'Departments Management', onClick: () => navigate('/admin/departments') },
                { icon: '🏭', label: 'Providers Management', onClick: () => navigate('/admin/providers') },
                { icon: '📦', label: 'Products Management', onClick: () => navigate('/admin/products') },
                { icon: '⚙️', label: 'Approval Configuration', onClick: () => navigate('/admin/approval-configs') },
                { icon: '📝', label: 'Approval Log', active: true },
                { icon: '🔐', label: 'Login Tracking', onClick: () => navigate('/admin/login-logs') },
            ];
        }
        // Approver
        return [
            { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/approver') },
            { icon: '📋', label: 'Pending Approvals', onClick: () => navigate('/approver/pending-reviews') },
            { icon: '✅', label: 'Approved', onClick: () => navigate('/approver/approved-requests') },
            { icon: '❌', label: 'Rejected', onClick: () => navigate('/approver/rejected-requests') },
            { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/approver/providers') },
            { icon: '📦', label: 'Products Management', onClick: () => navigate('/approver/products') },
            { icon: '📝', label: 'Approval Log', active: true },
        ];
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await approvalLogService.getAll();
            setLogs(data.slice(0, 10)); // First 10 logs
        } catch (err) {
            console.error('Failed to fetch approval logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };


    return (
        <DashboardLayout roleName={userRole} navItems={getNavItems()}>
            <div className="topbar">
                <h2>Approval Log</h2>
                <div className="topbar-right">
                    <span>Latest {logs.length} logs</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📝</div>
                        <div className="stat-value">{logs.length}</div>
                        <div className="stat-label">Recent Logs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">{logs.filter(l => l.action === 2).length}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>❌</div>
                        <div className="stat-value">{logs.filter(l => l.action === 4).length}</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>

                {/* Text List */}
                <div className="content-card">
                    {loading ? (
                        <div className="table-loading">Loading approval logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            No approval logs found
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: '1rem 1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {logs.map((log) => (
                                <li key={log.id} style={{
                                    padding: '0.875rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    background: log.action === 2
                                        ? 'rgba(34, 197, 94, 0.08)'
                                        : 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid ' + (log.action === 2
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)'),
                                    borderLeft: '3px solid ' + (log.action === 2 ? '#22c55e' : '#ef4444'),
                                    fontSize: '0.95rem',
                                    color: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <span style={{ color: '#94a3b8' }}>{formatDateTime(log.logTime)}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{log.requestTitle}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#000000', fontWeight: 600 }}>{log.action === 2 ? '✅ Approved' : '❌ Rejected'}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{log.approverComment || '—'}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{log.approverName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ApprovalLogPage;
