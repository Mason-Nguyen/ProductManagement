import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import RequestDetailModal from '../components/request-detail-modal';
import { reviewService } from '../services/review-service';
import type { PurchaseRequestDto } from '../services/purchase-request-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND } from '../utils/formatters';

const RejectedRequests: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const role = currentUser?.role || '';
    const [requests, setRequests] = useState<PurchaseRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailRequest, setDetailRequest] = useState<PurchaseRequestDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = role === 'Reviewer' ? [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/reviewer') },
        { icon: '🔍', label: t('nav.pendingReviews'), onClick: () => navigate('/reviewer/pending-reviews') },
        { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/reviewer/approved-requests') },
        { icon: '❌', label: t('nav.rejected'), active: true },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/reviewer/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/reviewer/products') },
    ] : [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/approver') },
        { icon: '📋', label: t('nav.pendingApprovals'), onClick: () => navigate('/approver/pending-reviews') },
        { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/approver/approved-requests') },
        { icon: '❌', label: t('nav.rejected'), active: true },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/approver/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/approver/products') },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/approver/approval-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await reviewService.getRejectedReviews();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch rejected requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const pageTitle = t('page.rejectedRequests');

    return (
        <DashboardLayout roleName={role} navItems={navItems}>
            <div className="topbar">
                <h2>{pageTitle}</h2>
                <div className="topbar-right">
                    <span>{requests.length} {t('page.rejectedRequests')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>❌</div>
                        <div className="stat-value">{requests.length}</div>
                        <div className="stat-label">{t('stat.totalRejected')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔥</div>
                        <div className="stat-value">{requests.filter(r => r.urgent === 1).length}</div>
                        <div className="stat-label">{t('stat.urgent')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>💰</div>
                        <div className="stat-value">${(requests.reduce((sum, r) => sum + r.totalPrice, 0) / 1000).toFixed(1)}K</div>
                        <div className="stat-label">{t('stat.totalValue')}</div>
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
                                        <th>{t('table.reviewer')}</th>
                                        <th>{t('table.priority')}</th>
                                        <th>{t('table.products')}</th>
                                        <th>{t('table.totalPrice')}</th>
                                        <th>Rejected Date</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="table-empty">{t('page.noRequestsFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(request => (
                                            <tr key={request.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                                            {request.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{request.title}</span>
                                                    </div>
                                                </td>
                                                <td>{request.createdUserName}</td>
                                                <td>{request.reviewerName || '—'}</td>
                                                <td>{getUrgentBadge(request.urgent)}</td>
                                                <td className="td-number">{request.products.length}</td>
                                                <td className="td-price">{formatVND(request.totalPrice)}</td>
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

export default RejectedRequests;
