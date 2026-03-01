import React, { useState, useEffect } from 'react';
import type { ApprovalConfigDto, CreateApprovalConfigRequest, UpdateApprovalConfigRequest } from '../services/approval-config-service';
import type { RoleDto } from '../services/user-service';
import { userService } from '../services/user-service';
import { useTranslation } from 'react-i18next';

interface ApprovalConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateApprovalConfigRequest | UpdateApprovalConfigRequest) => Promise<void>;
    editConfig: ApprovalConfigDto | null;
}

const ApprovalConfigModal: React.FC<ApprovalConfigModalProps> = ({ isOpen, onClose, onSave, editConfig }) => {
    const { t } = useTranslation();
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
            setValidationError(t('modal.validAmounts'));
            return false;
        }

        if (min < 0 || max < 0) {
            setValidationError(t('modal.amountsNonNegative'));
            return false;
        }

        if (min > max) {
            setValidationError(t('modal.minLessThanMax'));
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
                    <h3>{isEdit ? t('modal.editApprovalConfig') : t('modal.addApprovalConfig')}</h3>
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
                            <label>{t('form.role')}</label>
                            <select
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                required
                            >
                                <option value="">{t('modal.selectRole')}</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.roleName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="modal-form-group">
                            <label>{t('modal.minAmount')}</label>
                            <input
                                type="number"
                                value={minAmount}
                                onChange={(e) => {
                                    setMinAmount(e.target.value);
                                    setValidationError('');
                                }}
                                placeholder={t('modal.enterMinAmount')}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="modal-form-group">
                            <label>{t('modal.maxAmount')}</label>
                            <input
                                type="number"
                                value={maxAmount}
                                onChange={(e) => {
                                    setMaxAmount(e.target.value);
                                    setValidationError('');
                                }}
                                placeholder={t('modal.enterMaxAmount')}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('modal.updateConfig') : t('modal.createConfig')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApprovalConfigModal;
