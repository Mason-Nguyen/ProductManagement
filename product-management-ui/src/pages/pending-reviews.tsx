import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import ReviewDetailModal from '../components/review-detail-modal';
import { reviewService } from '../services/review-service';
import type { PurchaseRequestDto } from '../services/purchase-request-service';
import { approvalConfigService } from '../services/approval-config-service';
import type { ApprovalConfigDto } from '../services/approval-config-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND } from '../utils/formatters';

const PendingReviews: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const role = currentUser?.role || '';
    const [requests, setRequests] = useState<PurchaseRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailRequest, setDetailRequest] = useState<PurchaseRequestDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationTrigger, setNotificationTrigger] = useState(0);
    const [approvalConfigs, setApprovalConfigs] = useState<ApprovalConfigDto[]>([]);

    const navItems = role === 'Reviewer' ? [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/reviewer') },
        { icon: '🔍', label: t('nav.pendingReviews'), active: true },
        { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/reviewer/approved-requests') },
        { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/reviewer/rejected-requests') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/reviewer/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/reviewer/products') },
    ] : [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/approver') },
        { icon: '📋', label: t('nav.pendingApprovals'), active: true },
        { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/approver/approved-requests') },
        { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/approver/rejected-requests') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/approver/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/approver/products') },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/approver/approval-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [data, configs] = await Promise.all([
                reviewService.getPendingReviews(),
                approvalConfigService.getAll(),
            ]);
            setRequests(data);
            setApprovalConfigs(configs);
        } catch (err) {
            console.error('Failed to fetch pending reviews:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (id: string, comment: string) => {
        await reviewService.approve(id, comment);
        await fetchData();
        setNotificationTrigger(prev => prev + 1);
    };

    const handleReject = async (id: string, comment: string) => {
        await reviewService.reject(id, comment);
        await fetchData();
        setNotificationTrigger(prev => prev + 1);
    };

    const handleUpdateComment = async (id: string, comment: string) => {
        await reviewService.updateComment(id, comment);
        await fetchData();
    };

    const filteredRequests = requests.filter(
        r => r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUrgentBadge = (urgent: number) => {
        if (urgent === 1) return <span className="urgent-badge">🔥 {t('status.urgent')}</span>;
        return <span className="normal-badge">{t('status.normal')}</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const pageTitle = role === 'Reviewer' ? t('page.pendingReviews') : t('page.pendingApprovals');

    return (
        <DashboardLayout roleName={role} navItems={navItems} notificationRefreshTrigger={notificationTrigger}>
            <div className="topbar">
                <h2>{pageTitle}</h2>
                <div className="topbar-right">
                    <span>{requests.length} {t('page.pendingRequests')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">{requests.length}</div>
                        <div className="stat-label">{t('stat.totalPending')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔥</div>
                        <div className="stat-value">{requests.filter(r => r.urgent === 1).length}</div>
                        <div className="stat-label">{t('stat.urgent')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📝</div>
                        <div className="stat-value">{requests.filter(r => r.urgent === 0).length}</div>
                        <div className="stat-label">{t('stat.normal')}</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchByTitle')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="table-loading">{t('page.loadingRequests')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.title')}</th>
                                        <th>{t('table.createdBy')}</th>
                                        <th>{t('table.priority')}</th>
                                        <th>{t('table.products')}</th>
                                        <th>{t('table.totalPrice')}</th>
                                        <th>{t('table.expectedTotalPrice')}</th>
                                        <th>{t('table.expectedDeliveryDate')}</th>
                                        <th>{t('table.createdDate')}</th>
                                        <th>{t('table.modifiedDate')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="table-empty">{t('page.noRequestsFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(request => (
                                            <tr key={request.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: request.urgent === 1 ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {request.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{request.title}</span>
                                                    </div>
                                                </td>
                                                <td>{request.createdUserName}</td>
                                                <td>{getUrgentBadge(request.urgent)}</td>
                                                <td className="td-number">{request.products.length}</td>
                                                <td className="td-price">{formatVND(request.totalPrice)}</td>
                                                <td className="td-price">{request.expectedTotalPrice != null ? formatVND(request.expectedTotalPrice) : '—'}</td>
                                                <td>{request.expectedDeliveryDate ? formatDate(request.expectedDeliveryDate) : '—'}</td>
                                                <td>{formatDate(request.createdDate)}</td>
                                                <td>{formatDate(request.modifiedDate)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-detail" onClick={() => setDetailRequest(request)} title={t('button.viewDetails')}>👁️</button>
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

            {/* Review Detail Modal */}
            <ReviewDetailModal
                isOpen={!!detailRequest}
                onClose={() => setDetailRequest(null)}
                request={detailRequest}
                userRole={role}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdateComment={handleUpdateComment}
                approvalConfigs={approvalConfigs}
            />
        </DashboardLayout>
    );
};

export default PendingReviews;
