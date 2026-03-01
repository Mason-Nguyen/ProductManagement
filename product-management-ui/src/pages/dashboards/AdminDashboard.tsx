import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
        { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
        { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
        { icon: '�', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
        { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
    ];

    return (
        <DashboardLayout roleName="Admin" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.adminTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.adminAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👥</div>
                        <div className="stat-value">24</div>
                        <div className="stat-label">{t('stat.totalUsers')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">156</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">12</div>
                        <div className="stat-label">{t('stat.pendingRequests')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>✅</div>
                        <div className="stat-value">89</div>
                        <div className="stat-label">{t('dashboard.approvedThisMonth')}</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>{t('dashboard.recentActivity')}</h4>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#22c55e' }}></div>
                        <span className="activity-text">{t('dashboard.activity.newUser')}: john@example.com</span>
                        <span className="activity-time">{t('dashboard.time.minAgo', { count: 2 })}</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#6366f1' }}></div>
                        <span className="activity-text">{t('dashboard.activity.requestApproved')}: #1042</span>
                        <span className="activity-time">{t('dashboard.time.minAgo', { count: 15 })}</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#fb923c' }}></div>
                        <span className="activity-text">{t('dashboard.activity.productUpdated')}: "Server Rack"</span>
                        <span className="activity-time">{t('dashboard.time.hourAgo', { count: 1 })}</span>
                    </div>
                    <div className="activity-item">
                        <div className="activity-dot" style={{ background: '#8b5cf6' }}></div>
                        <span className="activity-text">{t('dashboard.activity.roleUpdated')}: "Purchaser"</span>
                        <span className="activity-time">{t('dashboard.time.hourAgo', { count: 3 })}</span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
