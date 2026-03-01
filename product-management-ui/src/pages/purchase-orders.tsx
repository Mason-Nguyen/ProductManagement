import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PurchaseOrderDetailModal from '../components/purchase-order-detail-modal';
import ImportProductsModal from '../components/import-products-modal';
import { purchaseOrderService } from '../services/purchase-order-service';
import type { PurchaseOrderDto } from '../services/purchase-order-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND, formatVNDCompact } from '../utils/formatters';

const PurchaseOrders: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const role = currentUser?.role || '';
    const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailOrder, setDetailOrder] = useState<PurchaseOrderDto | null>(null);
    const [importOrder, setImportOrder] = useState<PurchaseOrderDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeFromDate, setActiveFromDate] = useState('');
    const [activeToDate, setActiveToDate] = useState('');
    const [dateWarning, setDateWarning] = useState('');
    const [exportingExcel, setExportingExcel] = useState(false);

    // Calculate min date (3 months ago) and max date (today)
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d.toISOString().split('T')[0];
    })();

    const navItems = role === 'Requester' ? [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/requester') },
        { icon: '📝', label: 'My Requests', onClick: () => navigate('/requester/my-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/requester/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/requester/products') },
        { icon: '📋', label: 'Purchase Orders', active: true },
    ] : [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/receiver') },
        { icon: '📋', label: 'Purchase Orders', active: true },
        { icon: '📦', label: 'Incoming Shipments' },
        { icon: '✅', label: 'Received Items' },
        { icon: '🔄', label: 'Returns' },
        { icon: '📜', label: 'Receiving History' },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchaseOrderService.getAll();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch purchase orders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilter = () => {
        setDateWarning('');
        if (fromDate && fromDate < threeMonthsAgo) {
            setDateWarning('⚠️ From Date cannot be older than 3 months from today.');
            return;
        }
        if (toDate && toDate < threeMonthsAgo) {
            setDateWarning('⚠️ To Date cannot be older than 3 months from today.');
            return;
        }
        if (fromDate && toDate && fromDate > toDate) {
            setDateWarning('⚠️ From Date cannot be after To Date.');
            return;
        }
        setActiveFromDate(fromDate);
        setActiveToDate(toDate);
    };

    const handleReset = () => {
        setFromDate('');
        setToDate('');
        setActiveFromDate('');
        setActiveToDate('');
        setDateWarning('');
    };

    const handleExportExcel = async () => {
        if (filteredOrders.length === 0) return;

        try {
            setExportingExcel(true);
            const orderIds = filteredOrders.map(o => o.id);
            await purchaseOrderService.exportExcel(orderIds);
        } catch (err) {
            console.error('Failed to export Excel:', err);
            setDateWarning('⚠️ Failed to export Excel document.');
        } finally {
            setExportingExcel(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        // Text search
        if (searchTerm && !o.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        // Date range filter on modifiedDate
        if (activeFromDate || activeToDate) {
            const modified = o.modifiedDate.split('T')[0];
            if (activeFromDate && modified < activeFromDate) return false;
            if (activeToDate && modified > activeToDate) return false;
        }
        return true;
    });

    const getUrgentBadge = (urgent: number) => {
        if (urgent === 1) return <span className="urgent-badge">🔥 Urgent</span>;
        return <span className="normal-badge">Normal</span>;
    };

    const getStatusBadge = (status: number, statusText: string) => {
        const statusClass = status === 0 ? 'draft' : status === 1 ? 'waiting' : status === 2 ? 'approved' : 'cancelled';
        return <span className={`request-status-badge status-${statusClass}`}>{statusText}</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <DashboardLayout roleName={role} navItems={navItems}>
            <div className="topbar">
                <h2>Purchase Orders</h2>
                <div className="topbar-right">
                    <span>{orders.length} purchase orders</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📋</div>
                        <div className="stat-value">{filteredOrders.length}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔥</div>
                        <div className="stat-value">{filteredOrders.filter(o => o.urgent === 1).length}</div>
                        <div className="stat-label">Urgent</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>💰</div>
                        <div className="stat-value">{formatVNDCompact(filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0))}</div>
                        <div className="stat-label">Total Value</div>
                    </div>
                </div>

                {/* Toolbar + Table */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="date-filter-group">
                            <div className="date-filter-inputs">
                                <label className="date-filter-label">
                                    From:
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={fromDate}
                                        min={threeMonthsAgo}
                                        max={toDate || today}
                                        onChange={e => { setFromDate(e.target.value); setDateWarning(''); }}
                                    />
                                </label>
                                <label className="date-filter-label">
                                    To:
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={toDate}
                                        min={fromDate || threeMonthsAgo}
                                        max={today}
                                        onChange={e => { setToDate(e.target.value); setDateWarning(''); }}
                                    />
                                </label>
                            </div>
                            <div className="date-filter-actions">
                                <button className="btn-filter" onClick={handleFilter} disabled={!fromDate && !toDate}>
                                    🔍 Filter
                                </button>
                                <button className="btn-reset" onClick={handleReset}>
                                    🔄 Reset
                                </button>
                                <button
                                    className="btn-export"
                                    onClick={handleExportExcel}
                                    disabled={exportingExcel || filteredOrders.length === 0}
                                >
                                    {exportingExcel ? 'Exporting...' : '📊 Export Excel'}
                                </button>
                            </div>
                        </div>
                    </div>
                    {dateWarning && (
                        <div className="date-warning">
                            {dateWarning}
                        </div>
                    )}

                    {loading ? (
                        <div className="table-loading">Loading purchase orders...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Created By</th>
                                        <th>Reviewer</th>
                                        <th>Approver</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Total Price</th>
                                        <th>Created Date</th>
                                        <th>Modified Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="table-empty">No purchase orders found</td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr key={order.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                                                            {order.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{order.title}</span>
                                                    </div>
                                                </td>
                                                <td>{order.createdUserName}</td>
                                                <td>{order.reviewerName || '—'}</td>
                                                <td>{order.approverName || '—'}</td>
                                                <td>{getStatusBadge(order.status, order.statusText)}</td>
                                                <td>{getUrgentBadge(order.urgent)}</td>
                                                <td className="td-price">{formatVND(order.totalPrice)}</td>
                                                <td>{formatDate(order.createdDate)}</td>
                                                <td>{formatDate(order.modifiedDate)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-detail" onClick={() => setDetailOrder(order)} title="View Details">👁️</button>
                                                        {role === 'Receiver' && order.status === 1 && (
                                                            <button className="btn-detail" onClick={() => setImportOrder(order)} title="Import Products" style={{ color: '#6366f1' }}>📥</button>
                                                        )}
                                                    </div>
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

            {/* Purchase Order Detail Modal */}
            <PurchaseOrderDetailModal
                isOpen={!!detailOrder}
                onClose={() => { setDetailOrder(null); fetchData(); }}
                order={detailOrder}
                onStatusChange={fetchData}
            />

            {importOrder && (
                <ImportProductsModal
                    isOpen={!!importOrder}
                    onClose={() => { setImportOrder(null); fetchData(); }}
                    order={importOrder}
                    onImportSuccess={fetchData}
                />
            )}
        </DashboardLayout>
    );
};

export default PurchaseOrders;
