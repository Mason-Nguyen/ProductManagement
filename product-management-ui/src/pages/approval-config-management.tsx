import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import ApprovalConfigModal from '../components/approval-config-modal';
import { approvalConfigService } from '../services/approval-config-service';
import type { ApprovalConfigDto, CreateApprovalConfigRequest, UpdateApprovalConfigRequest } from '../services/approval-config-service';
import { useNavigate } from 'react-router-dom';

const formatVND = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const ApprovalConfigManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [configs, setConfigs] = useState<ApprovalConfigDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editConfig, setEditConfig] = useState<ApprovalConfigDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ApprovalConfigDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/admin') },
        { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
        { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: t('nav.approvalConfiguration'), active: true },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await approvalConfigService.getAll();
            setConfigs(data);
        } catch (err) {
            console.error('Failed to fetch approval configs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreateApprovalConfigRequest | UpdateApprovalConfigRequest) => {
        await approvalConfigService.create(data as CreateApprovalConfigRequest);
        await fetchData();
    };

    const handleUpdate = async (data: CreateApprovalConfigRequest | UpdateApprovalConfigRequest) => {
        if (!editConfig) return;
        await approvalConfigService.update(editConfig.id, data as UpdateApprovalConfigRequest);
        await fetchData();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await approvalConfigService.remove(deleteConfirm.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to delete approval config:', err);
        }
        setDeleteConfirm(null);
    };

    const openCreateModal = () => {
        setEditConfig(null);
        setModalOpen(true);
    };

    const openEditModal = (config: ApprovalConfigDto) => {
        setEditConfig(config);
        setModalOpen(true);
    };

    const filteredConfigs = configs.filter((c) =>
        c.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout roleName="Admin" navItems={navItems}>
            <div className="topbar">
                <h2>{t('page.approvalConfiguration')}</h2>
                <div className="topbar-right">
                    <span>{configs.length} {t('page.totalConfigurations')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>⚙️</div>
                        <div className="stat-value">{configs.length}</div>
                        <div className="stat-label">{t('stat.totalConfigs')}</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchByRoleName')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> {t('button.addConfig')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="table-loading">{t('page.loadingConfigs')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.role')}</th>
                                        <th>{t('table.minAmount')}</th>
                                        <th>{t('table.maxAmount')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredConfigs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="table-empty">{t('page.noConfigsFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredConfigs.map((config) => (
                                            <tr key={config.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {config.roleName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{config.roleName}</span>
                                                    </div>
                                                </td>
                                                <td className="td-price">{formatVND(config.minAmount)}</td>
                                                <td className="td-price">{formatVND(config.maxAmount)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-edit" onClick={() => openEditModal(config)} title={t('common.edit')}>
                                                            ✏️
                                                        </button>
                                                        <button className="btn-delete" onClick={() => setDeleteConfirm(config)} title={t('common.delete')}>
                                                            🗑️
                                                        </button>
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

            {/* Add/Edit Modal */}
            <ApprovalConfigModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditConfig(null); }}
                onSave={editConfig ? handleUpdate : handleCreate}
                editConfig={editConfig}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Approval Config</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                Are you sure you want to delete the configuration for <strong>{deleteConfirm.roleName}</strong>?
                            </p>
                            <p className="confirm-hint">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
                            <button className="btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ApprovalConfigManagement;
