import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';

const ApproverDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '📋', label: t('nav.pendingApprovals'), onClick: () => navigate('/approver/pending-reviews') },
        { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/approver/approved-requests') },
        { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/approver/rejected-requests') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/approver/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/approver/products') },
        { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/approver/approval-logs') },
    ];

    return (
        <DashboardLayout roleName="Approver" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.approverTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.approverAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>📋</div>
                        <div className="stat-value">7</div>
                        <div className="stat-label">{t('stat.pendingApprovals')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
                        <div className="stat-value">45</div>
                        <div className="stat-label">{t('dashboard.approvedThisMonth')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>💰</div>
                        <div className="stat-value">$28K</div>
                        <div className="stat-label">{t('stat.totalApprovedValue')}</div>
                    </div>
                </div>

                <div className="content-card">
                    <h4>{t('dashboard.pendingYourApproval')}</h4>
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
