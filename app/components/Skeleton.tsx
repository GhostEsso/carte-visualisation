'use client';

/**
 * Composants Skeleton pour le chargement
 * Affichent des placeholders animés pendant le chargement des données
 */

interface SkeletonProps {
    className?: string;
}

// Skeleton de base avec animation pulse
export const Skeleton = ({ className = '' }: SkeletonProps) => (
    <div
        className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className}`}
        aria-hidden="true"
    />
);

// Skeleton pour une ligne de texte
export const SkeletonText = ({ className = '' }: SkeletonProps) => (
    <Skeleton className={`h-4 ${className}`} />
);

// Skeleton pour un avatar/cercle
export const SkeletonCircle = ({ className = '' }: SkeletonProps) => (
    <Skeleton className={`rounded-full ${className}`} />
);

// Skeleton pour une carte de données (vue mobile)
export const SkeletonDataCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
    </div>
);

// Skeleton pour une ligne de tableau
export const SkeletonTableRow = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
    </tr>
);

// Skeleton pour le tableau complet
export const SkeletonDataTable = ({ rows = 5 }: { rows?: number }) => (
    <div className="space-y-3">
        {/* Vue mobile */}
        <div className="sm:hidden space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonDataCard key={i} />
            ))}
        </div>

        {/* Vue desktop */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                        {['Nom', 'Type', 'Contact', 'Coordonnées'].map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Skeleton pour les graphiques
export const SkeletonChart = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-4">
        {/* Boutons de sélection */}
        <div className="flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
        </div>

        {/* Zone du graphique */}
        <div className="h-80 flex items-center justify-center">
            <Skeleton className="h-64 w-64 rounded-full" />
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {[1, 2, 3].map((i) => (
                <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-3 w-20 mx-auto" />
                </div>
            ))}
        </div>
    </div>
);

// Skeleton pour les filtres
export const SkeletonFilters = () => (
    <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-9 w-20 sm:hidden" />
            <div className="flex items-center gap-2 ml-auto">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
            </div>
        </div>
        <div className="hidden sm:grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
            ))}
        </div>
    </div>
);

// Composant principal pour l'écran de chargement des données
export const DataVisualizationSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <Skeleton className="h-6 w-48 mb-3 md:mb-0" />
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
        </div>

        {/* Filtres */}
        <SkeletonFilters />

        {/* Tableau */}
        <SkeletonDataTable rows={5} />
    </div>
);

export default {
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    SkeletonDataCard,
    SkeletonTableRow,
    SkeletonDataTable,
    SkeletonChart,
    SkeletonFilters,
    DataVisualizationSkeleton,
};
