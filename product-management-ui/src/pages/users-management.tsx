import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import UserModal from '../components/user-modal';
import { userService } from '../services/user-service';
import type { UserDto, RoleDto, CreateUserRequest, UpdateUserRequest } from '../services/user-service';
import { departmentService } from '../services/department-service';
import type { DepartmentDto } from '../services/department-service';
import { useNavigate } from 'react-router-dom';

const UsersManagement: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UserDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: 'Dashboard' },
        { icon: '👥', label: 'Users Management', active: true },
        { icon: '🏢', label: 'Departments Management', onClick: () => navigate('/admin/departments') },
        { icon: '🏭', label: 'Providers Management', onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: 'Approval Configuration', onClick: () => navigate('/admin/approval-configs') },
        { icon: '📝', label: 'Approval Log', onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: 'Login Tracking', onClick: () => navigate('/admin/login-logs') },
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
        if (label === 'Dashboard') {
            navigate('/dashboard/admin');
        }
    };

    return (
        <DashboardLayout
            roleName="Admin"
            navItems={navItems.map(item => ({
                ...item,
                ...(item.label === 'Dashboard' || item.label === 'Users Management'
                    ? { onClick: () => handleNavClick(item.label) }
                    : {}),
            }))}
        >
            <div className="topbar">
                <h2>Users Management</h2>
                <div className="topbar-right">
                    <span>{users.length} total users</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👥</div>
                        <div className="stat-value">{users.length}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">{users.filter(u => u.status).length}</div>
                        <div className="stat-label">Active Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🚫</div>
                        <div className="stat-value">{users.filter(u => !u.status).length}</div>
                        <div className="stat-label">Inactive Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🔐</div>
                        <div className="stat-value">{roles.length}</div>
                        <div className="stat-label">Roles</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search users by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> Add User
                        </button>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="table-loading">Loading users...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Department</th>
                                        <th>Role</th>
                                        <th>Created Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="table-empty">No users found</td>
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
                                                        {user.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-edit" onClick={() => openEditModal(user)} title="Edit">
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => setDeleteConfirm(user)}
                                                            title="Deactivate"
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
                            <h3>Deactivate User</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                Are you sure you want to deactivate <strong>{deleteConfirm.username}</strong>?
                            </p>
                            <p className="confirm-hint">This will set the user's status to inactive. The account will not be deleted.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDelete}>Deactivate</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default UsersManagement;
