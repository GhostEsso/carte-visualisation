'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { DrawnShape, ApiData, LoadingState, FilterOptions, PaginationOptions } from '../types';
import { fetchDataWithCache } from '../services/api-cache';
import { exportData } from '../utils/export';
import { apiCacheService } from '../services/api-cache';

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
      <div className="data-visualization">
        <div className="loading-indicator">Chargement des données...</div>
      </div>
    );
  }
  
  // Afficher le message d'erreur
  if (loadingState === 'error') {
    return (
      <div className="data-visualization">
        <div className="error-message">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="data-visualization">
      <div className="data-visualization-header">
        <h2>Données pour la zone sélectionnée ({pagination.total} points)</h2>
        <div className="controls-container">
          <button
            className={`control-button ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => setActiveView('table')}
            aria-label="Afficher en tableau"
          >
            Tableau
          </button>
          <button
            className={`control-button ${activeView === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveView('chart')}
            aria-label="Afficher en graphique"
          >
            Graphiques
          </button>
        </div>
      </div>
      
      <div className="filters">
        <label>
          Trier par:
          <select
            value={filters.sortBy as string}
            onChange={(e) => handleFilterChange('sortBy', e.target.value as keyof ApiData)}
          >
            <option value="name">Nom</option>
            <option value="value">Valeur</option>
            <option value="type">Type</option>
          </select>
        </label>
        
        <label>
          Ordre:
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascendant</option>
            <option value="desc">Descendant</option>
          </select>
        </label>
        
        <label>
          Type:
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
          >
            <option value="">Tous</option>
            <option value="restaurant">Restaurant</option>
            <option value="hospital">Hôpital</option>
            <option value="school">École</option>
            <option value="park">Parc</option>
            <option value="store">Magasin</option>
          </select>
        </label>
        
        <label>
          Éléments par page:
          <select
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({ 
              ...prev, 
              limit: parseInt(e.target.value), 
              page: 1 
            }))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>
      
      {/* Boutons d'exportation */}
      <div className="export-container">
        <button 
          className="export-button"
          onClick={() => handleExport('csv')}
          aria-label="Exporter en CSV"
        >
          Exporter en CSV
        </button>
        <button 
          className="export-button"
          onClick={() => handleExport('json')}
          aria-label="Exporter en JSON"
        >
          Exporter en JSON
        </button>
        <button 
          className="export-button"
          onClick={() => handleExport('geojson')}
          aria-label="Exporter en GeoJSON"
        >
          Exporter en GeoJSON
        </button>
        <button 
          className="export-button"
          onClick={handleClearCache}
          aria-label="Vider le cache"
        >
          Vider le cache
        </button>
      </div>
      
      {/* Statistiques du cache */}
      <div className="cache-stats">
        Cache: {cacheStats.size} / {cacheStats.maxSize} entrées, validité: {cacheStats.duration / 1000 / 60} minutes
      </div>
      
      {activeView === 'table' ? (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Coordonnées</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.value}</td>
                  <td>
                    {item.coordinates[0].toFixed(4)}, {item.coordinates[1].toFixed(4)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>Aucune donnée trouvée pour cette zone.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-button"
              >
                Précédent
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`pagination-button ${pagination.page === pageNumber ? 'active' : ''}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              {totalPages > 5 && <span>...</span>}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className="pagination-button"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="charts-container">
          {/* Sélecteur de type de graphique */}
          <div className="chart-type-selector">
            <button 
              className={`chart-button ${activeChart === 'pie' ? 'active' : ''}`}
              onClick={() => setActiveChart('pie')}
            >
              Camembert
            </button>
            <button 
              className={`chart-button ${activeChart === 'bar' ? 'active' : ''}`}
              onClick={() => setActiveChart('bar')}
            >
              Barres
            </button>
            <button 
              className={`chart-button ${activeChart === 'line' ? 'active' : ''}`}
              onClick={() => setActiveChart('line')}
            >
              Ligne
            </button>
          </div>
          
          <div style={{ height: '400px', marginTop: '1rem' }}>
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