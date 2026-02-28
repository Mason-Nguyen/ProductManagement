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

    const getActionBadge = (action: number, actionText: string) => {
        const cls = action === 2 ? 'approved' : 'rejected';
        const icon = action === 2 ? '✅' : '❌';
        return <span className={`request-status-badge status-${cls}`}>{icon} {actionText}</span>;
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

                {/* Table */}
                <div className="content-card">
                    {loading ? (
                        <div className="table-loading">Loading approval logs...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Log Time</th>
                                        <th>Request Title</th>
                                        <th>Action</th>
                                        <th>Approver Comment</th>
                                        <th>Approver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="table-empty">No approval logs found</td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{formatDateTime(log.logTime)}</td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: log.action === 2 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                                            {log.requestTitle.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{log.requestTitle}</span>
                                                    </div>
                                                </td>
                                                <td>{getActionBadge(log.action, log.actionText)}</td>
                                                <td className="td-address">{log.approverComment || '—'}</td>
                                                <td>{log.approverName}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ApprovalLogPage;
