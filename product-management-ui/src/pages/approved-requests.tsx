import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import RequestDetailModal from '../components/request-detail-modal';
import { reviewService } from '../services/review-service';
import { approvalLogService } from '../services/approval-log-service';
import type { ApprovalLogDto } from '../services/approval-log-service';
import type { PurchaseRequestDto } from '../services/purchase-request-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND } from '../utils/formatters';

const ApprovedRequests: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const role = currentUser?.role || '';
    const [requests, setRequests] = useState<PurchaseRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailRequest, setDetailRequest] = useState<PurchaseRequestDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [approvalLogs, setApprovalLogs] = useState<ApprovalLogDto[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);

    const navItems = role === 'Reviewer' ? [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/reviewer') },
        { icon: '🔍', label: 'Pending Reviews', onClick: () => navigate('/reviewer/pending-reviews') },
        { icon: '✅', label: 'Approved', active: true },
        { icon: '❌', label: 'Rejected', onClick: () => navigate('/reviewer/rejected-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/reviewer/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/reviewer/products') },
    ] : [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/approver') },
        { icon: '📋', label: 'Pending Approvals', onClick: () => navigate('/approver/pending-reviews') },
        { icon: '✅', label: 'Approved', active: true },
        { icon: '❌', label: 'Rejected', onClick: () => navigate('/approver/rejected-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/approver/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/approver/products') },
        { icon: '📝', label: 'Approval Log', onClick: () => navigate('/approver/approval-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await reviewService.getApprovedReviews();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch approved requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            setLogsLoading(true);
            const data = await approvalLogService.getAll();
            setApprovalLogs(data.slice(0, 10));
        } catch (err) {
            console.error('Failed to fetch approval logs:', err);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchLogs();
    }, [fetchData, fetchLogs]);

    const filteredRequests = requests.filter(
        r => r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUrgentBadge = (urgent: number) => {
        if (urgent === 1) return <span className="urgent-badge">🔥 Urgent</span>;
        return <span className="normal-badge">Normal</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

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

    const pageTitle = role === 'Reviewer' ? 'Approved Requests' : 'Approved Requests';

    return (
        <DashboardLayout roleName={role} navItems={navItems}>
            <div className="topbar">
                <h2>{pageTitle}</h2>
                <div className="topbar-right">
                    <span>{requests.length} approved requests</span>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        style={{
                            background: showSidebar ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            color: showSidebar ? '#818cf8' : '#94a3b8',
                            border: '1px solid ' + (showSidebar ? 'rgba(99, 102, 241, 0.3)' : 'rgba(148, 163, 184, 0.2)'),
                            borderRadius: '0.375rem',
                            padding: '0.4rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s',
                        }}
                        title={showSidebar ? 'Hide Approval Log' : 'Show Approval Log'}
                    >
                        📝 {showSidebar ? 'Hide Log' : 'Show Log'}
                    </button>
                </div>
            </div>

            <div className="dashboard-content fade-in" style={{ display: 'flex', gap: '1.5rem' }}>
                {/* Left: Main content (3/4) */}
                <div style={{ flex: showSidebar ? 3 : 1, minWidth: 0 }}>
                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                            <div className="stat-value">{requests.length}</div>
                            <div className="stat-label">Total Approved</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔥</div>
                            <div className="stat-value">{requests.filter(r => r.urgent === 1).length}</div>
                            <div className="stat-label">Urgent</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>💰</div>
                            <div className="stat-value">${(requests.reduce((sum, r) => sum + r.totalPrice, 0) / 1000).toFixed(1)}K</div>
                            <div className="stat-label">Total Value</div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="content-card">
                        <div className="table-toolbar">
                            <div className="search-box">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search by title..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="table-loading">Loading approved requests...</div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Created By</th>
                                            <th>Reviewer</th>
                                            <th>Approver</th>
                                            <th>Priority</th>
                                            <th>Products</th>
                                            <th>Total Price</th>
                                            <th>Approved Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="table-empty">No approved requests found</td>
                                            </tr>
                                        ) : (
                                            filteredRequests.map(request => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <div className="user-cell">
                                                            <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                                                                {request.title.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span>{request.title}</span>
                                                        </div>
                                                    </td>
                                                    <td>{request.createdUserName}</td>
                                                    <td>{request.reviewerName || '—'}</td>
                                                    <td>{request.approverName || '—'}</td>
                                                    <td>{getUrgentBadge(request.urgent)}</td>
                                                    <td className="td-number">{request.products.length}</td>
                                                    <td className="td-price">{formatVND(request.totalPrice)}</td>
                                                    <td>{formatDate(request.modifiedDate)}</td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button className="btn-detail" onClick={() => setDetailRequest(request)} title="View Details">👁️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Approval Log Sidebar (1/4) */}
                {showSidebar && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="content-card" style={{ position: 'sticky', top: '1rem' }}>
                            <h4 style={{ padding: '1rem 1.25rem 0.5rem', margin: 0, color: '#000000', fontSize: '1rem', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '0.75rem' }}>
                                📝 Approval Log
                            </h4>
                            {logsLoading ? (
                                <div className="table-loading" style={{ padding: '1.5rem', fontSize: '0.85rem' }}>Loading logs...</div>
                            ) : approvalLogs.length === 0 ? (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    No approval logs found
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: '0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {approvalLogs.map((log) => (
                                        <li key={log.id} style={{
                                            padding: '0.625rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            background: log.action === 2
                                                ? 'rgba(34, 197, 94, 0.08)'
                                                : 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid ' + (log.action === 2
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : 'rgba(239, 68, 68, 0.2)'),
                                            borderLeft: '3px solid ' + (log.action === 2 ? '#22c55e' : '#ef4444'),
                                            fontSize: '0.8rem',
                                            color: '#000000',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, color: '#000000', fontSize: '0.85rem' }}>{log.requestTitle}</span>
                                                <span style={{ color: '#000000', fontWeight: 600, fontSize: '0.75rem' }}>
                                                    {log.action === 2 ? '✅' : '❌'} {log.actionText}
                                                </span>
                                            </div>
                                            <div style={{ color: '#000000', fontSize: '0.75rem' }}>
                                                {formatDateTime(log.logTime)} — {log.approverName}
                                            </div>
                                            {log.approverComment && (
                                                <div style={{ color: '#000000', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                    "{log.approverComment}"
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Request Detail Modal */}
            <RequestDetailModal
                isOpen={!!detailRequest}
                onClose={() => setDetailRequest(null)}
                request={detailRequest}
                currentUser={currentUser}
            />
        </DashboardLayout>
    );
};

export default ApprovedRequests;

