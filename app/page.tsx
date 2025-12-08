'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';

// Importation dynamique côté client pour éviter les problèmes de SSR avec Leaflet
const MapComponent = dynamic(() => import('./components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[50vh] sm:h-[70vh] text-gray-500">
      <div className="flex flex-col items-center">
        <div className="animate-spin-slow mb-3">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <span className="text-sm sm:text-base">Chargement de la carte...</span>
      </div>
    </div>
  )
});

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header responsive */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo et titre */}
            <div className="flex items-center">
              <img
                src="/vision-logo.svg"
                alt="Vision Logo"
                className="h-8 sm:h-10 w-auto"
              />
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                Vision
              </h1>
            </div>



            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Menu mobile */}
              <button
                className="sm:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {isMenuOpen && (
            <div className="sm:hidden pb-3 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
              <p className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
                Sélectionnez une région sur la carte pour visualiser les données.
              </p>
            </div>
          )}
        </div>
      </header >

      {/* Description - visible sur desktop uniquement */}
      < div className="hidden sm:block bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Sélectionnez une région sur la carte pour visualiser les données associées.
            Vous pouvez dessiner un rectangle ou un polygone.
          </p>
        </div>
      </div >

      {/* Main content */}
      < main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6" >
        <ErrorBoundary>
          <MapComponent />
        </ErrorBoundary>
      </main >

      {/* Footer */}
      < footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 mt-auto safe-area-inset-bottom" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            Vision - Visualisation de données cartographiques - {currentYear ?? ''}
          </p>
        </div>
      </footer >
    </div >
  );
}
