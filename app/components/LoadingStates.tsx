'use client';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner = ({ message = 'Chargement des données...' }: LoadingSpinnerProps) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
                <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-lg mt-4">{message}</div>
        </div>
    </div>
);

interface ErrorMessageProps {
    error: string;
    onRetry?: () => void;
}

export const ErrorMessage = ({ error, onRetry }: ErrorMessageProps) => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
                <div className="flex-shrink-0 text-red-500">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Une erreur est survenue
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-3 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            Réessayer
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export const EmptyState = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune donnée disponible
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                La zone sélectionnée ne contient aucun point d&apos;intérêt.
                Essayez de sélectionner une autre zone ou d&apos;agrandir la zone actuelle.
            </p>
        </div>
    </div>
);

export default { LoadingSpinner, ErrorMessage, EmptyState };
