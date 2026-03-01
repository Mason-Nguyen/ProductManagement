import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PurchaseRequestModal from '../components/purchase-request-modal';
import RequestDetailModal from '../components/request-detail-modal';
import { purchaseRequestService } from '../services/purchase-request-service';
import type { PurchaseRequestDto, CreatePurchaseRequestDto, UpdatePurchaseRequestDto } from '../services/purchase-request-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatVND } from '../utils/formatters';

const MyRequests: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getUser();
    const [requests, setRequests] = useState<PurchaseRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRequest, setEditRequest] = useState<PurchaseRequestDto | null>(null);
    const [detailRequest, setDetailRequest] = useState<PurchaseRequestDto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<PurchaseRequestDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const navItems = [
        { icon: '📊', label: 'Dashboard', onClick: () => navigate('/dashboard/requester') },
        { icon: '📝', label: 'My Requests', active: true },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/requester/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/requester/products') },
        { icon: '📋', label: 'Purchase Orders', onClick: () => navigate('/requester/purchase-orders') },
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await purchaseRequestService.getAll();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: CreatePurchaseRequestDto | UpdatePurchaseRequestDto) => {
        await purchaseRequestService.create(data as CreatePurchaseRequestDto);
        await fetchData();
    };

    const handleUpdate = async (data: CreatePurchaseRequestDto | UpdatePurchaseRequestDto) => {
        if (!editRequest) return;
        await purchaseRequestService.update(editRequest.id, data as UpdatePurchaseRequestDto);
        await fetchData();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await purchaseRequestService.remove(deleteConfirm.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to delete request:', err);
        }
        setDeleteConfirm(null);
    };

    const handleSubmit = async (request: PurchaseRequestDto) => {
        try {
            await purchaseRequestService.submit(request.id);
            await fetchData();
        } catch (err) {
            console.error('Failed to submit request:', err);
            throw err;
        }
    };

    const openCreateModal = () => {
        setEditRequest(null);
        setModalOpen(true);
    };

    const openEditModal = (request: PurchaseRequestDto) => {
        setEditRequest(request);
        setModalOpen(true);
    };

    const isCreator = (request: PurchaseRequestDto) => {
        return currentUser?.username === request.createdUserName;
    };

    const filteredRequests = requests.filter(
        r => r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: number, text: string) => {
        const cls = status === 0 ? 'status-draft' : status === 1 ? 'status-waiting' : status === 2 ? 'status-approved' : status === 4 ? 'status-rejected' : 'status-cancelled';
        const icon = status === 0 ? '📝' : status === 1 ? '⏳' : status === 2 ? '✅' : status === 4 ? '❌' : '🚫';
        return <span className={`request-status-badge ${cls}`}>{icon} {text}</span>;
    };

    const getUrgentBadge = (urgent: number) => {
        if (urgent === 1) return <span className="urgent-badge">🔥 Urgent</span>;
        return <span className="normal-badge">Normal</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <DashboardLayout roleName="Requester" navItems={navItems}>
            <div className="topbar">
                <h2>My Requests</h2>
                <div className="topbar-right">
                    <span>{requests.length} total requests</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }}>📝</div>
                        <div className="stat-value">{requests.filter(r => r.status === 0).length}</div>
                        <div className="stat-label">Draft</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>⏳</div>
                        <div className="stat-value">{requests.filter(r => r.status === 1).length}</div>
                        <div className="stat-label">Waiting for Review</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">{requests.filter(r => r.status === 2).length}</div>
                        <div className="stat-label">Approved</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>❌</div>
                        <div className="stat-value">{requests.filter(r => r.status === 4).length}</div>
                        <div className="stat-label">Rejected</div>
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
                        <button className="btn-add" onClick={openCreateModal}>
                            <span>➕</span> New Request
                        </button>
                    </div>

                    {loading ? (
                        <div className="table-loading">Loading requests...</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Created By</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Products</th>
                                        <th>Total Price</th>
                                        <th>Created</th>
                                        <th>Modified</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="table-empty">No requests found</td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(request => (
                                            <tr key={request.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-cell-avatar" style={{ background: request.urgent === 1 ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {request.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{request.title}</span>
                                                    </div>
                                                </td>
                                                <td>{request.createdUserName}</td>
                                                <td>{getUrgentBadge(request.urgent)}</td>
                                                <td>{getStatusBadge(request.status, request.statusText)}</td>
                                                <td className="td-number">{request.products.length}</td>
                                                <td className="td-price">{formatVND(request.totalPrice)}</td>
                                                <td>{formatDate(request.createdDate)}</td>
                                                <td>{formatDate(request.modifiedDate)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="btn-detail" onClick={() => setDetailRequest(request)} title="View Details">👁️</button>
                                                        {isCreator(request) && request.status === 0 && (
                                                            <>
                                                                <button className="btn-edit" onClick={() => openEditModal(request)} title="Edit">✏️</button>
                                                                <button className="btn-delete" onClick={() => setDeleteConfirm(request)} title="Cancel">🗑️</button>
                                                            </>
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

            {/* Add/Edit Modal */}
            <PurchaseRequestModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditRequest(null); }}
                onSave={editRequest ? handleUpdate : handleCreate}
                editRequest={editRequest}
            />

            {/* Detail View Modal */}
            <RequestDetailModal
                isOpen={!!detailRequest}
                onClose={() => setDetailRequest(null)}
                request={detailRequest}
                onSubmit={handleSubmit}
                currentUser={currentUser}
            />

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cancel Request</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="confirm-text">
                                Are you sure you want to cancel <strong>{deleteConfirm.title}</strong>?
                            </p>
                            <p className="confirm-hint">This request will be marked as cancelled.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>No, Keep It</button>
                            <button className="btn-danger" onClick={handleDelete}>Yes, Cancel Request</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default MyRequests;
