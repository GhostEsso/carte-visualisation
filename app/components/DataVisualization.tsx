'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  // Toutes les données de la zone, triées (ni filtrées par type, ni paginées)
  const [data, setData] = useState<ApiData[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // États de filtrage et pagination
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'value',
    sortOrder: 'desc'
  });
  const [pageState, setPageState] = useState({ page: 1, limit: 10 });

  // États d'affichage
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const [activeChart, setActiveChart] = useState<ChartType>('pie');
  const [cacheStats, setCacheStats] = useState({ size: 0, maxSize: 0, duration: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Identifiant de la dernière requête : une réponse plus ancienne est ignorée
  const requestIdRef = useRef(0);

  // Récupérer les données (nouvelle zone ou nouveau tri)
  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoadingState('loading');
    setError(null);
    setPageState(prev => ({ ...prev, page: 1 }));

    try {
      const response = await fetchDataWithCache({
        bounds: shape.bounds,
        center: shape.center,
        radius: shape.radius,
        coordinates: shape.coordinates as [number, number][],
        filters,
        // Pas de pagination côté API : elle se fait après le filtrage par type
      });

      if (requestId !== requestIdRef.current) return;

      setData(response.data);
      setLoadingState('success');
      setCacheStats(apiCacheService.getCacheStats());
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoadingState('error');
    }
  }, [shape, filters]);

  useEffect(() => {
    if (shape) {
      fetchData();
    }
  }, [shape, fetchData]);

  // Données filtrées par les types de la légende : base des graphiques, de l'export et du total
  const typeFilteredData = useMemo(
    () => data.filter(item => filteredTypes.includes(item.type)),
    [data, filteredTypes]
  );

  // Pagination dérivée : la page est bornée, elle ne peut pas dépasser le total filtré
  const pagination = useMemo<PaginationOptions>(() => {
    const total = typeFilteredData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageState.limit));

    return { page: Math.min(pageState.page, totalPages), limit: pageState.limit, total };
  }, [typeFilteredData, pageState]);

  // Page courante du tableau
  const pageData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    return typeFilteredData.slice(startIndex, startIndex + pagination.limit);
  }, [typeFilteredData, pagination.page, pagination.limit]);

  // Gestionnaires d'événements
  const handleFilterChange = useCallback((key: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (newPage > 0 && newPage <= totalPages) {
      setPageState(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.total, pagination.limit]);

  const handlePaginationChange = useCallback((changes: Partial<PaginationOptions>) => {
    setPageState(prev => ({
      page: changes.page ?? prev.page,
      limit: changes.limit ?? prev.limit
    }));
  }, []);

  // Exporter ce qui est affiché : toute la zone, filtrée par les types de la légende
  const handleExport = useCallback((format: 'csv' | 'json' | 'geojson') => {
    exportData(typeFilteredData, format);
  }, [typeFilteredData]);

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

  if (typeFilteredData.length === 0) {
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
          data={pageData}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      ) : (
        <DataCharts
          data={typeFilteredData}
          activeChart={activeChart}
          onChartChange={setActiveChart}
        />
      )}
    </div>
  );
};

export default DataVisualization;