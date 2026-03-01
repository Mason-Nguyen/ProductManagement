import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();

    const navItems = [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '👥', label: 'Users Management', onClick: () => navigate('/admin/users') },
        { icon: '🏢', label: 'Departments Management', onClick: () => navigate('/admin/departments') },
        { icon: '🏭', label: 'Providers Management', onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: 'Products Management', onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: 'Approval Configuration', onClick: () => navigate('/admin/approval-configs') },
        { icon: '📝', label: 'Approval Log', onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: 'Login Tracking', onClick: () => navigate('/admin/login-logs') },
    ];

    return (
        <DashboardLayout roleName="Admin" navItems={navItems}>
            <div className="topbar">
                <h2>Admin Dashboard</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>Welcome back, {user?.username}! 👋</h3>
                    <p>You have full administrative access to manage the system.</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👥</div>
                        <div className="stat-value">24</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">156</div>
                        <div className="stat-label">Products</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">12</div>
                        <div className="stat-label">Pending Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>✅</div>
                        <div className="stat-value">89</div>
                        <div className="stat-label">Approved This Month</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>Recent Activity</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">New user registered: john@example.com</span>
                        <span className="activity-time">2 min ago</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">Purchase request #1042 approved</span>
                        <span className="activity-time">15 min ago</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">Product "Server Rack" updated</span>
                        <span className="activity-time">1 hour ago</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#8b5cf6' }}></div>
                        <span className="activity-text">Role "Purchaser" permissions updated</span>
                        <span className="activity-time">3 hours ago</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
