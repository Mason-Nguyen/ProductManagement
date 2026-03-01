import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { loginLogService } from '../services/login-log-service';
import type { LoginLogDto } from '../services/login-log-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const LoginLogPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    const [logs, setLogs] = useState<LoginLogDto[]>([]);
    const [loading, setLoading] = useState(true);

    const getNavItems = () => {
        return [
            { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/admin') },
            { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
            { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
            { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
            { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
            { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
            { icon: '📝', label: t('nav.approvalLog'), onClick: () => navigate('/admin/approval-logs') },
            { icon: '🔐', label: t('nav.loginTracking'), active: true },
        ];
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await loginLogService.getRecent();
            setLogs(data);
        } catch (err) {
            console.error('Failed to fetch login logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getActionLabel = (action: number) => {
        return action === 1 ? '🟢 Login' : action === 2 ? '🔴 Logout' : '❓ Unknown';
    };

    return (
        <DashboardLayout roleName={userRole} navItems={getNavItems()}>
            <div className="topbar">
                <h2>{t('page.loginTracking')}</h2>
                <div className="topbar-right">
                    <span>{t('page.latestLogs').replace('{{count}}', logs.length.toString())}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📋</div>
                        <div className="stat-value">{logs.length}</div>
                        <div className="stat-label">{t('stat.recentLogs')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>🟢</div>
                        <div className="stat-value">{logs.filter(l => l.action === 1).length}</div>
                        <div className="stat-label">{t('stat.logins')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🔴</div>
                        <div className="stat-value">{logs.filter(l => l.action === 2).length}</div>
                        <div className="stat-label">{t('stat.logouts')}</div>
                    </div>
                </div>

                {/* Text List */}
                <div className="content-card">
                    {loading ? (
                        <div className="table-loading">{t('page.loadingLogs')}</div>
                    ) : logs.length === 0 ? (
                        <div className="table-empty" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            {t('page.noLogsFound')}
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: '1rem 1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {logs.map((log) => (
                                <li key={log.id} style={{
                                    padding: '0.875rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    background: log.action === 1
                                        ? 'rgba(34, 197, 94, 0.08)'
                                        : 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid ' + (log.action === 1
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)'),
                                    borderLeft: '3px solid ' + (log.action === 1 ? '#22c55e' : '#ef4444'),
                                    fontSize: '0.95rem',
                                    color: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <span style={{ color: '#94a3b8' }}>{formatDateTime(log.actionTime)}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{log.userName}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span className="request-status-badge" style={{
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        color: '#818cf8',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.8rem',
                                    }}>{log.roleName}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ipAddress}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#000000', fontWeight: 600 }}>{getActionLabel(log.action)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LoginLogPage;
