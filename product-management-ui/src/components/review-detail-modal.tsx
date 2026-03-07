import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PurchaseRequestDto } from '../services/purchase-request-service';
import type { ApprovalConfigDto } from '../services/approval-config-service';
import { formatVND } from '../utils/formatters';

interface ReviewDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PurchaseRequestDto | null;
    userRole: string;
    onApprove: (id: string, comment: string) => Promise<void>;
    onReject: (id: string, comment: string) => Promise<void>;
    onUpdateComment: (id: string, comment: string) => Promise<void>;
    approvalConfigs: ApprovalConfigDto[];
}

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
    isOpen, onClose, request, userRole, onApprove, onReject, onUpdateComment, approvalConfigs
}) => {
    const { t } = useTranslation();
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (request) {
            setComment(request.reviewerComment || '');
            setError('');
            setSuccess('');
        }
    }, [request]);

    if (!isOpen || !request) return null;

    const canApprove = () => {
        if (approvalConfigs.length > 0) {
            // Config-based: find config matching user's role AND totalPrice in range
            return approvalConfigs.some(ac =>
                ac.roleName === userRole &&
                request.totalPrice >= ac.minAmount &&
                request.totalPrice <= ac.maxAmount
            );
        }
        // Fallback: no configs in DB, use legacy 5M rule
        if (request.totalPrice < 5000000) {
            return true; // Both Reviewer and Approver can approve
        }
        return userRole === 'Approver'; // Only Approver for >= 5M
    };

    const handleApprove = async () => {
        if (!comment.trim()) {
            setError(t('modal.commentBeforeApproveReject'));
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            setSuccess('');
            await onApprove(request.id, comment.trim());
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.failedToApprove'));
            } else {
                setError(t('modal.errorWhileApproving'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            setError(t('modal.commentBeforeApproveReject'));
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            setSuccess('');
            await onReject(request.id, comment.trim());
            onClose();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.failedToReject'));
            } else {
                setError(t('modal.errorWhileRejecting'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!comment.trim()) {
            setError(t('modal.commentCannotBeEmpty'));
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            setSuccess('');
            await onUpdateComment(request.id, comment.trim());
            setSuccess(t('modal.commentUpdatedSuccessfully'));
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.failedToUpdateComment'));
            } else {
                setError(t('modal.errorWhileUpdating'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{t('modal.requestDetailsReview')}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {success && (
                    <div className="modal-success">
                        <span>✅</span> {success}
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

                    {/* Reviewer Comment — editable */}
                    <div className="detail-field detail-full">
                        <label>{t('request.reviewerComment')} <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>({comment.length}/3000)</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder={t('modal.enterReviewComment')}
                            value={comment}
                            onChange={e => {
                                setError('');
                                setSuccess('');
                                setComment(e.target.value);
                            }}
                            maxLength={3000}
                            rows={4}
                            disabled={submitting}
                        />
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
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>{t('button.close')}</button>
                    <button
                        className="btn-outline"
                        onClick={handleUpdateComment}
                        disabled={submitting}
                    >
                        {submitting ? t('modal.updating') : t('modal.reviewDetail.updateComment')}
                    </button>
                    {canApprove() && (
                        <button
                            className="btn-danger"
                            onClick={handleReject}
                            disabled={submitting}
                        >
                            {submitting ? t('modal.rejecting') : t('modal.reviewDetail.reject')}
                        </button>
                    )}
                    {canApprove() && (
                        <button
                            className="btn-save"
                            onClick={handleApprove}
                            disabled={submitting}
                        >
                            {submitting ? t('modal.approving') : t('modal.reviewDetail.approve')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailModal;
