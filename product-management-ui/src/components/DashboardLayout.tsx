import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { notificationService } from '../services/notification-service';
import LanguageSwitcher from './LanguageSwitcher';

interface DashboardLayoutProps {
    children: React.ReactNode;
    roleName: string;
    navItems: { icon: string; label: string; active?: boolean; onClick?: () => void }[];
    notificationRefreshTrigger?: number;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, roleName, navItems, notificationRefreshTrigger }) => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await authService.logout();
        window.location.href = '/login';
    };

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const handleNotificationClick = () => {
        // Only navigate if there are pending requests
        if (notificationCount.normalCount > 0 || notificationCount.urgentCount > 0) {
            if (user?.role === 'Reviewer') {
                navigate('/reviewer/pending-reviews');
            } else if (user?.role === 'Approver') {
                navigate('/approver/pending-reviews');
            }
        }
    };

    const showNotificationIcon = user?.role === 'Reviewer' || user?.role === 'Approver';
    const [notificationCount, setNotificationCount] = useState({
        normalCount: 0,
        urgentCount: 0
    });
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        const fetchNotificationCount = async () => {
            if (!showNotificationIcon) return;

            try {
                setLoadingNotifications(true);
                const counts = await notificationService.getPendingCount();
                setNotificationCount(counts);
            } catch (error) {
                console.error('Failed to fetch notification count:', error);
                setNotificationCount({ normalCount: 0, urgentCount: 0 });
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotificationCount();
    }, [showNotificationIcon, notificationRefreshTrigger]);

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="app-name">ProductManagement</div>
                    <div className="header-actions">
                        <LanguageSwitcher />
                        <span className="role-badge">{roleName}</span>
                        {showNotificationIcon && (
                            <div
                                className={`notification-icon ${(notificationCount.normalCount > 0 || notificationCount.urgentCount > 0) ? 'has-notifications' : 'empty'}`}
                                onClick={handleNotificationClick}
                                title={(notificationCount.normalCount > 0 || notificationCount.urgentCount > 0) ? t('dashboard.notification.viewPending') : t('dashboard.notification.noPending')}
                            >
                                <span className="bell-icon">🔔</span>
                                {!loadingNotifications && (notificationCount.normalCount > 0 || notificationCount.urgentCount > 0) && (
                                    <div className="notification-badges">
                                        {notificationCount.normalCount > 0 && (
                                            <span className="notification-badge normal" title={t('dashboard.notification.normalRequests')}>
                                                {notificationCount.normalCount}
                                            </span>
                                        )}
                                        {notificationCount.urgentCount > 0 && (
                                            <span className="notification-badge urgent" title={t('dashboard.notification.urgentRequests')}>
                                                🔥 {notificationCount.urgentCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {loadingNotifications && (
                                    <span className="notification-badge loading">...</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, index) => (
                        <div
                            key={index}
                            className={`nav-item ${item.active ? 'active' : ''}`}
                            onClick={item.onClick}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {getInitials(user?.username || 'U')}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user?.username}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <span>🚪</span>
                        <span>{t('dashboard.logout')}</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
