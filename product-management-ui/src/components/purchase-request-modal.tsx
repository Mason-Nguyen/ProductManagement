import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
    inStock: number;
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
    const { t } = useTranslation();
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
    const [expectedTotalPrice, setExpectedTotalPrice] = useState<string>('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');

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
                    inStock: 0, // Not available in edit mode, set to 0
                    minInStock: 0, // Not available in edit mode, set to 0
                    quantityRequest: p.quantityRequest,
                }))
            );
            setExpectedTotalPrice(editRequest.expectedTotalPrice != null ? String(editRequest.expectedTotalPrice) : '');
            setExpectedDeliveryDate(editRequest.expectedDeliveryDate ? editRequest.expectedDeliveryDate.substring(0, 10) : '');
        } else {
            setTitle('');
            setDescription('');
            setUrgent(0);
            setSelectedProducts([]);
            setExpectedTotalPrice('');
            setExpectedDeliveryDate('');
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
                    inStock: p.inStock,
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
            setError(t('validation.addAtLeastOneProduct'));
            return;
        }

        setLoading(true);
        try {
            const data = {
                title,
                description,
                urgent,
                expectedTotalPrice: expectedTotalPrice ? parseFloat(expectedTotalPrice) : null,
                expectedDeliveryDate: expectedDeliveryDate || null,
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
                setError(axiosErr.response?.data?.message || t('validation.operationFailed'));
            } else {
                setError(t('validation.errorOccurred'));
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
                    <h3>{isEdit ? t('modal.editPurchaseRequest') : t('modal.newPurchaseRequest')}</h3>
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
                                <label>{t('form.title')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder={t('form.enterTitle')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group" style={{ width: '100%' }}>
                                <label>{t('form.description')} <span className="required">*</span></label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder={t('form.enterDescription')}
                                    required
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.priority')}</label>
                                <div className="urgent-toggle">
                                    <button
                                        type="button"
                                        className={`toggle-btn ${urgent === 0 ? 'active' : ''}`}
                                        onClick={() => setUrgent(0)}
                                    >
                                        {t('status.normal')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`toggle-btn urgent ${urgent === 1 ? 'active' : ''}`}
                                        onClick={() => setUrgent(1)}
                                    >
                                        🔥 {t('status.urgent')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.expectedTotalPrice')}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={expectedTotalPrice}
                                    onChange={e => setExpectedTotalPrice(e.target.value)}
                                    placeholder={t('form.enterExpectedTotalPrice')}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.expectedDeliveryDate')}</label>
                                <input
                                    type="date"
                                    value={expectedDeliveryDate}
                                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Reviewer Comment (read-only, edit mode only) */}
                        {isEdit && editRequest?.reviewerComment && (
                            <div className="modal-form-row">
                                <div className="modal-form-group" style={{ width: '100%' }}>
                                    <label>{t('request.reviewerComment')}</label>
                                    <div className="reviewer-comment-box">
                                        {editRequest.reviewerComment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products Section */}
                        <div className="products-section">
                            <div className="products-section-header">
                                <h4>{t('table.products')} <span className="required">*</span></h4>
                                <button
                                    type="button"
                                    className="btn-add-product"
                                    onClick={() => {
                                        setShowProductPicker(!showProductPicker);
                                        setCheckedProductIds(new Set());
                                    }}
                                >
                                    {showProductPicker ? `✕ ${t('common.close')}` : `➕ ${t('request.addProducts')}`}
                                </button>
                            </div>

                            {/* Product Picker - Table with Checkboxes */}
                            {showProductPicker && (
                                <div className="product-picker">
                                    <div className="product-picker-toolbar">
                                        <input
                                            type="text"
                                            placeholder={t('modal.searchByCodeOrCategory')}
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
                                            ➕ {t('modal.addSelected')} ({checkedProductIds.size})
                                        </button>
                                    </div>
                                    <div className="product-picker-table-wrapper">
                                        {filteredAvailable.length === 0 ? (
                                            <div className="product-picker-empty">{t('modal.noAvailableProducts')}</div>
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
                                                        <th>{t('table.productCode')}</th>
                                                        <th>{t('table.productName')}</th>
                                                        <th>{t('table.category')}</th>
                                                        <th>{t('table.provider')}</th>
                                                        <th>{t('table.unit')}</th>
                                                        <th>{t('table.price')}</th>
                                                        <th>{t('table.inStock')}</th>
                                                        <th>{t('table.stockStatus')}</th>
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
                                                            <td className="td-number">{p.inStock}</td>
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
                                                <th>{t('table.productCode')}</th>
                                                <th>{t('table.productName')}</th>
                                                <th>{t('table.category')}</th>
                                                <th>{t('table.unit')}</th>
                                                <th>{t('table.price')}</th>
                                                <th style={{ width: 100 }}>{t('table.inStock')}</th>
                                                <th style={{ width: 100 }}>{t('table.minStock')}</th>
                                                <th style={{ width: 100 }}>{t('table.quantity')}</th>
                                                <th>{t('table.lineTotal')}</th>
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
                                                            value={p.inStock}
                                                            disabled
                                                            className="qty-input"
                                                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                                        />
                                                    </td>
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
                                                            title={t('request.removeProduct')}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="total-price-row">
                                        <strong>{t('form.totalPrice')}:</strong>
                                        <span className="total-price-value">{formatVND(totalPrice)}</span>
                                    </div>
                                </div>
                            )}

                            {selectedProducts.length === 0 && !showProductPicker && (
                                <div className="no-products-hint">
                                    {t('modal.clickAddProduct')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('button.updatePurchaseRequest') : t('button.createPurchaseRequest')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseRequestModal;
