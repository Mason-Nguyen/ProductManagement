import React, { useState, useEffect } from 'react';
import type { RoleDto, CreateUserRequest, UpdateUserRequest, UserDto } from '../services/user-service';
import type { DepartmentDto } from '../services/department-service';
import { useTranslation } from 'react-i18next';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
    roles: RoleDto[];
    departments: DepartmentDto[];
    editUser?: UserDto | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, roles, departments, editUser }) => {
    const { t } = useTranslation();
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
                    setError(t('validation.required'));
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
                setError(axiosErr.response?.data?.message || t('validation.operationFailed'));
            } else {
                setError(t('validation.errorOccurred'));
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
                    <h3>{isEdit ? t('modal.editUser') : t('modal.addUser')}</h3>
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
                                <label>{t('form.username')}</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('form.enterUsername')}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.email')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('form.enterEmail')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.password')} {isEdit && <span className="label-hint">{t('modal.leaveBlankKeepCurrent')}</span>}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEdit ? t('modal.leaveBlankKeepCurrent') : t('form.enterPassword')}
                                    {...(!isEdit && { required: true })}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.phone')}</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t('form.enterPhoneNumber')}
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.role')}</label>
                                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
                                    <option value="">{t('form.selectRole')}</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.roleName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.department')} <span className="label-hint">{t('form.optional')}</span></label>
                                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                                    <option value="">{t('form.noDepartment')}</option>
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
                                    <label>{t('table.status')}</label>
                                    <div className="status-toggle">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${status ? 'active' : ''}`}
                                            onClick={() => setStatus(true)}
                                        >
                                            {t('status.active')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${!status ? 'active inactive' : ''}`}
                                            onClick={() => setStatus(false)}
                                        >
                                            {t('status.inactive')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('button.updateUser') : t('button.createUser')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
