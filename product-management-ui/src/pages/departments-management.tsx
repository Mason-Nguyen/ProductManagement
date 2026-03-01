import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import DepartmentModal from '../components/department-modal';
import { departmentService } from '../services/department-service';
import type { DepartmentDto, CreateDepartmentRequest, UpdateDepartmentRequest } from '../services/department-service';
import { useNavigate } from 'react-router-dom';

const DepartmentsManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editDepartment, setEditDepartment] = useState<DepartmentDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DepartmentDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/admin') },
        { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
        { icon: '🏢', label: t('nav.departmentsManagement'), active: true },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreateDepartmentRequest | UpdateDepartmentRequest) => {
        await departmentService.create(data as CreateDepartmentRequest);
        await fetchData();
    };

    const handleUpdate = async (data: CreateDepartmentRequest | UpdateDepartmentRequest) => {
        if (!editDepartment) return;
        await departmentService.update(editDepartment.id, data as UpdateDepartmentRequest);
        await fetchData();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await departmentService.remove(deleteConfirm.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to delete department:', err);
        }
        setDeleteConfirm(null);
    };

    const openCreateModal = () => {
        setEditDepartment(null);
        setModalOpen(true);
    };

    const openEditModal = (department: DepartmentDto) => {
        setEditDepartment(department);
        setModalOpen(true);
    };

    const filteredDepartments = departments.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout roleName="Admin" navItems={navItems}>
            <div className="topbar">
                <h2>{t('page.departmentsManagement')}</h2>
                <div className="topbar-right">
                    <span>{departments.length} {t('page.totalDepartments')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏢</div>
                        <div className="stat-value">{departments.length}</div>
                        <div className="stat-label">{t('stat.totalDepartments')}</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchByDepartmentName')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> {t('button.addDepartment')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="table-loading">{t('page.loadingDepartments')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.departmentName')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartments.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="table-empty">{t('page.noDepartmentsFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredDepartments.map((department) => (
                                            <tr key={department.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {department.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{department.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-edit" onClick={() => openEditModal(department)} title={t('common.edit')}>
                                                            ✏️
                                                        </button>
                                                        <button className="btn-delete" onClick={() => setDeleteConfirm(department)} title={t('common.delete')}>
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
            <DepartmentModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditDepartment(null); }}
                onSave={editDepartment ? handleUpdate : handleCreate}
                editDepartment={editDepartment}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('modal.deleteDepartment')}</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                {t('modal.deleteDepartmentConfirm').replace('{{name}}', deleteConfirm.name)}
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

export default DepartmentsManagement;
