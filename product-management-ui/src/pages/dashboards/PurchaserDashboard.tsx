import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/DashboardLayout';
import { authService } from '../../services/authService';
import { productService } from '../../services/product-service';
import { providerService } from '../../services/provider-service';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

const PurchaserDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const { t } = useTranslation();

    // Stat cards state
    const [totalProducts, setTotalProducts] = useState<number>(0);
    const [totalProviders, setTotalProviders] = useState<number>(0);

    // Charts state
    const [donutChartData, setDonutChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [productsResult, providersResult] = 
                await Promise.allSettled([
                    productService.getAll(),
                    providerService.getAll()
                ]);

            // Handle products count
            if (productsResult.status === 'fulfilled') {
                setTotalProducts(productsResult.value.length);

                // Process donut chart data - group by product name & code, sum inStock
                const products = productsResult.value;
                
                // Group products by name and code, sum inStock quantities
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

                // Convert to array and sort by inStock, take top 8
                const productArray = Array.from(productMap.values())
                    .sort((a, b) => b.inStock - a.inStock)
                    .slice(0, 8);

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
        } catch (error) {
            console.error('Unexpected error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const navItems = [
        { icon: '📊', label: t('nav.dashboard'), active: true },
        { icon: '🏭', label: t('nav.providersManagement'), onClick: () => navigate('/purchaser/providers') },
        { icon: '📦', label: t('nav.productsManagement'), onClick: () => navigate('/purchaser/products') },
    ];

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
                        return `${label}: ${value} (${unit})`;
                    }
                }
            }
        }
    };

    return (
        <DashboardLayout roleName="Purchaser" navItems={navItems}>
            <div className="topbar">
                <h2>{t('dashboard.purchaserTitle')}</h2>
                <div className="topbar-right">
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="dashboard-content fade-in">
                <div className="welcome-card">
                    <h3>{t('dashboard.welcomeBack', { username: user?.username })} 👋</h3>
                    <p>{t('dashboard.purchaserAccess')}</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>📦</div>
                        <div className="stat-value">{totalProducts}</div>
                        <div className="stat-label">{t('stat.totalProducts')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>🏭</div>
                        <div className="stat-value">{totalProviders}</div>
                        <div className="stat-label">{t('stat.totalProviders')}</div>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        {t('dashboard.loading')}
                    </div>
                ) : (
                    <div style={{ marginTop: '1.5rem' }}>
                        {/* Donut Chart Card */}
                        <div className="content-card">
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>🍩</span>
                                {t('dashboard.productsDistribution')}
                            </h4>
                            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {donutChartData && donutChartData.labels.length > 0 ? (
                                    <Doughnut data={donutChartData} options={donutChartOptions} />
                                ) : (
                                    <div style={{ color: '#94a3b8' }}>
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

export default PurchaserDashboard;
