import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';
import { userService } from '../../services/user-service';
import { productService } from '../../services/product-service';
import { providerService } from '../../services/provider-service';
import { departmentService } from '../../services/department-service';
import { loginLogService, type LoginLogDto } from '../../services/login-log-service';
import { approvalLogService, type ApprovalLogDto } from '../../services/approval-log-service';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    // State management for stat card counts
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [totalProviders, setTotalProviders] = useState<number>(0);
    const [totalDepartments, setTotalDepartments] = useState<number>(0);
    
    // State management for log cards
    const [recentLoginLogs, setRecentLoginLogs] = useState<LoginLogDto[]>([]);
    const [recentApprovalLogs, setRecentApprovalLogs] = useState<ApprovalLogDto[]>([]);
    const [loginLogsLoading, setLoginLogsLoading] = useState<boolean>(true);
    const [approvalLogsLoading, setApprovalLogsLoading] = useState<boolean>(true);

    // Fetch dashboard data from all services in parallel
    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch all data concurrently using Promise.allSettled for independent error handling
            const [usersResult, productsResult, providersResult, departmentsResult, loginLogsResult, approvalLogsResult] = await Promise.allSettled([
                userService.getAll(),
                productService.getAll(),
                providerService.getAll(),
                departmentService.getAll(),
                loginLogService.getRecent(),
                approvalLogService.getAll()
            ]);

            // Handle users count
            if (usersResult.status === 'fulfilled') {
                setTotalUsers(usersResult.value.length);
            } else {
                console.error('Failed to fetch users:', usersResult.reason);
                setTotalUsers(0);
            }

            // Handle unique products count by ProductCode
            if (productsResult.status === 'fulfilled') {
                const uniqueProductCodes = new Set(productsResult.value.map(p => p.productCode)).size;
                setTotalProducts(uniqueProductCodes);
            } else {
                console.error('Failed to fetch products:', productsResult.reason);
                setTotalProducts(0);
            }

            // Handle providers count
            if (providersResult.status === 'fulfilled') {
                setTotalProviders(providersResult.value.length);
            } else {
                console.error('Failed to fetch providers:', providersResult.reason);
                setTotalProviders(0);
            }

            // Handle departments count
            if (departmentsResult.status === 'fulfilled') {
                setTotalDepartments(departmentsResult.value.length);
            } else {
                console.error('Failed to fetch departments:', departmentsResult.reason);
                setTotalDepartments(0);
            }

            // Handle login logs
            if (loginLogsResult.status === 'fulfilled') {
                setRecentLoginLogs(loginLogsResult.value.slice(0, 5));
            } else {
                console.error('Failed to fetch login logs:', loginLogsResult.reason);
                setRecentLoginLogs([]);
            }
            setLoginLogsLoading(false);

            // Handle approval logs
            if (approvalLogsResult.status === 'fulfilled') {
                setRecentApprovalLogs(approvalLogsResult.value.slice(0, 5));
            } else {
                console.error('Failed to fetch approval logs:', approvalLogsResult.reason);
                setRecentApprovalLogs([]);
            }
            setApprovalLogsLoading(false);
        } catch (error) {
            console.error('Unexpected error fetching dashboard data:', error);
            setLoginLogsLoading(false);
            setApprovalLogsLoading(false);
        }
    }, []);

    // Trigger data fetch on component mount
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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
                        <div className="stat-value">{totalUsers}</div>
                        <div className="stat-label">{t('stat.totalUsers')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">{totalProducts}</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>🏭</div>
                        <div className="stat-value">{totalProviders}</div>
                        <div className="stat-label">{t('stat.totalProviders')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>🏢</div>
                        <div className="stat-value">{totalDepartments}</div>
                        <div className="stat-label">{t('stat.totalDepartments')}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                    {/* Login Logs Card */}
                    <div className="content-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <span style={{ fontSize: '1.25rem' }}>🔐</span>
                                {t('dashboard.recentLoginLogs')}
                            </h4>
                            <button 
                                onClick={() => navigate('/admin/login-logs')}
                                style={{
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                            >
                                {t('dashboard.viewAll')} →
                            </button>
                        </div>
                        {loginLogsLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                {t('dashboard.loading')}
                            </div>
                        ) : recentLoginLogs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                📭 {t('dashboard.noRecentLogs')}
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {recentLoginLogs.map((log) => (
                                    <li key={log.id} style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        background: log.action === 1 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid ' + (log.action === 1 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                                        borderLeft: '3px solid ' + (log.action === 1 ? '#22c55e' : '#ef4444'),
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, color: '#000000' }}>{log.userName}</span>
                                            <span style={{ color: '#475569' }}>—</span>
                                            <span style={{ color: '#000000', fontWeight: 600 }}>
                                                {log.action === 1 ? '🟢 Login' : '🔴 Logout'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                            <span>{new Date(log.actionTime).toLocaleString('vi-VN', { 
                                                month: '2-digit', 
                                                day: '2-digit', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}</span>
                                            <span>•</span>
                                            <span style={{ fontFamily: 'monospace' }}>{log.ipAddress}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Approval Logs Card */}
                    <div className="content-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <span style={{ fontSize: '1.25rem' }}>✅</span>
                                {t('dashboard.recentApprovalLogs')}
                            </h4>
                            <button 
                                onClick={() => navigate('/admin/approval-logs')}
                                style={{
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    color: '#22c55e',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
                            >
                                {t('dashboard.viewAll')} →
                            </button>
                        </div>
                        {approvalLogsLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                {t('dashboard.loading')}
                            </div>
                        ) : recentApprovalLogs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                📭 {t('dashboard.noRecentLogs')}
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {recentApprovalLogs.map((log) => (
                                    <li key={log.id} style={{
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        background: log.action === 2 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid ' + (log.action === 2 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                                        borderLeft: '3px solid ' + (log.action === 2 ? '#22c55e' : '#ef4444'),
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, color: '#000000' }}>{log.requestTitle}</span>
                                            <span style={{ color: '#475569' }}>—</span>
                                            <span style={{ color: '#000000', fontWeight: 600 }}>
                                                {log.action === 2 ? '✅ Approved' : '❌ Rejected'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                            <span>{new Date(log.logTime).toLocaleString('vi-VN', { 
                                                month: '2-digit', 
                                                day: '2-digit', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}</span>
                                            <span>•</span>
                                            <span>{log.approverName}</span>
                                            {log.approverComment && (
                                                <>
                                                    <span>•</span>
                                                    <span style={{ fontStyle: 'italic' }}>
                                                        {log.approverComment.length > 30 
                                                            ? log.approverComment.substring(0, 30) + '...' 
                                                            : log.approverComment}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
