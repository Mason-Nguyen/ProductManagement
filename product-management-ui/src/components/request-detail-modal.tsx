import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PurchaseRequestDto } from '../services/purchase-request-service';
import { purchaseOrderService } from '../services/purchase-order-service';
import { formatVND } from '../utils/formatters';

interface RequestDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PurchaseRequestDto | null;
    onSubmit?: (request: PurchaseRequestDto) => Promise<void>;
    currentUser?: { username: string; role?: string } | null;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request, onSubmit, currentUser }) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [converting, setConverting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [orderExists, setOrderExists] = useState<boolean | null>(null);

    // Check if a PurchaseOrder already exists for this request
    useEffect(() => {
        if (isOpen && request && request.status === 2) {
            setOrderExists(null);
            purchaseOrderService.existsForRequest(request.id)
                .then(exists => setOrderExists(exists))
                .catch(() => setOrderExists(null));
        } else {
            setOrderExists(null);
        }
        setError('');
        setSuccessMsg('');
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleSubmit = async () => {
        if (!request || !onSubmit) return;

        try {
            setSubmitting(true);
            setError('');
            await onSubmit(request);
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.requestDetail.failedToSubmit'));
            } else {
                setError(t('modal.requestDetail.errorSubmitting'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleConvert = async () => {
        if (!request) return;

        try {
            setConverting(true);
            setError('');
            setSuccessMsg('');
            await purchaseOrderService.convertFromRequest(request.id);
            setSuccessMsg(t('modal.successfullyConverted'));
            setOrderExists(true);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.failedToConvert'));
            } else {
                setError(t('modal.errorWhileConverting'));
            }
        } finally {
            setConverting(false);
        }
    };

    const canSubmit = request.status === 0 && currentUser?.username === request.createdUserName;
    const canConvert = request.status === 2 && orderExists === false;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('modal.requestDetails')}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="modal-error" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', color: '#16a34a' }}>
                        <span></span> {successMsg}
                    </div>
                )}

                <div className="modal-body">
                    {/* Request Info */}
                    <div className="detail-grid">
                        <div className="detail-field">
                            <label>{t('form.title')}</label>
                            <div className="detail-value">{request.title}</div>
                        </div>
                        <div className="detail-field">
                            <label>{t('form.createdBy')}</label>
                            <div className="detail-value">{request.createdUserName}</div>
                        </div>
                        <div className="detail-field">
                            <label>{t('form.reviewer')}</label>
                            <div className="detail-value">{request.reviewerName || '—'}</div>
                        </div>
                        <div className="detail-field">
                            <label>{t('form.approver')}</label>
                            <div className="detail-value">{request.approverName || '—'}</div>
                        </div>
                    </div>

                    <div className="detail-field detail-full">
                        <label>{t('form.description')}</label>
                        <div className="detail-value detail-text">{request.description}</div>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-field">
                            <label>{t('form.priority')}</label>
                            <div className="detail-value">
                                {request.urgent === 1
                                    ? <span className="urgent-badge">🔥 {t('status.urgent')}</span>
                                    : <span className="normal-badge">{t('status.normal')}</span>
                                }
                            </div>
                        </div>
                        <div className="detail-field">
                            <label>{t('form.status')}</label>
                            <div className="detail-value">
                                <span className={`request-status-badge status-${request.status === 0 ? 'draft' : request.status === 1 ? 'waiting' : request.status === 2 ? 'approved' : 'cancelled'}`}>
                                    {request.statusText}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-field">
                            <label>{t('form.expectedTotalPrice')}</label>
                            <div className="detail-value">
                                {request.expectedTotalPrice != null ? formatVND(request.expectedTotalPrice) : '—'}
                            </div>
                        </div>
                        <div className="detail-field">
                            <label>{t('form.expectedDeliveryDate')}</label>
                            <div className="detail-value">
                                {request.expectedDeliveryDate
                                    ? new Date(request.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    <div className="detail-field detail-full">
                        <label>{t('request.reviewerComment')}</label>
                        <div className={`detail-value ${request.reviewerComment ? 'reviewer-comment-box' : 'detail-empty'}`}>
                            {request.reviewerComment || '—'}
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="detail-section">
                        <h4>{t('modal.requestDetail.productsCount', { count: request.products.length })}</h4>
                        {request.products.length > 0 ? (
                            <div className="selected-products-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t('table.productCode')}</th>
                                            <th>{t('table.productName')}</th>
                                            <th>{t('table.category')}</th>
                                            <th>{t('table.unit')}</th>
                                            <th>{t('table.price')}</th>
                                            <th>{t('table.quantity')}</th>
                                            <th>{t('table.lineTotal')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {request.products.map(p => (
                                            <tr key={p.id}>
                                                <td><strong>{p.productCode}</strong></td>
                                                <td>{p.productName || 'N/A'}</td>
                                                <td><span className="category-tag">{p.category}</span></td>
                                                <td>{p.unit}</td>
                                                <td className="td-price">{formatVND(p.price)}</td>
                                                <td className="td-number">{p.quantityRequest}</td>
                                                <td className="td-price">{formatVND(p.lineTotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="total-price-row">
                                    <strong>{t('form.totalPrice')}:</strong>
                                    <span className="total-price-value">{formatVND(request.totalPrice)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="no-products-hint">{t('modal.noProductsInRequest')}</div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>{t('button.close')}</button>
                    {canConvert && (
                        <button
                            className="btn-save"
                            onClick={handleConvert}
                            disabled={converting}
                            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
                        >
                            {converting ? t('modal.converting') : t('modal.requestDetail.convertToPurchaseOrder')}
                        </button>
                    )}
                    {canSubmit && (
                        <button
                            className="btn-save"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? t('button.submitting') : t('modal.requestDetail.sendForReview')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetailModal;
