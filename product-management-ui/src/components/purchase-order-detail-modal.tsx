import React, { useState, useEffect } from 'react';
import type { PurchaseOrderDto } from '../services/purchase-order-service';
import { purchaseOrderService } from '../services/purchase-order-service';
import { purchaseProductOrderService } from '../services/purchase-product-order-service';
import type { PurchaseProductOrderDto } from '../services/purchase-product-order-service';
import { formatVND } from '../utils/formatters';
import ImportProductsModal from './import-products-modal';

interface PurchaseOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto | null;
    onStatusChange?: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ isOpen, onClose, order, onStatusChange }) => {
    const [products, setProducts] = useState<PurchaseProductOrderDto[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [currentOrder, setCurrentOrder] = useState<PurchaseOrderDto | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            setCurrentOrder(order);
            setError('');
            setSuccessMsg('');
            setLoadingProducts(true);
            purchaseProductOrderService.getByOrderId(order.id)
                .then(data => setProducts(data))
                .catch(err => console.error('Failed to fetch product orders:', err))
                .finally(() => setLoadingProducts(false));
        } else {
            setProducts([]);
            setCurrentOrder(null);
        }
    }, [isOpen, order]);

    if (!isOpen || !currentOrder) return null;

    const handleSetOrdering = async () => {
        try {
            setUpdating(true);
            setError('');
            setSuccessMsg('');
            const updated = await purchaseOrderService.setOrdering(currentOrder.id);
            setCurrentOrder(updated);
            setSuccessMsg('✅ Order status updated to Ordering!');
            onStatusChange?.();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to update order.');
            } else {
                setError('An error occurred while updating the order.');
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = async () => {
        try {
            setUpdating(true);
            setError('');
            setSuccessMsg('');
            const updated = await purchaseOrderService.cancel(currentOrder.id);
            setCurrentOrder(updated);
            setSuccessMsg('✅ Order has been cancelled.');
            onStatusChange?.();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to cancel order.');
            } else {
                setError('An error occurred while cancelling the order.');
            }
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleExportPdf = async () => {
        try {
            setExporting(true);
            setError('');
            await purchaseOrderService.exportPdf(currentOrder.id);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to export PDF.');
            } else {
                setError('An error occurred while exporting PDF.');
            }
        } finally {
            setExporting(false);
        }
    };

    const canSetOrdering = currentOrder.status === 0;
    const canCancel = currentOrder.status === 0 || currentOrder.status === 1;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Purchase Order Details</h3>
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
                        {/* Order Info */}
                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>Title</label>
                                <div className="detail-value">{currentOrder.title}</div>
                            </div>
                            <div className="detail-field">
                                <label>Created By</label>
                                <div className="detail-value">{currentOrder.createdUserName}</div>
                            </div>
                            <div className="detail-field">
                                <label>Reviewer</label>
                                <div className="detail-value">{currentOrder.reviewerName || '—'}</div>
                            </div>
                            <div className="detail-field">
                                <label>Approver</label>
                                <div className="detail-value">{currentOrder.approverName || '—'}</div>
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>Description</label>
                            <div className="detail-value detail-text">{currentOrder.description}</div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>Priority</label>
                                <div className="detail-value">
                                    {currentOrder.urgent === 1
                                        ? <span className="urgent-badge">🔥 Urgent</span>
                                        : <span className="normal-badge">Normal</span>
                                    }
                                </div>
                            </div>
                            <div className="detail-field">
                                <label>Status</label>
                                <div className="detail-value">
                                    <span className={`request-status-badge status-${currentOrder.status === 0 ? 'draft' : currentOrder.status === 1 ? 'waiting' : currentOrder.status === 2 ? 'approved' : 'cancelled'}`}>
                                        {currentOrder.statusText}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-field">
                                <label>Total Price</label>
                                <div className="detail-value">
                                    <span className="total-price-value">{formatVND(currentOrder.totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>Reviewer Comment</label>
                            <div className={`detail-value ${currentOrder.reviewerComment ? 'reviewer-comment-box' : 'detail-empty'}`}>
                                {currentOrder.reviewerComment || '—'}
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>Ordering Comment</label>
                            <div className={`detail-value ${currentOrder.orderingComment ? 'reviewer-comment-box' : 'detail-empty'}`}>
                                {currentOrder.orderingComment || '—'}
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>Created Date</label>
                                <div className="detail-value">{formatDate(currentOrder.createdDate)}</div>
                            </div>
                            <div className="detail-field">
                                <label>Modified Date</label>
                                <div className="detail-value">{formatDate(currentOrder.modifiedDate)}</div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="detail-section">
                            <h4>Products ({products.length})</h4>
                            {loadingProducts ? (
                                <div className="table-loading">Loading products...</div>
                            ) : products.length > 0 ? (
                                <div className="selected-products-table">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product Code</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Imported Date</th>
                                                <th>Checked By</th>
                                                <th>Comment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(p => (
                                                <tr key={p.id}>
                                                    <td><strong>{p.productCode}</strong></td>
                                                    <td>{p.productName || 'N/A'}</td>
                                                    <td><span className="category-tag">{p.category}</span></td>
                                                    <td>{p.unit}</td>
                                                    <td className="td-price">{formatVND(p.price)}</td>
                                                    <td className="td-number">{p.quantity}</td>
                                                    <td>{p.importedDate ? formatDate(p.importedDate) : '—'}</td>
                                                    <td>{p.checkedUserName || '—'}</td>
                                                    <td>{p.comment || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="no-products-hint">No products in this order.</div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>Close</button>
                        <button
                            className="btn-save"
                            onClick={handleExportPdf}
                            disabled={exporting}
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                        >
                            {exporting ? 'Exporting...' : '📄 Export PDF'}
                        </button>
                        {canCancel && (
                            <button
                                className="btn-danger"
                                onClick={handleCancel}
                                disabled={updating}
                            >
                                {updating ? 'Cancelling...' : '🚫 Cancel Order'}
                            </button>
                        )}
                        {canSetOrdering && (
                            <button
                                className="btn-save"
                                onClick={handleSetOrdering}
                                disabled={updating}
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                                {updating ? 'Updating...' : '📦 Waiting For Ordering'}
                            </button>
                        )}
                        {currentOrder.status === 1 && (
                            <button
                                className="btn-save"
                                onClick={() => setImportModalOpen(true)}
                                disabled={updating}
                            >
                                📥 Import Products
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {currentOrder.status === 1 && (
                <ImportProductsModal
                    isOpen={importModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    order={currentOrder}
                    onImportSuccess={() => {
                        purchaseProductOrderService.getByOrderId(currentOrder.id)
                            .then(data => setProducts(data));
                        purchaseOrderService.getById(currentOrder.id)
                            .then(updated => setCurrentOrder(updated));
                        onStatusChange?.();
                    }}
                />
            )}
        </>
    );
};

export default PurchaseOrderDetailModal;
