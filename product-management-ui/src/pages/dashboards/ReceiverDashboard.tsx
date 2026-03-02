import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const ReceiverDashboard: React.FC = () => {
    const user = authService.getUser();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '📋', label: t('nav.purchaseOrders'), onClick: () => navigate('/receiver/purchase-orders') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/receiver/products') },
    ];

    return (
        <DashboardLayout roleName="Receiver" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.receiverTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.receiverAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📦</div>
                        <div className="stat-value">4</div>
                        <div className="stat-label">{t('stat.expectedShipments')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">18</div>
                        <div className="stat-label">{t('stat.receivedThisMonth')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔄</div>
                        <div className="stat-value">1</div>
                        <div className="stat-label">{t('stat.pendingReturns')}</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>{t('dashboard.expectedDeliveries')}</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">PO #2045 — Laptop Dell XPS 15 (qty: 5)</span>
                        <span className="activity-time">{t('dashboard.time.today')}</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">PO #2042 — Office Supplies Bundle</span>
                        <span className="activity-time">Tomorrow</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">PO #2040 — Server Equipment (Delayed)</span>
                        <span className="activity-time">Feb 20</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReceiverDashboard;
