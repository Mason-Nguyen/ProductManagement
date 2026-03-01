import React, { useState, useEffect } from 'react';
import type { PurchaseOrderDto } from '../services/purchase-order-service';
import { purchaseOrderService } from '../services/purchase-order-service';
import { purchaseProductOrderService } from '../services/purchase-product-order-service';
import type { PurchaseProductOrderDto } from '../services/purchase-product-order-service';
import { formatVND } from '../utils/formatters';

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrderDto;
    onImportSuccess: () => void;
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose, order, onImportSuccess }) => {
    const [products, setProducts] = useState<PurchaseProductOrderDto[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (isOpen && order) {
            setError('');
            setSuccessMsg('');
            setLoadingProducts(true);
            purchaseProductOrderService.getByOrderId(order.id)
                .then(data => {
                    setProducts(data);
                    // Initialize quantities to 0
                    const initQty: Record<string, number> = {};
                    data.forEach(p => { initQty[p.id] = 0; });
                    setQuantities(initQty);
                })
                .catch(err => console.error('Failed to fetch products:', err))
                .finally(() => setLoadingProducts(false));
        }
    }, [isOpen, order]);

    if (!isOpen) return null;

    const handleQuantityChange = (id: string, value: string) => {
        const num = parseInt(value) || 0;
        setQuantities(prev => ({ ...prev, [id]: num }));
    };

    const getMaxImport = (p: PurchaseProductOrderDto) => {
        return Math.max(0, p.quantityRequest - p.quantity);
    };

    const calculatedTotalPrice = products.reduce((sum, p) => {
        const importQty = quantities[p.id] || 0;
        return sum + (p.quantity + importQty) * p.price;
    }, 0);

    const hasAnyQuantity = Object.values(quantities).some(q => q > 0);

    const validate = (): string | null => {
        for (const p of products) {
            const importQty = quantities[p.id] || 0;
            if (importQty < 0) return `Quantity for ${p.productCode} cannot be negative.`;
            const max = getMaxImport(p);
            if (importQty > max) return `Quantity for ${p.productCode} exceeds max allowed (${max}).`;
        }
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        const items = products
            .filter(p => (quantities[p.id] || 0) > 0)
            .map(p => ({
                purchaseProductOrderId: p.id,
                quantity: quantities[p.id],
            }));

        if (items.length === 0) {
            setError('Please enter at least one quantity to import.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccessMsg('');
            const updated = await purchaseOrderService.importProducts(order.id, items);
            const allDone = updated.status === 2;
            setSuccessMsg(allDone
                ? '✅ All products imported! Order marked as Done.'
                : '✅ Import successful! Order remains in Ordering status for remaining items.'
            );
            onImportSuccess();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setError(axiosErr.response?.data?.message || 'Failed to import products.');
            } else {
                setError('An error occurred during import.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-xxlarge" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📥 Import Products — {order.title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="modal-error" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', color: '#16a34a' }}>
                        {successMsg}
                    </div>
                )}

                <div className="modal-body">
                    {loadingProducts ? (
                        <div className="table-loading">Loading products...</div>
                    ) : (
                        <div className="selected-products-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product Code</th>
                                        <th>Product Name</th>
                                        <th>Unit</th>
                                        <th>Price</th>
                                        <th>Min Stock</th>
                                        <th>In Stock</th>
                                        <th>Qty Requested</th>
                                        <th>Already Imported</th>
                                        <th>Remaining</th>
                                        <th>Import Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const maxImport = getMaxImport(p);
                                        const importQty = quantities[p.id] || 0;
                                        const isOver = importQty > maxImport;
                                        return (
                                            <tr key={p.id}>
                                                <td><strong>{p.productCode}</strong></td>
                                                <td>{p.productName || 'N/A'}</td>
                                                <td>{p.unit}</td>
                                                <td className="td-price">{formatVND(p.price)}</td>
                                                <td className="td-number">{p.minInStock}</td>
                                                <td className="td-number">{p.inStock}</td>
                                                <td className="td-number">{p.quantityRequest}</td>
                                                <td className="td-number">{p.quantity}</td>
                                                <td className="td-number">
                                                    <span style={{ color: maxImport > 0 ? '#ea580c' : '#16a34a', fontWeight: 600 }}>
                                                        {maxImport}
                                                    </span>
                                                </td>
                                                <td>
                                                    {maxImport > 0 ? (
                                                        <input
                                                            type="number"
                                                            className="qty-input"
                                                            min={0}
                                                            max={maxImport}
                                                            value={importQty}
                                                            onChange={e => handleQuantityChange(p.id, e.target.value)}
                                                            style={isOver ? { borderColor: '#ef4444' } : {}}
                                                        />
                                                    ) : (
                                                        <span className="request-status-badge status-approved">✅ Done</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="total-price-row">
                        <span>Projected Total Price:</span>
                        <span className="total-price-value">{formatVND(calculatedTotalPrice)}</span>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="btn-save"
                        onClick={handleSubmit}
                        disabled={submitting || !hasAnyQuantity || !!successMsg}
                    >
                        {submitting ? 'Importing...' : '📥 OK — Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportProductsModal;
