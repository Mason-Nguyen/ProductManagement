import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';
import { productService } from '../../services/product-service';
import { purchaseOrderService } from '../../services/purchase-order-service';
import { purchaseProductOrderService } from '../../services/purchase-product-order-service';
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

const ReceiverDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    // Stat cards state
    const [totalOrders, setTotalOrders] = useState<number>(0);
    const [totalProducts, setTotalProducts] = useState<number>(0);

    // Charts state
    const [ordersChartData, setOrdersChartData] = useState<any>(null);
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
            const [productsResult, ordersResult] = 
                await Promise.allSettled([
                    productService.getAll(),
                    purchaseOrderService.getAll()
                ]);

            // Handle products count
            if (productsResult.status === 'fulfilled') {
                setTotalProducts(productsResult.value.length);
            } else {
                console.error('Failed to fetch products:', productsResult.reason);
                setTotalProducts(0);
            }

            // Handle orders count
            if (ordersResult.status === 'fulfilled') {
                setTotalOrders(ordersResult.value.length);
            } else {
                console.error('Failed to fetch orders:', ordersResult.reason);
                setTotalOrders(0);
            }

            // Process orders chart data (last 3 months) - ONLY DONE ORDERS (status = 3)
            if (ordersResult.status === 'fulfilled') {
                const doneOrders = ordersResult.value.filter(order => order.status === 2);

                const last3Months = getLast3Months();
                
                // Fetch products for each done order to calculate actual total
                const monthlyOrdersData = await Promise.all(
                    last3Months.map(async (monthInfo) => {
                        const monthOrders = doneOrders.filter(order => {
                            const orderDate = new Date(order.createdDate);
                            return orderDate.getFullYear() === monthInfo.year && 
                                   orderDate.getMonth() === monthInfo.month;
                        });

                        let expectedTotal = 0;
                        let actualTotal = 0;

                        // Expected total: price * quantityRequest
                        expectedTotal = monthOrders.reduce(
                            (sum, order) => sum + (order.expectedTotalPrice ?? 0),
                            0
                        );

                        // Calculate both expected and actual totals from order products
                        for (const order of monthOrders) {
                            try {
                                const orderProducts = await purchaseProductOrderService.getByOrderId(order.id);
                                
                                // Actual total: price * quantity (what was actually imported)
                                actualTotal += orderProducts.reduce(
                                    (sum, product) => sum + (product.price * product.quantity),
                                    0
                                );
                            } catch (error) {
                                console.error(`Failed to fetch products for order ${order.id}:`, error);
                            }
                        }

                        return {
                            label: monthInfo.label,
                            expectedTotal,
                            actualTotal
                        };
                    })
                );

                setOrdersChartData({
                    labels: monthlyOrdersData.map(d => d.label),
                    datasets: [
                        {
                            type: 'line' as const,
                            label: t('dashboard.expectedTotalPrice'),
                            data: monthlyOrdersData.map(d => d.expectedTotal),
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            type: 'bar' as const,
                            label: t('dashboard.actualTotalPrice'),
                            data: monthlyOrdersData.map(d => d.actualTotal),
                            backgroundColor: 'rgba(251, 146, 60, 0.7)',
                            borderColor: '#fb923c',
                            borderWidth: 1
                        }
                    ]
                });
            }

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
                    '#6366f1', '#22c55e', '#fb923c', '#8b5cf6',
                    '#ef4444', '#14b8a6', '#f59e0b', '#ec4899'
                ];

                if (productArray.length > 0) {
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
            }
        } catch (error) {
            console.error('Unexpected error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '📋', label: t('nav.purchaseOrders'), onClick: () => navigate('/receiver/purchase-orders') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/receiver/products') },
    ];

    // Mixed chart options
    const mixedChartOptions: ChartOptions<'bar' | 'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#e2e8f0',
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
                    color: '#94a3b8',
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
                    color: '#94a3b8'
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
        <DashboardLayout roleName="Receiver" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.receiverTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.receiverAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📋</div>
                        <div className="stat-value">{totalOrders}</div>
                        <div className="stat-label">{t('stat.totalOrders')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">{totalProducts}</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        {t('dashboard.loading')}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                            {/* Orders Chart Card */}
                            <div className="content-card">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                                    {t('dashboard.ordersTrends')}
                                </h4>
                                <div style={{ height: '300px' }}>
                                    {ordersChartData ? (
                                        <Chart type="bar" data={ordersChartData} options={mixedChartOptions} />
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ReceiverDashboard;
