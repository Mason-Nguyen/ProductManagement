import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PurchaseOrderDto } from '../services/purchase-order-service';
import { purchaseOrderService } from '../services/purchase-order-service';
import { purchaseProductOrderService } from '../services/purchase-product-order-service';
import type { PurchaseProductOrderDto } from '../services/purchase-product-order-service';
import { formatVND } from '../utils/formatters';
import ImportProductsModal from './import-products-modal';
import { authService } from '../services/authService';

interface PurchaseOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto | null;
    onStatusChange?: () => void;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ isOpen, onClose, order, onStatusChange }) => {
    const { t } = useTranslation();
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
            setSuccessMsg(t('modal.purchaseOrderDetail.orderStatusUpdated'));
            onStatusChange?.();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.purchaseOrderDetail.failedToUpdateOrder'));
            } else {
                setError(t('modal.purchaseOrderDetail.errorUpdatingOrder'));
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
            setSuccessMsg(t('modal.purchaseOrderDetail.orderCancelled'));
            onStatusChange?.();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || t('modal.purchaseOrderDetail.failedToCancelOrder'));
            } else {
                setError(t('modal.purchaseOrderDetail.errorCancellingOrder'));
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
                setError(axiosErr.response?.data?.message || t('modal.purchaseOrderDetail.failedToExportPdf'));
            } else {
                setError(t('modal.purchaseOrderDetail.errorExportingPdf'));
            }
        } finally {
            setExporting(false);
        }
    };

    const canSetOrdering = currentOrder.status === 0;
    const canCancel = currentOrder.status === 0 || currentOrder.status === 1;
    
    // Get current user role
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    
    // Hide "Waiting for Ordering" button for Requester role
    const showWaitingForOrderingButton = canSetOrdering && userRole === 'Receiver';

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>{t('modal.purchaseOrderDetail.title')}</h3>
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
                                <label>{t('form.title')}</label>
                                <div className="detail-value">{currentOrder.title}</div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.createdBy')}</label>
                                <div className="detail-value">{currentOrder.createdUserName}</div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.reviewer')}</label>
                                <div className="detail-value">{currentOrder.reviewerName || '—'}</div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.approver')}</label>
                                <div className="detail-value">{currentOrder.approverName || '—'}</div>
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>{t('form.description')}</label>
                            <div className="detail-value detail-text">{currentOrder.description}</div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>{t('form.priority')}</label>
                                <div className="detail-value">
                                    {currentOrder.urgent === 1
                                        ? <span className="urgent-badge">🔥 {t('status.urgent')}</span>
                                        : <span className="normal-badge">{t('status.normal')}</span>
                                    }
                                </div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.status')}</label>
                                <div className="detail-value">
                                    <span className={`request-status-badge status-${currentOrder.status === 0 ? 'draft' : currentOrder.status === 1 ? 'waiting' : currentOrder.status === 2 ? 'approved' : 'cancelled'}`}>
                                        {currentOrder.statusText}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.totalPrice')}</label>
                                <div className="detail-value">
                                    <span className="total-price-value">{formatVND(currentOrder.totalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>{t('form.reviewerComment')}</label>
                            <div className={`detail-value ${currentOrder.reviewerComment ? 'reviewer-comment-box' : 'detail-empty'}`}>
                                {currentOrder.reviewerComment || '—'}
                            </div>
                        </div>

                        <div className="detail-field detail-full">
                            <label>{t('modal.purchaseOrderDetail.orderingComment')}</label>
                            <div className={`detail-value ${currentOrder.orderingComment ? 'reviewer-comment-box' : 'detail-empty'}`}>
                                {currentOrder.orderingComment || '—'}
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-field">
                                <label>{t('form.createdDate')}</label>
                                <div className="detail-value">{formatDate(currentOrder.createdDate)}</div>
                            </div>
                            <div className="detail-field">
                                <label>{t('form.modifiedDate')}</label>
                                <div className="detail-value">{formatDate(currentOrder.modifiedDate)}</div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="detail-section">
                            <h4>{t('modal.purchaseOrderDetail.productsCount', { count: products.length })}</h4>
                            {loadingProducts ? (
                                <div className="table-loading">{t('common.loadingProducts')}</div>
                            ) : products.length > 0 ? (
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
                                                <th>{t('modal.purchaseOrderDetail.importedDate')}</th>
                                                <th>{t('modal.purchaseOrderDetail.checkedBy')}</th>
                                                <th>{t('table.comment')}</th>
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
                                <div className="no-products-hint">{t('modal.purchaseOrderDetail.noProducts')}</div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>{t('button.close')}</button>
                        <button
                            className="btn-save"
                            onClick={handleExportPdf}
                            disabled={exporting}
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                        >
                            {exporting ? t('button.exporting') : t('button.exportPdf')}
                        </button>
                        {canCancel && (
                            <button
                                className="btn-danger"
                                onClick={handleCancel}
                                disabled={updating}
                            >
                                {updating ? t('button.cancelling') : t('button.cancelOrder')}
                            </button>
                        )}
                        {showWaitingForOrderingButton && (
                            <button
                                className="btn-save"
                                onClick={handleSetOrdering}
                                disabled={updating}
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                            >
                                {updating ? t('button.updating') : t('button.waitingForOrdering')}
                            </button>
                        )}
                        {currentOrder.status === 1 && (
                            <button
                                className="btn-save"
                                onClick={() => setImportModalOpen(true)}
                                disabled={updating}
                            >
                                {t('button.importProducts')}
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
