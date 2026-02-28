import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const RequesterDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '📝', label: 'My Requests', onClick: () => navigate('/requester/my-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/requester/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/requester/products') },
    ];

    return (
        <DashboardLayout roleName="Requester" navItems={navItems}>
            <div className="topbar">
                <h2>Requester Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>Create and track your product requests here.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📝</div>
                        <div className="stat-value">8</div>
                        <div className="stat-label">My Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>⏳</div>
                        <div className="stat-value">3</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">5</div>
                        <div className="stat-label">Approved</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>My Recent Requests</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1042 — Laptop Dell XPS 15 (Pending)</span>
                        <span className="activity-time">Today</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">Request #1038 — Office Supplies (Approved)</span>
                        <span className="activity-time">Yesterday</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">Request #1035 — Monitor 27" 4K (Approved)</span>
                        <span className="activity-time">3 days ago</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RequesterDashboard;
