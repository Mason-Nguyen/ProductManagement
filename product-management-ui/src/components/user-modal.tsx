import React, { useState, useEffect } from 'react';
import type { RoleDto, CreateUserRequest, UpdateUserRequest, UserDto } from '../services/user-service';
import type { DepartmentDto } from '../services/department-service';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
    roles: RoleDto[];
    departments: DepartmentDto[];
    editUser?: UserDto | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, roles, departments, editUser }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [roleId, setRoleId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [status, setStatus] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editUser;

    useEffect(() => {
        if (editUser) {
            setUsername(editUser.username);
            setEmail(editUser.email);
            setPhone(editUser.phone);
            setRoleId(editUser.roleId);
            setDepartmentId(editUser.departmentId || '');
            setStatus(editUser.status);
            setPassword('');
        } else {
            setUsername('');
            setEmail('');
            setPassword('');
            setPhone('');
            setRoleId(roles.length > 0 ? roles[0].id : '');
            setDepartmentId('');
            setStatus(true);
        }
        setError('');
    }, [editUser, isOpen, roles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEdit) {
                const data: UpdateUserRequest = {
                    username,
                    email,
                    phone,
                    roleId,
                    status,
                    departmentId: departmentId || null,
                    ...(password && { password }),
                };
                await onSave(data);
            } else {
                if (!password) {
                    setError('Password is required for new users.');
                    setLoading(false);
                    return;
                }
                const data: CreateUserRequest = {
                    username,
                    email,
                    password,
                    phone,
                    roleId,
                    departmentId: departmentId || null,
                };
                await onSave(data);
            }
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Operation failed.');
            } else {
                setError('An error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEdit ? 'Edit User' : 'Add New User'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>Password {isEdit && <span className="label-hint">(leave blank to keep current)</span>}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEdit ? 'Leave blank to keep current' : 'Enter password'}
                                    {...(!isEdit && { required: true })}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>Role</label>
                                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
                                    <option value="">Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.roleName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label>Department <span className="label-hint">(optional)</span></label>
                                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                                    <option value="">No Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {isEdit && (
                            <div className="modal-form-row">
                                <div className="modal-form-group">
                                    <label>Status</label>
                                    <div className="status-toggle">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${status ? 'active' : ''}`}
                                            onClick={() => setStatus(true)}
                                        >
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${!status ? 'active inactive' : ''}`}
                                            onClick={() => setStatus(false)}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
