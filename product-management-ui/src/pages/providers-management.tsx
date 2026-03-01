import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProviderModal from '../components/provider-modal';
import { providerService } from '../services/provider-service';
import type { ProviderDto, CreateProviderRequest, UpdateProviderRequest } from '../services/provider-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProvidersManagement: React.FC = () => {
    const navigate = useNavigate();
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
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/admin') },
                    { icon: '👥', label: 'Users Management', onClick: () => navigate('/admin/users') },
                    { icon: '🏢', label: 'Departments Management', onClick: () => navigate('/admin/departments') },
                    { icon: '🏭', label: 'Providers Management', active: true },
                    { icon: '📦', label: 'Products Management', onClick: () => navigate('/admin/products') },
                    { icon: '⚙️', label: 'Approval Configuration', onClick: () => navigate('/admin/approval-configs') },
                    { icon: '📝', label: 'Approval Log', onClick: () => navigate('/admin/approval-logs') },
                    { icon: '🔐', label: 'Login Tracking', onClick: () => navigate('/admin/login-logs') },
                ];
            case 'Approver':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/approver') },
                    { icon: '📋', label: 'Pending Approvals', onClick: () => navigate('/approver/pending-reviews') },
                    { icon: '✅', label: 'Approved', onClick: () => navigate('/approver/approved-requests') },
                    { icon: '❌', label: 'Rejected', onClick: () => navigate('/approver/rejected-requests') },
                    { icon: '🏢', label: 'Providers Management', active: true },
                    { icon: '📦', label: 'Products Management', onClick: () => navigate('/approver/products') },
                    { icon: '📝', label: 'Approval Log', onClick: () => navigate('/approver/approval-logs') },
                ];
            case 'Reviewer':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/reviewer') },
                    { icon: '🔍', label: 'Pending Reviews', onClick: () => navigate('/reviewer/pending-reviews') },
                    { icon: '✅', label: 'Approved', onClick: () => navigate('/reviewer/approved-requests') },
                    { icon: '❌', label: 'Rejected', onClick: () => navigate('/reviewer/rejected-requests') },
                    { icon: '🏢', label: 'Providers Management', active: true },
                    { icon: '📦', label: 'Products Management', onClick: () => navigate('/reviewer/products') },
                ];
            default:
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/requester') },
                    { icon: '📋', label: 'My Requests', onClick: () => navigate('/requester/my-requests') },
                    { icon: '🏢', label: 'Providers Management', active: true },
                    { icon: '📦', label: 'Products Management', onClick: () => navigate('/requester/products') },
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
                <h2>Providers Management</h2>
                <div className="topbar-right">
                    <span>{providers.length} total providers</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏢</div>
                        <div className="stat-value">{providers.length}</div>
                        <div className="stat-label">Total Providers</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>👤</div>
                        <div className="stat-value">{providers.filter(p => p.contactPerson).length}</div>
                        <div className="stat-label">With Contact Person</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📞</div>
                        <div className="stat-value">{providers.filter(p => p.phoneNumber).length}</div>
                        <div className="stat-label">With Phone Number</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by name, tax ID, or contact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {canEdit && (
                            <button className="btn-add" onClick={openCreateModal}>
                                <span>➕</span> Add Provider
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="table-loading">Loading providers...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Provider Name</th>
                                        <th>Tax ID</th>
                                        <th>Contact Person</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProviders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="table-empty">No providers found</td>
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
                                                            <button className="btn-edit" onClick={() => openEditModal(provider)} title="Edit">
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
