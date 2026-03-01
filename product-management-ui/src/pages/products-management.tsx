import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ProductModal from '../components/product-modal';
import { productService } from '../services/product-service';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '../services/product-service';
import { providerService } from '../services/provider-service';
import type { ProviderDto } from '../services/provider-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND } from '../utils/formatters';
import { useTranslation } from 'react-i18next';

const ProductsManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    const canEdit = userRole === 'Requester'; // Only Requester can edit products

    const [products, setProducts] = useState<ProductDto[]>([]);
    const [providers, setProviders] = useState<ProviderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ProductDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<number | null>(null);

    // Dynamic navigation based on role
    const getNavItems = () => {
        switch (userRole) {
            case 'Admin':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/admin') },
                    { icon: '👥', label: 'Users Management', onClick: () => navigate('/admin/users') },
                    { icon: '🏢', label: 'Departments Management', onClick: () => navigate('/admin/departments') },
                    { icon: '🏭', label: 'Providers Management', onClick: () => navigate('/admin/providers') },
                    { icon: '📦', label: 'Products Management', active: true },
                    { icon: '⚙️', label: 'Approval Configuration', onClick: () => navigate('/admin/approval-configs') },
                    { icon: '📝', label: 'Approval Log', onClick: () => navigate('/admin/approval-logs') },
                    { icon: '🔐', label: 'Login Tracking', onClick: () => navigate('/admin/login-logs') },
                ];
            case 'Approver':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/approver') },
                    { icon: '📋', label: 'Pending Approvals', onClick: () => navigate('/approver/pending-reviews') },
                    { icon: '✅', label: 'Approved', onClick: () => navigate('/approver/approved-requests') },
                    { icon: '❌', label: 'Rejected', onClick: () => navigate('/approver/rejected-requests') },
                    { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/approver/providers') },
                    { icon: '📦', label: 'Products Management', active: true },
                    { icon: '📝', label: 'Approval Log', onClick: () => navigate('/approver/approval-logs') },
                ];
            case 'Reviewer':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/reviewer') },
                    { icon: '🔍', label: 'Pending Reviews', onClick: () => navigate('/reviewer/pending-reviews') },
                    { icon: '✅', label: 'Approved', onClick: () => navigate('/reviewer/approved-requests') },
                    { icon: '❌', label: 'Rejected', onClick: () => navigate('/reviewer/rejected-requests') },
                    { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/reviewer/providers') },
                    { icon: '📦', label: 'Products Management', active: true },
                ];
            case 'Receiver':
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/receiver') },
                    { icon: '📋', label: 'Purchase Orders', onClick: () => navigate('/receiver/purchase-orders') },
                    { icon: '📦', label: 'Products Management', active: true },
                ];
            default:
                return [
                    { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/requester') },
                    { icon: '📝', label: 'My Requests', onClick: () => navigate('/requester/my-requests') },
                    { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/requester/providers') },
                    { icon: '📦', label: 'Products Management', active: true },
                ];
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, providersData] = await Promise.all([
                productService.getAll(),
                providerService.getAll(),
            ]);
            setProducts(productsData);
            setProviders(providersData);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreateProductRequest | UpdateProductRequest) => {
        await productService.create(data as CreateProductRequest);
        await fetchData();
    };

    const handleUpdate = async (data: CreateProductRequest | UpdateProductRequest) => {
        if (!editProduct) return;
        await productService.update(editProduct.id, data as UpdateProductRequest);
        await fetchData();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await productService.remove(deleteConfirm.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to delete product:', err);
        }
        setDeleteConfirm(null);
    };

    const openCreateModal = () => {
        setEditProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product: ProductDto) => {
        setEditProduct(product);
        setModalOpen(true);
    };

    const handleFilterClick = (status: number | null) => {
        // Toggle filter: if clicking the same filter, clear it
        setActiveFilter(activeFilter === status ? null : status);
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.providerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = activeFilter === null || p.inStockStatus === activeFilter;
        return matchesSearch && matchesStatus;
    });

    const getStockBadge = (status: number, text: string) => {
        const cls = status === 0 ? 'out-of-stock' : status === 1 ? 'in-stock' : 'almost-out';
        const icon = status === 0 ? '🔴' : status === 1 ? '🟢' : '🟡';
        return <span className={`stock-badge ${cls}`}>{icon} {text}</span>;
    };

    const formatPrice = (price: number) => {
        return formatVND(price);
    };

    return (
        <DashboardLayout roleName={userRole} navItems={getNavItems()}>
            <div className="topbar">
                <h2>{t('page.productsManagement')}</h2>
                <div className="topbar-right">
                    <span>{products.length} {t('page.products')}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div
                        className={`stat-card ${activeFilter === null ? 'active' : ''}`}
                        onClick={() => handleFilterClick(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📦</div>
                        <div className="stat-value">{products.length}</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                    <div
                        className={`stat-card ${activeFilter === 1 ? 'active' : ''}`}
                        onClick={() => handleFilterClick(1)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>🟢</div>
                        <div className="stat-value">{products.filter(p => p.inStockStatus === 1).length}</div>
                        <div className="stat-label">{t('stat.inStock')}</div>
                    </div>
                    <div
                        className={`stat-card ${activeFilter === 2 ? 'active' : ''}`}
                        onClick={() => handleFilterClick(2)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>🟡</div>
                        <div className="stat-value">{products.filter(p => p.inStockStatus === 2).length}</div>
                        <div className="stat-label">{t('stat.almostOut')}</div>
                    </div>
                    <div
                        className={`stat-card ${activeFilter === 0 ? 'active' : ''}`}
                        onClick={() => handleFilterClick(0)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔴</div>
                        <div className="stat-value">{products.filter(p => p.inStockStatus === 0).length}</div>
                        <div className="stat-label">{t('stat.outOfStock')}</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={t('page.searchByCode')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {canEdit && (
                            <button className="btn-add" onClick={openCreateModal}>
                                <span>➕</span> {t('button.addProduct')}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="table-loading">{t('page.loadingProducts')}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('table.productCode')}</th>
                                        <th>{t('table.productName')}</th>
                                        <th>{t('table.category')}</th>
                                        <th>{t('table.unit')}</th>
                                        <th>{t('table.price')}</th>
                                        <th>{t('table.inStock')}</th>
                                        <th>{t('table.minStock')}</th>
                                        <th>{t('table.provider')}</th>
                                        <th>{t('table.stockStatus')}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="table-empty">{t('page.noProductsFound')}</td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {product.productCode.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{product.productCode}</span>
                                                    </div>
                                                </td>
                                                <td>{product.productName || 'N/A'}</td>
                                                <td><span className="category-tag">{product.category}</span></td>
                                                <td>{product.unit}</td>
                                                <td className="td-price">{formatPrice(product.price)}</td>
                                                <td className="td-number">{product.inStock}</td>
                                                <td className="td-number">{product.minInStock}</td>
                                                <td>{product.providerName}</td>
                                                <td>{getStockBadge(product.inStockStatus, product.inStockStatusText)}</td>
                                                <td>
                                                    {canEdit && (
                                                        <div className="action-btns">
                                                            <button className="btn-edit" onClick={() => openEditModal(product)} title="Edit">✏️</button>
                                                            <button className="btn-delete" onClick={() => setDeleteConfirm(product)} title="Delete">🗑️</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <ProductModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditProduct(null); }}
                onSave={editProduct ? handleUpdate : handleCreate}
                providers={providers}
                editProduct={editProduct}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{t('modal.deleteProduct')}</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                {t('modal.deleteProductConfirm')}
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</button>
                            <button className="btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ProductsManagement;
