import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const PurchaserDashboard: React.FC = () => {
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '🛒', label: 'Purchase Orders' },
        { icon: '📋', label: 'Approved Requests' },
        { icon: '🏢', label: 'Vendors' },
        { icon: '📜', label: 'Purchase History' },
    ];

    return (
        <DashboardLayout roleName="Purchaser" navItems={navItems}>
            <div className="topbar">
                <h2>Purchaser Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>Manage purchase orders and vendor relationships.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🛒</div>
                        <div className="stat-value">6</div>
                        <div className="stat-label">Active POs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">3</div>
                        <div className="stat-label">To Purchase</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>💰</div>
                        <div className="stat-value">$15K</div>
                        <div className="stat-label">Spent This Month</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🏢</div>
                        <div className="stat-value">12</div>
                        <div className="stat-label">Active Vendors</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>Approved & Ready to Purchase</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">Request #1042 — Laptop Dell XPS 15 ($1,500) — Approved</span>
                        <span className="activity-time">Create PO</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">Request #1039 — Network Switch ($890) — Approved</span>
                        <span className="activity-time">Create PO</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">PO #2045 — Sent to Dell Technologies</span>
                        <span className="activity-time">In Progress</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaserDashboard;
