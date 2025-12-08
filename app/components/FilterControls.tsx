'use client';

import { useRef, useState } from 'react';
import { FilterOptions, PaginationOptions, ApiData } from '../types';
import useClickOutside from '../hooks/useClickOutside';

interface FilterControlsProps {
    filters: FilterOptions;
    pagination: PaginationOptions;
    cacheStats: { size: number; maxSize: number; duration: number };
    showExportMenu: boolean;
    onFilterChange: (key: keyof FilterOptions, value: unknown) => void;
    onPaginationChange: (pagination: Partial<PaginationOptions>) => void;
    onExport: (format: 'csv' | 'json' | 'geojson') => void;
    onClearCache: () => void;
    onExportMenuToggle: (show: boolean) => void;
}

const FilterControls = ({
    filters,
    pagination,
    cacheStats,
    showExportMenu,
    onFilterChange,
    onPaginationChange,
    onExport,
    onClearCache,
    onExportMenuToggle,
}: FilterControlsProps) => {
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    useClickOutside(exportMenuRef, () => onExportMenuToggle(false));

    const handleExportClick = (format: 'csv' | 'json' | 'geojson') => {
        onExport(format);
        onExportMenuToggle(false);
    };

    return (
        <div className="space-y-3">
            {/* Actions rapides - toujours visibles */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Bouton pour développer les filtres sur mobile */}
                <button
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className="sm:hidden flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${isFiltersExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                    </svg>
                    Filtres
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Stats du cache - masqué sur mobile */}
                    <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                        📦 Cache: {cacheStats.size}/{cacheStats.maxSize}
                    </span>

                    {/* Bouton vider cache */}
                    <button
                        onClick={onClearCache}
                        className="px-2 sm:px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition-colors"
                        aria-label="Vider le cache"
                    >
                        <span className="hidden sm:inline">🗑️ Vider cache</span>
                        <span className="sm:hidden">🗑️</span>
                    </button>

                    {/* Menu d'export */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            className="px-2 sm:px-3 py-1.5 text-xs rounded-md bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 flex items-center transition-colors"
                            aria-expanded={showExportMenu}
                            aria-haspopup="true"
                            onClick={() => onExportMenuToggle(!showExportMenu)}
                        >
                            📥 <span className="hidden sm:inline ml-1">Exporter</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-40 sm:w-44 bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden z-20 border border-gray-100 dark:border-gray-700 animate-fade-in">
                                <button
                                    onClick={() => handleExportClick('csv')}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    📄 CSV
                                </button>
                                <button
                                    onClick={() => handleExportClick('json')}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    📋 JSON
                                </button>
                                <button
                                    onClick={() => handleExportClick('geojson')}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    🗺️ GeoJSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtres - expansible sur mobile, toujours visible sur desktop */}
            <div className={`
        grid gap-3 transition-all duration-300
        ${isFiltersExpanded ? 'grid-cols-1 sm:grid-cols-3' : 'hidden sm:grid sm:grid-cols-3'}
      `}>
                {/* Trier par */}
                <div className="flex flex-col">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Trier par
                    </label>
                    <select
                        value={filters.sortBy as string}
                        onChange={(e) => onFilterChange('sortBy', e.target.value as keyof ApiData)}
                        className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
                    >
                        <option value="name">Nom</option>
                        <option value="value">Valeur</option>
                        <option value="type">Type</option>
                    </select>
                </div>

                {/* Ordre */}
                <div className="flex flex-col">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Ordre
                    </label>
                    <select
                        value={filters.sortOrder}
                        onChange={(e) => onFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                        className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
                    >
                        <option value="asc">Croissant ↑</option>
                        <option value="desc">Décroissant ↓</option>
                    </select>
                </div>

                {/* Éléments par page */}
                <div className="flex flex-col">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Par page
                    </label>
                    <select
                        value={pagination.limit}
                        onChange={(e) => onPaginationChange({ limit: parseInt(e.target.value), page: 1 })}
                        className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-white"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FilterControls;
