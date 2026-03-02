import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import { approvalLogService } from '../services/approval-log-service';
import type { ApprovalLogDto } from '../services/approval-log-service';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ApprovalLogPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = authService.getUser();
    const userRole = currentUser?.role || '';
    const [logs, setLogs] = useState<ApprovalLogDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateError, setDateError] = useState('');
    const [appliedFromDate, setAppliedFromDate] = useState('');
    const [appliedToDate, setAppliedToDate] = useState('');

    const getNavItems = () => {
        if (userRole === 'Admin') {
            return [
                { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/admin') },
                { icon: '👥', label: t('nav.usersManagement'), onClick: () => navigate('/admin/users') },
                { icon: '🏢', label: t('nav.departmentsManagement'), onClick: () => navigate('/admin/departments') },
                { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/admin/providers') },
                { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/admin/products') },
                { icon: '⚙️', label: t('nav.approvalConfiguration'), onClick: () => navigate('/admin/approval-configs') },
                { icon: '📝', label: t('nav.approvalLog'), active: true },
                { icon: '🔐', label: t('nav.loginTracking'), onClick: () => navigate('/admin/login-logs') },
            ];
        }
        // Approver
        return [
            { icon: '📊', label: t('nav.dashboard'), onClick: () => navigate('/dashboard/approver') },
            { icon: '📋', label: t('nav.pendingApprovals'), onClick: () => navigate('/approver/pending-reviews') },
            { icon: '✅', label: t('nav.approved'), onClick: () => navigate('/approver/approved-requests') },
            { icon: '❌', label: t('nav.rejected'), onClick: () => navigate('/approver/rejected-requests') },
            { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/approver/providers') },
            { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/approver/products') },
            { icon: '📝', label: t('nav.approvalLog'), active: true },
        ];
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await approvalLogService.getAll();
            setLogs(data.slice(0, 10)); // First 10 logs
        } catch (err) {
            console.error('Failed to fetch approval logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateDateRange = (from: string, to: string): boolean => {
        if (!from || !to) {
            setDateError('');
            return true;
        }

        const fromDateTime = new Date(from);
        const toDateTime = new Date(to);

        if (fromDateTime > toDateTime) {
            setDateError(t('validation.fromDateMustBeBeforeToDate') || 'From date must be before to date');
            return false;
        }

        // Calculate difference in months
        const monthsDiff = (toDateTime.getFullYear() - fromDateTime.getFullYear()) * 12 + 
                          (toDateTime.getMonth() - fromDateTime.getMonth());

        if (monthsDiff > 3) {
            setDateError(t('validation.dateRangeMax3Months') || 'Date range cannot exceed 3 months');
            return false;
        }

        setDateError('');
        return true;
    };

    const handleFromDateChange = (value: string) => {
        setFromDate(value);
        if (value && toDate) {
            validateDateRange(value, toDate);
        } else {
            setDateError('');
        }
    };

    const handleToDateChange = (value: string) => {
        setToDate(value);
        if (fromDate && value) {
            validateDateRange(fromDate, value);
        } else {
            setDateError('');
        }
    };

    const handleFilter = () => {
        if (!fromDate && !toDate) {
            setDateError(t('validation.selectDateRange') || 'Please select at least one date');
            return;
        }

        if (fromDate && toDate && !validateDateRange(fromDate, toDate)) {
            return;
        }

        setAppliedFromDate(fromDate);
        setAppliedToDate(toDate);
        setDateError('');
    };

    const handleReset = () => {
        setFromDate('');
        setToDate('');
        setAppliedFromDate('');
        setAppliedToDate('');
        setDateError('');
    };

    const filteredLogs = logs.filter((log) => {
        if (!appliedFromDate && !appliedToDate) return true;
        
        const logDate = new Date(log.logTime);
        
        if (appliedFromDate && !appliedToDate) {
            return logDate >= new Date(appliedFromDate);
        }
        
        if (!appliedFromDate && appliedToDate) {
            return logDate <= new Date(appliedToDate);
        }
        
        if (appliedFromDate && appliedToDate) {
            return logDate >= new Date(appliedFromDate) && logDate <= new Date(appliedToDate);
        }
        
        return true;
    });

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


    return (
        <DashboardLayout roleName={userRole} navItems={getNavItems()}>
            <div className="topbar">
                <h2>{t('page.approvalLog')}</h2>
                <div className="topbar-right">
                    <span>{t('page.latestLogs').replace('{{count}}', logs.length.toString())}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                {/* Date Filter */}
                <div className="content-card">
                    <div className="table-toolbar">
                        <div className="date-filter-group">
                            <div className="date-filter-inputs">
                                <label className="date-filter-label">
                                    {t('filter.fromDate') || 'From Date'}:
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={fromDate}
                                        onChange={(e) => handleFromDateChange(e.target.value)}
                                    />
                                </label>
                                <label className="date-filter-label">
                                    {t('filter.toDate') || 'To Date'}:
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={toDate}
                                        onChange={(e) => handleToDateChange(e.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="date-filter-actions">
                                <button 
                                    className="btn-filter" 
                                    onClick={handleFilter}
                                    disabled={!fromDate && !toDate}
                                >
                                    🔍 {t('common.filter')}
                                </button>
                                <button className="btn-reset" onClick={handleReset}>
                                    🔄 {t('common.reset')}
                                </button>
                            </div>
                        </div>
                    </div>
                    {dateError && (
                        <div style={{ 
                            margin: '0 1rem 1rem 1rem',
                            padding: '0.75rem', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.375rem',
                            color: '#ef4444',
                            fontSize: '0.875rem'
                        }}>
                            ⚠️ {dateError}
                        </div>
                    )}
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
                            {filteredLogs.map((log) => (
                                <li key={log.id} style={{
                                    padding: '0.875rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    background: log.action === 2
                                        ? 'rgba(34, 197, 94, 0.08)'
                                        : 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid ' + (log.action === 2
                                        ? 'rgba(34, 197, 94, 0.2)'
                                        : 'rgba(239, 68, 68, 0.2)'),
                                    borderLeft: '3px solid ' + (log.action === 2 ? '#22c55e' : '#ef4444'),
                                    fontSize: '0.95rem',
                                    color: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                }}>
                                    <span style={{ color: '#94a3b8' }}>{formatDateTime(log.logTime)}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{log.requestTitle}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#000000', fontWeight: 600 }}>{log.action === 2 ? '✅ Approved' : '❌ Rejected'}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{log.approverComment || '—'}</span>
                                    <span style={{ color: '#475569' }}>—</span>
                                    <span style={{ fontWeight: 600, color: '#000000' }}>{log.approverName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ApprovalLogPage;
