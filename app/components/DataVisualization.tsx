'use client';

import { useState, useEffect, useCallback } from 'react';
import { DrawnShape, ApiData, LoadingState, FilterOptions, PaginationOptions } from '../types';
import { fetchDataWithCache, apiCacheService } from '../services/api-cache';
import { exportData } from '../utils/export';

// Sous-composants
import DataTable from './DataTable';
import DataCharts from './DataCharts';
import FilterControls from './FilterControls';
import { ErrorMessage, EmptyState } from './LoadingStates';
import { DataVisualizationSkeleton } from './Skeleton';

interface DataVisualizationProps {
  shape: DrawnShape;
  filteredTypes: string[];
}

type ViewMode = 'table' | 'chart';
type ChartType = 'pie' | 'bar' | 'line';

const DataVisualization = ({ shape, filteredTypes }: DataVisualizationProps) => {
  // États principaux
  const [data, setData] = useState<ApiData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // États de filtrage et pagination
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'value',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    limit: 10,
    total: 0
  });

  // États d'affichage
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [activeChart, setActiveChart] = useState<ChartType>('pie');
  const [cacheStats, setCacheStats] = useState({ size: 0, maxSize: 0, duration: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Récupérer les données
  const fetchData = useCallback(async () => {
    setLoadingState('loading');
    setError(null);

    try {
      const params = {
        bounds: shape.bounds,
        center: shape.center,
        radius: shape.radius,
        coordinates: shape.coordinates as [number, number][],
        filters,
        // Ne pas paginer côté API, on le fera après le filtrage par type
      };

      const response = await fetchDataWithCache(params);

      // 1. D'abord filtrer par les types sélectionnés dans la légende
      const typeFilteredData = response.data.filter(item => filteredTypes.includes(item.type));

      // 2. Puis appliquer la pagination côté client
      const startIndex = (pagination.page - 1) * pagination.limit;
      const paginatedData = typeFilteredData.slice(startIndex, startIndex + pagination.limit);

      setData(paginatedData);
      setPagination(prev => ({ ...prev, total: typeFilteredData.length }));
      setLoadingState('success');
      setCacheStats(apiCacheService.getCacheStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoadingState('error');
    }
  }, [shape, filters, pagination.page, pagination.limit, filteredTypes]);

  useEffect(() => {
    if (shape) {
      fetchData();
    }
  }, [shape, fetchData]);

  // Gestionnaires d'événements
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (newPage > 0 && newPage <= totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.total, pagination.limit]);

  const handlePaginationChange = useCallback((changes: Partial<PaginationOptions>) => {
    setPagination(prev => ({ ...prev, ...changes }));
  }, []);

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'geojson') => {
    setLoadingState('loading');

    try {
      const params = {
        bounds: shape.bounds,
        center: shape.center,
        radius: shape.radius,
        coordinates: shape.coordinates as [number, number][],
        filters,
      };

      const response = await fetchDataWithCache(params);
      exportData(response.data, format);
      setLoadingState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'exportation');
      setLoadingState('error');
    }
  }, [shape, filters]);

  const handleClearCache = useCallback(() => {
    apiCacheService.clearCache();
    setCacheStats(apiCacheService.getCacheStats());
    fetchData();
  }, [fetchData]);

  // États d'affichage conditionnels
  if (loadingState === 'loading') {
    return <DataVisualizationSkeleton />;
  }

  if (loadingState === 'error') {
    return <ErrorMessage error={error || 'Erreur inconnue'} onRetry={fetchData} />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 md:mb-0">
          📊 Données de la zone ({pagination.total} points)
        </h2>

        {/* Boutons de vue */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeView === 'table'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            aria-label="Affichage en tableau"
          >
            📋 Tableau
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeView === 'chart'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            aria-label="Affichage en graphique"
          >
            📈 Graphique
          </button>
        </div>
      </div>

      {/* Contrôles de filtrage */}
      <FilterControls
        filters={filters}
        pagination={pagination}
        cacheStats={cacheStats}
        showExportMenu={showExportMenu}
        onFilterChange={handleFilterChange}
        onPaginationChange={handlePaginationChange}
        onExport={handleExport}
        onClearCache={handleClearCache}
        onExportMenuToggle={setShowExportMenu}
      />

      {/* Contenu principal */}
      {activeView === 'table' ? (
        <DataTable
          data={data}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      ) : (
        <DataCharts
          data={data}
          activeChart={activeChart}
          onChartChange={setActiveChart}
        />
      )}
    </div>
  );
};

export default DataVisualization;