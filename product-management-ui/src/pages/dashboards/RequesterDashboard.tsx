import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';
import { productService } from '../../services/product-service';
import { providerService } from '../../services/provider-service';
import { purchaseRequestService } from '../../services/purchase-request-service';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    type ChartOptions
} from 'chart.js';
import { Doughnut, Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title
);

const RequesterDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    // Stat cards state
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [totalProviders, setTotalProviders] = useState<number>(0);
    const [totalRequests, setTotalRequests] = useState<number>(0);
    const [pendingReview, setPendingReview] = useState<number>(0);

    // Charts state
    const [mixedChartData, setMixedChartData] = useState<any>(null);
    const [donutChartData, setDonutChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Helper function to get last 3 months
    const getLast3Months = () => {
        const months = [];
        const now = new Date();
        for (let i = 2; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
        }
        return months;
    };

    // Helper function to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [productsResult, providersResult, requestsResult] = await Promise.allSettled([
                productService.getAll(),
                providerService.getAll(),
                purchaseRequestService.getAll()
            ]);

            // Handle products count
            if (productsResult.status === 'fulfilled') {
                const uniqueProducts = new Set(productsResult.value.map(p => p.productCode)).size;
                setTotalProducts(uniqueProducts);
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

            // Handle requests data
            if (requestsResult.status === 'fulfilled') {
                const userRequests = requestsResult.value.filter(
                    req => req.createdUserName === user?.username
                );
                
                setTotalRequests(userRequests.length);
                
                // Count pending review (status 2 = WaitingForReview)
                const pendingCount = userRequests.filter(req => req.status === 2).length;
                setPendingReview(pendingCount);

                // Process mixed chart data (last 3 months)
                const last3Months = getLast3Months();
                const monthlyData = last3Months.map(monthInfo => {
                    const monthRequests = userRequests.filter(req => {
                        const reqDate = new Date(req.createdDate);
                        return reqDate.getFullYear() === monthInfo.year && 
                               reqDate.getMonth() === monthInfo.month;
                    });

                    const expectedTotal = monthRequests.reduce(
                        (sum, req) => sum + (req.expectedTotalPrice ?? 0), 
                        0
                    );
                    const actualTotal = monthRequests.reduce(
                        (sum, req) => sum + req.totalPrice, 
                        0
                    );

                    return {
                        label: monthInfo.label,
                        expectedTotal,
                        actualTotal
                    };
                });

                setMixedChartData({
                    labels: monthlyData.map(d => d.label),
                    datasets: [
                        {
                            type: 'line' as const,
                            label: t('dashboard.expectedTotalPrice'),
                            data: monthlyData.map(d => d.expectedTotal),
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            type: 'bar' as const,
                            label: t('dashboard.actualTotalPrice'),
                            data: monthlyData.map(d => d.actualTotal),
                            backgroundColor: 'rgba(34, 197, 94, 0.7)',
                            borderColor: '#22c55e',
                            borderWidth: 1
                        }
                    ]
                });

                // Process donut chart data - group by product name & code, sum inStock from product table
                if (productsResult.status === 'fulfilled') {
                    const products = productsResult.value;
                    const productMap = new Map<string, { name: string; code: string; inStock: number; unit: string }>();
                    
                    products.forEach(product => {
                        const key = `${product.productName || product.productCode}_${product.productCode}`;
                        const productName = product.productName || product.productCode;
                        
                        if (productMap.has(key)) {
                            const existing = productMap.get(key)!;
                            existing.inStock += product.inStock;
                        } else {
                            productMap.set(key, {
                                name: productName,
                                code: product.productCode,
                                inStock: product.inStock,
                                unit: product.unit
                            });
                        }
                    });

                    const productArray = Array.from(productMap.values())
                        .sort((a, b) => b.inStock - a.inStock)
                        .slice(0, 8); // Top 8 products

                    const colors = [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
                    ];

                    setDonutChartData({
                        labels: productArray.map(p => `${p.name} (${p.code})`),
                        datasets: [{
                            data: productArray.map(p => p.inStock),
                            backgroundColor: colors.slice(0, productArray.length),
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            // Store unit information for tooltip
                            units: productArray.map(p => p.unit)
                        }]
                    });
                }
            } else {
                console.error('Failed to fetch requests:', requestsResult.reason);
                setTotalRequests(0);
                setPendingReview(0);
            }
        } catch (error) {
            console.error('Unexpected error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.username, t]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '📝', label: t('nav.myRequests'), onClick: () => navigate('/requester/my-requests') },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/requester/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/requester/products') },
        { icon: '📋', label: t('nav.purchaseOrders'), onClick: () => navigate('/requester/purchase-orders') },
    ];

    // Mixed chart options
    const mixedChartOptions: ChartOptions<'bar' | 'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#64748b',
                    font: { size: 12 }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const value = formatCurrency(context.parsed.y ?? 0);
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#64748b',
                    callback: (value) => {
                        return new Intl.NumberFormat('vi-VN', {
                            notation: 'compact',
                            compactDisplay: 'short'
                        }).format(value as number);
                    }
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#64748b'
                },
                grid: {
                    color: 'rgba(148, 163, 184, 0.1)'
                }
            }
        }
    };

    // Donut chart options
    const donutChartOptions: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#64748b',
                    font: { size: 11 },
                    padding: 10,
                    boxWidth: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.parsed;
                        const dataset = context.dataset as any;
                        const unit = dataset.units?.[context.dataIndex] || '';
                        return `${label}: ${value} ${unit}`;
                    }
                }
            }
        }
    };

    return (
        <DashboardLayout roleName="Requester" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.requesterTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.requesterAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">{totalProducts}</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>⏳</div>
                        <div className="stat-value">{pendingReview}</div>
                        <div className="stat-label">{t('stat.pendingReview')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c' }}>🏭</div>
                        <div className="stat-value">{totalProviders}</div>
                        <div className="stat-label">{t('stat.totalProviders')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>📝</div>
                        <div className="stat-value">{totalRequests}</div>
                        <div className="stat-label">{t('stat.totalRequests')}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        {t('dashboard.loading')}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {/* Mixed Chart Card */}
                        <div className="content-card">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>📈</span>
                                {t('dashboard.requestsTrends')}
                            </h4>
                            <div style={{ height: '300px' }}>
                                {mixedChartData ? (
                                    <Chart type="bar" data={mixedChartData} options={mixedChartOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                        {t('dashboard.noData')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Donut Chart Card */}
                        <div className="content-card">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>🍩</span>
                                {t('dashboard.productsDistribution')}
                            </h4>
                            <div style={{ height: '300px' }}>
                                {donutChartData && donutChartData.labels.length > 0 ? (
                                    <Doughnut data={donutChartData} options={donutChartOptions} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                        {t('dashboard.noData')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RequesterDashboard;
