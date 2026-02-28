import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const ApproverDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '📋', label: 'Pending Approvals', onClick: () => navigate('/approver/pending-reviews') },
        { icon: '✅', label: 'Approved', onClick: () => navigate('/approver/approved-requests') },
        { icon: '❌', label: 'Rejected', onClick: () => navigate('/approver/rejected-requests') },
        { icon: '🏢', label: 'Providers Management', onClick: () => navigate('/approver/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/approver/products') },
    ];

    return (
        <DashboardLayout roleName="Approver" navItems={navItems}>
            <div className="topbar">
                <h2>Approver Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>Requests are waiting for your final approval.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">7</div>
                        <div className="stat-label">Pending Approvals</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">45</div>
                        <div className="stat-label">Approved This Month</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>💰</div>
                        <div className="stat-value">$28K</div>
                        <div className="stat-label">Total Approved Value</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>Pending Your Approval</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1042 — Laptop Dell XPS 15 ($1,500)</span>
                        <span className="activity-time">Reviewed ✓</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1041 — Server Equipment ($4,200)</span>
                        <span className="activity-time">Reviewed ✓</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Request #1039 — Network Switch ($890)</span>
                        <span className="activity-time">Reviewed ✓</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ApproverDashboard;
