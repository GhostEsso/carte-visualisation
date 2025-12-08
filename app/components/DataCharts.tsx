'use client';

import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { ApiData } from '../types';

// Enregistrement des composants ChartJS nécessaires
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    PointElement,
    LineElement
);

// Couleurs pour les graphiques
const CHART_COLORS = [
    'rgba(52, 152, 219, 0.7)',   // bleu
    'rgba(231, 76, 60, 0.7)',    // rouge
    'rgba(46, 204, 113, 0.7)',   // vert
    'rgba(155, 89, 182, 0.7)',   // violet
    'rgba(241, 196, 15, 0.7)',   // jaune
    'rgba(230, 126, 34, 0.7)',   // orange
    'rgba(26, 188, 156, 0.7)',   // turquoise
    'rgba(52, 73, 94, 0.7)',     // gris foncé
    'rgba(149, 165, 166, 0.7)',  // gris clair
    'rgba(192, 57, 43, 0.7)',    // rouge foncé
];

type ChartType = 'pie' | 'bar' | 'line';

interface DataChartsProps {
    data: ApiData[];
    activeChart: ChartType;
    onChartChange: (chart: ChartType) => void;
}

const DataCharts = ({ data, activeChart, onChartChange }: DataChartsProps) => {
    // Générer données pour le graphique en camembert
    const pieChartData = useMemo(() => {
        const typeCounts: Record<string, number> = {};
        data.forEach(item => {
            typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        });

        const types = Object.keys(typeCounts);

        return {
            labels: types.map(type => {
                const count = typeCounts[type];
                const percentage = Math.round((count / data.length) * 100);
                return `${type} (${percentage}%)`;
            }),
            datasets: [{
                label: 'Distribution par type',
                data: Object.values(typeCounts),
                backgroundColor: types.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
                borderColor: types.map((_, index) => CHART_COLORS[index % CHART_COLORS.length].replace('0.7', '1')),
                borderWidth: 2,
            }],
        };
    }, [data]);

    // Générer données pour le graphique à barres
    const barChartData = useMemo(() => {
        const typeValues: Record<string, { sum: number; count: number }> = {};
        data.forEach(item => {
            if (!typeValues[item.type]) {
                typeValues[item.type] = { sum: 0, count: 0 };
            }
            typeValues[item.type].sum += item.value;
            typeValues[item.type].count += 1;
        });

        const types = Object.keys(typeValues);
        const averages = types.map(type => Math.round(typeValues[type].sum / typeValues[type].count));

        return {
            labels: types,
            datasets: [{
                label: 'Valeur moyenne par type',
                data: averages,
                backgroundColor: types.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
                borderColor: types.map((_, index) => CHART_COLORS[index % CHART_COLORS.length].replace('0.7', '1')),
                borderWidth: 2,
                borderRadius: 4,
            }],
        };
    }, [data]);

    // Générer données pour le graphique en ligne
    const lineChartData = useMemo(() => {
        const sortedData = [...data]
            .sort((a, b) => a.value - b.value)
            .slice(0, 15);

        return {
            labels: sortedData.map(item =>
                item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name
            ),
            datasets: [{
                label: 'Progression des valeurs',
                data: sortedData.map(item => item.value),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            }],
        };
    }, [data]);

    // Options communes pour les graphiques (optimisées pour les performances)
    const baseOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 400, // Animation plus rapide
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: {
                        size: 11,
                    },
                },
            },
            tooltip: {
                enabled: true,
                mode: 'index' as const,
                intersect: false,
            },
        },
        // Optimisation des performances
        elements: {
            point: {
                hitRadius: 10,
            },
        },
    }), []);

    const chartButtons: { type: ChartType; label: string; icon: string }[] = [
        { type: 'pie', label: 'Camembert', icon: '◐' },
        { type: 'bar', label: 'Barres', icon: '▮' },
        { type: 'line', label: 'Ligne', icon: '📈' },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            {/* Sélecteur de type de graphique */}
            <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-lg shadow-sm bg-gray-100 dark:bg-slate-700 p-1" role="group">
                    {chartButtons.map(({ type, label }) => (
                        <button
                            key={type}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeChart === type
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-600'
                                }`}
                            onClick={() => onChartChange(type)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zone du graphique */}
            <div className="h-96 mt-4">
                {activeChart === 'pie' && (
                    <Pie
                        data={pieChartData}
                        options={{
                            ...baseOptions,
                            plugins: {
                                ...baseOptions.plugins,
                                title: {
                                    display: true,
                                    text: 'Distribution par type de point d\'intérêt',
                                    font: { size: 16, weight: 'bold' as const },
                                    padding: { bottom: 20 },
                                },
                            },
                        }}
                    />
                )}

                {activeChart === 'bar' && (
                    <Bar
                        data={barChartData}
                        options={{
                            ...baseOptions,
                            plugins: {
                                ...baseOptions.plugins,
                                title: {
                                    display: true,
                                    text: 'Valeur moyenne par type',
                                    font: { size: 16, weight: 'bold' as const },
                                    padding: { bottom: 20 },
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)',
                                    },
                                },
                                x: {
                                    grid: {
                                        display: false,
                                    },
                                },
                            },
                        }}
                    />
                )}

                {activeChart === 'line' && (
                    <Line
                        data={lineChartData}
                        options={{
                            ...baseOptions,
                            plugins: {
                                ...baseOptions.plugins,
                                title: {
                                    display: true,
                                    text: 'Progression des valeurs (15 premiers)',
                                    font: { size: 16, weight: 'bold' as const },
                                    padding: { bottom: 20 },
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)',
                                    },
                                },
                                x: {
                                    grid: {
                                        display: false,
                                    },
                                    ticks: {
                                        maxRotation: 45,
                                        minRotation: 45,
                                    },
                                },
                            },
                        }}
                    />
                )}
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{data.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Points total</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {new Set(data.map(d => d.type)).size}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Types différents</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) : 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Valeur moyenne</div>
                </div>
            </div>
        </div>
    );
};

export default DataCharts;
