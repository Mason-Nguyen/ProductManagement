import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import ProviderModal from '../components/provider-modal';
import { providerService } from '../services/provider-service';
import type { ProviderDto, CreateProviderRequest, UpdateProviderRequest } from '../services/provider-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProvidersManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    const canEdit = userRole === 'Admin' || userRole === 'Reviewer';

    const [providers, setProviders] = useState<ProviderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProvider, setEditProvider] = useState<ProviderDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Dynamic navigation based on role
    const getNavItems = () => {
        switch (userRole) {
            case 'Admin':
                return [
                    { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/admin') },
                    { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
                    { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
                    { icon: '🏭', label: t('nav.providersManagement'), active: true },
                    { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
                    { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
                    { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
                    { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
                ];
            case 'Approver':
                return [
                    { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/approver') },
                    { icon: '📋', label: t('nav.pendingApprovals'), onClick: () => navigate('/approver/pending-reviews') },
                    { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/approver/approved-requests') },
                    { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/approver/rejected-requests') },
                    { icon: '🏭', label: t('nav.providersManagement'), active: true },
                    { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/approver/products') },
                    { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/approver/approval-logs') },
                ];
            case 'Reviewer':
                return [
                    { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/reviewer') },
                    { icon: '🔍', label: t('nav.pendingReviews'), onClick: () => navigate('/reviewer/pending-reviews') },
                    { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/reviewer/approved-requests') },
                    { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/reviewer/rejected-requests') },
                    { icon: '🏭', label: t('nav.providersManagement'), active: true },
                    { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/reviewer/products') },
                ];
            default:
                return [
                    { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/requester') },
                    { icon: '📋', label: t('nav.myRequests'), onClick: () => navigate('/requester/my-requests') },
                    { icon: '🏭', label: t('nav.providersManagement'), active: true },
                    { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/requester/products') },
                ];
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await providerService.getAll();
            setProviders(data);
        } catch (err) {
            console.error('Failed to fetch providers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreateProviderRequest | UpdateProviderRequest) => {
        await providerService.create(data as CreateProviderRequest);
        await fetchData();
    };

    const handleUpdate = async (data: CreateProviderRequest | UpdateProviderRequest) => {
        if (!editProvider) return;
        await providerService.update(editProvider.id, data as UpdateProviderRequest);
        await fetchData();
    };

    const openCreateModal = () => {
        setEditProvider(null);
        setModalOpen(true);
    };

    const openEditModal = (provider: ProviderDto) => {
        setEditProvider(provider);
        setModalOpen(true);
    };

    const filteredProviders = providers.filter(
        (p) =>
            p.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.taxIdentification.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout roleName={userRole} navItems={getNavItems()}>
            <div className="topbar">
                <h2>{t('page.providersManagement')}</h2>
                <div className="topbar-right">
                    <span>{providers.length} {t('page.totalProviders')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏭</div>
                        <div className="stat-value">{providers.length}</div>
                        <div className="stat-label">{t('stat.totalProviders')}</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchByNameTaxContact')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {canEdit && (
                            <button className="btn-add" onClick={openCreateModal}>
                                <span>➕</span> {t('button.addProvider')}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="table-loading">{t('page.loadingProviders')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.providerName')}</th>
                                        <th>Tax ID</th>
                                        <th>{t('table.contactPerson')}</th>
                                        <th>{t('table.phone')}</th>
                                        <th>{t('table.address')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProviders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="table-empty">{t('page.noProvidersFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredProviders.map((provider) => (
                                            <tr key={provider.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
                                                            {provider.providerName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{provider.providerName}</span>
                                                    </div>
                                                </td>
                                                <td><code className="tax-code">{provider.taxIdentification}</code></td>
                                                <td>{provider.contactPerson || '—'}</td>
                                                <td>{provider.phoneNumber || '—'}</td>
                                                <td className="td-address">{provider.address || '—'}</td>
                                                <td>
                                                    {canEdit && (
                                                        <div className="action-btns">
                                                            <button className="btn-edit" onClick={() => openEditModal(provider)} title={t('common.edit')}>
                                                                ✏️
                                                            </button>
                                                        </div>
                                                    )}
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

            {/* Add/Edit Modal */}
            <ProviderModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditProvider(null); }}
                onSave={editProvider ? handleUpdate : handleCreate}
                editProvider={editProvider}
            />
        </DashboardLayout>
    );
};

export default ProvidersManagement;
