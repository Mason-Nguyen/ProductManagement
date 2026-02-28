import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const ReviewerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '🔍', label: 'Pending Reviews', onClick: () => navigate('/reviewer/pending-reviews') },
        { icon: '✅', label: 'Approved', onClick: () => navigate('/reviewer/approved-requests') },
        { icon: '❌', label: 'Rejected', onClick: () => navigate('/reviewer/rejected-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/reviewer/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/reviewer/products') },
    ];

    return (
        <DashboardLayout roleName="Reviewer" navItems={navItems}>
            <div className="topbar">
                <h2>Reviewer Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>You have requests waiting for your review.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>🔍</div>
                        <div className="stat-value">5</div>
                        <div className="stat-label">Pending Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">32</div>
                        <div className="stat-label">Reviewed This Month</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>❌</div>
                        <div className="stat-value">4</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>Awaiting Your Review</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1042 — Laptop Dell XPS 15 by john@email.com</span>
                        <span className="activity-time">2 hours ago</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1041 — Server Equipment by mike@email.com</span>
                        <span className="activity-time">5 hours ago</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1039 — Network Switch by sarah@email.com</span>
                        <span className="activity-time">1 day ago</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReviewerDashboard;
