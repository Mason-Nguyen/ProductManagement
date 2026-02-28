import React, { useState, useEffect } from 'react';
import type { DepartmentDto, CreateDepartmentRequest, UpdateDepartmentRequest } from '../services/department-service';

interface DepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateDepartmentRequest | UpdateDepartmentRequest) => Promise<void>;
    editDepartment: DepartmentDto | null;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ isOpen, onClose, onSave, editDepartment }) => {
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
                    <h3>{isEdit ? 'Edit Department' : 'Add New Department'}</h3>
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
                            <label>Department Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter department name"
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentModal;
