import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const ReceiverDashboard: React.FC = () => {
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '📦', label: 'Incoming Shipments' },
        { icon: '✅', label: 'Received Items' },
        { icon: '🔄', label: 'Returns' },
        { icon: '📜', label: 'Receiving History' },
    ];

    return (
        <DashboardLayout roleName="Receiver" navItems={navItems}>
            <div className="topbar">
                <h2>Receiver Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>Track and manage incoming product shipments.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📦</div>
                        <div className="stat-value">4</div>
                        <div className="stat-label">Expected Shipments</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">18</div>
                        <div className="stat-label">Received This Month</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔄</div>
                        <div className="stat-value">1</div>
                        <div className="stat-label">Pending Returns</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>Expected Deliveries</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">PO #2045 — Laptop Dell XPS 15 (qty: 5)</span>
                        <span className="activity-time">Today</span>
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
