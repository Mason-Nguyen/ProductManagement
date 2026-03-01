import React, { useState, useEffect } from 'react';
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
            setError('Please enter a ReviewerComment before approving.');
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
                setError(axiosErr.response?.data?.message || 'Failed to approve request.');
            } else {
                setError('An error occurred while approving.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            setError('Please enter a ReviewerComment before rejecting.');
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
                setError(axiosErr.response?.data?.message || 'Failed to reject request.');
            } else {
                setError('An error occurred while rejecting.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (!comment.trim()) {
            setError('ReviewerComment cannot be empty.');
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            setSuccess('');
            await onUpdateComment(request.id, comment.trim());
            setSuccess('Comment updated successfully!');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to update comment.');
            } else {
                setError('An error occurred while updating comment.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Request Details — Review</h3>
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
                            <label>Title</label>
                            <div className="detail-value">{request.title}</div>
                        </div>
                        <div className="detail-field">
                            <label>Created By</label>
                            <div className="detail-value">{request.createdUserName}</div>
                        </div>
                        <div className="detail-field">
                            <label>Reviewer</label>
                            <div className="detail-value">{request.reviewerName || '—'}</div>
                        </div>
                        <div className="detail-field">
                            <label>Approver</label>
                            <div className="detail-value">{request.approverName || '—'}</div>
                        </div>
                    </div>

                    <div className="detail-field detail-full">
                        <label>Description</label>
                        <div className="detail-value detail-text">{request.description}</div>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-field">
                            <label>Priority</label>
                            <div className="detail-value">
                                {request.urgent === 1
                                    ? <span className="urgent-badge">🔥 Urgent</span>
                                    : <span className="normal-badge">Normal</span>
                                }
                            </div>
                        </div>
                        <div className="detail-field">
                            <label>Status</label>
                            <div className="detail-value">
                                <span className={`request-status-badge status-${request.status === 0 ? 'draft' : request.status === 1 ? 'waiting' : request.status === 2 ? 'approved' : 'cancelled'}`}>
                                    {request.statusText}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reviewer Comment — editable */}
                    <div className="detail-field detail-full">
                        <label>Reviewer Comment <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>({comment.length}/3000)</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder="Enter your review comment here..."
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
                        <h4>Products ({request.products.length})</h4>
                        {request.products.length > 0 ? (
                            <div className="selected-products-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product Code</th>
                                            <th>Category</th>
                                            <th>Unit</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Line Total</th>
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
                                    <strong>Total Price:</strong>
                                    <span className="total-price-value">{formatVND(request.totalPrice)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="no-products-hint">No products in this request.</div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={submitting}>Close</button>
                    <button
                        className="btn-outline"
                        onClick={handleUpdateComment}
                        disabled={submitting}
                    >
                        {submitting ? 'Updating...' : '💬 Update Comment'}
                    </button>
                    <button
                        className="btn-danger"
                        onClick={handleReject}
                        disabled={submitting}
                    >
                        {submitting ? 'Rejecting...' : '❌ Reject'}
                    </button>
                    {canApprove() && (
                        <button
                            className="btn-save"
                            onClick={handleApprove}
                            disabled={submitting}
                        >
                            {submitting ? 'Approving...' : '✅ Approve'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailModal;
