import React, { useState, useEffect } from 'react';
import type { ProviderDto, CreateProviderRequest, UpdateProviderRequest } from '../services/provider-service';

interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateProviderRequest | UpdateProviderRequest) => Promise<void>;
    editProvider?: ProviderDto | null;
}

const ProviderModal: React.FC<ProviderModalProps> = ({ isOpen, onClose, onSave, editProvider }) => {
    const [providerName, setProviderName] = useState('');
    const [taxIdentification, setTaxIdentification] = useState('');
    const [address, setAddress] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editProvider;

    useEffect(() => {
        if (editProvider) {
            setProviderName(editProvider.providerName);
            setTaxIdentification(editProvider.taxIdentification);
            setAddress(editProvider.address);
            setContactPerson(editProvider.contactPerson);
            setPhoneNumber(editProvider.phoneNumber);
        } else {
            setProviderName('');
            setTaxIdentification('');
            setAddress('');
            setContactPerson('');
            setPhoneNumber('');
        }
        setError('');
    }, [editProvider, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = {
                providerName,
                taxIdentification,
                address,
                contactPerson,
                phoneNumber,
            };
            await onSave(data);
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
                    <h3>{isEdit ? 'Edit Provider' : 'Add New Provider'}</h3>
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
                                <label>Provider Name</label>
                                <input
                                    type="text"
                                    value={providerName}
                                    onChange={(e) => setProviderName(e.target.value)}
                                    placeholder="Enter provider name"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Tax Identification</label>
                                <input
                                    type="text"
                                    value={taxIdentification}
                                    onChange={(e) => setTaxIdentification(e.target.value)}
                                    placeholder="Enter tax ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>Contact Person</label>
                                <input
                                    type="text"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    placeholder="Enter contact person"
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group" style={{ width: '100%' }}>
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Provider' : 'Create Provider'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProviderModal;
