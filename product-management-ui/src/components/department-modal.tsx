import React, { useState, useEffect } from 'react';
import type { DepartmentDto, CreateDepartmentRequest, UpdateDepartmentRequest } from '../services/department-service';
import { useTranslation } from 'react-i18next';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateDepartmentRequest | UpdateDepartmentRequest) => Promise<void>;
    editDepartment: DepartmentDto | null;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ isOpen, onClose, onSave, editDepartment }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editDepartment;

    useEffect(() => {
        if (editDepartment) {
            setName(editDepartment.name);
        } else {
            setName('');
        }
        setError('');
    }, [editDepartment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSave({ name: name.trim() });
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
                    <h3>{isEdit ? t('modal.editDepartment') : t('modal.addDepartment')}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-group">
                            <label>{t('form.departmentName')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('form.enterDepartmentName')}
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('button.updateDepartment') : t('button.createDepartment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentModal;
