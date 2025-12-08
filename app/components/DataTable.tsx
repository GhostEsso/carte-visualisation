'use client';

import { ApiData, PaginationOptions } from '../types';

interface DataTableProps {
    data: ApiData[];
    pagination: PaginationOptions;
    onPageChange: (page: number) => void;
}

const DataTable = ({ data, pagination, onPageChange }: DataTableProps) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Générer les numéros de page à afficher
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const { page } = pagination;

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (page > 3) pages.push('ellipsis');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('ellipsis');
            pages.push(totalPages);
        }

        return pages;
    };

    // Vue mobile en cartes
    const MobileCardView = () => (
        <div className="sm:hidden space-y-3">
            {data.length > 0 ? (
                data.map(item => (
                    <div
                        key={item.id}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 animate-fade-in"
                    >
                        {/* Nom et type */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm flex-1">
                                {item.website ? (
                                    <a
                                        href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:underline"
                                    >
                                        {item.name}
                                    </a>
                                ) : (
                                    item.name
                                )}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 whitespace-nowrap">
                                {item.type}
                            </span>
                        </div>

                        {/* Contact */}
                        <div className="text-sm mb-2">
                            {item.phone ? (
                                <a
                                    href={`tel:${item.phone}`}
                                    className="flex items-center text-primary-600 dark:text-primary-400"
                                >
                                    📞 {item.phone}
                                </a>
                            ) : item.email ? (
                                <a
                                    href={`mailto:${item.email}`}
                                    className="flex items-center text-primary-600 dark:text-primary-400"
                                >
                                    ✉️ {item.email}
                                </a>
                            ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-xs italic">
                                    Pas de contact
                                </span>
                            )}
                        </div>

                        {/* Coordonnées */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            📍 {item.coordinates[0].toFixed(4)}, {item.coordinates[1].toFixed(4)}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune donnée trouvée
                </div>
            )}
        </div>
    );

    // Vue desktop en tableau
    const DesktopTableView = () => (
        <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Coordonnées
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.length > 0 ? (
                        data.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {item.website ? (
                                        <a
                                            href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:underline"
                                        >
                                            {item.name}
                                        </a>
                                    ) : (
                                        item.name
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {item.phone ? (
                                        <a
                                            href={`tel:${item.phone}`}
                                            className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400"
                                        >
                                            📞 {item.phone}
                                        </a>
                                    ) : item.email ? (
                                        <a
                                            href={`mailto:${item.email}`}
                                            className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400"
                                        >
                                            ✉️ {item.email}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                                            Non disponible
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                                    {item.coordinates[0].toFixed(4)}, {item.coordinates[1].toFixed(4)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                Aucune donnée trouvée
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // Pagination compacte pour mobile
    const Pagination = () => (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Info pages */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="hidden sm:inline">Page {pagination.page}/{totalPages}</span>
                <span className="sm:hidden">{pagination.page}/{totalPages}</span>
                <span className="hidden sm:inline"> ({pagination.total} résultats)</span>
            </div>

            {/* Boutons de navigation */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded-md text-sm transition-colors ${pagination.page === 1
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                    aria-label="Page précédente"
                >
                    ←
                </button>

                {/* Numéros de page - masqués sur très petit écran */}
                <div className="hidden xs:flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) =>
                        pageNum === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${pagination.page === pageNum
                                        ? 'bg-primary-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        )
                    )}
                </div>

                {/* Page actuelle visible sur très petit écran */}
                <span className="xs:hidden px-2 py-1 text-sm font-medium bg-primary-600 text-white rounded-md">
                    {pagination.page}
                </span>

                <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className={`p-2 rounded-md text-sm transition-colors ${pagination.page === totalPages
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                    aria-label="Page suivante"
                >
                    →
                </button>
            </div>
        </div>
    );

    return (
        <>
            <MobileCardView />
            <DesktopTableView />
            {totalPages > 1 && <Pagination />}
        </>
    );
};

export default DataTable;
