import React, { useState, useEffect } from 'react';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '../services/product-service';
import type { ProviderDto } from '../services/provider-service';
import { useTranslation } from 'react-i18next';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
    providers: ProviderDto[];
    editProduct?: ProductDto | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, providers, editProduct }) => {
    const { t } = useTranslation();
    const [productCode, setProductCode] = useState('');
    const [productName, setProductName] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState('');
    const [inStock, setInStock] = useState('');
    const [minInStock, setMinInStock] = useState('');
    const [providerId, setProviderId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEdit = !!editProduct;

    useEffect(() => {
        if (editProduct) {
            setProductCode(editProduct.productCode);
            setProductName(editProduct.productName || '');
            setCategory(editProduct.category);
            setUnit(editProduct.unit);
            setPrice(editProduct.price.toFixed(3));
            setInStock(editProduct.inStock.toString());
            setMinInStock(editProduct.minInStock.toString());
            setProviderId(editProduct.providerId);
        } else {
            setProductCode('');
            setProductName('');
            setCategory('');
            setUnit('');
            setPrice('');
            setInStock('');
            setMinInStock('');
            setProviderId(providers.length > 0 ? providers[0].id : '');
        }
        setError('');
    }, [editProduct, isOpen, providers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsedPrice = parseFloat(price);
        const parsedInStock = parseInt(inStock, 10);
        const parsedMinInStock = parseInt(minInStock, 10);

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            setError(t('validation.priceInvalid'));
            return;
        }
        if (isNaN(parsedInStock) || parsedInStock < 0) {
            setError(t('validation.stockInvalid'));
            return;
        }
        if (isNaN(parsedMinInStock) || parsedMinInStock < 0) {
            setError(t('validation.minStockInvalid'));
            return;
        }

        setLoading(true);
        try {
            const data = {
                productCode,
                productName: productName.trim() || null,
                category,
                unit,
                price: Math.round(parsedPrice * 1000) / 1000,
                inStock: parsedInStock,
                minInStock: parsedMinInStock,
                providerId,
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
            <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEdit ? t('modal.editProduct') : t('modal.addProduct')}</h3>
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
                                <label>{t('form.productCode')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={productCode}
                                    onChange={(e) => setProductCode(e.target.value)}
                                    placeholder={t('form.enterProductCode')}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.productName')}</label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder={t('form.enterProductName')}
                                    maxLength={3000}
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.category')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder={t('form.enterCategory')}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.unit')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder={t('form.enterUnit')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.price')} <span className="required">*</span></label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.000"
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.inStock')} <span className="required">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    value={inStock}
                                    onChange={(e) => setInStock(e.target.value)}
                                    placeholder={t('table.inStock')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label>{t('form.minInStock')} <span className="required">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minInStock}
                                    onChange={(e) => setMinInStock(e.target.value)}
                                    placeholder={t('table.minStock')}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>{t('form.provider')} <span className="required">*</span></label>
                                <select value={providerId} onChange={(e) => setProviderId(e.target.value)} required>
                                    <option value="">{t('form.selectProvider')}</option>
                                    {providers.map((p) => (
                                        <option key={p.id} value={p.id}>{p.providerName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? t('button.saving') : isEdit ? t('button.updateProduct') : t('button.createProduct')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
