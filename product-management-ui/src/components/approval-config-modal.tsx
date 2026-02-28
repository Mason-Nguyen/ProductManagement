import React, { useState, useEffect } from 'react';
import type { ApprovalConfigDto, CreateApprovalConfigRequest, UpdateApprovalConfigRequest } from '../services/approval-config-service';
import type { RoleDto } from '../services/user-service';
import { userService } from '../services/user-service';

interface ApprovalConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateApprovalConfigRequest | UpdateApprovalConfigRequest) => Promise<void>;
    editConfig: ApprovalConfigDto | null;
}

const ApprovalConfigModal: React.FC<ApprovalConfigModalProps> = ({ isOpen, onClose, onSave, editConfig }) => {
    const [roleId, setRoleId] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editConfig;

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const allRoles = await userService.getRoles();
                // Only show Reviewer and Approver roles
                const filtered = allRoles.filter(r => r.roleName === 'Reviewer' || r.roleName === 'Approver');
                setRoles(filtered);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
            }
        };
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editConfig) {
            setRoleId(editConfig.roleId);
            setMinAmount(editConfig.minAmount.toString());
            setMaxAmount(editConfig.maxAmount.toString());
        } else {
            setRoleId('');
            setMinAmount('');
            setMaxAmount('');
        }
        setError('');
        setValidationError('');
    }, [editConfig, isOpen]);

    const validateAmounts = (): boolean => {
        const min = parseFloat(minAmount);
        const max = parseFloat(maxAmount);

        if (isNaN(min) || isNaN(max)) {
            setValidationError('Please enter valid amounts.');
            return false;
        }

        if (min < 0 || max < 0) {
            setValidationError('Amounts cannot be negative.');
            return false;
        }

        if (min > max) {
            setValidationError('Min Amount must be less than or equal to Max Amount.');
            return false;
        }

        setValidationError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateAmounts()) return;

        setLoading(true);

        try {
            await onSave({
                roleId,
                minAmount: parseFloat(minAmount),
                maxAmount: parseFloat(maxAmount),
            });
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
                    <h3>{isEdit ? 'Edit Approval Config' : 'Add Approval Config'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {validationError && (
                    <div className="modal-error">
                        <span>⚠️</span> {validationError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-group">
                            <label>Role</label>
                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                required
                            >
                                <option value="">Select a role...</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.roleName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="modal-form-group">
                            <label>Min Amount (VND)</label>
                            <input
                                type="number"
                                value={minAmount}
                                onChange={(e) => {
                                    setMinAmount(e.target.value);
                                    setValidationError('');
                                }}
                                placeholder="Enter minimum amount"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="modal-form-group">
                            <label>Max Amount (VND)</label>
                            <input
                                type="number"
                                value={maxAmount}
                                onChange={(e) => {
                                    setMaxAmount(e.target.value);
                                    setValidationError('');
                                }}
                                placeholder="Enter maximum amount"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Config' : 'Create Config'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApprovalConfigModal;
