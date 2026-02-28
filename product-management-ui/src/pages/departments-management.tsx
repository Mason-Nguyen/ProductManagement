import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DepartmentModal from '../components/department-modal';
import { departmentService } from '../services/department-service';
import type { DepartmentDto, CreateDepartmentRequest, UpdateDepartmentRequest } from '../services/department-service';
import { useNavigate } from 'react-router-dom';

const DepartmentsManagement: React.FC = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editDepartment, setEditDepartment] = useState<DepartmentDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DepartmentDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/admin') },
        { icon: '👥', label: 'Users Management', onClick: () => navigate('/admin/users') },
        { icon: '🏢', label: 'Departments Management', active: true },
        { icon: '🏭', label: 'Providers Management', onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/admin/products') },
        { icon: '🔐', label: 'Roles & Permissions' },
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
                <h2>Departments Management</h2>
                <div className="topbar-right">
                    <span>{departments.length} total departments</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏢</div>
                        <div className="stat-value">{departments.length}</div>
                        <div className="stat-label">Total Departments</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by department name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> Add Department
                        </button>
                    </div>

                    {loading ? (
                        <div className="table-loading">Loading departments...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Department Name</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartments.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="table-empty">No departments found</td>
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
                                                        <button className="btn-edit" onClick={() => openEditModal(department)} title="Edit">
                                                            ✏️
                                                        </button>
                                                        <button className="btn-delete" onClick={() => setDeleteConfirm(department)} title="Delete">
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
                            <h3>Delete Department</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                            </p>
                            <p className="confirm-hint">This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default DepartmentsManagement;
