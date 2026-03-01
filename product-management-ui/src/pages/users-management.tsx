import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import UserModal from '../components/user-modal';
import { userService } from '../services/user-service';
import type { UserDto, RoleDto, CreateUserRequest, UpdateUserRequest } from '../services/user-service';
import { departmentService } from '../services/department-service';
import type { DepartmentDto } from '../services/department-service';
import { useNavigate } from 'react-router-dom';

const UsersManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UserDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: t('nav.dashboard') },
        { icon: '👥', label: t('nav.usersManagement'), active: true },
        { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, rolesData, departmentsData] = await Promise.all([
                userService.getAll(),
                userService.getRoles(),
                departmentService.getAll(),
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setDepartments(departmentsData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreateUserRequest | UpdateUserRequest) => {
        await userService.create(data as CreateUserRequest);
        await fetchData();
    };

    const handleUpdate = async (data: CreateUserRequest | UpdateUserRequest) => {
        if (!editUser) return;
        await userService.update(editUser.id, data as UpdateUserRequest);
        await fetchData();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await userService.remove(deleteConfirm.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to deactivate user:', err);
        }
        setDeleteConfirm(null);
    };

    const openCreateModal = () => {
        setEditUser(null);
        setModalOpen(true);
    };

    const openEditModal = (user: UserDto) => {
        setEditUser(user);
        setModalOpen(true);
    };

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNavClick = (label: string) => {
        if (label === t('nav.dashboard')) {
            navigate('/dashboard/admin');
        }
    };

    return (
        <DashboardLayout
            roleName="Admin"
            navItems={navItems.map(item => ({
                ...item,
                ...(item.label === t('nav.dashboard') || item.label === t('nav.usersManagement')
                    ? { onClick: () => handleNavClick(item.label) }
                    : {}),
            }))}
        >
            <div className="topbar">
                <h2>{t('page.usersManagement')}</h2>
                <div className="topbar-right">
                    <span>{users.length} {t('page.totalUsers')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👥</div>
                        <div className="stat-value">{users.length}</div>
                        <div className="stat-label">{t('stat.totalUsers')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">{users.filter(u => u.status).length}</div>
                        <div className="stat-label">{t('stat.activeUsers')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🚫</div>
                        <div className="stat-value">{users.filter(u => !u.status).length}</div>
                        <div className="stat-label">{t('stat.inactiveUsers')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🔐</div>
                        <div className="stat-value">{roles.length}</div>
                        <div className="stat-label">{t('stat.roles')}</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchUsers')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> {t('button.addUser')}
                        </button>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="table-loading">{t('page.loadingUsers')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.username')}</th>
                                        <th>{t('table.email')}</th>
                                        <th>{t('table.phone')}</th>
                                        <th>{t('table.department')}</th>
                                        <th>{t('table.role')}</th>
                                        <th>{t('table.createdDate')}</th>
                                        <th>{t('table.status')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="table-empty">{t('page.noUsersFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td className="td-username">
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{user.username}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>{user.phone || '—'}</td>
                                                <td>{user.departmentName || '—'}</td>
                                                <td>
                                                    <span className={`role-tag role-${user.roleName.toLowerCase()}`}>
                                                        {user.roleName}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.createdDate).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status-badge ${user.status ? 'active' : 'inactive'}`}>
                                                        {user.status ? t('status.active') : t('status.inactive')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-edit" onClick={() => openEditModal(user)} title={t('common.edit')}>
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => setDeleteConfirm(user)}
                                                            title={t('common.delete')}
                                                            disabled={!user.status}
                                                        >
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
            <UserModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditUser(null); }}
                onSave={editUser ? handleUpdate : handleCreate}
                roles={roles}
                departments={departments}
                editUser={editUser}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('modal.deleteUser')}</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                {t('modal.deleteUserConfirm')}
                            </p>
                            <p className="confirm-hint">This will set the user's status to inactive. The account will not be deleted.</p>
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

export default UsersManagement;
