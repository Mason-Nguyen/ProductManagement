import React, { useState, useEffect, useCallback } from 'react';
import type { PurchaseRequestDto, CreatePurchaseRequestDto, UpdatePurchaseRequestDto, AvailableProductDto, PurchaseProductDto } from '../services/purchase-request-service';
import { purchaseRequestService } from '../services/purchase-request-service';
import { formatVND } from '../utils/formatters';

interface SelectedProduct {
    productId: string;
    productCode: string;
    productName?: string | null;
    category: string;
    unit: string;
    price: number;
    minInStock: number;
    quantityRequest: number;
}

interface PurchaseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreatePurchaseRequestDto | UpdatePurchaseRequestDto) => Promise<void>;
    editRequest?: PurchaseRequestDto | null;
}

const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({ isOpen, onClose, onSave, editRequest }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [urgent, setUrgent] = useState(0);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [availableProducts, setAvailableProducts] = useState<AvailableProductDto[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [checkedProductIds, setCheckedProductIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editRequest;

    const fetchAvailableProducts = useCallback(async () => {
        try {
            const products = await purchaseRequestService.getAvailableProducts(
                editRequest?.id
            );
            setAvailableProducts(products);
        } catch (err) {
            console.error('Failed to fetch available products:', err);
        }
    }, [editRequest]);

    useEffect(() => {
        if (!isOpen) return;

        if (editRequest) {
            setTitle(editRequest.title);
            setDescription(editRequest.description);
            setUrgent(editRequest.urgent);
            setSelectedProducts(
                editRequest.products.map((p: PurchaseProductDto) => ({
                    productId: p.productId,
                    productCode: p.productCode,
                    category: p.category,
                    unit: p.unit,
                    price: p.price,
                    minInStock: 0, // Not available in edit mode, set to 0
                    quantityRequest: p.quantityRequest,
                }))
            );
        } else {
            setTitle('');
            setDescription('');
            setUrgent(0);
            setSelectedProducts([]);
        }
        setError('');
        setProductSearch('');
        setShowProductPicker(false);
        setCheckedProductIds(new Set());
        fetchAvailableProducts();
    }, [editRequest, isOpen, fetchAvailableProducts]);

    const totalPrice = selectedProducts.reduce(
        (sum, p) => sum + p.price * p.quantityRequest,
        0
    );

    const handleToggleCheck = (productId: string) => {
        setCheckedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };

    const handleToggleCheckAll = (checked: boolean) => {
        if (checked) {
            setCheckedProductIds(new Set(filteredAvailable.map(p => p.id)));
        } else {
            setCheckedProductIds(new Set());
        }
    };

    const handleAddCheckedProducts = () => {
        const toAdd = availableProducts.filter(p => checkedProductIds.has(p.id));
        if (toAdd.length === 0) return;
        setSelectedProducts(prev => [
            ...prev,
            ...toAdd
                .filter(p => !prev.some(sp => sp.productId === p.id))
                .map(p => ({
                    productId: p.id,
                    productCode: p.productCode,
                    productName: p.productName,
                    category: p.category,
                    unit: p.unit,
                    price: p.price,
                    minInStock: p.minInStock,
                    quantityRequest: 1,
                })),
        ]);
        setCheckedProductIds(new Set());
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    };

    const handleQuantityChange = (productId: string, qty: string) => {
        const val = parseInt(qty, 10);
        if (isNaN(val) || val < 1) return;
        setSelectedProducts(prev =>
            prev.map(p => (p.productId === productId ? { ...p, quantityRequest: val } : p))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedProducts.length === 0) {
            setError('Please add at least one product.');
            return;
        }

        setLoading(true);
        try {
            const data = {
                title,
                description,
                urgent,
                products: selectedProducts.map(p => ({
                    productId: p.productId,
                    quantityRequest: p.quantityRequest,
                })),
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

    // Products available for the picker (filter out already selected)
    const filteredAvailable = availableProducts
        .filter(p => !selectedProducts.some(sp => sp.productId === p.id))
        .filter(
            p =>
                p.productCode.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.category.toLowerCase().includes(productSearch.toLowerCase())
        );

    const allChecked = filteredAvailable.length > 0 && filteredAvailable.every(p => checkedProductIds.has(p.id));

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEdit ? 'Edit Purchase Request' : 'New Purchase Request'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="modal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Request Info */}
                        <div className="modal-form-row">
                            <div className="modal-form-group" style={{ width: '100%' }}>
                                <label>Title <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Enter request title"
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group" style={{ width: '100%' }}>
                                <label>Description <span className="required">*</span></label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Describe the purpose of this request..."
                                    required
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>Priority</label>
                                <div className="urgent-toggle">
                                    <button
                                        type="button"
                                        className={`toggle-btn ${urgent === 0 ? 'active' : ''}`}
                                        onClick={() => setUrgent(0)}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        type="button"
                                        className={`toggle-btn urgent ${urgent === 1 ? 'active' : ''}`}
                                        onClick={() => setUrgent(1)}
                                    >
                                        🔥 Urgent
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reviewer Comment (read-only, edit mode only) */}
                        {isEdit && editRequest?.reviewerComment && (
                            <div className="modal-form-row">
                                <div className="modal-form-group" style={{ width: '100%' }}>
                                    <label>Reviewer Comment</label>
                                    <div className="reviewer-comment-box">
                                        {editRequest.reviewerComment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products Section */}
                        <div className="products-section">
                            <div className="products-section-header">
                                <h4>Products <span className="required">*</span></h4>
                                <button
                                    type="button"
                                    className="btn-add-product"
                                    onClick={() => {
                                        setShowProductPicker(!showProductPicker);
                                        setCheckedProductIds(new Set());
                                    }}
                                >
                                    {showProductPicker ? '✕ Close' : '➕ Add Product'}
                                </button>
                            </div>

                            {/* Product Picker - Table with Checkboxes */}
                            {showProductPicker && (
                                <div className="product-picker">
                                    <div className="product-picker-toolbar">
                                        <input
                                            type="text"
                                            placeholder="Search by product code or category..."
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            className="product-picker-search"
                                        />
                                        <button
                                            type="button"
                                            className="btn-add-checked"
                                            onClick={handleAddCheckedProducts}
                                            disabled={checkedProductIds.size === 0}
                                        >
                                            ➕ Add Selected ({checkedProductIds.size})
                                        </button>
                                    </div>
                                    <div className="product-picker-table-wrapper">
                                        {filteredAvailable.length === 0 ? (
                                            <div className="product-picker-empty">No available products found</div>
                                        ) : (
                                            <table className="data-table product-picker-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 40 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={allChecked}
                                                                onChange={e => handleToggleCheckAll(e.target.checked)}
                                                            />
                                                        </th>
                                                        <th>Product Code</th>
                                                        <th>Product Name</th>
                                                        <th>Category</th>
                                                        <th>Provider</th>
                                                        <th>Unit</th>
                                                        <th>Price</th>
                                                        <th>Stock Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAvailable.map(p => (
                                                        <tr
                                                            key={p.id}
                                                            className={checkedProductIds.has(p.id) ? 'row-checked' : ''}
                                                            onClick={() => handleToggleCheck(p.id)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checkedProductIds.has(p.id)}
                                                                    onChange={() => handleToggleCheck(p.id)}
                                                                />
                                                            </td>
                                                            <td><strong>{p.productCode}</strong></td>
                                                            <td>{p.productName || 'N/A'}</td>
                                                            <td><span className="category-tag">{p.category}</span></td>
                                                            <td>{p.providerName}</td>
                                                            <td>{p.unit}</td>
                                                            <td className="td-price">{formatVND(p.price)}</td>
                                                            <td>
                                                                <span className={`stock-badge ${p.inStockStatus === 0 ? 'out-of-stock' : 'almost-out'}`}>
                                                                    {p.inStockStatus === 0 ? '🔴' : '🟡'} {p.inStockStatusText}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Selected Products Table */}
                            {selectedProducts.length > 0 && (
                                <div className="selected-products-table">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product Code</th>
                                                <th>Product Name</th>
                                                <th>Category</th>
                                                <th>Unit</th>
                                                <th>Price</th>
                                                <th style={{ width: 100 }}>Min Stock</th>
                                                <th style={{ width: 100 }}>Quantity</th>
                                                <th>Line Total</th>
                                                <th style={{ width: 50 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedProducts.map(p => (
                                                <tr key={p.productId}>
                                                    <td><strong>{p.productCode}</strong></td>
                                                    <td>{p.productName || 'N/A'}</td>
                                                    <td><span className="category-tag">{p.category}</span></td>
                                                    <td>{p.unit}</td>
                                                    <td className="td-price">{formatVND(p.price)}</td>
                                                    <td className="td-number">
                                                        <input
                                                            type="number"
                                                            value={p.minInStock}
                                                            disabled
                                                            className="qty-input"
                                                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={p.quantityRequest}
                                                            onChange={e => handleQuantityChange(p.productId, e.target.value)}
                                                            className="qty-input"
                                                        />
                                                    </td>
                                                    <td className="td-price">
                                                        {formatVND(p.price * p.quantityRequest)}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-remove-product"
                                                            onClick={() => handleRemoveProduct(p.productId)}
                                                            title="Remove"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="total-price-row">
                                        <strong>Total Price:</strong>
                                        <span className="total-price-value">{formatVND(totalPrice)}</span>
                                    </div>
                                </div>
                            )}

                            {selectedProducts.length === 0 && !showProductPicker && (
                                <div className="no-products-hint">
                                    Click "Add Product" to select products for this request.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Request' : 'Create Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseRequestModal;
