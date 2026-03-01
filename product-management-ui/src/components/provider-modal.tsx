import React, { useState, useEffect } from 'react';
import type { ProviderDto, CreateProviderRequest, UpdateProviderRequest } from '../services/provider-service';
import { useTranslation } from 'react-i18next';

interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateProviderRequest | UpdateProviderRequest) => Promise<void>;
    editProvider?: ProviderDto | null;
}

const ProviderModal: React.FC<ProviderModalProps> = ({ isOpen, onClose, onSave, editProvider }) => {
    const { t } = useTranslation();
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
                    <h3>{isEdit ? t('modal.editProvider') : t('modal.addProvider')}</h3>
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
                                <label>{t('form.providerName')}</label>
                                <input
                                    type="text"
                                    value={providerName}
                                    onChange={(e) => setProviderName(e.target.value)}
                                    placeholder={t('form.enterProviderName')}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('modal.taxIdentification')}</label>
                                <input
                                    type="text"
                                    value={taxIdentification}
                                    onChange={(e) => setTaxIdentification(e.target.value)}
                                    placeholder={t('modal.enterTaxId')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.contactPerson')}</label>
                                <input
                                    type="text"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                    placeholder={t('form.enterContactPerson')}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.phoneNumber')}</label>
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder={t('form.enterPhoneNumber')}
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group" style={{ width: '100%' }}>
                                <label>{t('form.address')}</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder={t('form.enterAddress')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('button.updateProvider') : t('button.createProvider')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProviderModal;
