'use client';

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { DrawnShape, ApiData, LoadingState, FilterOptions, PaginationOptions } from '../types';
import { fetchDataWithCache } from '../services/api-cache';
import { exportData } from '../utils/export';
import { apiCacheService } from '../services/api-cache';
import useClickOutside from '../hooks/useClickOutside';

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

interface DataVisualizationProps {
  shape: DrawnShape;
}

const DataVisualization = ({ shape }: DataVisualizationProps) => {
  const [data, setData] = useState<ApiData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'value',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    limit: 10,
    total: 0
  });
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'line'>('pie');
  const [cacheStats, setCacheStats] = useState({ size: 0, maxSize: 0, duration: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Fermer le menu d'exportation lorsqu'on clique en dehors
  useClickOutside(exportMenuRef, () => setShowExportMenu(false));
  
  // Récupérer les données en fonction de la forme sélectionnée
  useEffect(() => {
    const fetchData = async () => {
      setLoadingState('loading');
      setError(null);
      
      try {
        const params = {
          bounds: shape.bounds,
          center: shape.center,
          radius: shape.radius,
          coordinates: shape.coordinates as [number, number][],
          filters,
          pagination: {
            page: pagination.page,
            limit: pagination.limit
          }
        };
        
        const response = await fetchDataWithCache(params);
        setData(response.data);
        setPagination(prev => ({ ...prev, total: response.total }));
        setLoadingState('success');
        
        // Mettre à jour les stats du cache
        setCacheStats(apiCacheService.getCacheStats());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        setLoadingState('error');
      }
    };
    
    if (shape) {
      fetchData();
    }
  }, [shape, filters, pagination.page, pagination.limit]);
  
  // Préparer les données pour le graphique en camembert (distribution par type)
  const generatePieChartData = () => {
    // Compter les occurrences de chaque type
    const typeCounts: Record<string, number> = {};
    data.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });
    
    // Générer des couleurs
    const colors = [
      'rgba(52, 152, 219, 0.6)', // bleu
      'rgba(231, 76, 60, 0.6)',  // rouge
      'rgba(46, 204, 113, 0.6)', // vert
      'rgba(155, 89, 182, 0.6)', // violet
      'rgba(241, 196, 15, 0.6)', // jaune
    ];
    
    return {
      labels: Object.keys(typeCounts).map(type => {
        const count = typeCounts[type];
        const percentage = Math.round((count / data.length) * 100);
        return `${type} (${percentage}%)`;
      }),
      datasets: [
        {
          label: 'Distribution par type',
          data: Object.values(typeCounts),
          backgroundColor: Object.keys(typeCounts).map((_, index) => colors[index % colors.length]),
          borderColor: Object.keys(typeCounts).map((_, index) => colors[index % colors.length].replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Générer données pour le graphique à barres
  const generateBarChartData = () => {
    // Regrouper par type et calculer la valeur moyenne
    const typeValues: Record<string, { sum: number, count: number }> = {};
    data.forEach(item => {
      if (!typeValues[item.type]) {
        typeValues[item.type] = { sum: 0, count: 0 };
      }
      typeValues[item.type].sum += item.value;
      typeValues[item.type].count += 1;
    });
    
    const types = Object.keys(typeValues);
    const averages = types.map(type => typeValues[type].sum / typeValues[type].count);
    
    return {
      labels: types,
      datasets: [
        {
          label: 'Valeur moyenne par type',
          data: averages,
          backgroundColor: 'rgba(52, 152, 219, 0.6)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Générer données pour le graphique en ligne
  const generateLineChartData = () => {
    // Trier les données par valeur et prendre les 15 premiers éléments
    const sortedData = [...data]
      .sort((a, b) => a.value - b.value)
      .slice(0, 15);
    
    return {
      labels: sortedData.map(item => item.name.substring(0, 15) + (item.name.length > 15 ? '...' : '')),
      datasets: [
        {
          label: 'Progression des valeurs',
          data: sortedData.map(item => item.value),
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };
  
  // Options de graphique communes
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Analyse des données',
        font: {
          size: 16
        }
      },
    },
  };
  
  // Gérer le changement de filtre
  const handleFilterChange = (key: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Revenir à la première page
  };
  
  // Gérer le changement de page
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  // Gérer l'exportation des données
  const handleExport = (format: 'csv' | 'json' | 'geojson') => {
    // Récupérer toutes les données (pas juste la page courante)
    const fetchAllData = async () => {
      setLoadingState('loading');
      
      try {
        const params = {
          bounds: shape.bounds,
          center: shape.center,
          radius: shape.radius,
          coordinates: shape.coordinates as [number, number][],
          filters,
          // Pas de pagination pour obtenir toutes les données
        };
        
        const response = await fetchDataWithCache(params);
        exportData(response.data, format);
        setLoadingState('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'exportation');
        setLoadingState('error');
      }
    };
    
    fetchAllData();
  };
  
  // Vider le cache de l'API
  const handleClearCache = () => {
    apiCacheService.clearCache();
    setCacheStats(apiCacheService.getCacheStats());
    // Rafraîchir les données
    const currentPage = pagination.page;
    setPagination(prev => ({ ...prev, page: 0 }));
    setTimeout(() => setPagination(prev => ({ ...prev, page: currentPage })), 10);
  };
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  // Afficher l'indicateur de chargement
  if (loadingState === 'loading') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin-slow h-12 w-12 text-primary-500 mb-4">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="text-gray-600 dark:text-gray-300 text-lg">Chargement des données...</div>
        </div>
      </div>
    );
  }
  
  // Afficher le message d'erreur
  if (loadingState === 'error') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong className="font-medium">Erreur:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher un message si aucune donnée n'est disponible
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="empty-data-message">
          <svg className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-1">La zone sélectionnée ne contient aucun point d&apos;intérêt.</p>
          <p className="text-gray-500 dark:text-gray-400">Essayez de sélectionner une autre zone ou d&apos;agrandir la zone actuelle.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-0">
          Données pour la zone sélectionnée ({pagination.total} points)
        </h2>
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex gap-2 mb-2 sm:mb-0">
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1 text-sm rounded ${
                activeView === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="Affichage en tableau"
            >
              Tableau
            </button>
            <button
              onClick={() => setActiveView('chart')}
              className={`px-3 py-1 text-sm rounded ${
                activeView === 'chart'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="Affichage en graphique"
            >
              Graphique
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Cache: {cacheStats.size}/{cacheStats.maxSize}
            </span>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300"
              aria-label="Vider le cache"
            >
              Vider cache
            </button>
            <div className="dropdown relative">
              <button
                className="px-3 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 flex items-center"
                aria-expanded={showExportMenu}
                aria-haspopup="true"
                aria-label="Exporter les données"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Exporter
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <div ref={exportMenuRef} className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 shadow-lg rounded-md overflow-hidden z-10 py-1">
                  <button 
                    onClick={() => {
                      handleExport('csv');
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Exporter en CSV
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('json');
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Exporter en JSON
                  </button>
                  <button 
                    onClick={() => {
                      handleExport('geojson');
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Exporter en GeoJSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trier par:
          </label>
          <select
            value={filters.sortBy as string}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as keyof ApiData)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
          >
            <option value="name">Nom</option>
            <option value="value">Valeur</option>
            <option value="type">Type</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ordre:
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
          >
            <option value="asc">Ascendant</option>
            <option value="desc">Descendant</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type:
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
          >
            <option value="">Tous</option>
            <option value="restaurant">Restaurant</option>
            <option value="hospital">Hôpital</option>
            <option value="school">École</option>
            <option value="park">Parc</option>
            <option value="store">Magasin</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Éléments par page:
          </label>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({ 
              ...prev, 
              limit: parseInt(e.target.value), 
              page: 1 
            }))}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      
      {activeView === 'table' ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coordonnées</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.length > 0 ? data.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.coordinates[0].toFixed(4)}, {item.coordinates[1].toFixed(4)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucune donnée trouvée pour cette zone.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-1 mt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded text-sm ${
                  pagination.page === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-gray-500' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Précédent
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                      pagination.page === pageNumber
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 5 && <span className="text-gray-500 dark:text-gray-400">...</span>}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  pagination.page === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-gray-500' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
          {/* Sélecteur de type de graphique */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border border-gray-200 dark:border-gray-600 ${
                  activeChart === 'pie'
                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
                onClick={() => setActiveChart('pie')}
              >
                Camembert
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-200 dark:border-gray-600 ${
                  activeChart === 'bar'
                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
                onClick={() => setActiveChart('bar')}
              >
                Barres
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border border-gray-200 dark:border-gray-600 ${
                  activeChart === 'line'
                    ? 'bg-primary-600 text-white border-primary-600 dark:border-primary-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
                onClick={() => setActiveChart('line')}
              >
                Ligne
              </button>
            </div>
          </div>
          
          <div className="h-96 mt-4">
            {activeChart === 'pie' && (
              <Pie data={generatePieChartData()} options={chartOptions} />
            )}
            
            {activeChart === 'bar' && (
              <Bar 
                data={generateBarChartData()} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Valeur moyenne par type'
                    }
                  }
                }} 
              />
            )}
            
            {activeChart === 'line' && (
              <Line 
                data={generateLineChartData()} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Progression des valeurs'
                    }
                  }
                }} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;